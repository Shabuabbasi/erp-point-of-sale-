import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const isValidToken = (token) => token && token !== 'undefined' && token !== 'null';

const parseStoredUser = (raw) => {
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    const user = JSON.parse(raw);
    return user && typeof user === 'object' ? user : null;
  } catch {
    return null;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = parseStoredUser(localStorage.getItem('user'));

    if (!isValidToken(token) || !savedUser) {
      clearAuthStorage();
      setLoading(false);
      return;
    }

    setUser(savedUser);
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        clearAuthStorage();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data?.token || !data?.user) {
      throw new Error('Invalid login response — check that VITE_API_URL points to your backend API');
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
  };

  const hasPermission = (...perms) => {
    const userPerms = user?.effectivePermissions || [];
    return perms.some((p) => userPerms.includes(p));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
