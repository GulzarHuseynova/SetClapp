import { authService } from '../../services/auth.service';
import { cleanupLegacyAuthStorage, patchStoredUser } from '../../storage/auth.storage';
import { findLocalCompanyAdminAccount } from '../../storage/local-auth/company-admin-local-auth';
import { applyLocalEmployeeOverrideToAccount, findLocalEmployeeOverride, localEmployeeAccountInfo, readLocalEmployeeAccounts, saveLocalEmployeeAccount } from '../../storage/local-auth/employee-local-auth';
import {extractAccessToken,extractCompanyId,extractCompanyVoen,extractRefreshToken,extractRole,extractUserId,parseJwt,} from '../../utils/api.utils';
import type { LoginFormValues, LoginResponse } from '../../types/auth.type';
import { PASSWORD_CHANGE_ROLES, ROLES, type Role } from '../../constants/roles';
import {buildBackendEmployeeFallback,buildCompanyAdminAccountInfo,buildLoginPayload,clearStaleBackendSession,hasEmployeeCompletedPasswordChange,hasEmployeePasswordChangeRequired,isAuthCredentialError,isCompanyAdminPasswordChanged,isNetworkOrTimeoutError,looksLikeEmployeeAccount,mergeEmployeeAccountInfo,readFirstLoginFlag,withCompanyAdminFirstLoginFlags,} from '../../features/auth/auth-login.helpers';
import type { PasswordChangeState } from '../../types/auth.type';

const resolveMustChangePassword = ({
  role,
  backendFirstLoginFlag,
  employeePasswordChangeCompleted,
  employeePasswordChangeRequired,
  employeeStoredFirstLogin,
}: PasswordChangeState): boolean => {
  if (role === ROLES.COMPANY_ADMIN) {
    return backendFirstLoginFlag ?? !isCompanyAdminPasswordChanged();
  }

  if (role !== ROLES.EMPLOYEE) return false;

  if (employeePasswordChangeCompleted || employeeStoredFirstLogin === false) {
    return false;
  }

  if (employeePasswordChangeRequired || employeeStoredFirstLogin === true) {
    return true;
  }

  return backendFirstLoginFlag ?? true;
};

const applyFirstLoginFlags = (
  info: Record<string, unknown>,
  mustChangePassword: boolean,
): Record<string, unknown> => ({
  ...info,
  mustChangePassword,
  firstLogin: mustChangePassword,
  isFirstLogin: mustChangePassword,
  forcePasswordChange: mustChangePassword,
});

const buildFinalAccountInfo = (
  role: Role | '',
  accountInfo: Record<string, unknown> | null,
  companyAdminFallbackInfo: Record<string, unknown>,
  mustChangePassword: boolean,
): Record<string, unknown> | null => {
  if (role === ROLES.COMPANY_ADMIN) {
    return withCompanyAdminFirstLoginFlags(
      { ...companyAdminFallbackInfo, ...(accountInfo || {}) },
      mustChangePassword,
    );
  }

  if (role === ROLES.EMPLOYEE) {
    return applyFirstLoginFlags(accountInfo || {}, mustChangePassword);
  }

  return accountInfo;
};

