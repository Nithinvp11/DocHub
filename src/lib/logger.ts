/**
 * Application logger
 * Provides structured logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        },
      }),
    };
    this.log('error', message, errorContext);
  }

  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`${operation} completed`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${operation} failed`, error, { duration: `${duration.toFixed(2)}ms` });
      throw error;
    }
  }
}

export const logger = new Logger();
