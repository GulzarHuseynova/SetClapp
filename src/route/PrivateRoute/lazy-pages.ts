import { lazy } from 'react';

export const SuperAdmin = lazy(() => import('../../pages/super-admin/super-admin'));
export const CompanyAdmin = lazy(() => import('../../pages/company-admin/company-admin'));
export const Employee = lazy(() => import('../../pages/employee/employee'));
