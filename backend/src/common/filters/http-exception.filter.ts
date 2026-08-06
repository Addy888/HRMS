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

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
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
          message = `Unique constraint failed on field: ${(exception.meta?.target as string[])?.join(', ')}`;
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
