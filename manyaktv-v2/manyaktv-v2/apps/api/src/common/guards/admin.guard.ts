import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user: User = req.user;

    if (!user) throw new ForbiddenException('Not authenticated');

    const hasRole = requiredRoles.some((role) => {
      if (role === UserRole.ADMIN) return user.isAdmin;
      if (role === UserRole.SUPER_ADMIN) return user.isSuperAdmin;
      return user.role === role;
    });

    if (!hasRole) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
