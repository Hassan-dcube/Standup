export class Logger {
    static instance;
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    formatLog(level, message, data, context) {
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
    log(level, message, data, context) {
        const logLine = this.formatLog(level, message, data, context);
        console.log(logLine);
    }
    info(message, data, context) {
        this.log('INFO', message, data, context);
    }
    warn(message, data, context) {
        this.log('WARN', message, data, context);
    }
    error(message, data, context) {
        this.log('ERROR', message, data, context);
    }
    debug(message, data, context) {
        this.log('DEBUG', message, data, context);
    }
    // Specific logging methods for different operations
    logProgressUpdate(data, context) {
        this.info('Progress updated', {
            progress: data,
            change: {
                percentDelta: data.newPercent - (data.previousPercent || 0),
                statusChanged: data.previousStatus !== data.newStatus
            }
        }, context);
    }
    logRetrieval(data, context) {
        this.info('Vector retrieval completed', {
            retrieval: data,
            performance: {
                hitRate: data.hits / (data.hits + data.misses),
                avgLatency: data.latency
            }
        }, context);
    }
    logLLMOperation(data, context) {
        const level = data.parseSuccess ? 'info' : 'error';
        this[level]('LLM operation completed', {
            llm: data,
            performance: {
                latency: data.latency,
                success: data.parseSuccess
            }
        }, context);
    }
    logOverride(data, context) {
        this.info('Manual override applied', {
            override: data,
            impact: {
                percentDelta: data.newPercent - data.previousPercent,
                statusChanged: data.previousStatus !== data.newStatus
            }
        }, context);
    }
    logBatchOperation(data, context) {
        const level = data.failureCount > 0 ? 'warn' : 'info';
        this[level]('Batch operation completed', {
            batch: data,
            performance: {
                successRate: data.successCount / (data.successCount + data.failureCount),
                throughput: data.taskCount / (data.duration / 1000) // tasks per second
            }
        }, context);
    }
    logCircuitBreaker(operation, state, context) {
        this.warn(`Circuit breaker ${state} for ${operation}`, {
            circuitBreaker: {
                operation,
                state,
                timestamp: new Date().toISOString()
            }
        }, context);
    }
    logStandupTrigger(userId, taskCount, context) {
        this.info('Standup trigger initiated', {
            trigger: {
                userId,
                taskCount,
                timestamp: new Date().toISOString()
            }
        }, context);
    }
    logNightlyBatch(startTime, endTime, results, context) {
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
