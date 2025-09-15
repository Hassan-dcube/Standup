import { Router } from 'express';
import axios from 'axios';
import { prisma } from '../db.js';
import { requireAuth, requireManager } from '../auth.js';

const router = Router();

// Apply authentication and manager role check to all chatbot routes
// Temporarily disabled for testing
// router.use(requireAuth);
// router.use(requireManager);

// Get blockers from standups
router.get('/blockers', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get today's standup sessions with responses
    const standupSessions = await prisma.standupSession.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        user: true,
        responses: true
      }
    });

    const blockers: Array<{
      id: string;
      employee: string;
      blocker: string;
      date: string;
    }> = [];

    // Extract blockers from responses
    standupSessions.forEach(session => {
      session.responses.forEach(response => {
        // Look for blocker-related content in the answer text
        const answerText = response.answerText.toLowerCase();
        if (answerText.includes('blocker') || 
            answerText.includes('impediment') ||
            answerText.includes('obstacle') ||
            answerText.includes('stuck') ||
            answerText.includes('issue') ||
            answerText.includes('problem')) {
          if (response.answerText && response.answerText.trim() !== '') {
        blockers.push({
          id: `${session.id}-${response.id}`,
          employee: session.user.name,
          blocker: response.answerText,
          date: today.toISOString().split('T')[0]
        });
          }
        }
      });
    });

    res.json({ blockers });
  } catch (error) {
    console.error('Error fetching blockers:', error);
    res.status(500).json({ error: 'Failed to fetch blockers' });
  }
});

// Get standup summaries for LLM processing
router.get('/standup-summary/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    // Get all standup sessions for the specified date
    const standups = await prisma.standupSession.findMany({
      where: {
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999))
        },
        state: 'SUBMITTED'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        responses: true
      }
    });

    if (standups.length === 0) {
      return res.json({
        summary: "No standup updates available for this date.",
        standups: []
      });
    }

    // Format standup data for LLM
    const formattedStandups = standups.map(standup => ({
      employee: standup.user.name,
      email: standup.user.email,
      responses: standup.responses.map(response => ({
        question: `Question ${response.questionId}`,
        answer: response.answerText
      }))
    }));

    // Create prompt for LLM
    const prompt = createStandupSummaryPrompt(formattedStandups);

    // Call Ollama API
    const summary = await generateSummary(prompt);

    res.json({
      summary,
      standups: formattedStandups,
      date: date,
      totalEmployees: standups.length
    });

  } catch (error) {
    console.error('Error generating standup summary:', error);
    res.status(500).json({ error: 'Failed to generate standup summary' });
  }
});

// Chat endpoint for interactive chatbot
router.post('/chat', async (req, res) => {
  try {
    const { message, context, includeStandupData } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let standupData = null;
    
    // If the message is asking about standups or we're explicitly including standup data
    if (includeStandupData || message.toLowerCase().includes('standup') || 
        message.toLowerCase().includes('summary') || message.toLowerCase().includes('team')) {
      
      // Get today's standup data
      const today = new Date().toISOString().split('T')[0];
      const targetDate = new Date(today);
      
      const standups = await prisma.standupSession.findMany({
        where: {
          date: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999))
          },
          state: 'SUBMITTED'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          responses: true
        }
      });

      if (standups.length > 0) {
        standupData = standups.map(standup => ({
          employee: standup.user.name,
          email: standup.user.email,
          responses: standup.responses.map(response => ({
            question: `Question ${response.questionId}`,
            answer: response.answerText
          }))
        }));
      }
    }

    // Create context-aware prompt
    const prompt = createChatPrompt(message, context, standupData);
    
    // Call Ollama API
    const response = await generateChatResponse(prompt);
    
    res.json({
      response,
      timestamp: new Date().toISOString(),
      hasStandupData: standupData !== null
    });

  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Helper function to create standup summary prompt
function createStandupSummaryPrompt(standups: any[]): string {
  const standupText = standups.map(standup => {
    const responses = standup.responses.map((r: any) => 
      `Q: ${r.question}\nA: ${r.answer}`
    ).join('\n\n');
    
    return `Employee: ${standup.employee} (${standup.email})\n${responses}`;
  }).join('\n\n---\n\n');

  return `You are an AI assistant that summarizes daily standup meetings. Please analyze the following standup updates and provide a concise, professional summary that highlights:

1. Key accomplishments across the team
2. Current work in progress
3. Blockers or challenges that need attention
4. Overall team progress and momentum

Standup Updates:
${standupText}

Please provide a well-structured summary that would be useful for managers and stakeholders. Keep it concise but informative.`;
}

// Helper function to create chat prompt
function createChatPrompt(message: string, context?: any, standupData?: any): string {
  let prompt = `You are a helpful AI assistant for a project management and standup system. You can help with:

- Analyzing standup data and providing insights
- Answering questions about team progress
- Suggesting improvements for standup processes
- Providing project management advice

User question: ${message}`;

  if (standupData && standupData.length > 0) {
    const standupText = standupData.map((standup: any) => {
      const responses = standup.responses.map((r: any) => 
        `Q: ${r.question}\nA: ${r.answer}`
      ).join('\n\n');
      
      return `Employee: ${standup.employee} (${standup.email})\n${responses}`;
    }).join('\n\n---\n\n');

    prompt += `\n\nCurrent Standup Data (${new Date().toISOString().split('T')[0]}):\n${standupText}`;
  }

  if (context) {
    prompt += `\n\nAdditional Context: ${JSON.stringify(context, null, 2)}`;
  }

  prompt += '\n\nPlease provide a helpful and professional response based on the available information.';
  
  return prompt;
}

// Helper function to call Ollama API
async function generateSummary(prompt: string): Promise<string> {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      }
    });

    return response.data.response || 'Unable to generate summary.';
  } catch (error) {
    console.error('Ollama API error:', error);
    throw new Error('Failed to generate summary with LLM');
  }
}

// Helper function to call Ollama API for chat
async function generateChatResponse(prompt: string): Promise<string> {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 500
      }
    });

    return response.data.response || 'I apologize, but I cannot process your request at the moment.';
  } catch (error) {
    console.error('Ollama API error:', error);
    throw new Error('Failed to generate chat response');
  }
}

export default router;
