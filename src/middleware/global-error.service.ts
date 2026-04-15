import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GlobalErrorService {
  setupGlobalErrorHandlers() {
    process.on('uncaughtException', (error) => {
      this.logError(error);
      // Optional: Restart process after logging
      // setTimeout(() => process.exit(1), 1000);
    });

    process.on('unhandledRejection', (reason) => {
      this.logError(reason);
    });

    process.on('warning', (warning) => {
      this.logError(warning);
    });
  }

  logError(error: unknown) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const logFileName = `error-log-${dateStr}.log`;
    const logsDir = path.resolve(__dirname, '../../logs');

    const isError = (err: unknown): err is { message?: string; stack?: string; name?: string } =>
      typeof err === 'object' &&
      err !== null &&
      ('message' in err || 'stack' in err || 'name' in err);

    const logEntry = {
      timestamp: now.toISOString(),
      message: isError(error) && typeof error.message === 'string' ? error.message : String(error),
      stack: isError(error) && typeof error.stack === 'string' ? error.stack : null,
      name: isError(error) && typeof error.name === 'string' ? error.name : 'Error',
    };

    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const filePath = path.join(logsDir, logFileName);
      fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write error log:', err);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('Logged error:', logEntry);
    }
  }
}
