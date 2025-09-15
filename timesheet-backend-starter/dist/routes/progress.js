import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, allow } from '../auth.js';
import { progressEngine } from '../services/progressEngine.js';
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
// POST /api/progress/analyze/task/:taskId - Analyze progress for a specific task
router.post('/analyze/task/:taskId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const taskId = req.params.taskId;
        // Check if task exists and user has access
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: { orgId }
            },
            include: {
                assignees: {
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Check if user is assigned to task or is a manager
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        const isAssigned = task.assignees.some(assignee => assignee.userId === userId);
        const isManager = user?.role === 'MANAGER';
        if (!isAssigned && !isManager) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Analyze progress
        const analysis = await progressEngine.analyzeTaskProgress(taskId);
        if (!analysis) {
            return res.status(500).json({ error: 'Failed to analyze progress' });
        }
        // Persist the analysis
        await progressEngine.persistProgress(taskId, analysis);
        res.json({
            taskId,
            analysis,
            message: 'Progress analysis completed'
        });
    }
    catch (error) {
        console.error('Error analyzing task progress:', error);
        res.status(500).json({ error: 'Failed to analyze task progress' });
    }
});
// POST /api/progress/analyze/project/:projectId - Analyze progress for all tasks in a project (Manager only)
router.post('/analyze/project/:projectId', allow('MANAGER'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const projectId = req.params.projectId;
        // Check if project exists and user has access
        const project = await prisma.project.findFirst({
            where: { id: projectId, orgId }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Start analysis in background
        progressEngine.analyzeProjectProgress(projectId).catch(error => {
            console.error('Background progress analysis failed:', error);
        });
        res.json({
            projectId,
            message: 'Progress analysis started for all tasks in project'
        });
    }
    catch (error) {
        console.error('Error starting project progress analysis:', error);
        res.status(500).json({ error: 'Failed to start project progress analysis' });
    }
});
// GET /api/progress/task/:taskId - Get progress history for a task
router.get('/task/:taskId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const taskId = req.params.taskId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        // Check if task exists and user has access
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: { orgId }
            },
            include: {
                assignees: {
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Check if user is assigned to task or is a manager
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        const isAssigned = task.assignees.some(assignee => assignee.userId === userId);
        const isManager = user?.role === 'MANAGER';
        if (!isAssigned && !isManager) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Get progress history
        const [progress, total] = await Promise.all([
            prisma.taskProgress.findMany({
                where: { taskId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.taskProgress.count({ where: { taskId } })
        ]);
        res.json({
            taskId,
            progress,
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
// GET /api/progress/project/:projectId - Get progress summary for all tasks in a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = await getUserOrg(userId);
        const projectId = req.params.projectId;
        // Check if project exists and user has access
        const project = await prisma.project.findFirst({
            where: { id: projectId, orgId }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Get all tasks with their latest progress
        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignees: {
                    include: { user: { select: { id: true, name: true } } }
                },
                progress: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        // Calculate project-level progress
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'DONE').length;
        const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
        const inProgressTasks = tasks.filter(t => t.status === 'DOING').length;
        const todoTasks = tasks.filter(t => t.status === 'TODO').length;
        const averageProgress = totalTasks > 0
            ? tasks.reduce((sum, task) => {
                const latestProgress = task.progress[0];
                return sum + (latestProgress?.percent || 0);
            }, 0) / totalTasks
            : 0;
        res.json({
            projectId,
            summary: {
                totalTasks,
                completedTasks,
                blockedTasks,
                inProgressTasks,
                todoTasks,
                averageProgress: Math.round(averageProgress * 100) / 100
            },
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                status: task.status,
                assignees: task.assignees.map(a => a.user),
                latestProgress: task.progress[0] || null
            }))
        });
    }
    catch (error) {
        console.error('Error fetching project progress:', error);
        res.status(500).json({ error: 'Failed to fetch project progress' });
    }
});
export default router;
