import { CompanyAdmin, Employee, SuperAdmin } from './lazy-pages';
import type { PrivateRouteConfig } from '../../types/route.type';
import type { UserRole } from '../../types/auth.type';
import { ROLES } from '../../constants/roles';

export const roleHome: Record<UserRole, string> = {
  [ROLES.SUPER_ADMIN]: '/admin/statistics',
  [ROLES.COMPANY_ADMIN]: '/company-admin/analytics',
  [ROLES.EMPLOYEE]: '/employee/business-card',
};

export const privateRoutes: PrivateRouteConfig[] = [
  {
    key: ROLES.SUPER_ADMIN,
    path: '/admin/*',
    roles: [ROLES.SUPER_ADMIN],
    element: <SuperAdmin />,
  },
  {
    key: ROLES.COMPANY_ADMIN,
    path: '/company-admin/*',
    roles: [ROLES.COMPANY_ADMIN],
    element: <CompanyAdmin />,
  },
  {
    key: ROLES.EMPLOYEE,
    path: '/employee/*',
    roles: [ROLES.EMPLOYEE],
    element: <Employee />,
  },
];
