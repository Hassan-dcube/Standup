import { Router } from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';
import { recomputeProjectProgress } from '../services/projectAggregation.js';
import { triggerStandupAssessment } from '../services/triggerService.js';
import { progressEngine } from '../services/progressEngine.js';
import { logger } from '../services/logger.js';

const router = Router();

// Get standup data for calendar view
router.get('/calendar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, requesterId } = req.query;
    
    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    
    // Use requesterId from query, fallback to userId from params
    const actualRequesterId = (requesterId as string) || userId;
    
    // Get start and end of the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Check if requester is a manager
    const requester = await prisma.user.findUnique({
      where: { id: actualRequesterId }
    });
    
    const isManager = requester?.role === 'MANAGER';
    
    // Build where clause based on role
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // If not a manager, only show their own standups
    if (!isManager) {
      whereClause.userId = userId;
    }
    // If manager, show all standups from their organization
    else {
      whereClause.orgId = requester.orgId;
    }
    
    const standups = await prisma.standupSession.findMany({
      where: whereClause,
      include: {
        responses: {
          include: {
            managerComments: {
              where: { parentId: null }, // Only top-level comments
              include: {
                manager: true,
                replies: {
                  include: {
                    manager: true
                  },
                  orderBy: { createdAt: 'asc' }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        user: true,
        project: true,
        managerComments: {
          include: {
            manager: true
          }
        },
        standupSeen: {
          where: {
            managerId: requesterId as string
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    // Format data for calendar
    const calendarData = standups.map(standup => ({
      id: standup.id,
      date: standup.date.getDate(),
      state: standup.state,
      submittedAt: standup.submittedAt,
      responses: standup.responses,
      user: standup.user,
      project: standup.project,
      managerComments: standup.managerComments,
      isSeen: standup.standupSeen.length > 0,
      seenAt: standup.standupSeen[0]?.seenAt || null
    }));
    
    res.json({ standups: calendarData, isManager });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// Mark standup as seen by manager
router.post('/:sessionId/seen', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { managerId } = req.body;
    
    // Check if manager exists and has MANAGER role
    const manager = await prisma.user.findUnique({
      where: { id: managerId }
    });
    
    if (!manager || manager.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can mark standups as seen' });
    }
    
    // Mark as seen (upsert to avoid duplicates)
    await prisma.standupSeen.upsert({
      where: {
        sessionId_managerId: {
          sessionId,
          managerId
        }
      },
      update: {
        seenAt: new Date()
      },
      create: {
        sessionId,
        managerId,
        seenAt: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking standup as seen:', error);
    res.status(500).json({ error: 'Failed to mark standup as seen' });
  }
});

// Add comment to standup (manager or employee reply)
router.post('/:sessionId/comment', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, comment, responseId, parentId } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If this is a reply to a manager comment, check permissions
    if (parentId) {
      const parentComment = await prisma.managerComment.findUnique({
        where: { id: parentId },
        include: { manager: true }
      });
      
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
      
      // Only the standup owner or manager can reply
      const standup = await prisma.standupSession.findUnique({
        where: { id: sessionId }
      });
      
      if (user.role !== 'MANAGER' && standup?.userId !== userId) {
        return res.status(403).json({ error: 'Only the standup owner or manager can reply' });
      }
    } else {
      // New top-level comment - only managers can create these
      if (user.role !== 'MANAGER') {
        return res.status(403).json({ error: 'Only managers can create new comments' });
      }
    }
    
    // Add comment
    const newComment = await prisma.managerComment.create({
      data: {
        sessionId,
        responseId: responseId || null,
        managerId: userId, // Store the actual user ID (could be manager or employee)
        comment,
        parentId: parentId || null
      },
      include: {
        manager: true,
        response: true,
        parent: true,
        replies: {
          include: {
            manager: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    res.json({ comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get standup history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { requesterId, month, year } = req.query;
    
    // Check if requester is a manager
    const requester = await prisma.user.findUnique({
      where: { id: requesterId as string }
    });
    
    const isManager = requester?.role === 'MANAGER';
    
    // Build where clause based on role
    const whereClause: any = {
      state: 'SUBMITTED' // Only show completed standups
    };
    
    // If not a manager, only show their own standups
    if (!isManager) {
      whereClause.userId = userId;
    }
    // If manager, show all standups from their organization
    else {
      whereClause.orgId = requester.orgId;
    }
    
    // Add date filter if provided
    if (month && year) {
      const targetMonth = parseInt(month as string);
      const targetYear = parseInt(year as string);
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
      
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }
    
    const standups = await prisma.standupSession.findMany({
      where: whereClause,
      include: {
        user: true,
        responses: true,
        managerComments: {
          include: {
            manager: true
          }
        },
        standupSeen: {
          where: {
            managerId: requesterId as string
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    // Format data for history
    const historyData = standups.map(standup => ({
      id: standup.id,
      date: standup.date.toISOString().split('T')[0],
      status: standup.state === 'SUBMITTED' ? 'attended' : 'missed',
      employeeName: standup.user.name,
      startTime: standup.startedAt ? new Date(standup.startedAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : undefined,
      endTime: standup.submittedAt ? new Date(standup.submittedAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : undefined,
      duration: standup.durationSec ? Math.round(standup.durationSec / 60) : undefined,
      aiSummary: `Standup completed by ${standup.user.name}. ${standup.responses.length} questions answered.`,
      keyPoints: standup.responses.map(r => `Q${r.questionId}: ${r.answerText}`),
      blockers: standup.responses.filter(r => r.questionId === 'q3' && r.answerText.toLowerCase().includes('yes')).map(r => r.answerText),
      summarySharedWithManager: standup.state === 'SUBMITTED',
      managerSeenStatus: standup.standupSeen.length > 0 ? 'seen' : 'not_seen',
      managerComments: standup.managerComments
    }));
    
    res.json({ standups: historyData, isManager });
  } catch (error) {
    console.error('Error fetching standup history:', error);
    res.status(500).json({ error: 'Failed to fetch standup history' });
  }
});

// Get user's standup history with manager comments
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, date } = req.query;
    
    // Build where clause
    const whereClause: any = {
      userId: userId,
      state: 'SUBMITTED'
    };
    
    // Add date filtering if provided
    if (date) {
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    const standups = await prisma.standupSession.findMany({
      where: whereClause,
      include: {
        responses: {
          include: {
            managerComments: {
              where: { parentId: null }, // Only top-level comments
              include: {
                manager: true,
                replies: {
                  include: {
                    manager: true
                  },
                  orderBy: { createdAt: 'asc' }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        user: true
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string)
    });
    
    // Format data for user history
    const historyData = standups.map(standup => ({
      id: standup.id,
      date: standup.date.toISOString().split('T')[0],
      submittedAt: standup.submittedAt,
      state: standup.state,
      responses: standup.responses.map(response => ({
        id: response.id,
        questionId: response.questionId,
        answerText: response.answerText,
        managerComments: response.managerComments.map(comment => ({
          id: comment.id,
          comment: comment.comment,
          createdAt: comment.createdAt,
          manager: {
            name: comment.manager.name
          },
          replies: comment.replies.map(reply => ({
            id: reply.id,
            comment: reply.comment,
            createdAt: reply.createdAt,
            manager: {
              name: reply.manager.name
            }
          }))
        }))
      }))
    }));
    
    res.json({ standups: historyData });
  } catch (error) {
    console.error('Error fetching user standup history:', error);
    res.status(500).json({ error: 'Failed to fetch standup history' });
  }
});

// Get dashboard statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { requesterId } = req.query;
    
    // Check if requester is a manager
    const requester = await prisma.user.findUnique({
      where: { id: requesterId as string }
    });
    
    const isManager = requester?.role === 'MANAGER';
    
    if (isManager) {
      // Manager stats - team-wide statistics
      const teamStandups = await prisma.standupSession.findMany({
        where: {
          orgId: requester.orgId,
          state: 'SUBMITTED'
        },
        include: {
          user: true,
          responses: true
        }
      });
      
      const totalStandups = teamStandups.length;
      const uniqueUsers = new Set(teamStandups.map(s => s.userId)).size;
      const totalUsers = await prisma.user.count({
        where: { orgId: requester.orgId, role: 'EMPLOYEE' }
      });
      
      const attendanceRate = totalUsers > 0 ? Math.round((uniqueUsers / totalUsers) * 100) : 0;
      const avgDuration = totalStandups > 0 ? 
        Math.round(teamStandups.reduce((sum, s) => sum + (s.durationSec || 180), 0) / totalStandups / 60 * 10) / 10 : 0;
      
      // This week's standups
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const thisWeekStandups = teamStandups.filter(s => s.date >= weekStart);
      const thisWeekUsers = new Set(thisWeekStandups.map(s => s.userId)).size;
      const thisWeekAttendance = totalUsers > 0 ? Math.round((thisWeekUsers / totalUsers) * 100) : 0;
      
      res.json({
        attendanceRate: `${attendanceRate}%`,
        avgDuration: `${avgDuration}min`,
        teamEngagement: `${thisWeekAttendance}%`,
        activeMembers: `${thisWeekUsers}/${totalUsers}`,
        totalStandups,
        isManager: true
      });
    } else {
      // Employee stats - personal statistics
      const userStandups = await prisma.standupSession.findMany({
        where: {
          userId: userId,
          state: 'SUBMITTED'
        },
        include: {
          responses: true
        }
      });
      
      const totalStandups = userStandups.length;
      const avgDuration = totalStandups > 0 ? 
        Math.round(userStandups.reduce((sum, s) => sum + (s.durationSec || 180), 0) / totalStandups / 60 * 10) / 10 : 0;
      
      // This week's standups
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const thisWeekStandups = userStandups.filter(s => s.date >= weekStart);
      const weeklyParticipation = `${thisWeekStandups.length}/5`;
      
      // Calculate attendance rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentStandups = userStandups.filter(s => s.date >= thirtyDaysAgo);
      const attendanceRate = Math.round((recentStandups.length / 30) * 100);
      
      res.json({
        attendanceRate: `${attendanceRate}%`,
        avgDuration: `${avgDuration}min`,
        weeklyParticipation,
        totalStandups,
        isManager: false
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get today's standup summary for managers
router.get('/summary/today/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Check if user is a manager
    const manager = await prisma.user.findUnique({
      where: { id: managerId }
    });
    
    if (!manager || manager.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can access standup summaries' });
    }
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get all standups from today
    const todayStandups = await prisma.standupSession.findMany({
      where: {
        orgId: manager.orgId,
        state: 'SUBMITTED',
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        user: true,
        responses: {
          include: {
            managerComments: {
              where: { parentId: null },
              include: {
                manager: true,
                replies: {
                  include: {
                    manager: true
                  },
                  orderBy: { createdAt: 'asc' }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });
    
    // Calculate summary statistics
    const totalEmployees = await prisma.user.count({
      where: { orgId: manager.orgId, role: 'EMPLOYEE' }
    });
    
    const submittedCount = todayStandups.length;
    const attendanceRate = totalEmployees > 0 ? Math.round((submittedCount / totalEmployees) * 100) : 0;
    
    // Extract key information
    const accomplishments: Array<{employee: string, accomplishment: string}> = [];
    const blockers: Array<{employee: string, blocker: string, standupId: string, employeeId: string}> = [];
    const helpRequests: Array<{employee: string, request: string, standupId: string, employeeId: string}> = [];
    const comments: Array<{employee: string, question: string, comment: string, manager: string, replies: number, createdAt: Date}> = [];
    
    todayStandups.forEach(standup => {
      standup.responses.forEach(response => {
        switch(response.questionId) {
          case 'q1': // What did you accomplish yesterday?
            accomplishments.push({
              employee: standup.user.name,
              accomplishment: response.answerText
            });
            break;
          case 'q2': // What are you working on today?
            // This could be used for current work tracking
            break;
          case 'q3': // Any blockers?
            if (response.answerText.toLowerCase().includes('yes') || 
                response.answerText.toLowerCase().includes('block') ||
                response.answerText.toLowerCase().includes('issue') ||
                response.answerText.toLowerCase().includes('problem')) {
              blockers.push({
                employee: standup.user.name,
                blocker: response.answerText,
                standupId: standup.id,
                employeeId: standup.userId
              });
            }
            break;
          case 'q4': // Do you need help?
            if (response.answerText.toLowerCase().includes('yes') || 
                response.answerText.toLowerCase().includes('help') ||
                response.answerText.toLowerCase().includes('support') ||
                response.answerText.toLowerCase().includes('assist')) {
              helpRequests.push({
                employee: standup.user.name,
                request: response.answerText,
                standupId: standup.id,
                employeeId: standup.userId
              });
            }
            break;
        }
        
        // Collect comments
        response.managerComments.forEach(comment => {
          comments.push({
            employee: standup.user.name,
            question: `Q${response.questionId}`,
            comment: comment.comment,
            manager: comment.manager.name,
            replies: comment.replies.length,
            createdAt: comment.createdAt
          });
        });
      });
    });
    
    // Get employees who didn't submit
    const submittedUserIds = todayStandups.map(s => s.userId);
    const missingEmployees = await prisma.user.findMany({
      where: {
        orgId: manager.orgId,
        role: 'EMPLOYEE',
        id: { notIn: submittedUserIds }
      },
      select: { name: true, email: true }
    });
    
    res.json({
      date: today.toISOString().split('T')[0],
      summary: {
        totalEmployees,
        submittedCount,
        attendanceRate: `${attendanceRate}%`,
        missingCount: missingEmployees.length
      },
      accomplishments,
      blockers,
      helpRequests,
      comments,
      missingEmployees,
      standups: todayStandups.map(standup => ({
        id: standup.id,
        employee: standup.user.name,
        submittedAt: standup.submittedAt,
        responses: standup.responses.map(r => ({
          questionId: r.questionId,
          answer: r.answerText
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching today\'s standup summary:', error);
    res.status(500).json({ error: 'Failed to fetch standup summary' });
  }
});

router.post('/start', async (req, res) => {
  const body = z.object({
    orgId: z.string(),
    userId: z.string(),
    templateId: z.string().optional(),
    dateISO: z.string().optional(),
    projectId: z.string().optional(),
  }).parse(req.body);

  const date = body.dateISO ? new Date(body.dateISO) : new Date();
  const startOfDay = new Date(date.toDateString());

  let session = await prisma.standupSession.findFirst({
    where: { orgId: body.orgId, userId: body.userId, date: startOfDay }
  });

  if (!session) {
    session = await prisma.standupSession.create({
      data: { 
        orgId: body.orgId, 
        userId: body.userId, 
        projectId: body.projectId,
        date: startOfDay, 
        startedAt: new Date() 
      }
    });
  }

  // Determine template to use
  let template = null as any;
  if (body.templateId) {
    template = await prisma.standupTemplate.findUnique({ where: { id: body.templateId } });
  }
  if (!template) {
    template = await prisma.standupTemplate.findFirst({ where: { orgId: body.orgId } });
  }
  if (!template) {
    template = await prisma.standupTemplate.create({
      data: {
        orgId: body.orgId,
        name: 'Default Daily Standup',
        questions: JSON.stringify([
          { id: 'q1', text: 'What did you accomplish yesterday?' },
          { id: 'q2', text: 'What are you working on today?' },
          { id: 'q3', text: 'Any blockers?' },
          { id: 'q4', text: 'Do you need help with anything?' }
        ]) as unknown as any,
      }
    });
  }

  res.json({ session, template });
});

router.post('/:sessionId/answer', async (req, res) => {
  const { sessionId } = req.params;
  const body = z.object({
    questionId: z.string(),
    answerText: z.string().max(2000)
  }).parse(req.body);

  const response = await prisma.standupResponse.upsert({
    where: { sessionId_questionId: { sessionId, questionId: body.questionId } } as any,
    update: { answerText: body.answerText },
    create: { sessionId, questionId: body.questionId, answerText: body.answerText }
  }).catch(async () => {
    return await prisma.standupResponse.create({ data: { sessionId, questionId: body.questionId, answerText: body.answerText } });
  });

  res.json({ ok: true, response });
});

// Update project for a standup session
router.put('/:sessionId/project', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { projectId } = req.body;

    const session = await prisma.standupSession.update({
      where: { id: sessionId },
      data: { projectId },
      include: { project: true }
    });

    res.json({ session });
  } catch (error) {
    console.error('Error updating standup project:', error);
    res.status(500).json({ error: 'Failed to update standup project' });
  }
});

router.post('/:sessionId/submit', async (req, res) => {
  const { sessionId } = req.params;

  const responses = await prisma.standupResponse.findMany({ where: { sessionId } });
  const started = await prisma.standupSession.findUnique({ where: { id: sessionId } });

  const session = await prisma.standupSession.update({
    where: { id: sessionId },
    data: {
      state: 'SUBMITTED',
      submittedAt: new Date(),
      durationSec: started?.startedAt ? Math.floor((Date.now() - started.startedAt.getTime()) / 1000) : null
    }
  });

  // Trigger per-task assessment and project recomputation
  if (session.userId) {
    try {
      const triggerResult = await triggerStandupAssessment(session.userId, session.id);
      
      if (!triggerResult.success) {
        logger.warn('Standup assessment trigger had errors', {
          userId: session.userId,
          sessionId: session.id,
          errorCount: triggerResult.errors.length,
          errors: triggerResult.errors
        });
      }
      
    } catch (error) {
      logger.error('Failed to trigger standup assessment', {
        userId: session.userId,
        sessionId: session.id,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't fail the standup submission if trigger fails
    }
  }

  res.json({ ok: true, session, responses });
});

router.get('/', async (req, res) => {
  const userId = String(req.query.userId || '');
  const limit = parseInt(String(req.query.limit || '20'), 10);

  const sessions = await prisma.standupSession.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
    include: { responses: true }
  });

  res.json({ sessions });
});

// Check if user has any standup (including drafts) for today
router.get('/user/:userId/today-check', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Check for any standup today (including drafts)
    const anyStandupToday = await prisma.standupSession.findFirst({
      where: {
        userId: userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        state: true,
        submittedAt: true
      }
    });
    
    // Check for completed standup today
    const completedStandupToday = await prisma.standupSession.findFirst({
      where: {
        userId: userId,
        state: 'SUBMITTED',
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        state: true,
        submittedAt: true
      }
    });
    
    res.json({
      hasAnyStandupToday: !!anyStandupToday,
      hasCompletedStandupToday: !!completedStandupToday,
      anyStandup: anyStandupToday,
      completedStandup: completedStandupToday
    });
  } catch (error) {
    console.error('Error checking today standup:', error);
    res.status(500).json({ error: 'Failed to check today standup' });
  }
});

// Mark standup as seen by manager
router.post('/:sessionId/mark-seen', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { managerId } = req.body;
    
    // Create or update the StandupSeen record
    const standupSeen = await prisma.standupSeen.upsert({
      where: {
        sessionId_managerId: {
          sessionId: sessionId,
          managerId: managerId
        }
      },
      update: {
        seenAt: new Date()
      },
      create: {
        sessionId: sessionId,
        managerId: managerId,
        seenAt: new Date()
      }
    });
    
    res.json({ 
      success: true, 
      standupSeen: standupSeen 
    });
  } catch (error) {
    console.error('Error marking standup as seen:', error);
    res.status(500).json({ error: 'Failed to mark standup as seen' });
  }
});

export default router;
