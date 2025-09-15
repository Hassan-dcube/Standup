import { prisma } from '../db.js';
import { progressEngine } from './progressEngine.js';
import { recomputeProjectProgress } from './projectAggregation.js';
import { logger } from './logger.js';
/**
 * Trigger per-task assessment and project recomputation after standup submission
 */
export async function triggerStandupAssessment(userId, sessionId) {
    const startTime = Date.now();
    const result = {
        success: true,
        taskCount: 0,
        projectCount: 0,
        errors: [],
        timings: {
            totalMs: 0,
            taskAnalysisMs: 0,
            projectRecomputeMs: 0
        }
    };
    try {
        logger.info('Triggering standup assessment', {
            userId,
            sessionId,
            triggerType: 'standup_submission'
        });
        // Get user's assigned tasks
        const userTasks = await prisma.task.findMany({
            where: {
                assignees: {
                    some: { userId }
                }
            },
            include: {
                project: {
                    select: { id: true, name: true }
                }
            }
        });
        result.taskCount = userTasks.length;
        logger.info('Found assigned tasks for assessment', {
            userId,
            taskCount: userTasks.length,
            taskIds: userTasks.map(t => t.id)
        });
        // Group tasks by project for efficient project recomputation
        const projectTaskMap = new Map();
        for (const task of userTasks) {
            if (!projectTaskMap.has(task.projectId)) {
                projectTaskMap.set(task.projectId, []);
            }
            projectTaskMap.get(task.projectId).push(task.id);
        }
        // Trigger per-task inference for each assigned task
        const taskAnalysisStart = Date.now();
        const taskResults = [];
        for (const task of userTasks) {
            const taskStart = Date.now();
            try {
                logger.info('Analyzing task progress', {
                    taskId: task.id,
                    taskTitle: task.title,
                    projectId: task.projectId,
                    userId
                });
                const analysis = await progressEngine.analyzeTaskProgress(task.id);
                if (analysis) {
                    await progressEngine.persistProgress(task.id, analysis);
                    taskResults.push({
                        taskId: task.id,
                        success: true,
                        analysis,
                        durationMs: Date.now() - taskStart
                    });
                    logger.info('Task analysis completed', {
                        taskId: task.id,
                        percent: analysis.percent,
                        status: analysis.status,
                        confidence: analysis.confidence,
                        durationMs: Date.now() - taskStart
                    });
                }
                else {
                    taskResults.push({
                        taskId: task.id,
                        success: false,
                        error: 'No analysis returned',
                        durationMs: Date.now() - taskStart
                    });
                }
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                taskResults.push({
                    taskId: task.id,
                    success: false,
                    error: errorMsg,
                    durationMs: Date.now() - taskStart
                });
                logger.error('Task analysis failed', {
                    taskId: task.id,
                    userId,
                    error: errorMsg
                });
                result.errors.push(`Task ${task.id}: ${errorMsg}`);
            }
        }
        result.timings.taskAnalysisMs = Date.now() - taskAnalysisStart;
        // Trigger project progress recomputation for affected projects
        const projectRecomputeStart = Date.now();
        const projectResults = [];
        for (const [projectId, taskIds] of projectTaskMap) {
            const projectStart = Date.now();
            try {
                logger.info('Recomputing project progress', {
                    projectId,
                    affectedTaskIds: taskIds,
                    userId
                });
                const recomputeResult = await recomputeProjectProgress(projectId);
                projectResults.push({
                    projectId,
                    success: true,
                    previousProgress: recomputeResult.previousProgress,
                    newProgress: recomputeResult.newProgress,
                    durationMs: Date.now() - projectStart
                });
                logger.info('Project recomputation completed', {
                    projectId,
                    previousProgress: recomputeResult.previousProgress,
                    newProgress: recomputeResult.newProgress,
                    change: recomputeResult.newProgress - recomputeResult.previousProgress,
                    durationMs: Date.now() - projectStart
                });
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                projectResults.push({
                    projectId,
                    success: false,
                    error: errorMsg,
                    previousProgress: 0,
                    newProgress: 0,
                    durationMs: Date.now() - projectStart
                });
                logger.error('Project recomputation failed', {
                    projectId,
                    userId,
                    error: errorMsg
                });
                result.errors.push(`Project ${projectId}: ${errorMsg}`);
            }
        }
        result.timings.projectRecomputeMs = Date.now() - projectRecomputeStart;
        result.projectCount = projectResults.length;
        // Determine overall success
        const failedTasks = taskResults.filter(r => !r.success).length;
        const failedProjects = projectResults.filter(r => !r.success).length;
        result.success = failedTasks === 0 && failedProjects === 0;
        result.timings.totalMs = Date.now() - startTime;
        logger.info('Standup assessment trigger completed', {
            userId,
            sessionId,
            success: result.success,
            taskCount: result.taskCount,
            projectCount: result.projectCount,
            failedTasks,
            failedProjects,
            totalDurationMs: result.timings.totalMs,
            taskAnalysisMs: result.timings.taskAnalysisMs,
            projectRecomputeMs: result.timings.projectRecomputeMs,
            errorCount: result.errors.length
        });
        return result;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.success = false;
        result.errors.push(`Trigger failed: ${errorMsg}`);
        result.timings.totalMs = Date.now() - startTime;
        logger.error('Standup assessment trigger failed', {
            userId,
            sessionId,
            error: errorMsg,
            durationMs: result.timings.totalMs
        });
        return result;
    }
}
/**
 * Trigger nightly batch processing for all active projects
 */
