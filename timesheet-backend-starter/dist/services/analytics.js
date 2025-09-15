import { prisma } from '../db.js';
import { logger } from './logger.js';
/**
 * Analytics Service
 *
 * Provides actionable insights for managers:
 * - What moved yesterday (biggest positive changes)
 * - Top blockers (recently blocked tasks)
 * - At-risk tasks (due soon with low progress/confidence)
 */
export class AnalyticsService {
    /**
     * Get comprehensive analytics insights
     */
    async getAnalyticsInsights() {
        const startTime = Date.now();
        try {
            logger.info('Generating analytics insights');
            const [whatMovedYesterday, topBlockers, atRiskThisWeek] = await Promise.all([
                this.getWhatMovedYesterday(),
                this.getTopBlockers(),
                this.getAtRiskThisWeek()
            ]);
            const insights = {
                whatMovedYesterday,
                topBlockers,
                atRiskThisWeek,
                generatedAt: new Date()
            };
            const duration = Date.now() - startTime;
            logger.info('Analytics insights generated', {
                duration,
                counts: {
                    movedTasks: whatMovedYesterday.length,
                    blockers: topBlockers.length,
                    atRiskTasks: atRiskThisWeek.length
                }
            });
            return insights;
        }
        catch (error) {
            logger.error('Failed to generate analytics insights', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Get tasks with biggest positive progress changes in the last 24 hours
     */
    async getWhatMovedYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        try {
            // Get tasks with progress updates in the last 24 hours
            const recentProgress = await prisma.taskProgress.findMany({
                where: {
                    createdAt: {
                        gte: yesterday,
                        lt: today
                    },
                    source: 'LLM' // Focus on AI-generated progress
                },
                include: {
                    task: {
                        include: {
                            project: {
                                select: { name: true }
                            },
                            assignees: {
                                include: {
                                    user: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            // Group by task and find the biggest positive changes
            const taskMovements = new Map();
            for (const progress of recentProgress) {
                const taskId = progress.taskId;
                if (!taskMovements.has(taskId)) {
                    // Get previous progress for comparison
                    const previousProgress = await prisma.taskProgress.findFirst({
                        where: {
                            taskId,
                            createdAt: {
                                lt: yesterday
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                    const previousPercent = previousProgress?.percent || 0;
                    const currentPercent = progress.percent;
                    const percentChange = currentPercent - previousPercent;
                    // Only include positive changes
                    if (percentChange > 0) {
                        taskMovements.set(taskId, {
                            taskId,
                            taskTitle: progress.task.title,
                            projectName: progress.task.project.name,
                            previousPercent,
                            currentPercent,
                            percentChange,
                            evidence: progress.summary ? [progress.summary] : [],
                            assignees: progress.task.assignees.map(a => a.user.name),
                            lastUpdated: progress.createdAt
                        });
                    }
                }
            }
            // Sort by biggest positive change and return top 5
            const movements = Array.from(taskMovements.values())
                .sort((a, b) => b.percentChange - a.percentChange)
                .slice(0, 5);
            logger.info(`Found ${movements.length} tasks with positive movement yesterday`);
            return movements;
        }
        catch (error) {
            logger.error('Failed to get what moved yesterday', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get tasks marked as BLOCKED in the last 48 hours with blocker quotes
     */
    async getTopBlockers() {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        twoDaysAgo.setHours(0, 0, 0, 0);
        try {
            // Get tasks that became BLOCKED in the last 48 hours
            const blockedTasks = await prisma.task.findMany({
                where: {
                    status: 'BLOCKED',
                    updatedAt: {
                        gte: twoDaysAgo
                    }
                },
                include: {
                    project: {
                        select: { name: true }
                    },
                    assignees: {
                        include: {
                            user: {
                                select: { name: true }
                            }
                        }
                    }
                }
            });
            const blockers = [];
            for (const task of blockedTasks) {
                // Get blocker quotes from recent standup responses
                const blockerQuotes = await this.getBlockerQuotes(task.id, twoDaysAgo);
                const daysBlocked = Math.ceil((Date.now() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
                blockers.push({
                    taskId: task.id,
                    taskTitle: task.title,
                    projectName: task.project.name,
                    assignees: task.assignees.map(a => a.user.name),
                    blockerQuotes,
                    blockedSince: task.updatedAt,
                    daysBlocked
                });
            }
            // Sort by days blocked (longest first) and return top 5
            const topBlockers = blockers
                .sort((a, b) => b.daysBlocked - a.daysBlocked)
                .slice(0, 5);
            logger.info(`Found ${topBlockers.length} top blockers`);
            return topBlockers;
        }
        catch (error) {
            logger.error('Failed to get top blockers', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get tasks at risk this week (due within 7 days with low progress/confidence)
     */
    async getAtRiskThisWeek() {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        oneWeekFromNow.setHours(23, 59, 59, 999);
        try {
            // Get tasks due within 7 days
            const upcomingTasks = await prisma.task.findMany({
                where: {
                    dueDate: {
                        lte: oneWeekFromNow,
                        gte: new Date() // Not overdue
                    },
                    status: {
                        not: 'DONE'
                    }
                },
                include: {
                    project: {
                        select: { name: true }
                    },
                    assignees: {
                        include: {
                            user: {
                                select: { name: true }
                            }
                        }
                    },
                    progress: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            const atRiskTasks = [];
            for (const task of upcomingTasks) {
                const latestProgress = task.progress[0];
                const currentProgress = latestProgress?.percent || 0;
                const confidence = latestProgress?.confidence || 0;
                // Calculate risk level
                let riskLevel = 'LOW';
                if (currentProgress < 0.3 || confidence < 0.3) {
                    riskLevel = 'HIGH';
                }
                else if (currentProgress < 0.5 || confidence < 0.5) {
                    riskLevel = 'MEDIUM';
                }
                // Only include medium and high risk tasks
                if (riskLevel !== 'LOW') {
                    const daysUntilDue = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    atRiskTasks.push({
                        taskId: task.id,
                        taskTitle: task.title,
                        projectName: task.project.name,
                        dueDate: task.dueDate,
                        currentProgress,
                        confidence,
                        riskLevel,
                        assignees: task.assignees.map(a => a.user.name),
                        daysUntilDue
                    });
                }
            }
            // Sort by risk level (HIGH first) then by days until due
            const sortedAtRisk = atRiskTasks
                .sort((a, b) => {
                if (a.riskLevel !== b.riskLevel) {
                    return a.riskLevel === 'HIGH' ? -1 : 1;
                }
                return a.daysUntilDue - b.daysUntilDue;
            })
                .slice(0, 10); // Top 10 at-risk tasks
            logger.info(`Found ${sortedAtRisk.length} at-risk tasks this week`);
            return sortedAtRisk;
        }
        catch (error) {
            logger.error('Failed to get at-risk tasks', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get blocker quotes from recent standup responses
     */
    async getBlockerQuotes(taskId, since) {
        try {
            // Get task details for context
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                select: { title: true, description: true }
            });
            if (!task)
                return [];
            // Get recent standup responses from task assignees
            const responses = await prisma.standupResponse.findMany({
                where: {
                    session: {
                        userId: {
                            in: await this.getTaskAssigneeIds(taskId)
                        },
                        date: { gte: since },
                        state: 'SUBMITTED'
                    }
                },
                include: {
                    session: {
                        include: {
                            user: { select: { name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            // Filter responses that might contain blocker information
            return responses
                .map(r => r.answerText)
                .filter(text => {
                if (!text || text.length < 10)
                    return false;
                // Look for blocker-related keywords
                const blockerKeywords = ['block', 'stuck', 'issue', 'problem', 'waiting', 'dependency', 'cannot', 'unable'];
                return blockerKeywords.some(keyword => text.toLowerCase().includes(keyword));
            })
                .slice(0, 5); // Take top 5 blocker quotes
        }
        catch (error) {
            logger.error('Failed to get blocker quotes', {
                taskId,
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    /**
     * Get assignee IDs for a task
     */
    async getTaskAssigneeIds(taskId) {
        const assignees = await prisma.taskAssignee.findMany({
            where: { taskId },
            select: { userId: true }
        });
        return assignees.map(a => a.userId);
    }
}
// Export singleton instance
export const analytics = new AnalyticsService();
