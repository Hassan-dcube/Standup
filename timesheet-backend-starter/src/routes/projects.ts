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

// GET /api/projects - List projects with pagination and filtering - Demo mode
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = { orgId };
    if (status) {
      where.status = status;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } }
          },
          _count: { select: { sprints: true, tasks: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        sprints: {
          orderBy: { startDate: 'desc' }
        },
        tasks: {
          include: {
            assignees: {
              include: { user: { select: { id: true, name: true, email: true } } }
            },
            progress: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { updatedAt: 'desc' }
        },
        _count: {
          select: {
            sprints: true,
            tasks: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create project (Manager only) - Demo mode
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values but allow dynamic user selection
    const userId = req.body.ownerId || 'hassan-manager';
    const orgId = 'demo-org';
    const {
      name,
      ownerId,
      startAt,
      endAt,
      template = 'blank',
      members = [],
      llmSettings = {
        lookbackDays: 7,
        weighting: 'points',
        smoothing: 'medium',
        triggers: ['onSubmit', 'nightly']
      },
      description,
      sprint
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Project name must be less than 100 characters' });
    }

    // Check if project name is unique within org
    const existingProject = await prisma.project.findFirst({
      where: {
        orgId,
        name: name.trim()
      }
    });

    if (existingProject) {
      return res.status(400).json({ error: 'Project name must be unique within your organization' });
    }

    // In demo mode, validate owner against demo users
    const demoUsers = [
      { id: '1', name: 'Fawad', email: 'fawad@company.com', role: 'employee' },
      { id: '2', name: 'Hira', email: 'hira@company.com', role: 'employee' },
      { id: '3', name: 'Assad', email: 'assad@company.com', role: 'employee' },
      { id: '4', name: 'Saad', email: 'saad@company.com', role: 'employee' },
      { id: 'hassan-manager', name: 'Hassan', email: 'hassan@company.com', role: 'manager' }
    ];

    const owner = demoUsers.find(u => u.id === ownerId);
    if (!owner) {
      return res.status(400).json({ error: 'Invalid owner selected' });
    }
    if (owner.role !== 'manager') {
      return res.status(400).json({ error: 'Owner must be a manager' });
    }

    // Create project with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create project
      const project = await tx.project.create({
        data: {
          orgId,
          name: name.trim(),
          description: description?.trim(),
          ownerId,
          startDate: startAt ? new Date(startAt) : new Date(),
          endDate: endAt ? new Date(endAt) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          progressCached: 0
        }
      });

      // Add owner information manually for demo mode
      const projectWithOwner = {
        ...project,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email
        }
      };

      // Create project members
      const projectMembers = [];
      const addedUserIds = new Set();
      
      // Add owner as manager (if not already in members list)
      if (!members.some((m: any) => m.userId === ownerId)) {
        projectMembers.push({
          projectId: project.id,
          userId: ownerId,
          role: 'MANAGER'
        });
        addedUserIds.add(ownerId);
      }

      // Add additional members (validate against demo users and avoid duplicates)
      for (const member of members) {
        const memberUser = demoUsers.find(u => u.id === member.userId);
        if (memberUser && !addedUserIds.has(member.userId)) {
          projectMembers.push({
            projectId: project.id,
            userId: member.userId,
            role: member.role
          });
          addedUserIds.add(member.userId);
        }
      }

      if (projectMembers.length > 0) {
        await tx.projectMember.createMany({
          data: projectMembers
        });
      }

      // Handle template-specific logic
      let createdSprint = null;
      let createdTasks = [];

      if (template === 'paper-writing') {
        // Create Sprint 1
        const sprintData = sprint || {
          name: 'Sprint 1',
          startAt: project.startDate || new Date(),
          endAt: new Date((project.startDate || new Date()).getTime() + 14 * 24 * 60 * 60 * 1000),
          goal: 'Complete first draft'
        };

        createdSprint = await tx.sprint.create({
          data: {
            projectId: project.id,
            name: sprintData.name,
            startDate: new Date(sprintData.startAt),
            endDate: new Date(sprintData.endAt),
            goal: sprintData.goal
          }
        });

        // Create suggested tasks for Paper Writing & Submission
        const suggestedTasks = [
          {
            title: 'Literature Review',
            description: 'Research and analyze relevant academic papers',
            acceptanceCriteria: 'Complete review of 15+ relevant papers with summary notes',
            estimatePoints: 8,
            dueDate: new Date(createdSprint.startDate.getTime() + 3 * 24 * 60 * 60 * 1000)
          },
          {
            title: 'Methodology Section',
            description: 'Write detailed methodology and approach',
            acceptanceCriteria: 'Complete methodology section with clear procedures and rationale',
            estimatePoints: 5,
            dueDate: new Date(createdSprint.startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          {
            title: 'Data Collection',
            description: 'Gather and organize research data',
            acceptanceCriteria: 'All required data collected, organized, and validated',
            estimatePoints: 6,
            dueDate: new Date(createdSprint.startDate.getTime() + 10 * 24 * 60 * 60 * 1000)
          },
          {
            title: 'Results Analysis',
            description: 'Analyze data and write results section',
            acceptanceCriteria: 'Complete results section with analysis and visualizations',
            estimatePoints: 7,
            dueDate: new Date(createdSprint.startDate.getTime() + 12 * 24 * 60 * 60 * 1000)
          },
          {
            title: 'Final Draft Review',
            description: 'Review and polish the complete paper',
            acceptanceCriteria: 'Final draft complete with all sections reviewed and polished',
            estimatePoints: 4,
            dueDate: createdSprint.endDate
          }
        ];

        for (const taskData of suggestedTasks) {
          const task = await tx.task.create({
            data: {
              projectId: project.id,
              sprintId: createdSprint.id,
              title: taskData.title,
              description: taskData.description,
              acceptanceCriteria: taskData.acceptanceCriteria,
              estimatePoints: taskData.estimatePoints,
              dueDate: taskData.dueDate,
              status: 'TODO'
            }
          });
          createdTasks.push(task);
        }
      }

      // Create activity log entry
      await tx.activityLog.create({
        data: {
          orgId,
          actorId: userId,
          action: 'PROJECT_CREATED',
          meta: {
            projectName: project.name,
            template,
            membersCount: projectMembers.length,
            tasksCount: createdTasks.length
          }
        }
      });

      return {
        project: projectWithOwner,
        sprint: createdSprint,
        tasks: createdTasks,
        members: projectMembers
      };
    });

    res.status(201).json({
      project: result.project,
      sprint: result.sprint,
      tasks: result.tasks,
      members: result.members
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project (Manager only)
router.put('/:id', allow('MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orgId = await getUserOrg(userId);
    const projectId = req.params.id;
    const { name, description, startDate, endDate, status, progressCached } = req.body;

    // Check if project exists and user has access
    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, orgId }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validation
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Project name is required' });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: 'Project name must be less than 100 characters' });
      }
    }

    if (progressCached !== undefined && (progressCached < 0 || progressCached > 1)) {
      return res.status(400).json({ error: 'Progress must be between 0 and 1' });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status }),
        ...(progressCached !== undefined && { progressCached })
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project (Manager only) - Demo mode
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;

    // Check if project exists and user has access
    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, orgId }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// GET /api/projects/:id/blockers-help - Get blockers and help needed for a project
router.get('/:id/blockers-help', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;

    // Get project members
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true }
    });

    const memberIds = projectMembers.map(member => member.userId);

    // Get today's standup sessions for project members only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const standupSessions = await prisma.standupSession.findMany({
      where: {
        userId: { in: memberIds },
        date: { 
          gte: today,
          lt: tomorrow
        },
        state: 'SUBMITTED'
      },
      include: {
        responses: {
          where: {
            questionId: { in: ['q3', 'q4', '3', '4'] } // Blockers and help needed questions
          }
        },
        user: true
      },
      orderBy: { date: 'desc' }
    });

    // Extract blockers and help needed
    const blockers: Array<{ user: string; text: string; date: string }> = [];
    const helpNeeded: Array<{ user: string; text: string; date: string }> = [];

    standupSessions.forEach(session => {
      session.responses.forEach(response => {
        if (response.questionId === 'q3' || response.questionId === '3') {
          // Blockers
          blockers.push({
            user: session.user.name,
            text: response.answerText,
            date: session.date.toISOString()
          });
        } else if (response.questionId === 'q4' || response.questionId === '4') {
          // Help needed
          helpNeeded.push({
            user: session.user.name,
            text: response.answerText,
            date: session.date.toISOString()
          });
        }
      });
    });

    res.json({
      projectId,
      blockers,
      helpNeeded,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching blockers and help needed:', error);
    res.status(500).json({ error: 'Failed to fetch blockers and help needed' });
  }
});

