/**
 * Types for monitoring events
 */
interface ErrorEvent {
  type: 'error';
  error: Error;
  componentStack?: string;
  context?: Record<string, unknown>;
}

interface PerformanceEvent {
  type: 'performance';
  name: string;
  duration: number;
  context?: Record<string, unknown>;
}

type MonitoringEvent = ErrorEvent | PerformanceEvent;

/**
 * Simple monitoring service
 * Can be extended to send data to external services
 */
class MonitoringService {
  private static instance: MonitoringService;
  private isEnabled: boolean;
  private buffer: MonitoringEvent[] = [];
  private bufferSize = 50;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {
    this.isEnabled = true;
    this.setupErrorListeners();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Track error events
   */
  public trackError(error: Error, componentStack?: string, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const event: ErrorEvent = {
      type: 'error',
      error,
      componentStack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
    };

    this.addToBuffer(event);
    this.logEvent(event);
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(name: string, duration: number, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const event: PerformanceEvent = {
      type: 'performance',
      name,
      duration,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
    };

    this.addToBuffer(event);
    this.logEvent(event);
  }

  /**
   * Enable/disable monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current buffer for debugging
   */
  public getBuffer(): MonitoringEvent[] {
    return [...this.buffer];
  }

  /**
   * Clear event buffer
   */
  public clearBuffer(): void {
    this.buffer = [];
  }

  private addToBuffer(event: MonitoringEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
  }

  private logEvent(event: MonitoringEvent): void {
    if (this.isDevelopment) {
      if (event.type === 'error') {
        console.error('[Monitoring]', event);
      } else {
        console.info('[Monitoring]', event);
      }
    }
    // TODO: Send to external monitoring service
  }

  private setupErrorListeners(): void {
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.trackError(error || new Error(String(message)), undefined, {
          source,
          lineno,
          colno,
        });
      };

      window.onunhandledrejection = (event) => {
        this.trackError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          undefined,
          { type: 'unhandledRejection' }
        );
      };
    }
  }
}

export const monitoring = MonitoringService.getInstance();
