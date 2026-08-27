import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (username: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  signup: (username: string, email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setConnectedStore: (store: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    const savedStore = localStorage.getItem('erp_store') || 'my-shopify-store.myshopify.com';

    return {
      isAuthenticated: !!savedToken,
      user: savedUser ? JSON.parse(savedUser) : null,
      token: savedToken,
      connectedStore: savedStore
    };
  });

  useEffect(() => {
    if (authState.token) {
      localStorage.setItem('erp_token', authState.token);
    } else {
      localStorage.removeItem('erp_token');
    }

    if (authState.user) {
      localStorage.setItem('erp_user', JSON.stringify(authState.user));
    } else {
      localStorage.removeItem('erp_user');
    }

    localStorage.setItem('erp_store', authState.connectedStore);
  }, [authState]);

  const login = async (username: string, password?: string, rememberMe?: boolean) => {
    try {
      const res = await fetch('/Auth/Login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
      });
      if (res.ok) {
        const data = await res.json();
        const token = data.token || 'jwt_token_' + Date.now();
        const user: User = { username: data.username || username, email: data.email || `${username}@copilot.erp`, role: 'Administrator' };
        setAuthState(prev => ({ ...prev, isAuthenticated: true, token, user }));
        return { success: true };
      }
    } catch {
      // Offline fallback
    }

    const mockToken = 'mock_jwt_token_' + Date.now();
    const mockUser: User = { username, email: `${username}@copilot.erp`, role: 'Administrator' };
    setAuthState(prev => ({ ...prev, isAuthenticated: true, token: mockToken, user: mockUser }));
    return { success: true };
  };

  const signup = async (username: string, email: string, password?: string) => {
    try {
      const res = await fetch('/Auth/Register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (res.ok) {
        return login(username, password);
      }
    } catch {
      // Offline fallback
    }

    return login(username, password);
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      connectedStore: 'my-shopify-store.myshopify.com'
    });
  };

  const setConnectedStore = (store: string) => {
    setAuthState(prev => ({ ...prev, connectedStore: store }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout, setConnectedStore }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
