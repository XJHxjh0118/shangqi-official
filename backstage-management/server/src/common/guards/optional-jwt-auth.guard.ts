import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** 有 Bearer Token 时解析用户；无 Token / 无效 Token 时放行且 user 为空 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();
    const auth = req.headers?.authorization;
    if (!auth || !/^Bearer\s+\S+/i.test(auth)) {
      return true;
    }
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser | null {
    if (err || !user) return null;
    return user;
  }
}
