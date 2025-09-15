import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, allow, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Apply authentication to all routes (temporarily disabled for demo)
// router.use(requireAuth);

// Helper function to get user's organization
const getUserOrg = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgId: true }
  });
  if (!user) throw new Error('User not found');
  return user.orgId;
};

// Mock Llama-3B integration (in production, this would call actual Llama API)
const callLlama3B = async (prompt: string): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock response based on prompt content analysis
  const promptLower = prompt.toLowerCase();
  
  // More sophisticated heuristics for demo purposes
  let percent = 0;
  let status = 'TODO';
  let confidence = 0.3;
  let summary = 'No clear progress indicators found';
  
  // Count progress indicators
  const progressWords = ['working', 'progress', 'implementing', 'developing', 'building', 'creating', 'writing', 'analyzing', 'testing', 'debugging'];
  const completionWords = ['completed', 'finished', 'done', 'delivered', 'submitted', 'approved', 'merged', 'deployed'];
  const blockedWords = ['blocked', 'stuck', 'issue', 'problem', 'waiting', 'delayed', 'error', 'bug'];
  const startedWords = ['started', 'beginning', 'initial', 'setup', 'planning', 'researching'];
  
  const progressCount = progressWords.filter(word => promptLower.includes(word)).length;
  const completionCount = completionWords.filter(word => promptLower.includes(word)).length;
  const blockedCount = blockedWords.filter(word => promptLower.includes(word)).length;
  const startedCount = startedWords.filter(word => promptLower.includes(word)).length;
  
  // Determine status and progress based on context
  if (blockedCount > 0) {
    // If blocked, cap progress at 30% regardless of other indicators
    percent = Math.min(30, Math.random() * 30);
    status = 'BLOCKED';
    confidence = 0.7;
    summary = 'Task appears to be blocked or facing issues';
  } else if (completionCount >= 2 || promptLower.includes('fully completed') || promptLower.includes('100% done')) {
    // Only mark as 100% if there are strong completion indicators
    percent = 100;
    status = 'DONE';
    confidence = 0.9;
    summary = 'Task appears to be fully completed based on standup responses';
  } else if (progressCount >= 2 || promptLower.includes('almost done') || promptLower.includes('nearly finished')) {
    // Active progress - 60-85% range
    percent = 60 + Math.random() * 25;
    status = 'DOING';
    confidence = 0.7;
    summary = 'Task shows significant progress and is actively being worked on';
  } else if (progressCount >= 1 || startedCount >= 1) {
    // Some progress - 25-60% range
    percent = 25 + Math.random() * 35;
    status = 'DOING';
    confidence = 0.6;
    summary = 'Task has been started and shows some progress';
  } else if (startedCount > 0) {
    // Just started - 10-25% range
    percent = 10 + Math.random() * 15;
    status = 'DOING';
    confidence = 0.5;
    summary = 'Task has been started with initial progress';
  } else {
    // No clear indicators - assume minimal progress
    percent = Math.random() * 15; // 0-15% range
    status = 'TODO';
    confidence = 0.3;
    summary = 'Limited progress indicators found in standup responses';
  }
  
  // Special cases for specific completion keywords (be more strict)
  if (promptLower.includes('submitted to') || promptLower.includes('approved by') || promptLower.includes('merged into') || promptLower.includes('deployed to production')) {
    percent = 100;
    status = 'DONE';
    confidence = 0.95;
    summary = 'Task marked as completed (submitted/approved/merged/deployed)';
  }
  
  // Clamp values to valid ranges
  percent = Math.max(0, Math.min(100, percent));
  confidence = Math.max(0.1, Math.min(1.0, confidence));
  
  return JSON.stringify({
    percent: Math.round(percent),
    status: status,
    confidence: Math.round(confidence * 100) / 100,
    summary: summary
  });
};

// Validate and sanitize LLM response
const validateLLMResponse = (response: string): { percent: number; status: string; confidence: number; summary: string } | null => {
  try {
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (typeof parsed.percent !== 'number' || 
        typeof parsed.status !== 'string' || 
        typeof parsed.confidence !== 'number' || 
        typeof parsed.summary !== 'string') {
      return null;
    }
    
    // Clamp ranges
    const percent = Math.max(0, Math.min(100, parsed.percent));
    const confidence = Math.max(0.1, Math.min(1.0, parsed.confidence));
    
    // Validate status
    const validStatuses = ['TODO', 'DOING', 'BLOCKED', 'DONE'];
    const status = validStatuses.includes(parsed.status) ? parsed.status : 'TODO';
    
    // Sanitize summary
    const summary = parsed.summary.trim().substring(0, 500); // Max 500 chars
    
    return { percent, status, confidence, summary };
  } catch (error) {
    console.error('Invalid LLM response:', error);
    return null;
  }
};

