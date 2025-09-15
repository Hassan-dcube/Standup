import { Router } from 'express';
import { prisma } from '../db.js';
import { recomputeAllActiveProjects, getProjectProgressSummary } from '../services/projectAggregation.js';
import { triggerManualRecompute } from '../services/triggerService.js';
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
// POST /api/projects/:id/recompute - Recompute progress for a single project (Manual Trigger)
router.post('/:id/recompute', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const projectId = req.params.id;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        // Verify project exists and user has access
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                orgId
            },
            select: {
                id: true,
                name: true,
                progressCached: true
            }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Trigger manual recomputation with enhanced logging
        const result = await triggerManualRecompute(projectId, userId);
        if (result.success) {
            res.json({
                success: true,
                project: {
                    id: project.id,
                    name: project.name
                },
                progress: {
                    previous: Math.round(result.previousProgress * 100),
                    new: Math.round(result.newProgress * 100),
                    change: Math.round(result.change * 100)
                },
                metadata: {
                    triggerType: 'manual_recompute',
                    durationMs: result.durationMs,
                    recomputedAt: new Date().toISOString()
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error,
                project: {
                    id: project.id,
                    name: project.name
                },
                metadata: {
                    triggerType: 'manual_recompute',
                    durationMs: result.durationMs,
                    failedAt: new Date().toISOString()
                }
            });
        }
    }
    catch (error) {
        console.error('Error in manual recompute trigger:', error);
        res.status(500).json({ error: 'Failed to trigger manual recompute' });
    }
});
// POST /api/projects/recompute-active - Recompute progress for all active projects
router.post('/recompute-active', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        // Recompute all active projects
        const result = await recomputeAllActiveProjects();
        // Format results for response
        const formattedResults = result.results.map(r => ({
            projectId: r.projectId,
            previousProgress: Math.round(r.previousProgress * 100),
            newProgress: Math.round(r.newProgress * 100),
            change: Math.round((r.newProgress - r.previousProgress) * 100),
            taskCount: r.taskCount,
            smoothingApplied: r.smoothingApplied
        }));
        res.json({
            success: true,
            summary: {
                totalProjects: result.totalProjects,
                updatedProjects: result.updatedProjects,
                recomputedAt: new Date().toISOString()
            },
            results: formattedResults
        });
    }
    catch (error) {
        console.error('Error recomputing all active projects:', error);
        res.status(500).json({ error: 'Failed to recompute active projects' });
    }
});
// GET /api/projects/:id/progress-summary - Get detailed progress summary for a project
router.get('/:id/progress-summary', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const projectId = req.params.id;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        // Verify project exists and user has access
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                orgId
            },
            select: { id: true }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Get detailed progress summary
        const summary = await getProjectProgressSummary(projectId);
        // Format response
        res.json({
            project: {
                ...summary.project,
                progressCached: Math.round(summary.project.progressCached * 100)
            },
            tasks: summary.tasks.map(task => ({
                ...task,
                latestProgress: task.latestProgress ? {
                    ...task.latestProgress,
                    percent: Math.round(task.latestProgress.percent * 100)
                } : null
            })),
            aggregation: {
                ...summary.aggregation,
                weightedAverage: Math.round(summary.aggregation.weightedAverage * 100)
            }
        });
    }
    catch (error) {
        console.error('Error fetching project progress summary:', error);
        res.status(500).json({ error: 'Failed to fetch project progress summary' });
    }
});
// GET /api/projects/progress-overview - Get progress overview for all projects
router.get('/progress-overview', async (req, res) => {
    try {
        // Demo mode: use hardcoded values
        const userId = 'hassan-manager';
        const orgId = 'demo-org';
        const projects = await prisma.project.findMany({
            where: { orgId },
            select: {
                id: true,
                name: true,
                status: true,
                progressCached: true,
                updatedAt: true,
                _count: {
                    select: {
                        tasks: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        const overview = projects.map(project => ({
            id: project.id,
            name: project.name,
            status: project.status,
            progress: Math.round((project.progressCached || 0) * 100),
            taskCount: project._count.tasks,
            lastUpdated: project.updatedAt
        }));
        res.json({
            projects: overview,
            summary: {
                totalProjects: projects.length,
                averageProgress: Math.round(projects.reduce((sum, p) => sum + (p.progressCached || 0), 0) / projects.length * 100),
                lastUpdated: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching progress overview:', error);
        res.status(500).json({ error: 'Failed to fetch progress overview' });
    }
});
export default router;
