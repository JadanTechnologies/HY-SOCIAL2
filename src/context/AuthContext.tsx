import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: { username: string; email: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: { displayName?: string; bio?: string; avatar?: string; website?: string }) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to sync auth status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.login({ identifier, password });
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
    }
  };

  const register = async (payload: { username: string; email: string; password: string; displayName?: string }) => {
    const res = await api.register(payload);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    await api.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (payload: { displayName?: string; bio?: string; avatar?: string; website?: string }) => {
    const res = await api.updateProfile(payload);
    if (res.success && res.user) {
      setCurrentUser(res.user);
    }
  };

  const switchUser = async (userId: string) => {
    const res = await api.switchUser(userId);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        switchUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
