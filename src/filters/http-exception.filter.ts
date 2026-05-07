import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

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

    // If the exception response is already a plain object, pass it through as-is
    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      if (responseBody && typeof responseBody === 'object' && !Array.isArray(responseBody)) {
        const body = responseBody as Record<string, unknown>;
        // If it has only a 'message' key, pass through exactly (for strict Flutter contract)
        if (Object.keys(body).length === 1 && 'message' in body) {
          this.logToFile(errorDetails);
          return response.status(status).json(body);
        }
      }
    }

    // If it's a BadRequestException, handle the invalid fields and send the response accordingly
    if (exception instanceof BadRequestException) {
      const responseBody = exception.getResponse();
      const message =
        responseBody && typeof responseBody === 'object' && 'message' in responseBody
          ? (responseBody as { message?: unknown }).message
          : undefined;

      if (message) {
        let details = Array.isArray(message) ? message : [message];

        if (
          responseBody &&
          typeof responseBody === 'object' &&
          'details' in responseBody &&
          Array.isArray((responseBody as any).details)
        ) {
          details = (responseBody as any).details;
        }

        this.logToFile({
          ...errorDetails,
          details,
        });

        const errorMessage = Array.isArray(message)
          ? message.join(', ')
          : String(message);

        return response.status(status).json({
          statusCode: status,
          message: errorMessage || 'Validation failed',
          details,
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

    this.logToFile(errorDetails);

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
