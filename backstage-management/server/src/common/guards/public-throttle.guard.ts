import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** 仅对 POST 等写操作限流，GET 公开接口不限流 */
@Injectable()
export class PublicThrottleGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ method?: string }>();
    const method = req?.method?.toUpperCase() || 'GET';
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }
    return super.shouldSkip(context);
  }
}
