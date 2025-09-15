import { prisma } from '../db.js';
import { recomputeAllActiveProjects } from './projectAggregation.js';
import { triggerNightlyBatch, decayStaleProgress } from './triggerService.js';
import { progressEngine } from './progressEngine.js';
import { logger } from './logger.js';

/**
 * Nightly Batch Service
 * 
 * Runs scheduled tasks during off-hours to:
 * - Recompute project progress for all active projects
 * - Run LLM progress analysis for all tasks
 * - Update cached progress values
 */
export class NightlyBatchService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the nightly batch job
   * Runs every weekday morning at 2 AM PKT (Pakistan Time)
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Nightly batch service is already running');
      return;
    }

    logger.info('Starting nightly batch service for weekday mornings at 2 AM PKT');
    
    // Calculate milliseconds until next 2 AM PKT on a weekday
    const nextRun = this.getNextWeekdayMorning();
    const msUntilNext = nextRun.getTime() - Date.now();
    
    logger.info(`Next batch job scheduled for: ${nextRun.toISOString()} (PKT)`);
    
    // Schedule the first run
    setTimeout(() => {
      this.runBatchJob();
      
      // Then run every 24 hours (will automatically skip weekends)
      this.intervalId = setInterval(() => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // Only run on weekdays (Monday = 1 to Friday = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          this.runBatchJob();
        } else {
          logger.info(`Skipping batch job on ${this.getDayName(dayOfWeek)}`);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, msUntilNext);

    this.isRunning = true;
  }

  /**
   * Get next weekday morning at 2 AM PKT
   */
  private getNextWeekdayMorning(): Date {
    const now = new Date();
    const pktOffset = 5 * 60; // PKT is UTC+5 (5 hours * 60 minutes)
    
    // Convert current time to PKT
    const pktNow = new Date(now.getTime() + (pktOffset * 60 * 1000));
    
    // Find next weekday at 2 AM PKT
    let nextRun = new Date(pktNow);
    nextRun.setHours(2, 0, 0, 0);
    
    // If it's already past 2 AM today, move to tomorrow
    if (pktNow.getHours() >= 2) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    // Skip to next weekday if it's weekend
    while (nextRun.getDay() === 0 || nextRun.getDay() === 6) { // Sunday or Saturday
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    // Convert back to UTC
    return new Date(nextRun.getTime() - (pktOffset * 60 * 1000));
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  /**
   * Stop the nightly batch service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Nightly batch service stopped');
  }

  /**
   * Run the complete batch job
   */
  async runBatchJob(): Promise<void> {
    const startTime = new Date();
    logger.info('Starting nightly batch job', {
      startTime: startTime.toISOString(),
      timezone: 'PKT'
    });

    const results = {
      progressAnalysis: { success: 0, failed: 0, errors: [] as string[] },
      projectAggregation: { success: 0, failed: 0, errors: [] as string[] }
    };

    try {
      // Step 1: Run LLM progress analysis for all active tasks
      logger.info('Step 1: Running LLM progress analysis for all active tasks');
      const progressResults = await this.runProgressAnalysis();
      results.progressAnalysis = progressResults;

      // Step 2: Recompute project progress aggregation
      logger.info('Step 2: Recomputing project progress aggregation');
      const aggregationResults = await this.runProjectAggregation();
      results.projectAggregation = aggregationResults;

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      logger.logBatchOperation({
        operation: 'nightly',
        projectCount: aggregationResults.success,
        taskCount: progressResults.success,
        successCount: progressResults.success + aggregationResults.success,
        failureCount: progressResults.failed + aggregationResults.failed,
        duration,
        errors: [...progressResults.errors, ...aggregationResults.errors]
      });

      logger.info('Nightly batch job completed', {
        duration,
        results,
        nextRun: new Date(endTime.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      logger.error('Nightly batch job failed', {
        duration,
        error: error instanceof Error ? error.message : String(error),
        results
      });
      
      // Log error but don't crash the service
      // In production, you might want to send alerts here
    }
  }

  /**
   * Run LLM progress analysis for all active tasks
   */
  private async runProgressAnalysis(): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    try {
      // Find all active tasks with recent standup activity
      const activeTasks = await prisma.task.findMany({
        where: {
          project: {
            status: 'ACTIVE'
          },
          assignees: {
            some: {}
          }
        },
        select: { id: true, title: true }
      });

      logger.info(`Found ${activeTasks.length} active tasks for progress analysis`);

      // Run progress analysis for each task
      for (const task of activeTasks) {
        try {
          const analysis = await progressEngine.analyzeTaskProgress(task.id);
          if (analysis) {
            await progressEngine.persistProgress(task.id, analysis);
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`No analysis result for task ${task.id}`);
          }
        } catch (error) {
          results.failed++;
          const errorMsg = `Task ${task.id}: ${error instanceof Error ? error.message : String(error)}`;
          results.errors.push(errorMsg);
          logger.error(`Progress analysis failed for task ${task.id}`, {
            taskId: task.id,
            error: error instanceof Error ? error.message : String(error)
          }, { taskId: task.id });
        }
      }

      logger.info('Progress analysis completed', {
        totalTasks: activeTasks.length,
        success: results.success,
        failed: results.failed
      });

      return results;
      
    } catch (error) {
      logger.error('Progress analysis batch failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Run project aggregation for all active projects
   */
  private async runProjectAggregation(): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    try {
      const batchResult = await triggerNightlyBatch();
      
      if (batchResult.success) {
        results.success = 1;
        logger.info('Nightly batch processing completed successfully', {
          totalProjects: batchResult.totalProjects,
          updatedProjects: batchResult.updatedProjects,
          durationMs: batchResult.durationMs
        });
      } else {
        results.failed = 1;
        results.errors.push(...batchResult.errors);
        logger.error('Nightly batch processing failed', {
          errorCount: batchResult.errors.length,
          errors: batchResult.errors
        });
      }
      
      return results;
      
    } catch (error) {
      results.failed = 1;
      results.errors.push(error instanceof Error ? error.message : String(error));
      
      logger.error('Project aggregation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return results;
    }
  }

  /**
   * Manually trigger a batch job (for testing or manual runs)
   */
  async triggerManualRun(): Promise<void> {
    console.log('🔧 Manual batch job triggered');
    await this.runBatchJob();
  }

  /**
   * Get the status of the batch service
   */
  getStatus(): { isRunning: boolean; nextRun?: Date } {
    return {
      isRunning: this.isRunning,
      nextRun: this.intervalId ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
    };
  }
}

// Export singleton instance
export const nightlyBatch = new NightlyBatchService();
