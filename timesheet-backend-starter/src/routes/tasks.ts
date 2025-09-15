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

// Helper function to check if user can access task
const canAccessTask = async (taskId: string, userId: string, orgId: string) => {
  const task = await prisma.task.findFirst({
    where: { 
      id: taskId,
      project: { orgId }
    },
    include: {
      assignees: { select: { userId: true } }
    }
  });

  if (!task) return { canAccess: false, task: null };

  // Managers can access all tasks in their org
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role === 'MANAGER') {
    return { canAccess: true, task };
  }

  // Students can only access tasks they're assigned to
  const isAssigned = task.assignees.some(assignee => assignee.userId === userId);
  return { canAccess: isAssigned, task };
};

// GET /api/tasks - List tasks with pagination and filtering
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const projectId = req.query.projectId as string;
    const sprintId = req.query.sprintId as string;
    const status = req.query.status as string;
    const assigneeId = req.query.assigneeId as string;

    // Get user role to determine access level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const where: any = {
      project: { orgId }
    };

    if (projectId) {
      where.projectId = projectId;
    }
    if (sprintId) {
      where.sprintId = sprintId;
    }
    if (status) {
      where.status = status;
    }

    // Students can only see tasks they're assigned to
    if (user?.role !== 'MANAGER') {
      where.assignees = {
        some: { userId }
      };
    } else if (assigneeId) {
      where.assignees = {
        some: { userId: assigneeId }
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          sprint: { select: { id: true, name: true } },
          assignees: {
            include: { user: { select: { id: true, name: true, email: true } } }
          },
          progress: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const taskId = req.params.id;

    const { canAccess, task } = await canAccessTask(taskId, userId, orgId);

    if (!canAccess || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        progress: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(fullTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create task (Manager only) - Demo mode
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const { 
      projectId, 
      sprintId, 
      title, 
      description, 
      estimatePoints, 
      dueDate, 
      acceptanceCriteria,
      assigneeId,
      assigneeIds = []
    } = req.body;

    // Handle both single assigneeId and assigneeIds array
    const finalAssigneeIds = assigneeId ? [assigneeId] : assigneeIds;

    // Validation
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Task title must be less than 200 characters' });
    }
    if (estimatePoints !== undefined && (estimatePoints < 0 || estimatePoints > 100)) {
      return res.status(400).json({ error: 'Estimate points must be between 0 and 100' });
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if sprint exists and belongs to the project
    if (sprintId) {
      const sprint = await prisma.sprint.findFirst({
        where: { id: sprintId, projectId }
      });

      if (!sprint) {
        return res.status(404).json({ error: 'Sprint not found' });
      }
    }

    // In demo mode, validate assignees against demo users
    if (finalAssigneeIds.length > 0) {
      const demoUsers = [
        { id: '1', name: 'Fawad', email: 'fawad@company.com', role: 'employee' },
        { id: '2', name: 'Hira', email: 'hira@company.com', role: 'employee' },
        { id: '3', name: 'Assad', email: 'assad@company.com', role: 'employee' },
        { id: '4', name: 'Saad', email: 'saad@company.com', role: 'employee' },
        { id: 'hassan-manager', name: 'Hassan', email: 'hassan@company.com', role: 'manager' }
      ];

      const validUsers = demoUsers.filter(user => finalAssigneeIds.includes(user.id));
      if (validUsers.length !== finalAssigneeIds.length) {
        return res.status(400).json({ error: 'One or more assignees not found' });
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        sprintId: sprintId || null,
        title: title.trim(),
        description: description?.trim(),
        estimatePoints,
        dueDate: dueDate ? new Date(dueDate) : null,
        acceptanceCriteria: acceptanceCriteria?.trim()
      },
      include: {
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    // Add assignees if provided
    if (finalAssigneeIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: finalAssigneeIds.map((assigneeId: string) => ({
          taskId: task.id,
          userId: assigneeId
        }))
      });

      // Fetch updated task with assignees
      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
        include: {
          project: { select: { id: true, name: true } },
          sprint: { select: { id: true, name: true } },
          assignees: {
            include: { user: { select: { id: true, name: true, email: true } } }
          }
        }
      });

      return res.status(201).json(updatedTask);
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});



// POST /api/tasks/:id/progress - Add progress update
router.post('/:id/progress', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orgId = await getUserOrg(userId);
    const taskId = req.params.id;
    const { percent, status, summary, source = 'MANUAL' } = req.body;

    const { canAccess, task } = await canAccessTask(taskId, userId, orgId);

    if (!canAccess || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validation
    if (percent === undefined || percent < 0 || percent > 1) {
      return res.status(400).json({ error: 'Progress percent must be between 0 and 1' });
    }

    const progress = await prisma.taskProgress.create({
      data: {
        taskId,
        source,
        percent,
        status: status?.trim(),
        summary: summary?.trim()
      }
    });

    res.status(201).json(progress);
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ error: 'Failed to add progress' });
  }
});

// PUT /api/tasks/:id - Update task (Manager only)
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('PUT /api/tasks/:id - Request received');
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const taskId = req.params.id;
    const { title, description, status, dueDate, estimatePoints, sprintId } = req.body;
    console.log('Task ID:', taskId, 'User ID:', userId, 'Org ID:', orgId);

    // Check if task exists and user has access
    const { canAccess, task } = await canAccessTask(taskId, userId, orgId);

    if (!canAccess || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is manager
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can edit tasks' });
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(estimatePoints !== undefined && { estimatePoints }),
        ...(sprintId !== undefined && { sprintId: sprintId || null })
      },
      include: {
        assignees: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        sprint: { select: { id: true, name: true } },
        progress: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task (Manager only)
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    // Demo mode: use hardcoded values
    const userId = 'hassan-manager';
    const orgId = 'demo-org';
    const taskId = req.params.id;

    // Check if task exists and user has access
    const { canAccess, task } = await canAccessTask(taskId, userId, orgId);

    if (!canAccess || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is manager
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can delete tasks' });
    }

    // Delete task (cascade will handle related records)
    await prisma.task.delete({
      where: { id: taskId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
