import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ok } from '../http/api-response';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiEnvelope<T> | StreamableFile>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiEnvelope<T> | StreamableFile> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) {
          return data;
        }
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'data' in data &&
          'msg' in data
        ) {
          return data as ApiEnvelope<T>;
        }
        return ok(data);
      }),
    );
  }
}
