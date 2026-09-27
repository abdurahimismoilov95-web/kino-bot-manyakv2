import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Faqat admin uchun qisqartma dekorator */
export const AdminOnly = () => Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN);
/** Faqat super admin uchun */
export const SuperAdminOnly = () => Roles(UserRole.SUPER_ADMIN);
