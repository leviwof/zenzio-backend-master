import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorDetails = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.originalUrl,
      statusCode: status,
      error:
        typeof exception === 'object' &&
        exception !== null &&
        'message' in exception &&
        typeof (exception as { message?: unknown }).message === 'string'
          ? (exception as { message: string }).message
          : 'Internal server error',
      stack:
        typeof exception === 'object' &&
        exception !== null &&
        'stack' in exception &&
        typeof (exception as { stack?: unknown }).stack === 'string'
          ? (exception as { stack: string }).stack
          : null,
    };

    // If it's a BadRequestException, handle the invalid fields and send the response accordingly
    if (exception instanceof BadRequestException) {
      const responseBody = exception.getResponse();
      const message =
        responseBody && typeof responseBody === 'object' && 'message' in responseBody
          ? (responseBody as { message?: unknown }).message
          : undefined;

      if (message) {
        // Handle invalid fields (message could be a string or an array of strings)
        let details = Array.isArray(message) ? message : [message];

        // If the exception already has detailed 'details', use them
        if (
          responseBody &&
          typeof responseBody === 'object' &&
          'details' in responseBody &&
          Array.isArray((responseBody as any).details)
        ) {
          details = (responseBody as any).details;
        }

        // Write the error details to the log file (including the stack and url)
        this.logToFile({
          ...errorDetails,
          details, // Include invalid fields in the log for debugging
        });

        // Get the actual message to show to the user
        const errorMessage = Array.isArray(message)
          ? message.join(', ') // If multiple errors, join them
          : String(message); // Single error message

        // Send the error response with invalid fields
        return response.status(status).json({
          statusCode: status,
          message: errorMessage || 'Validation failed', // Show actual error message
          details, // Include invalid fields in the response
          error:
            typeof exception === 'object' &&
            exception !== null &&
            'name' in exception &&
            typeof (exception as { name?: unknown }).name === 'string'
              ? (exception as { name: string }).name
              : 'BadRequestException',
        });
      }
    }

    // For other exceptions, log to file and send a standard error response
    this.logToFile(errorDetails);

    // Send standard error response (without details in other exceptions)
    response.status(status).json({
      statusCode: status,
      message:
        typeof exception === 'object' &&
        exception !== null &&
        'message' in exception &&
        typeof (exception as { message?: unknown }).message === 'string'
          ? (exception as { message: string }).message
          : 'Internal server error',
      error:
        typeof exception === 'object' &&
        exception !== null &&
        'name' in exception &&
        typeof (exception as { name?: unknown }).name === 'string'
          ? (exception as { name: string }).name
          : 'UnknownError',
    });
  }

  private logToFile(logDetails: any) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}${String(date.getDate()).padStart(2, '0')}`;
    const fileName = `error-log-${dateStr}.log`;

    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFilePath = path.join(logsDir, fileName);
    fs.appendFileSync(logFilePath, JSON.stringify(logDetails) + '\n', 'utf8');
  }
}