// POST /api/projects/:id/members - Add project member (Manager only) - Demo mode
router.post('/:id/members', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;
    const { userId: memberId, role = 'CONTRIBUTOR' } = req.body;

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // In demo mode, validate user against demo users
    const demoUsers = [
      { id: '1', name: 'Fawad', email: 'fawad@company.com', role: 'employee' },
      { id: '2', name: 'Hira', email: 'hira@company.com', role: 'employee' },
      { id: '3', name: 'Assad', email: 'assad@company.com', role: 'employee' },
      { id: '4', name: 'Saad', email: 'saad@company.com', role: 'employee' },
      { id: 'hassan-manager', name: 'Hassan', email: 'hassan@company.com', role: 'manager' }
    ];

    const user = demoUsers.find(u => u.id === memberId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: memberId }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: memberId,
        role
      }
    });

    // Add user information manually for demo mode
    const memberWithUser = {
      ...member,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    res.status(201).json(memberWithUser);
  } catch (error) {
    console.error('Error adding project member:', error);
    res.status(500).json({ error: 'Failed to add project member' });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove project member (Manager only) - Demo mode
router.delete('/:id/members/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;
    const memberId = req.params.userId;

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Don't allow removing the project owner
    if (project.ownerId === memberId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberId } }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ error: 'Failed to remove project member' });
  }
});

