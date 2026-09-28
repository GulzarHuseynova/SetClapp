import { Suspense, cloneElement, useCallback, useEffect } from 'react';
import { Spin } from 'antd';
import { Routes, Route, Navigate } from 'react-router';
import PublicCard from '../../pages/public/public-card';
import { authSessionStorage } from '../../storage/auth-session.storage';
import { useAuthSelector } from '../../store/authStore';
import { readAuthStateFromStorage } from '../../storage/auth.storage';
import type { NormalizedRole } from '../../types/common.type';
import type { PrivateRouteProps } from '../../types/route.type';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import { privateRoutes, roleHome } from './PrivateRoutes';
import { ROLES } from '../../constants/roles';

const getActiveRole = (storeRole: NormalizedRole): NormalizedRole => {
  return storeRole || readAuthStateFromStorage().role;
};

export default function PrivateRoute({ onLogout }: PrivateRouteProps) {
  const storeRole = useAuthSelector((state) => state.role);
  const role = getActiveRole(storeRole);

  const handleLogout = useCallback(() => {
    authSessionStorage.clear();
    onLogout?.();
  }, [onLogout]);

  useEffect(() => {
    if (!role) {
      handleLogout();
    }
  }, [handleLogout, role]);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/card/:cardId" element={<PublicCard />} />
      <Route path="/v/:cardId" element={<PublicCard />} />

      <Route element={<ProtectedRoute onUnauthorized={handleLogout} />}>
        <Route path="/" element={<Navigate to={roleHome[role]} replace />} />
        <Route path="/login" element={<Navigate to={roleHome[role]} replace />} />

        {privateRoutes
          .filter((route) => route.roles.includes(role))
          .map((route) => (
            <Route
              key={route.key}
              path={route.path}
              element={(
                <Suspense fallback={<Spin fullscreen />}>
                  {cloneElement(route.element, { onLogout: handleLogout })}
                </Suspense>
              )}
            />
          ))}

        {role === ROLES.SUPER_ADMIN && (
          <Route path="/super-admin/*" element={<Navigate to="/admin/statistics" replace />} />
        )}

        <Route path="*" element={<Navigate to={roleHome[role]} replace />} />
      </Route>
    </Routes>
  );
}
