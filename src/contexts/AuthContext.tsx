import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiService from '../services/api';
import { msalInstance, loginRequest } from '../config/msalConfig';
import { BrowserAuthError } from "@azure/msal-browser";

interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  avatar?: string;
  role: string;
  role_id : string; 
  email_verified?: number | boolean;
  needs_password_change?: number | boolean;  // ✅ Add this
  is_temp_password?: number | boolean;       // ✅ Add this
  membership_number?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>; // ✅ returns User or null
  register: (userData: { email: string; name: string; avatar_url?: string }) => Promise<{ success: boolean; password?: string }>;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  getCurrentUserId: () => string | null;
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

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
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
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
  setError(null);

  try {
    const response = await ApiService.login(email, password);

    console.log('🔍 Full API Response:', response);

    if (response.success) {
      const userData: User = {
        id: response.user.id.toString(),
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar || '',
        role: response.user.role || 'voter',
        role_id: response.user.role_id,  // ✅ ADD THIS
        surname: response.user.surname,
        email_verified: response.user.email_verified,
        needs_password_change: response.user.needs_password_change,
        is_temp_password: response.user.is_temp_password
      };

      console.log('✅ User role_id:', userData.role_id);  // ✅ Debug log
      console.log('✅ User role:', userData.role);

      setUser(userData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));

      setIsLoading(false);
      return userData;
    } else {
      setError(response.message || 'Login failed');
      setIsLoading(false);
      return null;
    }
  } catch (error: any) {
    console.error('Login error:', error);
    setError(error.message || 'Login failed. Please try again.');
    setIsLoading(false);
    return null;
  }
};




    // Add this helper function to generate random passwords
  const generateRandomPassword = (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const register = async (userData: { email: string; name: string; avatar_url?: string }): Promise<{ success: boolean; password?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate random password
      const generatedPassword = generateRandomPassword(12);
      
      const registrationData = {
        ...userData,
        password: generatedPassword
      };
      
      const response = await ApiService.register(registrationData);
      
      if (response.success) {
        console.log('Registration successful:', response);  
        // Auto-login after successful registration if token is provided
        if (response.token && response.user) {
          const userData: User = {
            id: response.user.id.toString(),
            email: response.user.email,
            name: response.user.name,
            surname: response.user.surname,
            avatar: response.user.avatar || '',
            role: response.user.role, 
            role_id: response.user.role_id
          };
          
          setUser(userData);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setIsLoading(false);
        return { success: true, password: generatedPassword };
      } else {
        setError(response.message || 'Registration failed');
        setIsLoading(false);
        return { success: false };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
      setIsLoading(false);
      return { success: false };
    }
  };


  const loginWithMicrosoft = async (): Promise<boolean> => {
  setIsLoading(true);
  setError(null);

  try {
    console.log('Starting Microsoft login...');

    try {
      // Try the normal Microsoft login flow first
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      console.log('Microsoft login response:', loginResponse);

      if (loginResponse.accessToken && loginResponse.account) {
        console.log('Got Microsoft access token, calling backend...');

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
            surname: response.user.surname,
            avatar: response.user.avatar || '',
            role: response.user.role,
            role_id: response.user.role_id
          };

          setUser(userData);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(userData));

          setIsLoading(false);
          return true;
        }
      }
    } catch (msalError: any) {
      console.log('MSAL OAuth failed, trying fallback approach...', msalError);

      // Handle popup blocked error with redirect fallback
      if (msalError.errorCode === 'popup_window_error') {
        console.warn('Popup blocked. Redirecting for login...');
        try {
          await msalInstance.loginRedirect({
            scopes: [],
            prompt: 'select_account'
          });
          return false; // Redirect will take over
        } catch (redirectError) {
          console.error('Redirect login failed:', redirectError);
        }
      }

      // Fallback: Try silent login to get cached account info
      try {
        const accounts = msalInstance.getAllAccounts();
        console.log('Available accounts:', accounts);

        if (accounts.length > 0) {
          const account = accounts[0];
          console.log('Using cached account:', account);

          const microsoftUser = {
            displayName: account.name || 'Microsoft User',
            mail: account.username || account.localAccountId + '@microsoft.com',
            userPrincipalName: account.username || account.localAccountId + '@microsoft.com',
            id: account.localAccountId || account.homeAccountId
          };

          const response = await ApiService.loginWithMicrosoft(
            'bypass-token',
            microsoftUser
          );

          if (response.success) {
            const userData: User = {
              id: response.user.id.toString(),
              email: response.user.email,
              surname: response.user.surname,
              name: response.user.name,
              avatar: response.user.avatar || '',
              role: response.user.role, 
              role_id: response.user.role_id
            };

            setUser(userData);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(userData));

            setIsLoading(false);
            return true;
          }
        }

        // If no cached accounts, try popup again with minimal scopes
        console.log('No cached accounts, trying popup with minimal scopes...');
        const minimalLoginResponse = await msalInstance.loginPopup({
          scopes: [],
          prompt: 'select_account'
        });

        if (minimalLoginResponse.account) {
          console.log('Got account info without API access:', minimalLoginResponse.account);

          const microsoftUser = {
            displayName: minimalLoginResponse.account.name || 'Microsoft User',
            mail: minimalLoginResponse.account.username,
            userPrincipalName: minimalLoginResponse.account.username,
            id: minimalLoginResponse.account.localAccountId || minimalLoginResponse.account.homeAccountId
          };

          const response = await ApiService.loginWithMicrosoft(
            'bypass-token',
            microsoftUser
          );

          if (response.success) {
            const userData: User = {
              id: response.user.id.toString(),
              email: response.user.email,
              name: response.user.name,
              surname: response.user.surname,
              avatar: response.user.avatar || '',
              role: response.user.role, 
              role_id: response.user.role_id
            };

            setUser(userData);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(userData));

            setIsLoading(false);
            return true;
          }
        }
      } catch (fallbackError) {
        console.log('Fallback approach also failed:', fallbackError);
      }
    }

    setError('Microsoft authentication failed - unable to get account information');
    setIsLoading(false);
    return false;

  } catch (error: any) {
    console.error('Microsoft login error:', error);

    if (error.errorCode === 'interaction_in_progress') {
      // Clear MSAL's interaction state
      window.sessionStorage.removeItem("msal.interaction.status");
    }

    if (error.errorCode === 'user_cancelled') {
      setError('Microsoft login was cancelled');
    } else if (error.errorCode === 'popup_window_error') {
      setError('Popup was blocked. Please allow popups and try again.');
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
  };

  const clearError = () => {
    setError(null);
  };

  const getCurrentUserId = (): string | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Use 'id' if that's what you put in the JWT payload
      return payload.id ? payload.id.toString() : null;
    } catch {
      return null;
    }
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
    getCurrentUserId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};