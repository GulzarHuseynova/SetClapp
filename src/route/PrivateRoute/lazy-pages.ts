import { lazy } from 'react';

// Hər rol yalnız öz bölməsinin kodunu yükləsin deyə səhifələr ayrıca chunk-lara bölünür.
export const SuperAdmin = lazy(() => import('../../pages/super-admin/super-admin'));
export const CompanyAdmin = lazy(() => import('../../pages/company-admin/company-admin'));
export const Employee = lazy(() => import('../../pages/employee/employee'));
