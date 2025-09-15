import { prisma } from '../db.js';

export interface ProjectProgressData {
  projectId: string;
  currentProgress: number;
  previousProgress: number;
  lastUpdated: Date | null;
  taskCount: number;
  totalEstimatePoints: number;
}

export interface TaskProgressData {
  taskId: string;
  percent: number;
  estimatePoints: number | null;
  status: string | null;
  lastUpdated: Date;
}

export interface ProjectBadges {
  isAtRisk: boolean;
  isStale: boolean;
  riskReason?: string;
  staleReason?: string;
}

// Configuration for smoothing and jump caps
const SMOOTHING_CONFIG = {
  alpha: 0.3, // Exponential smoothing factor (0-1, higher = more responsive)
  maxDailyJump: 0.15, // Maximum 15% progress increase per day
  minConfidenceThreshold: 0.3 // Minimum confidence for including task progress
};

/**
 * Calculate weighted average progress for a project
 */
export async function calculateProjectProgress(projectId: string): Promise<ProjectProgressData> {
  // Get project settings first
  const projectSettings = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      weighting: true,
      smoothing: true,
      dailyJumpCap: true,
      progressCached: true
    }
  });

  if (!projectSettings) {
    throw new Error('Project not found');
  }

  // Get smoothing configuration based on project settings
  const getSmoothingConfig = (smoothing: string) => {
    switch (smoothing) {
      case 'low': return { alpha: 0.5, maxDailyJump: projectSettings.dailyJumpCap };
      case 'high': return { alpha: 0.1, maxDailyJump: projectSettings.dailyJumpCap };
      default: return { alpha: 0.3, maxDailyJump: projectSettings.dailyJumpCap }; // med
    }
  };

  const smoothingConfig = getSmoothingConfig(projectSettings.smoothing);

  // Get all tasks for the project with their latest progress
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      progress: {
        orderBy: [
          { source: 'desc' }, // MANUAL comes before LLM alphabetically
          { createdAt: 'desc' }
        ],
        take: 1 // Get latest progress for each task (prioritizing MANUAL over LLM)
      }
    }
  });

  if (tasks.length === 0) {
    return {
      projectId,
      currentProgress: 0,
      previousProgress: 0,
      lastUpdated: null,
      taskCount: 0,
      totalEstimatePoints: 0
    };
  }

  // Calculate total estimate points
  const totalEstimatePoints = tasks.reduce((sum, task) => {
    return sum + (task.estimatePoints || 1); // Fallback to 1 if no estimate
  }, 0);

  // Calculate weighted progress
  let weightedProgressSum = 0;
  let totalWeight = 0;
  let taskCount = 0;

  for (const task of tasks) {
    const latestProgress = task.progress[0];
    
    if (latestProgress && (latestProgress.confidence || 0) >= SMOOTHING_CONFIG.minConfidenceThreshold) {
      // Use project-specific weighting
      const weight = projectSettings.weighting === 'points' ? (task.estimatePoints || 1) : 1;
      const taskProgress = latestProgress.percent; // Already in 0-1 range
      
      weightedProgressSum += taskProgress * weight;
      totalWeight += weight;
      taskCount++;
    }
  }

  // Calculate raw progress (0-1 range)
  const rawProgress = totalWeight > 0 ? weightedProgressSum / totalWeight : 0;

  // Get previous cached progress for smoothing
  const projectCache = await prisma.project.findUnique({
    where: { id: projectId },
    select: { 
      progressCached: true,
      updatedAt: true
    }
  });

  const previousProgress = projectCache?.progressCached || 0;
  const lastUpdated = projectCache?.updatedAt || null;

  return {
    projectId,
    currentProgress: rawProgress,
    previousProgress,
    lastUpdated,
    taskCount,
    totalEstimatePoints
  };
}

/**
 * Apply smoothing and jump caps to project progress
 */
export function applySmoothingAndCaps(
  currentProgress: number,
  previousProgress: number,
  lastUpdated: Date | null,
  smoothingConfig?: { alpha: number; maxDailyJump: number }
): number {
  const config = smoothingConfig || SMOOTHING_CONFIG;
  const now = new Date();
  
  // If no previous progress, return current progress
  if (previousProgress === 0 || !lastUpdated) {
    return currentProgress;
  }

  // Calculate days since last update
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  
  // Apply daily jump cap using project-specific settings
  const maxAllowedProgress = previousProgress + (config.maxDailyJump * daysSinceUpdate);
  const cappedProgress = Math.min(currentProgress, maxAllowedProgress);
  
  // Apply exponential smoothing using project-specific settings
  const smoothedProgress = (config.alpha * cappedProgress) + 
                          ((1 - config.alpha) * previousProgress);
  
  // Ensure progress doesn't decrease (unless it's a significant drop indicating task changes)
  const finalProgress = Math.max(smoothedProgress, previousProgress * 0.9);
  
  return Math.max(0, Math.min(1, finalProgress)); // Clamp to 0-1 range
}

