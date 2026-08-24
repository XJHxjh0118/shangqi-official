import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  actionOf,
  apiOf,
  describeOperation,
  pathnameOf,
  resourceLabelOf,
} from '../operation-log.meta';

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = String(req.method || '').toUpperCase();
    if (method === 'GET' || method === 'OPTIONS' || method === 'HEAD') {
      return next.handle();
    }

    const rawPath = String(req.originalUrl || req.url || '');
    const path = pathnameOf(rawPath).slice(0, 255);
    if (this.shouldSkip(path)) return next.handle();

    const user = req.user as
      | { id?: number; username?: string; role?: string }
      | undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          const action = actionOf(method, path);
          void this.writeLog({
            userId: user?.id ?? null,
            username: user?.username ?? '',
            module: resourceLabelOf(path),
            action,
            method,
            path: apiOf(method, path).slice(0, 255),
            ip: req.ip || req.headers?.['x-forwarded-for'] || '',
            statusCode: context.switchToHttp().getResponse().statusCode,
            detail: describeOperation({
              username: user?.username,
              method,
              path,
              body: req.body,
              action,
            }).slice(0, 500),
          });
        },
      }),
    );
  }

  private shouldSkip(path: string) {
    return (
      path.includes('/login') ||
      path.includes('/refresh-token') ||
      path.includes('/register') ||
      path.includes('/forgot') ||
      path.includes('/change-password') ||
      path.includes('/health') ||
      path.includes('/assets/upload') ||
      path.includes('/product/asset/upload') ||
      path.startsWith('/api/public') ||
      path.startsWith('/car/public')
    );
  }

  private writeLog(data: {
    userId: number | null;
    username: string;
    module: string;
    action: string;
    method: string;
    path: string;
    ip: string;
    statusCode: number;
    detail: string;
  }) {
    return this.prisma.operationLog
      .create({ data })
      .catch(() => undefined);
  }
}
