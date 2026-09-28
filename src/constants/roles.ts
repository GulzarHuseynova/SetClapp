export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  COMPANY_ADMIN: 'company-admin',
  EMPLOYEE: 'employee',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PASSWORD_CHANGE_ROLES: Role[] = [
  ROLES.COMPANY_ADMIN,
  ROLES.EMPLOYEE,
];
