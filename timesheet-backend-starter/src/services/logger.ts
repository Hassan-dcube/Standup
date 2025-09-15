import { TaskProgressSource } from '@prisma/client';

export interface LogContext {
  userId?: string;
  projectId?: string;
  taskId?: string;
  sessionId?: string;
  operation?: string;
  [key: string]: any;
}

export interface ProgressLogData {
  taskId: string;
  previousPercent?: number;
  newPercent: number;
  previousStatus?: string;
  newStatus: string;
  source: TaskProgressSource;
  confidence: number;
  summary?: string;
  evidence?: string[];
}

export interface RetrievalLogData {
  taskId: string;
  query: string;
  hits: number;
  misses: number;
  latency: number;
  vectorSimilarity?: number[];
}

export interface LLMLogData {
  taskId: string;
  prompt: string;
  response: string;
  latency: number;
  parseSuccess: boolean;
  error?: string;
  retryCount?: number;
}

export interface OverrideLogData {
  taskId: string;
  userId: string;
  previousPercent: number;
  newPercent: number;
  previousStatus: string;
  newStatus: string;
  reason: string;
}

export interface BatchLogData {
  operation: 'nightly' | 'standup_trigger' | 'manual';
  projectCount: number;
  taskCount: number;
  successCount: number;
  failureCount: number;
  duration: number;
  errors?: string[];
}

export class Logger {
  private static instance: Logger;
  
  private constructor() {}
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: string, message: string, data?: any, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
      ...(context && { context })
    };
    
    return JSON.stringify(logEntry);
  }

  private log(level: string, message: string, data?: any, context?: LogContext): void {
    const logLine = this.formatLog(level, message, data, context);
    console.log(logLine);
  }

  info(message: string, data?: any, context?: LogContext): void {
    this.log('INFO', message, data, context);
  }

  warn(message: string, data?: any, context?: LogContext): void {
    this.log('WARN', message, data, context);
  }

  error(message: string, data?: any, context?: LogContext): void {
    this.log('ERROR', message, data, context);
  }

  debug(message: string, data?: any, context?: LogContext): void {
    this.log('DEBUG', message, data, context);
  }

  // Specific logging methods for different operations

  logProgressUpdate(data: ProgressLogData, context?: LogContext): void {
    this.info('Progress updated', {
      progress: data,
      change: {
        percentDelta: data.newPercent - (data.previousPercent || 0),
        statusChanged: data.previousStatus !== data.newStatus
      }
    }, context);
  }

  logRetrieval(data: RetrievalLogData, context?: LogContext): void {
    this.info('Vector retrieval completed', {
      retrieval: data,
      performance: {
        hitRate: data.hits / (data.hits + data.misses),
        avgLatency: data.latency
      }
    }, context);
  }

  logLLMOperation(data: LLMLogData, context?: LogContext): void {
    const level = data.parseSuccess ? 'info' : 'error';
    this[level]('LLM operation completed', {
      llm: data,
      performance: {
        latency: data.latency,
        success: data.parseSuccess
      }
    }, context);
  }

  logOverride(data: OverrideLogData, context?: LogContext): void {
    this.info('Manual override applied', {
      override: data,
      impact: {
        percentDelta: data.newPercent - data.previousPercent,
        statusChanged: data.previousStatus !== data.newStatus
      }
    }, context);
  }

  logBatchOperation(data: BatchLogData, context?: LogContext): void {
    const level = data.failureCount > 0 ? 'warn' : 'info';
    this[level]('Batch operation completed', {
      batch: data,
      performance: {
        successRate: data.successCount / (data.successCount + data.failureCount),
        throughput: data.taskCount / (data.duration / 1000) // tasks per second
      }
    }, context);
  }

  logCircuitBreaker(operation: string, state: 'open' | 'closed' | 'half-open', context?: LogContext): void {
    this.warn(`Circuit breaker ${state} for ${operation}`, {
      circuitBreaker: {
        operation,
        state,
        timestamp: new Date().toISOString()
      }
    }, context);
  }

  logStandupTrigger(userId: string, taskCount: number, context?: LogContext): void {
    this.info('Standup trigger initiated', {
      trigger: {
        userId,
        taskCount,
        timestamp: new Date().toISOString()
      }
    }, context);
  }

  logNightlyBatch(startTime: Date, endTime: Date, results: any, context?: LogContext): void {
    const duration = endTime.getTime() - startTime.getTime();
    this.info('Nightly batch completed', {
      batch: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        results
      }
    }, context);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