/**
 * Recompute and cache project progress
 */
export async function recomputeProjectProgress(projectId: string): Promise<{
  projectId: string;
  previousProgress: number;
  newProgress: number;
  taskCount: number;
  totalEstimatePoints: number;
  smoothingApplied: boolean;
}> {
  // Calculate current progress
  const progressData = await calculateProjectProgress(projectId);
  
  // Get project settings for smoothing
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { smoothing: true, dailyJumpCap: true }
  });

  const getSmoothingConfig = (smoothing: string) => {
    switch (smoothing) {
      case 'low': return { alpha: 0.5, maxDailyJump: project?.dailyJumpCap || 0.15 };
      case 'high': return { alpha: 0.1, maxDailyJump: project?.dailyJumpCap || 0.15 };
      default: return { alpha: 0.3, maxDailyJump: project?.dailyJumpCap || 0.15 }; // med
    }
  };

  const smoothingConfig = getSmoothingConfig(project?.smoothing || 'med');

  // Apply smoothing and caps using project-specific settings
  const smoothedProgress = applySmoothingAndCaps(
    progressData.currentProgress,
    progressData.previousProgress,
    progressData.lastUpdated,
    smoothingConfig
  );
  
  // Update project with cached progress
  await prisma.project.update({
    where: { id: projectId },
    data: { 
      progressCached: smoothedProgress,
      updatedAt: new Date()
    }
  });
  
  return {
    projectId,
    previousProgress: progressData.previousProgress,
    newProgress: smoothedProgress,
    taskCount: progressData.taskCount,
    totalEstimatePoints: progressData.totalEstimatePoints,
    smoothingApplied: progressData.previousProgress > 0
  };
}

/**
 * Recompute progress for all active projects
 */
export async function recomputeAllActiveProjects(): Promise<{
  totalProjects: number;
  updatedProjects: number;
  results: Array<{
    projectId: string;
    previousProgress: number;
    newProgress: number;
    taskCount: number;
    smoothingApplied: boolean;
  }>;
}> {
  // Get all active projects (not completed or cancelled)
  const activeProjects = await prisma.project.findMany({
    where: {
      status: {
        in: ['PLANNING', 'ACTIVE']
      }
    },
    select: { id: true }
  });

  const results = [];
  let updatedProjects = 0;

  for (const project of activeProjects) {
    try {
      const result = await recomputeProjectProgress(project.id);
      results.push(result);
      
      // Count as updated if progress actually changed
      if (Math.abs(result.newProgress - result.previousProgress) > 0.001) {
        updatedProjects++;
      }
    } catch (error) {
      console.error(`Error recomputing progress for project ${project.id}:`, error);
      results.push({
        projectId: project.id,
        previousProgress: 0,
        newProgress: 0,
        taskCount: 0,
        smoothingApplied: false
      });
    }
  }

  return {
    totalProjects: activeProjects.length,
    updatedProjects,
    results
  };
}

/**
 * Get project progress summary with task breakdown
 */
export async function getProjectProgressSummary(projectId: string): Promise<{
  project: {
    id: string;
    name: string;
    progressCached: number;
    lastUpdated: Date;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    estimatePoints: number | null;
    latestProgress: {
      percent: number;
      confidence: number;
      summary: string;
      createdAt: Date;
    } | null;
  }>;
  aggregation: {
    totalTasks: number;
    tasksWithProgress: number;
    totalEstimatePoints: number;
    weightedAverage: number;
    smoothingApplied: boolean;
  };
}> {
  // Get project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      progressCached: true,
      updatedAt: true
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Get project settings for weighting
  const projectSettings = await prisma.project.findUnique({
    where: { id: projectId },
    select: { weighting: true }
  });

  // Get all tasks with their latest progress
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      progress: {
        orderBy: [
          { source: 'desc' }, // MANUAL comes before LLM alphabetically
          { createdAt: 'desc' }
        ],
        take: 1
      }
    }
  });

  // Calculate aggregation metrics
  const totalTasks = tasks.length;
  const tasksWithProgress = tasks.filter(task => task.progress.length > 0).length;
  const totalEstimatePoints = tasks.reduce((sum, task) => sum + (task.estimatePoints || 1), 0);
  
  // Calculate weighted average using project-specific weighting
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const task of tasks) {
    const latestProgress = task.progress[0];
    if (latestProgress && (latestProgress.confidence || 0) >= SMOOTHING_CONFIG.minConfidenceThreshold) {
      // Use project-specific weighting
      const weight = projectSettings?.weighting === 'points' ? (task.estimatePoints || 1) : 1;
      weightedSum += latestProgress.percent * weight;
      totalWeight += weight;
    }
  }
  
  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    project: {
      id: project.id,
      name: project.name,
      progressCached: project.progressCached || 0,
      lastUpdated: project.updatedAt
    },
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      estimatePoints: task.estimatePoints,
      latestProgress: task.progress[0] ? {
        percent: task.progress[0].percent,
        confidence: task.progress[0].confidence || 0,
        summary: task.progress[0].summary || '',
        createdAt: task.progress[0].createdAt
      } : null
    })),
    aggregation: {
      totalTasks,
      tasksWithProgress,
      totalEstimatePoints,
      weightedAverage,
      smoothingApplied: project.progressCached !== weightedAverage
    }
  };
}

