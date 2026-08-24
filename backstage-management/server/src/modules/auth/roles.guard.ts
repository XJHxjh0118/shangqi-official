import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MENUS_KEY } from '../../common/decorators/menus.decorator';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { SYSTEM_ROLE } from '../../common/system-role';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const menus = this.reflector.getAllAndOverride<string[]>(MENUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if ((!roles || roles.length === 0) && (!menus || menus.length === 0)) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) {
      throw new ForbiddenException('权限不足');
    }
    if (user.role === SYSTEM_ROLE.ADMIN) {
      return true;
    }

    const roleOk = !roles?.length || roles.includes(user.role);
    if (!menus?.length) {
      if (!roleOk) throw new ForbiddenException('权限不足');
      return true;
    }

    const granted = await this.rolesService.getMenusByCode(user.role);
    const menuOk = this.rolesService.hasMenu(granted, menus);
    if (roleOk && menuOk) return true;
    if (!roles?.length && menuOk) return true;
    throw new ForbiddenException('权限不足');
  }
}
