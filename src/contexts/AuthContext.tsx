import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiService from '../services/api';
import { msalInstance, loginRequest } from '../config/msalConfig';

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { email: string; password: string; name: string; avatar_url?: string }) => Promise<boolean>;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msalInitialized, setMsalInitialized] = useState(false);

  // Initialize MSAL and check authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize MSAL first
        console.log('Initializing MSAL...');
        await msalInstance.initialize();
        setMsalInitialized(true);
        console.log('MSAL initialized successfully');

        // Then check for existing authentication
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          try {
            // Verify token is still valid
            const response = await ApiService.verifyToken();
            if (response.success) {
              setUser(JSON.parse(savedUser));
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('MSAL initialization failed:', error);
        setError('Authentication system initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.login(email, password);

      console.log(response.token)
      console.log("Decoded token", JSON.parse(atob(response.token.split('.')[1])))
      
      if (response.success) {
        const userData: User = {
          id: response.user.id.toString(),
          email: response.user.email,
          name: response.user.name,
          avatar: response.user.avatar || '',
          role: response.user.role
        };
        
        setUser(userData);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setIsLoading(false);
        return true;
      } else {
        setError(response.message || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: { email: string; password: string; name: string; avatar_url?: string }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.register(userData);
      
      if (response.success) {
        setIsLoading(false);
        console.log('work')
        return true;
      } else {
        console.log('no work')
        setError(response.message || 'Registration failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const loginWithMicrosoft = async (): Promise<boolean> => {
    // Check if MSAL is initialized
    if (!msalInitialized) {
      setError('Authentication system is still initializing. Please try again.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting Microsoft login...');
      
      // Trigger Microsoft login popup
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      console.log('Microsoft login response:', loginResponse);
      
      if (loginResponse.accessToken && loginResponse.account) {
        console.log('Got Microsoft access token, calling backend...');
        
        // Call your backend API with the Microsoft access token
        const response = await ApiService.loginWithMicrosoft(
          loginResponse.accessToken,
          loginResponse.account
        );
        
        console.log('Backend response:', response);
        
        if (response.success) {
          const userData: User = {
            id: response.user.id.toString(),
            email: response.user.email,
            name: response.user.name,
            avatar: response.user.avatar || '',
            role: response.user.role
          };
          
          setUser(userData);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setIsLoading(false);
          return true;
        } else {
          setError(response.message || 'Microsoft login failed');
          setIsLoading(false);
          return false;
        }
      } else {
        setError('Microsoft authentication failed - no access token received');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Microsoft login error:', error);
      
      // Handle specific MSAL errors
      if (error.errorCode === 'user_cancelled') {
        setError('Microsoft login was cancelled');
      } else if (error.errorCode === 'popup_window_error') {
        setError('Popup was blocked. Please allow popups and try again.');
      } else if (error.errorCode === 'uninitialized_public_client_application') {
        setError('Authentication system not ready. Please refresh and try again.');
      } else {
        setError(error.message || 'Microsoft authentication failed');
      }
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Also logout from Microsoft if they were logged in via Microsoft
    if (msalInitialized) {
      try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.logoutPopup({
            account: accounts[0]
          });
        }
      } catch (error) {
        console.log('Microsoft logout error (non-critical):', error);
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    loginWithMicrosoft,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
