import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router';

import { AntdAppProvider } from './components/antd-app-provider';

import PrivateRoute from './route/PrivateRoute/PrivateRoute';
import PublicRoute from './route/PublicRoute/PublicRoute';
import { authSessionStorage } from './storage/auth-session.storage';
import { readAuthStateFromStorage } from './storage/auth.storage';
import { isPersistentRuntimeKey, runtimeStorage } from './storage/runtime.storage';
import { THEME_STORAGE_KEY } from './store/themeStore';
import { brandStore } from './store/brandStore';
import { useAuthSelector } from './store/authStore';
import { ROLES } from './constants/roles';

const cleanBrowserStorage = () => {
  const allowedKeys = new Set(["token", "id", THEME_STORAGE_KEY]);
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key || allowedKeys.has(key)) continue;

    const value = localStorage.getItem(key);

    
    
    if (value !== null && isPersistentRuntimeKey(key)) {
      runtimeStorage.setItem(key, value);
    }

    localStorage.removeItem(key);
  }
};

const hasValidSession = () => {
  cleanBrowserStorage();
  return readAuthStateFromStorage().isAuthenticated;
};


function BrandSync({ active }: { active: boolean }) {
  const companyId = useAuthSelector((state) => state.companyId);
  const role = useAuthSelector((state) => state.role);
  const target = active && role !== ROLES.SUPER_ADMIN ? companyId : '';

  useEffect(() => {
    brandStore.setActiveCompany(target, 'auth');
    return () => brandStore.setActiveCompany('', 'auth');
  }, [target]);

  return null;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidSession);

  const handleLoginSuccess = () => {
    cleanBrowserStorage();
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authSessionStorage.clear();
    setIsAuthenticated(false);
  };

  return (
    <AntdAppProvider>
      <BrandSync active={isAuthenticated} />
      <BrowserRouter>
        {isAuthenticated ? (
          <PrivateRoute onLogout={handleLogout} />
        ) : (
          <PublicRoute onLoginSuccess={handleLoginSuccess} />
        )}
      </BrowserRouter>
    </AntdAppProvider>
  );
}

export default App;
