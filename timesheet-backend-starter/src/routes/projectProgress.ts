import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, allow, AuthenticatedRequest } from '../auth.js';
import { recomputeProjectProgress, getProjectProgressSummary, recomputeAllActiveProjects } from '../services/projectAggregation.js';
import { nightlyBatch } from '../services/nightlyBatch.js';

const router = Router();

/**
 * Get project progress with aggregation details
 */
router.get('/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    
    // Get project details with progress
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        progressCached: true,
        updatedAt: true,
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            estimatePoints: true,
            progress: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                percent: true,
                status: true,
                confidence: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Compute fresh progress for comparison
    const freshProgress = await getProjectProgressSummary(projectId);

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: {
          cached: project.progressCached,
          fresh: freshProgress.aggregation.weightedAverage,
          lastUpdated: freshProgress.project.lastUpdated,
          taskCount: freshProgress.aggregation.totalTasks,
          tasksWithProgress: freshProgress.aggregation.tasksWithProgress
        },
        tasks: project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          estimatePoints: task.estimatePoints,
          progress: task.progress[0] || null
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching project progress:', error);
    res.status(500).json({ error: 'Failed to fetch project progress' });
  }
});

/**
 * Manually update project progress
 */
router.post('/:projectId/update', requireAuth, allow('MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await recomputeProjectProgress(projectId);
    
    res.json({
      success: true,
      progress: result
    });

  } catch (error) {
    console.error('Error updating project progress:', error);
    res.status(500).json({ error: 'Failed to update project progress' });
  }
});

/**
 * Recompute progress for all active projects
 */
router.post('/recompute-all', requireAuth, allow('MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    await recomputeAllActiveProjects();
    
    res.json({
      success: true,
      message: 'Progress recomputation completed for all active projects'
    });

  } catch (error) {
    console.error('Error recomputing all project progress:', error);
    res.status(500).json({ error: 'Failed to recompute project progress' });
  }
});

/**
 * Get nightly batch service status
 */
router.get('/batch/status', requireAuth, allow('MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    const status = nightlyBatch.getStatus();
    
    res.json({
      status
    });

  } catch (error) {
    console.error('Error fetching batch status:', error);
    res.status(500).json({ error: 'Failed to fetch batch status' });
  }
});

/**
 * Manually trigger nightly batch job
 */
router.post('/batch/trigger', requireAuth, allow('MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    await nightlyBatch.triggerManualRun();
    
    res.json({
      success: true,
      message: 'Nightly batch job triggered successfully'
    });

  } catch (error) {
    console.error('Error triggering batch job:', error);
    res.status(500).json({ error: 'Failed to trigger batch job' });
  }
});

/**
 * Start nightly batch service
 */
router.post('/batch/start', requireAuth, allow('MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    nightlyBatch.start();
    
    res.json({
      success: true,
      message: 'Nightly batch service started'
    });

  } catch (error) {
    console.error('Error starting batch service:', error);
    res.status(500).json({ error: 'Failed to start batch service' });
  }
});

/**
 * Stop nightly batch service
 */
router.post('/batch/stop', requireAuth, allow('MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    nightlyBatch.stop();
    
    res.json({
      success: true,
      message: 'Nightly batch service stopped'
    });

  } catch (error) {
    console.error('Error stopping batch service:', error);
    res.status(500).json({ error: 'Failed to stop batch service' });
  }
});

export default router;
