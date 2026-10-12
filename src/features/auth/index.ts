import { getAccountInfo, logout } from './auth-account.helper';
import { login } from './auth-login.helper';
import { changePassword } from './auth-password.helper';

export const authOperations = {
  login,
  changePassword,
  getAccountInfo,
  logout,
};
