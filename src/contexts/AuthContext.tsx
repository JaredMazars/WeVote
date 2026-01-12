import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string) => Promise<boolean>;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
  getCurrentUserId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const userData = response.data as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.register(name, email);
      
      if (response.success) {
        return true;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMicrosoft = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.loginWithMicrosoft();
      
      if (response.success && response.data) {
        const userData = response.data as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Microsoft login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Clear all authentication and session data
    localStorage.removeItem('user');
    localStorage.removeItem('proxyChoice');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Clear any session storage
    sessionStorage.clear();
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('logout'));
  };

  const getCurrentUserId = (): string | null => {
    return user?.id || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithMicrosoft,
        logout,
        getCurrentUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