// GET /api/projects/:id/settings - Get project settings
router.get('/:id/settings', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId },
      select: {
        id: true,
        name: true,
        lookbackDays: true,
        weighting: true,
        smoothing: true,
        dailyJumpCap: true,
        ragTopK: true,
        triggersOnSubmit: true,
        triggersNightly: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = {
      lookbackDays: project.lookbackDays,
      weighting: project.weighting,
      smoothing: project.smoothing,
      dailyJumpCap: project.dailyJumpCap,
      ragTopK: project.ragTopK,
      triggersOnSubmit: project.triggersOnSubmit,
      triggersNightly: project.triggersNightly
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching project settings:', error);
    res.status(500).json({ error: 'Failed to fetch project settings' });
  }
});

// PUT /api/projects/:id/settings - Update project settings
router.put('/:id/settings', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;
    const { settings } = req.body;

    // Validation
    if (!settings) {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    // Validate settings
    if (settings.lookbackDays && (settings.lookbackDays < 1 || settings.lookbackDays > 30)) {
      return res.status(400).json({ error: 'Lookback days must be between 1 and 30' });
    }
    if (settings.weighting && !['points', 'equal'].includes(settings.weighting)) {
      return res.status(400).json({ error: 'Weighting must be "points" or "equal"' });
    }
    if (settings.smoothing && !['low', 'med', 'high'].includes(settings.smoothing)) {
      return res.status(400).json({ error: 'Smoothing must be "low", "med", or "high"' });
    }
    if (settings.dailyJumpCap && (settings.dailyJumpCap < 0.05 || settings.dailyJumpCap > 0.50)) {
      return res.status(400).json({ error: 'Daily jump cap must be between 0.05 and 0.50' });
    }
    if (settings.ragTopK && (settings.ragTopK < 10 || settings.ragTopK > 20)) {
      return res.status(400).json({ error: 'RAG top-K must be between 10 and 20' });
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update project settings
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(settings.lookbackDays !== undefined && { lookbackDays: settings.lookbackDays }),
        ...(settings.weighting !== undefined && { weighting: settings.weighting }),
        ...(settings.smoothing !== undefined && { smoothing: settings.smoothing }),
        ...(settings.dailyJumpCap !== undefined && { dailyJumpCap: settings.dailyJumpCap }),
        ...(settings.ragTopK !== undefined && { ragTopK: settings.ragTopK }),
        ...(settings.triggersOnSubmit !== undefined && { triggersOnSubmit: settings.triggersOnSubmit }),
        ...(settings.triggersNightly !== undefined && { triggersNightly: settings.triggersNightly })
      },
      select: {
        id: true,
        name: true,
        lookbackDays: true,
        weighting: true,
        smoothing: true,
        dailyJumpCap: true,
        ragTopK: true,
        triggersOnSubmit: true,
        triggersNightly: true
      }
    });

    const updatedSettings = {
      lookbackDays: updatedProject.lookbackDays,
      weighting: updatedProject.weighting,
      smoothing: updatedProject.smoothing,
      dailyJumpCap: updatedProject.dailyJumpCap,
      ragTopK: updatedProject.ragTopK,
      triggersOnSubmit: updatedProject.triggersOnSubmit,
      triggersNightly: updatedProject.triggersNightly
    };

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Error updating project settings:', error);
    res.status(500).json({ error: 'Failed to update project settings' });
  }
});

// GET /api/projects/:id/badges - Get project risk and freshness badges
router.get('/:id/badges', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectId = req.params.id;

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Import the badge calculation function
    const { calculateProjectBadges } = await import('../services/projectAggregation.js');
    const badges = await calculateProjectBadges(projectId);

    res.json({ badges });
  } catch (error) {
    console.error('Error fetching project badges:', error);
    res.status(500).json({ error: 'Failed to fetch project badges' });
  }
});

// GET /api/projects/badges - Get badges for multiple projects
router.get('/badges', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const projectIds = req.query.ids as string;

    if (!projectIds) {
      return res.status(400).json({ error: 'Project IDs are required' });
    }

    const ids = projectIds.split(',');
    
    // Check if all projects exist and user has access
    const projects = await prisma.project.findMany({
      where: { 
        id: { in: ids },
        orgId 
      },
      select: { id: true }
    });

    if (projects.length !== ids.length) {
      return res.status(404).json({ error: 'One or more projects not found' });
    }

    // Import the badge calculation function
    const { getProjectsBadges } = await import('../services/projectAggregation.js');
    const badges = await getProjectsBadges(ids);

    res.json({ badges });
  } catch (error) {
    console.error('Error fetching project badges:', error);
    res.status(500).json({ error: 'Failed to fetch project badges' });
  }
});

export default router;