/**
 * Calculate project risk and freshness badges
 */
export async function calculateProjectBadges(projectId: string): Promise<ProjectBadges> {
  // Get project with tasks and their progress
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          progress: {
            orderBy: [
              { source: 'desc' }, // MANUAL comes before LLM alphabetically
              { createdAt: 'desc' }
            ],
            take: 1
          }
        }
      }
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const now = new Date();
  const badges: ProjectBadges = {
    isAtRisk: false,
    isStale: false
  };

  // Risk Assessment
  const riskReasons: string[] = [];
  
  // Check for blocked tasks
  const blockedTasks = project.tasks.filter(task => task.status === 'BLOCKED');
  if (blockedTasks.length > 0) {
    badges.isAtRisk = true;
    riskReasons.push(`${blockedTasks.length} blocked task${blockedTasks.length > 1 ? 's' : ''}`);
  }

  // Check for tasks due within 7 days with low progress or confidence
  const tasksDueSoon = project.tasks.filter(task => {
    if (!task.dueDate) return false;
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  });

  for (const task of tasksDueSoon) {
    const latestProgress = task.progress[0];
    if (latestProgress) {
      const percent = latestProgress.percent;
      const confidence = latestProgress.confidence || 0;
      
      if (percent < 0.5 || confidence < 0.5) {
        badges.isAtRisk = true;
        const daysUntilDue = Math.ceil((new Date(task.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        riskReasons.push(`Task "${task.title}" due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} (${Math.round(percent * 100)}% progress, ${Math.round(confidence * 100)}% confidence)`);
      }
    } else {
      // No progress data for a task due soon
      badges.isAtRisk = true;
      const daysUntilDue = Math.ceil((new Date(task.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      riskReasons.push(`Task "${task.title}" due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} (no progress data)`);
    }
  }

  if (riskReasons.length > 0) {
    badges.riskReason = riskReasons.join('; ');
  }

  // Freshness Assessment
  // Check if there are any progress events in the last 3 working days
  const threeWorkingDaysAgo = new Date(now);
  threeWorkingDaysAgo.setDate(now.getDate() - 3);
  
  // Simple working days calculation (excluding weekends)
  let workingDaysBack = 3;
  let checkDate = new Date(now);
  while (workingDaysBack > 0) {
    checkDate.setDate(checkDate.getDate() - 1);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workingDaysBack--;
    }
  }

  // Check for recent progress events
  const recentProgressEvents = await prisma.taskProgress.findMany({
    where: {
      task: {
        projectId: projectId
      },
      createdAt: {
        gte: checkDate
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  if (recentProgressEvents.length === 0) {
    badges.isStale = true;
    badges.staleReason = `No progress updates in the last 3 working days (since ${checkDate.toLocaleDateString()})`;
  } else {
    const lastUpdate = recentProgressEvents[0].createdAt;
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate >= 3) {
      badges.isStale = true;
      badges.staleReason = `Last progress update was ${daysSinceUpdate} days ago (${lastUpdate.toLocaleDateString()})`;
    }
  }

  return badges;
}

/**
 * Get project badges for multiple projects
 */
export async function getProjectsBadges(projectIds: string[]): Promise<Record<string, ProjectBadges>> {
  const badges: Record<string, ProjectBadges> = {};
  
  for (const projectId of projectIds) {
    try {
      badges[projectId] = await calculateProjectBadges(projectId);
    } catch (error) {
      console.error(`Error calculating badges for project ${projectId}:`, error);
      badges[projectId] = {
        isAtRisk: false,
        isStale: false,
        riskReason: 'Error calculating risk',
        staleReason: 'Error calculating freshness'
      };
    }
  }
  
  return badges;
}