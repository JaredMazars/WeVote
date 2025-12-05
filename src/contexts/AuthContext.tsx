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
  role_id : number | string;  // ✅ Add this
  email_verified?: number | boolean;
  needs_password_change?: number | boolean;  // ✅ Add this
  is_temp_password?: number | boolean;       // ✅ Add this
  membership_number?: string;
  proxy_vote_form?: string; // 'manual', 'digital', or 'abstain'
  proxy_file_name?: string; // Uploaded file name
  proxy_file_path?: string; // Uploaded file path
  proxy_uploaded_at?: string; // Upload timestamp
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
      console.log('🔄 AuthContext: Initializing authentication...');
      
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('📦 AuthContext: localStorage contents:', {
        hasToken: !!token,
        hasSavedUser: !!savedUser,
        tokenLength: token?.length,
        savedUserPreview: savedUser?.substring(0, 100)
      });
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('👤 AuthContext: Parsed user from localStorage:', {
            id: parsedUser.id,
            email: parsedUser.email,
            name: parsedUser.name,
            role: parsedUser.role,
            role_id: parsedUser.role_id,
            role_id_type: typeof parsedUser.role_id
          });
          
          // Verify token is still valid
          const response = await ApiService.verifyToken();
          console.log('🔐 AuthContext: Token verification response:', response);
          
          if (response.success) {
            console.log('✅ AuthContext: Token valid, setting user state');
            
            // Use the verified user data from API (which includes role_id)
            const verifiedUser: User = {
              id: response.user.id.toString(),
              email: response.user.email,
              name: response.user.name,
              surname: response.user.surname,
              avatar: response.user.avatar || '',
              role: response.user.role || 'voter',
              // ✅ FIX: Check for undefined/null, not falsy (because 0 is valid but falsy)
              role_id: response.user.role_id !== undefined ? response.user.role_id : parsedUser.role_id,
              membership_number: response.user.member_number
            };

            console.log('Role Id from API:', response.user.role_id);
            console.log('Role Id in verifiedUser:', verifiedUser.role_id);
            console.log('Role Id type:', typeof verifiedUser.role_id);

            console.log('👤 AuthContext: Final user state:', {
              id: verifiedUser.id,
              email: verifiedUser.email,
              role: verifiedUser.role,
              role_id: verifiedUser.role_id,
              role_id_type: typeof verifiedUser.role_id
            });
            
            setUser(verifiedUser);
            
            // Update localStorage with verified data
            localStorage.setItem('user', JSON.stringify(verifiedUser));
          } else {
            console.warn('⚠️ AuthContext: Token invalid, clearing storage');
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('❌ AuthContext: Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('ℹ️ AuthContext: No token or saved user found');
      }
      
      setIsLoading(false);
      console.log('✅ AuthContext: Initialization complete');
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
  setError(null);

  try {
    const response = await ApiService.login(email, password);

    console.log('🔍 Full API Response:', response);
    console.log('🔍 Response.user object:', response.user);
    console.log('🔍 Response.user.role_id:', response.user?.role_id);
    console.log('🔍 Response.user.role_id type:', typeof response.user?.role_id);

    if (response.success) {
      // Log every field from the API response
      console.log('📋 API Response Fields:', {
        'response.user.id': response.user.id,
        'response.user.email': response.user.email,
        'response.user.name': response.user.name,
        'response.user.role': response.user.role,
        'response.user.role_id': response.user.role_id,
        'response.user.avatar': response.user.avatar,
        'response.user.surname': response.user.surname
      });

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
        is_temp_password: response.user.is_temp_password,
        proxy_vote_form: response.user.proxy_vote_form,  // ✅ ADD THIS - THE MISSING PIECE!
        proxy_file_name: response.user.proxy_file_name,
        proxy_file_path: response.user.proxy_file_path,
        proxy_uploaded_at: response.user.proxy_uploaded_at
      };

      console.log('✅ AuthContext - User Data Created:', {
        role: userData.role,
        role_id: userData.role_id,
        role_id_type: typeof userData.role_id,
        proxy_vote_form: userData.proxy_vote_form,  // ✅ Log this too
        id: userData.id,
        email: userData.email,
        name: userData.name
      });

      console.log('📦 Saving to localStorage:', JSON.stringify(userData, null, 2));

      setUser(userData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ AuthContext - Data saved to localStorage');
      console.log('✅ User state after setUser:', userData);

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
            role_id: response.user.role_id,
            proxy_vote_form: response.user.proxy_vote_form
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
            role_id: response.user.role_id,
            proxy_vote_form: response.user.proxy_vote_form
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
              role_id: response.user.role_id,
              proxy_vote_form: response.user.proxy_vote_form
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
              role_id: response.user.role_id,
              proxy_vote_form: response.user.proxy_vote_form
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