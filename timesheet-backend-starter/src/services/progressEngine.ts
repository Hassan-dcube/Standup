import { prisma } from '../db.js';
import axios from 'axios';
import { logger } from './logger.js';
import { llmCircuitBreaker, vectorCircuitBreaker, progressCircuitBreaker } from './circuitBreaker.js';

interface ProgressAnalysis {
  percent: number;
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  confidence: number;
  summary: string;
  evidence: string[];
}

interface StandupSnippet {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  answerText: string;
  questionId: string;
  similarity?: number;
}

export class ProgressEngine {
  private ollamaUrl = 'http://localhost:11434/api/generate';
  
  // Telemetry metrics
  private metrics = {
    retrievalHits: 0,
    retrievalMisses: 0,
    llmLatency: [] as number[],
    parseSuccesses: 0,
    parseFailures: 0,
    progressDeltas: [] as number[],
    totalAssessments: 0
  };

  /**
   * Analyze progress for a specific task based on recent standup data
   */
  async analyzeTaskProgress(taskId: string): Promise<ProgressAnalysis | null> {
    const startTime = Date.now();
    this.metrics.totalAssessments++;
    
    try {
      // Get task details
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignees: {
            include: { user: { select: { id: true, name: true } } }
          }
        }
      });

      if (!task || task.assignees.length === 0) {
        logger.warn(`Task ${taskId} not found or has no assignees`, {}, { taskId });
        return null;
      }

      // Get relevant standup snippets with circuit breaker
      const snippets = await vectorCircuitBreaker.execute(async () => {
        return await this.getRelevantStandupSnippets(task);
      });
      
      if (snippets.length === 0) {
        this.metrics.retrievalMisses++;
        logger.info(`No standup data found for task ${taskId}`, {}, { taskId });
        return this.createDefaultProgress();
      } else {
        this.metrics.retrievalHits++;
      }

      // Analyze with LLM using circuit breaker
      const llmStartTime = Date.now();
      const analysis = await llmCircuitBreaker.execute(async () => {
        return await this.analyzeWithLLM(task, snippets);
      });
      const llmLatency = Date.now() - llmStartTime;
      this.metrics.llmLatency.push(llmLatency);
      
      // Apply guardrails
      const guardedAnalysis = this.applyGuardrails(analysis, snippets);
      
      // Track parsing success/failure
      if (guardedAnalysis && guardedAnalysis.percent !== undefined) {
        this.metrics.parseSuccesses++;
      } else {
        this.metrics.parseFailures++;
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Task progress analysis completed`, {
        taskId,
        duration,
        snippetCount: snippets.length,
        result: {
          percent: guardedAnalysis.percent,
          status: guardedAnalysis.status,
          confidence: guardedAnalysis.confidence
        }
      }, { taskId });
      
      return guardedAnalysis;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Error analyzing task progress`, {
        taskId,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, { taskId });
      
      // Return last known progress if available
      return await this.getLastKnownProgress(taskId);
    }
  }

  /**
   * Get last known progress for a task (fallback when analysis fails)
   */
  private async getLastKnownProgress(taskId: string): Promise<ProgressAnalysis | null> {
    try {
      const lastProgress = await prisma.taskProgress.findFirst({
        where: { taskId },
        orderBy: { createdAt: 'desc' }
      });

      if (lastProgress) {
        logger.info(`Using last known progress for task ${taskId}`, {
          taskId,
          lastProgress: {
            percent: lastProgress.percent,
            status: lastProgress.status,
            confidence: lastProgress.confidence,
            source: lastProgress.source,
            createdAt: lastProgress.createdAt
          }
        }, { taskId });

        return {
          percent: lastProgress.percent,
          status: lastProgress.status as any,
          confidence: Math.max(0, (lastProgress.confidence || 0.5) - 0.1), // Reduce confidence over time
          summary: lastProgress.summary || 'Using last known progress',
          evidence: []
        };
      }

      return this.createDefaultProgress();
    } catch (error) {
      logger.error(`Failed to get last known progress for task ${taskId}`, {
        taskId,
        error: error instanceof Error ? error.message : String(error)
      }, { taskId });
      return this.createDefaultProgress();
    }
  }

  /**
   * Get relevant standup snippets for a task using vector similarity
   */
  private async getRelevantStandupSnippets(task: any): Promise<StandupSnippet[]> {
    const assigneeIds = task.assignees.map((a: any) => a.userId);
    const daysBack = 10;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Create search context from task details
    const searchContext = [
      task.title,
      task.description || '',
      task.acceptanceCriteria || ''
    ].filter(Boolean).join(' ');

    try {
      // Get standup responses for assignees in the last 10 days
      const responses = await prisma.standupResponse.findMany({
        where: {
          session: {
            userId: { in: assigneeIds },
            date: { gte: cutoffDate },
            state: 'SUBMITTED'
          }
        },
        include: {
          session: {
            include: {
              user: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: {
          session: { date: 'desc' }
        },
        take: 50 // Get more than needed for filtering
      });

      // Filter and rank by relevance (simple keyword matching for now)
      // In a production system, you'd use pgvector with embeddings
      const relevantSnippets: StandupSnippet[] = responses
        .map(response => ({
          id: response.id,
          userId: response.session.userId,
          userName: response.session.user.name,
          date: response.session.date,
          answerText: response.answerText,
          questionId: response.questionId,
          similarity: this.calculateSimilarity(searchContext, response.answerText)
        }))
        .filter(snippet => snippet.similarity! > 0.1) // Basic relevance threshold
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, 20); // Top 20 most relevant

      return relevantSnippets;
    } catch (error) {
      console.error('Error fetching standup snippets:', error);
      return [];
    }
  }

  /**
   * Simple similarity calculation (in production, use proper embeddings)
   */
  private calculateSimilarity(context: string, text: string): number {
    const contextWords = context.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);
    
    const contextSet = new Set(contextWords);
    const textSet = new Set(textWords);
    
    const intersection = new Set([...contextSet].filter(x => textSet.has(x)));
    const union = new Set([...contextSet, ...textSet]);
    
    return intersection.size / union.size;
  }

  /**
   * Analyze standup data with LLM
   */
  private async analyzeWithLLM(task: any, snippets: StandupSnippet[]): Promise<ProgressAnalysis> {
    const prompt = this.createProgressPrompt(task, snippets);
    
    try {
      const response = await axios.post(this.ollamaUrl, {
        model: 'llama3.2:3b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent output
          top_p: 0.9
        }
      });

      const result = response.data.response;
      return this.parseLLMResponse(result);
    } catch (error) {
      console.error('Error calling LLM:', error);
      return this.createDefaultProgress();
    }
  }

  /**
   * Create prompt for LLM analysis
   */
  private createProgressPrompt(task: any, snippets: StandupSnippet[]): string {
    const snippetsText = snippets
      .map(s => `[${s.date.toISOString().split('T')[0]}] ${s.userName}: ${s.answerText}`)
      .join('\n');

    return `You are a project management AI analyzing task progress from standup updates.

TASK DETAILS:
Title: ${task.title}
Description: ${task.description || 'No description'}
Acceptance Criteria: ${task.acceptanceCriteria || 'No criteria specified'}

RECENT STANDUP UPDATES:
${snippetsText}

ANALYSIS INSTRUCTIONS:
1. Analyze the standup updates to determine task progress
2. Look for evidence of work completion, blockers, or status changes
3. Return ONLY a valid JSON object with these exact fields:
   - percent: number between 0 and 1 (0.0 = not started, 1.0 = complete)
   - status: one of "TODO", "DOING", "BLOCKED", "DONE"
   - confidence: number between 0 and 1 (how confident you are in this assessment)
   - summary: brief 1-2 sentence summary of progress
   - evidence: array of 1-2 key phrases from standups that support your assessment

GUARDRAILS:
- If no relevant evidence found: percent=0, status=TODO, confidence=0.2
- If blocker evidence found: status=BLOCKED, cap percent growth
- If completion evidence found ("submitted", "merged", "approved", "deployed"): percent=1, status=DONE
- Be conservative with progress estimates
- Only cite evidence that directly relates to this specific task

RESPONSE FORMAT (JSON only):
{
  "percent": 0.0,
  "status": "TODO",
  "confidence": 0.0,
  "summary": "No evidence of progress found",
  "evidence": []
}`;
  }

  /**
   * Parse LLM response and extract JSON
   */
  private parseLLMResponse(response: string): ProgressAnalysis {
    try {
      // Extract JSON from response (handle cases where LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        percent: Math.max(0, Math.min(1, parsed.percent || 0)),
        status: parsed.status || 'TODO',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        summary: parsed.summary || 'No summary provided',
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : []
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return this.createDefaultProgress();
    }
  }

  /**
   * Apply guardrails to ensure valid output
   */
  private applyGuardrails(analysis: ProgressAnalysis, snippets: StandupSnippet[]): ProgressAnalysis {
    const result = { ...analysis };

    // Check for blocker evidence
    const blockerKeywords = ['blocked', 'stuck', 'issue', 'problem', 'waiting', 'cannot', 'unable'];
    const hasBlockers = snippets.some(snippet => 
      blockerKeywords.some(keyword => 
        snippet.answerText.toLowerCase().includes(keyword)
      )
    );

    if (hasBlockers) {
      result.status = 'BLOCKED';
      result.percent = Math.min(result.percent, 0.5); // Cap progress if blocked
    }

    // Check for completion evidence
    const completionKeywords = ['submitted', 'merged', 'approved', 'deployed', 'completed', 'finished', 'done'];
    const hasCompletion = snippets.some(snippet => 
      completionKeywords.some(keyword => 
        snippet.answerText.toLowerCase().includes(keyword)
      )
    );

    if (hasCompletion) {
      result.status = 'DONE';
      result.percent = 1.0;
    }

    // Ensure valid status
    const validStatuses = ['TODO', 'DOING', 'BLOCKED', 'DONE'];
    if (!validStatuses.includes(result.status)) {
      result.status = 'TODO';
    }

    // Clamp values to valid ranges
    result.percent = Math.max(0, Math.min(1, result.percent));
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    return result;
  }

  /**
   * Create default progress when no evidence is found
   */
  private createDefaultProgress(): ProgressAnalysis {
    return {
      percent: 0,
      status: 'TODO',
      confidence: 0.2,
      summary: 'No evidence of progress found in recent standups',
      evidence: []
    };
  }

  /**
   * Persist progress analysis to database
   */
  async persistProgress(taskId: string, analysis: ProgressAnalysis): Promise<void> {
    try {
      // Create TaskProgress record
      await prisma.taskProgress.create({
        data: {
          taskId,
          source: 'LLM',
          percent: analysis.percent,
          status: analysis.status as any,
          confidence: analysis.confidence,
          summary: `${analysis.summary} Evidence: ${analysis.evidence.join(', ')}`
        }
      });

      // Update task status if confidence is high enough
      if (analysis.confidence >= 0.6) {
        await prisma.task.update({
          where: { id: taskId },
          data: { status: analysis.status }
        });
      }

      console.log(`Progress persisted for task ${taskId}: ${analysis.percent * 100}% ${analysis.status}`);
    } catch (error) {
      console.error('Error persisting progress:', error);
    }
  }

  /**
   * Run progress analysis for all tasks in a project
   */
  async analyzeProjectProgress(projectId: string): Promise<void> {
    try {
      const tasks = await prisma.task.findMany({
        where: { 
          projectId,
          assignees: { some: {} } // Only tasks with assignees
        },
        include: {
          assignees: {
            include: { user: { select: { id: true, name: true } } }
          }
        }
      });

      console.log(`Analyzing progress for ${tasks.length} tasks in project ${projectId}`);

      for (const task of tasks) {
        const analysis = await this.analyzeTaskProgress(task.id);
        if (analysis) {
          await this.persistProgress(task.id, analysis);
        }
        
        // Add small delay to avoid overwhelming the LLM
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Completed progress analysis for project ${projectId}`);
    } catch (error) {
      console.error('Error analyzing project progress:', error);
    }
  }

  /**
   * Get current telemetry metrics
   */
  getMetrics() {
    const avgLlmLatency = this.metrics.llmLatency.length > 0 
      ? this.metrics.llmLatency.reduce((a, b) => a + b, 0) / this.metrics.llmLatency.length 
      : 0;
    
    const avgProgressDelta = this.metrics.progressDeltas.length > 0
      ? this.metrics.progressDeltas.reduce((a, b) => a + b, 0) / this.metrics.progressDeltas.length
      : 0;

    return {
      retrieval: {
        hits: this.metrics.retrievalHits,
        misses: this.metrics.retrievalMisses,
        hitRate: this.metrics.retrievalHits / (this.metrics.retrievalHits + this.metrics.retrievalMisses) || 0
      },
      llm: {
        avgLatencyMs: Math.round(avgLlmLatency),
        totalCalls: this.metrics.llmLatency.length
      },
      parsing: {
        successes: this.metrics.parseSuccesses,
        failures: this.metrics.parseFailures,
        successRate: this.metrics.parseSuccesses / (this.metrics.parseSuccesses + this.metrics.parseFailures) || 0
      },
      progress: {
        avgDelta: Math.round(avgProgressDelta * 100) / 100,
        totalDeltas: this.metrics.progressDeltas.length
      },
      total: {
        assessments: this.metrics.totalAssessments
      }
    };
  }

  /**
   * Emit metrics to logs
   */
  emitMetrics() {
    const metrics = this.getMetrics();
    logger.info('Progress Engine Telemetry', metrics);
    console.log('📊 Progress Engine Metrics:', JSON.stringify(metrics, null, 2));
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      retrievalHits: 0,
      retrievalMisses: 0,
      llmLatency: [],
      parseSuccesses: 0,
      parseFailures: 0,
      progressDeltas: [],
      totalAssessments: 0
    };
  }
}

export const progressEngine = new ProgressEngine();
