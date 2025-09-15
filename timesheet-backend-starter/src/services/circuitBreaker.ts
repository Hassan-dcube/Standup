import { logger } from './logger.js';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private successCount = 0;
  private config: CircuitBreakerConfig;

  constructor(
    private operation: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        logger.logCircuitBreaker(this.operation, 'half-open');
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.operation}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.logCircuitBreaker(this.operation, 'closed');
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      logger.logCircuitBreaker(this.operation, 'open');
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      operation: this.operation
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    logger.logCircuitBreaker(this.operation, 'closed');
  }
}

// Circuit breaker instances for different operations
export const llmCircuitBreaker = new CircuitBreaker('LLM_API', {
  failureThreshold: 3,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 300000 // 5 minutes
});

export const vectorCircuitBreaker = new CircuitBreaker('VECTOR_SEARCH', {
  failureThreshold: 5,
  recoveryTimeout: 10000, // 10 seconds
  monitoringPeriod: 300000 // 5 minutes
});

export const progressCircuitBreaker = new CircuitBreaker('PROGRESS_UPDATE', {
  failureThreshold: 10,
  recoveryTimeout: 5000, // 5 seconds
  monitoringPeriod: 300000 // 5 minutes
});
