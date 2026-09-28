import { authService } from '../../services/auth.service';
import { getStoredUser } from '../../storage/auth.storage';
import { setLocalEmployeeMustChangePassword } from '../../storage/local-auth/employee-local-auth';
import { extractCompanyVoen, findStringDeep, normalizeRole } from '../../utils/api.utils';
import type { ChangePasswordRequest, ChangePasswordResponse } from '../../types/auth.type';
import { ROLES } from '../../constants/roles';
import { getStoredLoginEmail, markEmployeePasswordChangeCompleted, markStoredPasswordChanged } from '../../features/auth/auth-login.helpers';

export const changePassword = async (payload: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  const storedUser = getStoredUser();
  const email = payload.email?.trim() || getStoredLoginEmail();
  const userId = storedUser?.userId || storedUser?.id || email;
  const voen = payload.companyVoen?.trim() || storedUser?.companyVoen || extractCompanyVoen(storedUser?.accountInfo) || '';
  const currentPassword = payload.currentPassword.trim();
  const newPassword = payload.newPassword.trim();
  const confirmPassword = payload.confirmPassword.trim();
  const role = normalizeRole(storedUser?.role || findStringDeep(storedUser?.accountInfo, ['role', 'roleName', 'userRole']));

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error('Köhnə şifrə, yeni şifrə və təkrar şifrə mütləqdir.');
  }

  if (newPassword !== confirmPassword) {
    throw new Error('Yeni şifrə və təkrar şifrə eyni olmalıdır.');
  }

  const response = await authService.changePassword({
    ...payload,
    currentPassword,
    newPassword,
    confirmPassword,
  });

  if (role === ROLES.EMPLOYEE) {
    setLocalEmployeeMustChangePassword(userId || email, voen, false);
    markEmployeePasswordChangeCompleted(email, voen, userId);
  }
  markStoredPasswordChanged();
  return response.data || { success: true };
};
