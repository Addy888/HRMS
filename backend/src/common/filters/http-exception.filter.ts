import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log all exception details for debugging
    console.log('=== EXCEPTION FILTER CAUGHT ERROR ===');
    console.log('URL:', request.url);
    console.log('Method:', request.method);
    console.log('Query:', request.query);
    console.log('Exception Type:', exception?.constructor?.name);
    console.log('Exception:', exception);
    if (exception instanceof Error) {
      console.log('Error Message:', exception.message);
      console.log('Error Stack:', exception.stack);
    }
    console.log('====================================');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
      console.log('HTTP Exception Status:', status);
      console.log('HTTP Exception Response:', message);
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      exception instanceof Prisma.PrismaClientKnownRequestError
    ) {
      // Prisma error mapping
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          const target = exception.meta?.target;
          const targetStr = Array.isArray(target) ? target.join(', ') : String(target || 'unknown field');
          message = `Unique constraint failed on field: ${targetStr}`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record to update or delete not found';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database error: ${(exception as any).message}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorDetails = typeof message === 'object' ? message : { message };

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorDetails,
    });
  }
}
