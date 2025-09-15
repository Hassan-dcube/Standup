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

// Simple embedding function (mock for demo - in production, use OpenAI API)
const generateEmbedding = async (text: string): Promise<number[]> => {
  // Mock embedding generation - in production, call OpenAI API
  // For now, return a simple hash-based vector
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate a 1536-dimensional vector based on text hash
  const vector = new Array(1536).fill(0);
  for (let i = 0; i < 1536; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  return vector;
};

// GET /api/progress/retrieve - Retrieve relevant standup responses for a task
router.get('/retrieve', async (req: AuthenticatedRequest, res) => {
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
      return res.json({
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          acceptanceCriteria: task.acceptanceCriteria,
          projectName: task.project.name
        },
        snippets: [],
        message: 'No assignees found for this task'
      });
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
      take: 100 // Get more responses for better ranking
    });

    if (standupResponses.length === 0) {
      return res.json({
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          acceptanceCriteria: task.acceptanceCriteria,
          projectName: task.project.name
        },
        snippets: [],
        message: 'No standup responses found for task assignees in the last 10 days'
      });
    }

    // Create query text from task title and acceptance criteria
    const queryText = `${task.title} ${task.description || ''} ${task.acceptanceCriteria || ''}`.trim();
    
    // Generate embedding for the query (mock for demo)
    const queryEmbedding = await generateEmbedding(queryText);

    // For demo purposes, we'll do simple text matching instead of vector similarity
    // In production, you would use pgvector similarity search
    const relevantSnippets = standupResponses
      .map(response => {
        const answerText = response.answerText.toLowerCase();
        const queryWords = queryText.toLowerCase().split(/\s+/);
        
        // Simple relevance scoring based on keyword matches
        let relevanceScore = 0;
        queryWords.forEach(word => {
          if (word.length > 2 && answerText.includes(word)) {
            relevanceScore += 1;
          }
        });
        
        // Boost score for task-related keywords
        const taskKeywords = ['task', 'work', 'progress', 'complete', 'done', 'blocked', 'issue', 'problem'];
        taskKeywords.forEach(keyword => {
          if (answerText.includes(keyword)) {
            relevanceScore += 0.5;
          }
        });

        return {
          id: response.id,
          answerText: response.answerText,
          relevanceScore,
          user: {
            id: response.session.user.id,
            email: response.session.user.email,
            name: response.session.user.name
          },
          date: response.session.date,
          questionId: response.questionId,
          sessionId: response.sessionId
        };
      })
      .filter(snippet => snippet.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // Return top 20 snippets

    res.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        acceptanceCriteria: task.acceptanceCriteria,
        projectName: task.project.name
      },
      snippets: relevantSnippets,
      metadata: {
        totalResponses: standupResponses.length,
        relevantSnippets: relevantSnippets.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        assignees: task.assignees.map(ta => ({
          id: ta.user.id,
          email: ta.user.email,
          name: ta.user.name
        }))
      }
    });

  } catch (error) {
    console.error('Error retrieving standup responses:', error);
    res.status(500).json({ error: 'Failed to retrieve standup responses' });
  }
});

// POST /api/progress/retrieve/embed - Generate and store embeddings for standup responses
router.post('/embed', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    
    const { responseId } = req.body;
    
    if (!responseId) {
      return res.status(400).json({ error: 'responseId is required' });
    }

    // Get the standup response
    const response = await prisma.standupResponse.findFirst({
      where: {
        id: responseId,
        session: {
          user: {
            orgId
          }
        }
      }
    });

    if (!response) {
      return res.status(404).json({ error: 'Standup response not found' });
    }

    // Generate embedding
    const embedding = await generateEmbedding(response.answerText);

    // Update the response with the embedding
    // Note: In production, you would use a proper vector database or pgvector
    // For demo purposes, we'll just return the embedding
    res.json({
      responseId: response.id,
      embedding: embedding,
      message: 'Embedding generated successfully (demo mode)'
    });

  } catch (error) {
    console.error('Error generating embedding:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

export default router;
