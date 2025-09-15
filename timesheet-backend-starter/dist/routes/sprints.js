import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, allow } from '../auth.js';
const router = Router();
// Apply authentication to all routes
router.use(requireAuth);
// Helper function to get user's organization
const getUserOrg = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { orgId: true }
    });
    if (!user)
        throw new Error('User not found');
    return user.orgId;
};
// GET /api/sprints - List sprints with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const projectId = req.query.projectId;
        const where = {
            project: { orgId }
        };
        if (projectId) {
            where.projectId = projectId;
        }
        const [sprints, total] = await Promise.all([
            prisma.sprint.findMany({
                where,
                include: {
                    project: { select: { id: true, name: true } },
                    _count: { select: { tasks: true } }
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.sprint.count({ where })
        ]);
        res.json({
            sprints,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching sprints:', error);
        res.status(500).json({ error: 'Failed to fetch sprints' });
    }
});
// GET /api/sprints/:id - Get single sprint
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const sprintId = req.params.id;
        const sprint = await prisma.sprint.findFirst({
            where: {
                id: sprintId,
                project: { orgId }
            },
            include: {
                project: { select: { id: true, name: true } },
                tasks: {
                    include: {
                        assignees: {
                            include: { user: { select: { id: true, name: true, email: true } } }
                        }
                    },
                    orderBy: { updatedAt: 'desc' }
                }
            }
        });
        if (!sprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        res.json(sprint);
    }
    catch (error) {
        console.error('Error fetching sprint:', error);
        res.status(500).json({ error: 'Failed to fetch sprint' });
    }
});
// POST /api/sprints - Create sprint (Manager only)
router.post('/', allow('MANAGER'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const { projectId, name, goal, startDate, endDate } = req.body;
        // Validation
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Sprint name is required' });
        }
        if (name.length > 100) {
            return res.status(400).json({ error: 'Sprint name must be less than 100 characters' });
        }
        if (!goal || goal.trim().length === 0) {
            return res.status(400).json({ error: 'Sprint goal is required' });
        }
        if (!startDate) {
            return res.status(400).json({ error: 'Start date is required' });
        }
        if (!endDate) {
            return res.status(400).json({ error: 'End date is required' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }
        // Check if project exists and user has access
        const project = await prisma.project.findFirst({
            where: { id: projectId, orgId }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Check for overlapping sprints
        const overlappingSprint = await prisma.sprint.findFirst({
            where: {
                projectId,
                OR: [
                    {
                        AND: [
                            { startDate: { lte: start } },
                            { endDate: { gte: start } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: end } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { gte: start } },
                            { endDate: { lte: end } }
                        ]
                    }
                ]
            }
        });
        if (overlappingSprint) {
            return res.status(400).json({ error: 'Sprint dates overlap with existing sprint' });
        }
        const sprint = await prisma.sprint.create({
            data: {
                projectId,
                name: name.trim(),
                goal: goal.trim(),
                startDate: start,
                endDate: end
            },
            include: {
                project: { select: { id: true, name: true } },
                _count: { select: { tasks: true } }
            }
        });
        res.status(201).json(sprint);
    }
    catch (error) {
        console.error('Error creating sprint:', error);
        res.status(500).json({ error: 'Failed to create sprint' });
    }
});
// PUT /api/sprints/:id - Update sprint (Manager only) - Demo mode
router.put('/:id', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const sprintId = req.params.id;
        const { name, goal, startDate, endDate } = req.body;
        // Check if sprint exists and user has access
        const existingSprint = await prisma.sprint.findFirst({
            where: {
                id: sprintId,
                project: { orgId }
            }
        });
        if (!existingSprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        // Validation
        if (name !== undefined) {
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'Sprint name is required' });
            }
            if (name.length > 100) {
                return res.status(400).json({ error: 'Sprint name must be less than 100 characters' });
            }
        }
        if (goal !== undefined && (!goal || goal.trim().length === 0)) {
            return res.status(400).json({ error: 'Sprint goal is required' });
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start >= end) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }
            // Check for overlapping sprints (excluding current sprint)
            const overlappingSprint = await prisma.sprint.findFirst({
                where: {
                    projectId: existingSprint.projectId,
                    id: { not: sprintId },
                    OR: [
                        {
                            AND: [
                                { startDate: { lte: start } },
                                { endDate: { gte: start } }
                            ]
                        },
                        {
                            AND: [
                                { startDate: { lte: end } },
                                { endDate: { gte: end } }
                            ]
                        },
                        {
                            AND: [
                                { startDate: { gte: start } },
                                { endDate: { lte: end } }
                            ]
                        }
                    ]
                }
            });
            if (overlappingSprint) {
                return res.status(400).json({ error: 'Sprint dates overlap with existing sprint' });
            }
        }
        const sprint = await prisma.sprint.update({
            where: { id: sprintId },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(goal !== undefined && { goal: goal.trim() }),
                ...(startDate !== undefined && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: new Date(endDate) })
            },
            include: {
                project: { select: { id: true, name: true } },
                _count: { select: { tasks: true } }
            }
        });
        res.json(sprint);
    }
    catch (error) {
        console.error('Error updating sprint:', error);
        res.status(500).json({ error: 'Failed to update sprint' });
    }
});
// DELETE /api/sprints/:id - Delete sprint (Manager only)
router.delete('/:id', allow('MANAGER'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const sprintId = req.params.id;
        // Check if sprint exists and user has access
        const existingSprint = await prisma.sprint.findFirst({
            where: {
                id: sprintId,
                project: { orgId }
            }
        });
        if (!existingSprint) {
            return res.status(404).json({ error: 'Sprint not found' });
        }
        // Check if sprint has tasks
        const taskCount = await prisma.task.count({
            where: { sprintId }
        });
        if (taskCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete sprint with existing tasks. Please move or delete tasks first.'
            });
        }
        await prisma.sprint.delete({
            where: { id: sprintId }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting sprint:', error);
        res.status(500).json({ error: 'Failed to delete sprint' });
    }
});
export default router;