export const login = async (payload: LoginFormValues): Promise<LoginResponse> => {
  const enteredVoen = payload.companyVoen?.trim() || '';
  let loginData: Record<string, unknown>;

  try {
    clearStaleBackendSession();
    const response = await authService.login(buildLoginPayload(payload));
    loginData = response.data;
  } catch (error) {
    // Giriş yalnız backend tərəfindən təsdiqlənir; lokal/oflayn fallback yoxdur.
    if (isNetworkOrTimeoutError(error)) {
      throw new Error('Serverə qoşulmaq mümkün olmadı. İnternet bağlantısını yoxlayıb yenidən cəhd edin.', { cause: error });
    }

    if (isAuthCredentialError(error)) {
      throw new Error('E-poçt, kod və ya VÖEN yanlışdır.', { cause: error });
    }

    throw error;
  }

  const accessToken = extractAccessToken(loginData);
  const refreshToken = extractRefreshToken(loginData);

  if (!accessToken) {
    throw new Error('Login cavabında accessToken tapılmadı.');
  }

  localStorage.setItem('token', accessToken);
  // refreshToken cavabda qala bilər, amma localStorage/sessionStorage-ə yazılmır.
  cleanupLegacyAuthStorage();

  let accountInfo: Record<string, unknown> | null = null;
  try {
    const accountResponse = await authService.getAccountInfo();
    accountInfo = accountResponse.data;
  } catch {
    // Account info is optional; token data is enough for routing.
  }

  const decoded = parseJwt(accessToken);
  const backendRole = extractRole(accountInfo, loginData, decoded);
  const companyVoen = enteredVoen || extractCompanyVoen(accountInfo, loginData, decoded);
  // Lokal qeyd yalnız şirkət məlumatını tamamlamaq üçündür; rolu backend müəyyən edir.
  const localCompanyAdminAfterApi = backendRole === ROLES.COMPANY_ADMIN
    ? findLocalCompanyAdminAccount(payload.email, companyVoen)
    : null;

  let companyId = extractCompanyId(accountInfo, loginData, decoded);

  let userId = extractUserId(accountInfo, loginData, decoded);

  const blockedEmployeeOverride = findLocalEmployeeOverride({
    id: userId,
    email: payload.email,
    companyId,
    companyVoen,
  });

  if (companyVoen && blockedEmployeeOverride?.isActive === false) {
    throw new Error('Bu əməkdaş deaktiv edilib.');
  }

  let role = backendRole;

  if (companyVoen) {
    if (localCompanyAdminAfterApi) {
      role = ROLES.COMPANY_ADMIN;
      companyId = companyId || localCompanyAdminAfterApi.companyId;
      userId = userId || localCompanyAdminAfterApi.gmail;
      accountInfo = {
        ...buildCompanyAdminAccountInfo(localCompanyAdminAfterApi, readFirstLoginFlag(accountInfo, loginData, decoded) ?? true),
        ...(accountInfo || {}),
        role: ROLES.COMPANY_ADMIN,
        companyId,
        companyVoen,
        voen: companyVoen,
        userId,
        id: userId,
      };
    } else if (backendRole === ROLES.COMPANY_ADMIN) {
      role = ROLES.COMPANY_ADMIN;
    } else if (backendRole === ROLES.EMPLOYEE || !backendRole || backendRole === ROLES.SUPER_ADMIN || looksLikeEmployeeAccount(accountInfo, loginData, decoded)) {
      const employeeFallback = applyLocalEmployeeOverrideToAccount(buildBackendEmployeeFallback(
        payload.email,
        companyId,
        companyVoen,
        accountInfo,
        loginData,
        decoded
      ));
      if (employeeFallback.isActive === false) throw new Error('Bu əməkdaş deaktiv edilib.');
      saveLocalEmployeeAccount(employeeFallback);

      role = ROLES.EMPLOYEE;
      companyId = companyId || employeeFallback.companyId;
      userId = userId || employeeFallback.id;

      const employeeAccountInfo = localEmployeeAccountInfo(employeeFallback);
      accountInfo = {
        ...mergeEmployeeAccountInfo(employeeAccountInfo, accountInfo),
        role: ROLES.EMPLOYEE,
        companyId: companyId || employeeFallback.companyId,
        companyVoen: companyVoen || employeeFallback.voen,
        voen: companyVoen || employeeFallback.voen,
        userId: userId || employeeFallback.id,
        id: userId || employeeFallback.id,
        employeeId: userId || employeeFallback.id,
      };
    }
  } else if (!role) {
    throw new Error('Hesabın rolu müəyyən edilmədi. Administratorla əlaqə saxlayın.');
  }

  if (companyVoen && (!role || role === ROLES.SUPER_ADMIN)) {
    throw new Error('Bu VÖEN üçün CompanyAdmin və ya Employee hesabı tapılmadı.');
  }

  const canRequirePasswordChange = PASSWORD_CHANGE_ROLES.includes(role as Role);
  const backendFirstLoginFlag = canRequirePasswordChange
    ? readFirstLoginFlag(accountInfo, loginData, decoded)
    : undefined;

  const storedEmployeeForPassword = role === ROLES.EMPLOYEE
    ? (
        readLocalEmployeeAccounts().find((employee) => {
          const sameId = userId && employee.id === userId;
          const sameEmail = employee.email.trim().toLowerCase() === payload.email.trim().toLowerCase();
          const sameCompany = !companyVoen || employee.voen === companyVoen || employee.companyId === companyId;
          return (sameId || sameEmail) && sameCompany;
        }) || null
      )
    : null;

  const employeeStoredFirstLogin = storedEmployeeForPassword
    ? (storedEmployeeForPassword.mustChangePassword ?? storedEmployeeForPassword.isFirstLogin ?? storedEmployeeForPassword.firstLogin ?? true)
    : undefined;
  const employeePasswordChangeCompleted = role === ROLES.EMPLOYEE && hasEmployeeCompletedPasswordChange(
    payload.email,
    companyVoen,
    userId,
  );
  const employeePasswordChangeRequired = role === ROLES.EMPLOYEE && hasEmployeePasswordChangeRequired(
    payload.email,
    companyVoen,
    userId,
  );

  const mustChangePassword = resolveMustChangePassword({
    role,
    backendFirstLoginFlag,
    employeePasswordChangeCompleted,
    employeePasswordChangeRequired,
    employeeStoredFirstLogin,
  });

  if (canRequirePasswordChange) {
    patchStoredUser({
      email: payload.email.trim().toLowerCase(),
      mustChangePassword,
      firstLogin: mustChangePassword,
      isFirstLogin: mustChangePassword,
      forcePasswordChange: mustChangePassword,
    });
  }

  const companyAdminFallbackInfo = localCompanyAdminAfterApi
    ? buildCompanyAdminAccountInfo(localCompanyAdminAfterApi, mustChangePassword)
    : {};

  const finalAccountInfo = buildFinalAccountInfo(
    role,
    accountInfo,
    companyAdminFallbackInfo,
    mustChangePassword,
  );

  const finalResponse: LoginResponse = {
    accessToken,
    refreshToken,
    role,
    companyId,
    companyVoen,
    userId,
    accountInfo: finalAccountInfo,
    mustChangePassword,
    firstLogin: mustChangePassword,
    isFirstLogin: mustChangePassword,
  };

  return finalResponse;
};
