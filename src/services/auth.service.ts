import { axiosInstance as apiClient, publicAxiosInstance as publicApiClient } from '../api/client';
import type { ChangePasswordRequest, LoginPayload } from '../types/auth.type';

export const authService = {
  login: (data: LoginPayload) =>
    publicApiClient.post('/api/Auth/login', data),

  getAccountInfo: () =>
    apiClient.get('/api/Auth/account-info'),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post('/api/Auth/change-password', {
      oldPassword: data.currentPassword,
      newPassword: data.newPassword,
    }),
};
