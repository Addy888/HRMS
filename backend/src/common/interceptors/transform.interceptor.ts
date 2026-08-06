import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        let message = 'Success';
        let actualData = data;
        let meta = undefined;

        // Custom structure support from service response
        if (data && typeof data === 'object') {
          if ('message' in data) {
            message = data.message;
          }
          if ('data' in data) {
            actualData = data.data;
          }
          if ('meta' in data) {
            meta = data.meta;
          }
        }

        return {
          success: true,
          statusCode,
          message,
          data: actualData,
          meta,
        };
      }),
    );
  }
}
