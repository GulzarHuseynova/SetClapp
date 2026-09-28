import { axiosInstance as apiClient } from '../api/client';
import type { AnalyticsQueryParams, ScanLogParams } from '../types/company-admin.type';

export const analyticsService = {
  getScansCount: (params?: AnalyticsQueryParams) =>
    apiClient.get('/api/Analytics/scans/count', { params }),

  getScansChart: (params?: AnalyticsQueryParams) =>
    apiClient.get('/api/Analytics/scans/chart', { params }),

  getEmployeesRanking: (params?: AnalyticsQueryParams) =>
    apiClient.get('/api/Analytics/employees/ranking', { params }),

  getScansLogs: (params?: ScanLogParams) =>
    apiClient.get('/api/Analytics/scans/logs', { params }),
};
