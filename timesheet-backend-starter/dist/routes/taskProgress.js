import { Router } from 'express';
import { prisma } from '../db.js';
const router = Router();
// Apply authentication to all routes (temporarily disabled for demo)
// router.use(requireAuth);
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
// GET /api/task-progress - List task progress records with pagination and filtering
router.get('/', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const taskId = req.query.taskId;
        const source = req.query.source;
        const where = {
            task: {
                project: { orgId }
            }
        };
        if (taskId) {
            where.taskId = taskId;
        }
        if (source) {
            where.source = source;
        }
        const [progressRecords, total] = await Promise.all([
            prisma.taskProgress.findMany({
                where,
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            project: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.taskProgress.count({ where })
        ]);
        res.json({
            progressRecords,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching task progress:', error);
        res.status(500).json({ error: 'Failed to fetch task progress' });
    }
});
// GET /api/task-progress/:id - Get specific task progress record
router.get('/:id', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const progressId = req.params.id;
        const progressRecord = await prisma.taskProgress.findFirst({
            where: {
                id: progressId,
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
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!progressRecord) {
            return res.status(404).json({ error: 'Task progress record not found' });
        }
        res.json({ progressRecord });
    }
    catch (error) {
        console.error('Error fetching task progress:', error);
        res.status(500).json({ error: 'Failed to fetch task progress' });
    }
});
// POST /api/task-progress - Create new task progress record
router.post('/', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const { taskId, source = 'MANUAL', percent, status, confidence, summary } = req.body;
        // Validation
        if (!taskId) {
            return res.status(400).json({ error: 'Task ID is required' });
        }
        if (percent === undefined || percent < 0 || percent > 1) {
            return res.status(400).json({ error: 'Percent must be between 0 and 1' });
        }
        if (confidence !== undefined && (confidence < 0 || confidence > 1)) {
            return res.status(400).json({ error: 'Confidence must be between 0 and 1' });
        }
        if (source && !['LLM', 'MANUAL'].includes(source)) {
            return res.status(400).json({ error: 'Source must be LLM or MANUAL' });
        }
        if (status && !['TODO', 'DOING', 'BLOCKED', 'DONE'].includes(status)) {
            return res.status(400).json({ error: 'Status must be TODO, DOING, BLOCKED, or DONE' });
        }
        // Check if task exists and user has access
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: { orgId }
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const progressRecord = await prisma.taskProgress.create({
            data: {
                taskId,
                source: source,
                percent,
                status: status,
                confidence,
                summary: summary?.trim()
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        project: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        res.status(201).json({ progressRecord });
    }
    catch (error) {
        console.error('Error creating task progress:', error);
        res.status(500).json({ error: 'Failed to create task progress' });
    }
});
// PUT /api/task-progress/:id - Update task progress record
router.put('/:id', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const progressId = req.params.id;
        const { source, percent, status, confidence, summary } = req.body;
        // Check if progress record exists and user has access
        const existingRecord = await prisma.taskProgress.findFirst({
            where: {
                id: progressId,
                task: {
                    project: { orgId }
                }
            }
        });
        if (!existingRecord) {
            return res.status(404).json({ error: 'Task progress record not found' });
        }
        // Validation
        if (percent !== undefined && (percent < 0 || percent > 1)) {
            return res.status(400).json({ error: 'Percent must be between 0 and 1' });
        }
        if (confidence !== undefined && (confidence < 0 || confidence > 1)) {
            return res.status(400).json({ error: 'Confidence must be between 0 and 1' });
        }
        if (source && !['LLM', 'MANUAL'].includes(source)) {
            return res.status(400).json({ error: 'Source must be LLM or MANUAL' });
        }
        if (status && !['TODO', 'DOING', 'BLOCKED', 'DONE'].includes(status)) {
            return res.status(400).json({ error: 'Status must be TODO, DOING, BLOCKED, or DONE' });
        }
        const progressRecord = await prisma.taskProgress.update({
            where: { id: progressId },
            data: {
                ...(source && { source: source }),
                ...(percent !== undefined && { percent }),
                ...(status && { status: status }),
                ...(confidence !== undefined && { confidence }),
                ...(summary !== undefined && { summary: summary?.trim() })
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        project: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        res.json({ progressRecord });
    }
    catch (error) {
        console.error('Error updating task progress:', error);
        res.status(500).json({ error: 'Failed to update task progress' });
    }
});
// DELETE /api/task-progress/:id - Delete task progress record
router.delete('/:id', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const progressId = req.params.id;
        // Check if progress record exists and user has access
        const existingRecord = await prisma.taskProgress.findFirst({
            where: {
                id: progressId,
                task: {
                    project: { orgId }
                }
            }
        });
        if (!existingRecord) {
            return res.status(404).json({ error: 'Task progress record not found' });
        }
        await prisma.taskProgress.delete({
            where: { id: progressId }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting task progress:', error);
        res.status(500).json({ error: 'Failed to delete task progress' });
    }
});
export default router;
