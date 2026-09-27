import { useAuthStore } from '../store/useAuthStore';

export type Role = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR' | 'AUDITOR' | 'SUPER_ADMIN' | 'CAJERO' | 'BOMBERO' | 'GESTOR_COMERCIAL' | string;

export function getUserRoles(): string[] {
  const user = useAuthStore.getState().user;
  if (!user) return [];
  const roles = user.roles && user.roles.length > 0
    ? user.roles
    : user.role
      ? [user.role]
      : [];
  return roles.map((r) => r.toUpperCase().trim());
}

export function hasRole(...roles: Role[]): boolean {
  const userRoles = getUserRoles();
  return roles.some((r) => userRoles.includes(r.toUpperCase().trim()));
}

export function isAdmin(): boolean {
  return hasRole('ADMIN', 'SUPER_ADMIN');
}

export const PERMISSIONS = {
  usersManage: ['ADMIN', 'SUPER_ADMIN'],
  rolesManage: ['ADMIN', 'SUPER_ADMIN'],
  storesManage: ['ADMIN', 'SUPER_ADMIN'],
  hosesManage: ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'],
  reportsView: ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'AUDITOR'],
  syncRun: ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'],
  documentsEdit: ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'OPERATOR'],
  customersManage: ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'OPERATOR'],
  auditView: ['ADMIN', 'SUPER_ADMIN', 'AUDITOR'],
} as const;

export function can(permission: string): boolean {
  if (isAdmin()) return true;
  const user = useAuthStore.getState().user;
  if (user?.permissions && user.permissions.includes(permission)) {
    return true;
  }
  const roleList = (PERMISSIONS as Record<string, readonly string[]>)[permission];
  if (roleList) {
    return hasRole(...roleList);
  }
  return false;
}

