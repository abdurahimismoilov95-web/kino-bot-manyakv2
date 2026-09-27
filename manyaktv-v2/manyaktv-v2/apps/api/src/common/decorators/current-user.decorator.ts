import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';

/** Route handler parametrida joriy foydalanuvchini olish
 * @example async getMe(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;
    return data ? user?.[data] : user;
  },
);
