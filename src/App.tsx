import { useState } from 'react';
import { BrowserRouter } from 'react-router';

import { AntdAppProvider } from './components/antd-app-provider';

import PrivateRoute from './route/PrivateRoute/PrivateRoute';
import PublicRoute from './route/PublicRoute/PublicRoute';
import { authSessionStorage } from './storage/auth-session.storage';
import { readAuthStateFromStorage } from './storage/auth.storage';
import { isPersistentRuntimeKey, runtimeStorage } from './storage/runtime.storage';
import { THEME_STORAGE_KEY } from './store/themeStore';

const cleanBrowserStorage = () => {
  const allowedKeys = new Set(["token", "id", THEME_STORAGE_KEY]);
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key || allowedKeys.has(key)) continue;

    const value = localStorage.getItem(key);

    // İşçi məlumatları, override-lar və şirkət cache-i login zamanı silinməsin.
    // Bütün persistent runtime açarlarını əvvəlcə session/IndexedDB qatına köçürürük.
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