export async function triggerNightlyBatch() {
    const startTime = Date.now();
    const result = {
        success: true,
        totalProjects: 0,
        updatedProjects: 0,
        errors: [],
        durationMs: 0
    };
    try {
        logger.info('Starting nightly batch processing', {
            triggerType: 'nightly_batch',
            startTime: new Date().toISOString()
        });
        // Get all active projects
        const activeProjects = await prisma.project.findMany({
            where: {
                status: {
                    in: ['PLANNING', 'ACTIVE']
                }
            },
            select: { id: true, name: true }
        });
        result.totalProjects = activeProjects.length;
        logger.info('Found active projects for batch processing', {
            projectCount: activeProjects.length,
            projectIds: activeProjects.map(p => p.id)
        });
        // Process each project
        for (const project of activeProjects) {
            try {
                const projectStart = Date.now();
                logger.info('Processing project in nightly batch', {
                    projectId: project.id,
                    projectName: project.name
                });
                const recomputeResult = await recomputeProjectProgress(project.id);
                if (Math.abs(recomputeResult.newProgress - recomputeResult.previousProgress) > 0.001) {
                    result.updatedProjects++;
                }
                logger.info('Project batch processing completed', {
                    projectId: project.id,
                    previousProgress: recomputeResult.previousProgress,
                    newProgress: recomputeResult.newProgress,
                    durationMs: Date.now() - projectStart
                });
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                result.errors.push(`Project ${project.id}: ${errorMsg}`);
                logger.error('Project batch processing failed', {
                    projectId: project.id,
                    error: errorMsg
                });
            }
        }
        result.durationMs = Date.now() - startTime;
        result.success = result.errors.length === 0;
        logger.info('Nightly batch processing completed', {
            success: result.success,
            totalProjects: result.totalProjects,
            updatedProjects: result.updatedProjects,
            errorCount: result.errors.length,
            durationMs: result.durationMs
        });
        return result;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.success = false;
        result.errors.push(`Batch processing failed: ${errorMsg}`);
        result.durationMs = Date.now() - startTime;
        logger.error('Nightly batch processing failed', {
            error: errorMsg,
            durationMs: result.durationMs
        });
        return result;
    }
}
/**
 * Trigger manual recomputation for a specific project
 */
export async function triggerManualRecompute(projectId, userId) {
    const startTime = Date.now();
    try {
        logger.info('Triggering manual project recomputation', {
            projectId,
            userId,
            triggerType: 'manual_recompute'
        });
        const recomputeResult = await recomputeProjectProgress(projectId);
        const durationMs = Date.now() - startTime;
        logger.info('Manual recomputation completed', {
            projectId,
            userId,
            previousProgress: recomputeResult.previousProgress,
            newProgress: recomputeResult.newProgress,
            change: recomputeResult.newProgress - recomputeResult.previousProgress,
            durationMs
        });
        return {
            success: true,
            previousProgress: recomputeResult.previousProgress,
            newProgress: recomputeResult.newProgress,
            change: recomputeResult.newProgress - recomputeResult.previousProgress,
            durationMs
        };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const durationMs = Date.now() - startTime;
        logger.error('Manual recomputation failed', {
            projectId,
            userId,
            error: errorMsg,
            durationMs
        });
        return {
            success: false,
            previousProgress: 0,
            newProgress: 0,
            change: 0,
            durationMs,
            error: errorMsg
        };
    }
}
/**
 * Decay confidence for stale progress data
 */
export async function decayStaleProgress() {
    const result = {
        updatedCount: 0,
        errors: []
    };
    try {
        // Find progress records older than 7 days
        const staleThreshold = new Date();
        staleThreshold.setDate(staleThreshold.getDate() - 7);
        const staleProgress = await prisma.taskProgress.findMany({
            where: {
                createdAt: {
                    lt: staleThreshold
                },
                confidence: {
                    gt: 0.1 // Only decay records with some confidence
                }
            },
            include: {
                task: {
                    select: { id: true, title: true }
                }
            }
        });
        logger.info('Found stale progress records for confidence decay', {
            count: staleProgress.length,
            threshold: staleThreshold.toISOString()
        });
        for (const progress of staleProgress) {
            try {
                // Decay confidence by 20% (minimum 0.1)
                const newConfidence = Math.max(0.1, (progress.confidence || 0) * 0.8);
                await prisma.taskProgress.update({
                    where: { id: progress.id },
                    data: { confidence: newConfidence }
                });
                result.updatedCount++;
                logger.info('Decayed confidence for stale progress', {
                    progressId: progress.id,
                    taskId: progress.taskId,
                    oldConfidence: progress.confidence,
                    newConfidence,
                    age: Math.floor((Date.now() - progress.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                });
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                result.errors.push(`Progress ${progress.id}: ${errorMsg}`);
                logger.error('Failed to decay confidence', {
                    progressId: progress.id,
                    error: errorMsg
                });
            }
        }
        logger.info('Confidence decay completed', {
            updatedCount: result.updatedCount,
            errorCount: result.errors.length
        });
        return result;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Decay process failed: ${errorMsg}`);
        logger.error('Confidence decay process failed', {
            error: errorMsg
        });
        return result;
    }
}