// GET /api/progress/assess - Assess task progress using LLM
router.get('/assess', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    
    const { taskId } = req.query;
    
    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    // Get task details including assignees
    const task = await prisma.task.findFirst({
      where: {
        id: taskId as string,
        project: { orgId }
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get assignee user IDs
    const assigneeIds = task.assignees.map(ta => ta.user.id);
    
    if (assigneeIds.length === 0) {
      return res.status(400).json({ error: 'No assignees found for this task' });
    }

    // Calculate date range (last 7-10 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 10);

    // Get standup responses from assignees in the date range
    const standupResponses = await prisma.standupResponse.findMany({
      where: {
        session: {
          userId: { in: assigneeIds },
          date: {
            gte: startDate,
            lte: endDate
          },
          state: 'SUBMITTED' // Only completed standups
        }
      },
      include: {
        session: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        session: {
          date: 'desc'
        }
      },
      take: 20 // Limit for prompt size
    });

    // Prepare context for LLM
    const taskContext = {
      title: task.title,
      description: task.description || '',
      acceptanceCriteria: task.acceptanceCriteria || '',
      assignees: task.assignees.map(ta => ta.user.name).join(', ')
    };

    // Prepare standup context
    const standupContext = standupResponses.map(response => ({
      user: response.session.user.name,
      date: response.session.date.toISOString().split('T')[0],
      answer: response.answerText
    }));

    // Create concise prompt for Llama-3B
    const prompt = `Task: "${taskContext.title}"
Description: ${taskContext.description}
Acceptance Criteria: ${taskContext.acceptanceCriteria}
Assignees: ${taskContext.assignees}

Recent Standup Responses (last 10 days):
${standupContext.map(ctx => `- ${ctx.user} (${ctx.date}): ${ctx.answer}`).join('\n')}

Analyze the standup responses and assess task progress. Return ONLY valid JSON with these exact fields:
{
  "percent": number (0-100),
  "status": "TODO" | "DOING" | "BLOCKED" | "DONE",
  "confidence": number (0.1-1.0),
  "summary": string (brief evidence-based summary)
}

Rules:
- No evidence = 0% progress, TODO status, low confidence
- Blockers cap growth (max 30% if blocked)
- "submitted/approved/merged" = DONE status, 100% progress
- Base assessment on actual standup content, not assumptions`;

    // Call Llama-3B
    const llmResponse = await callLlama3B(prompt);
    
    // Validate response
    const validatedResponse = validateLLMResponse(llmResponse);
    
    if (!validatedResponse) {
      // Fallback to conservative assessment
      const fallbackResponse = {
        percent: 0,
        status: 'TODO' as const,
        confidence: 0.1,
        summary: 'Unable to assess progress - no clear evidence found in standup responses'
      };
      
      // Create TaskProgress record with fallback
      const taskProgress = await prisma.taskProgress.create({
        data: {
          taskId: task.id,
          source: 'LLM',
          percent: fallbackResponse.percent / 100, // Convert to 0-1 range
          status: fallbackResponse.status,
          confidence: fallbackResponse.confidence,
          summary: fallbackResponse.summary
        }
      });
      
      return res.json({
        task: {
          id: task.id,
          title: task.title,
          projectName: task.project.name
        },
        assessment: fallbackResponse,
        taskProgress: taskProgress,
        metadata: {
          standupResponses: standupResponses.length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          llmResponse: 'Invalid response - using fallback'
        }
      });
    }

    // Create TaskProgress record
    const taskProgress = await prisma.taskProgress.create({
      data: {
        taskId: task.id,
        source: 'LLM',
        percent: validatedResponse.percent / 100, // Convert to 0-1 range
        status: validatedResponse.status as any,
        confidence: validatedResponse.confidence,
        summary: validatedResponse.summary
      }
    });

    res.json({
      task: {
        id: task.id,
        title: task.title,
        projectName: task.project.name
      },
      assessment: validatedResponse,
      taskProgress: taskProgress,
      metadata: {
        standupResponses: standupResponses.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        llmResponse: 'Success'
      }
    });

  } catch (error) {
    console.error('Error assessing task progress:', error);
    res.status(500).json({ error: 'Failed to assess task progress' });
  }
});

// GET /api/progress/assess/history - Get assessment history for a task
router.get('/assess/history', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    
    const { taskId } = req.query;
    
    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    // Get task progress history
    const progressHistory = await prisma.taskProgress.findMany({
      where: {
        taskId: taskId as string,
        task: {
          project: { orgId }
        }
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      task: progressHistory[0]?.task || { id: taskId, title: 'Unknown', projectName: 'Unknown' },
      progressHistory: progressHistory.map(progress => ({
        id: progress.id,
        source: progress.source,
        percent: Math.round(progress.percent * 100),
        status: progress.status,
        confidence: progress.confidence,
        summary: progress.summary,
        createdAt: progress.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching progress history:', error);
    res.status(500).json({ error: 'Failed to fetch progress history' });
  }
});

// GET /api/llm-assessor/metrics - Get telemetry metrics
router.get('/metrics', async (req: AuthenticatedRequest, res) => {
  try {
    // Import the progress engine to get metrics
    const { progressEngine } = await import('../services/progressEngine.js');
    const metrics = progressEngine.getMetrics();
    
    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// POST /api/llm-assessor/emit-metrics - Emit metrics to logs
router.post('/emit-metrics', async (req: AuthenticatedRequest, res) => {
  try {
    // Import the progress engine to emit metrics
    const { progressEngine } = await import('../services/progressEngine.js');
    progressEngine.emitMetrics();
    
    res.json({ message: 'Metrics emitted to logs' });
  } catch (error) {
    console.error('Error emitting metrics:', error);
    res.status(500).json({ error: 'Failed to emit metrics' });
  }
});

export default router;
