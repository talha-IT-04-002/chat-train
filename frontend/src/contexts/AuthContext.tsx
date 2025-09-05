import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { apiService, type User, type Organization } from '../services/api';

interface AuthState {
  user: User | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginResult {
  success: boolean;
  reason?: 'EMAIL_NOT_VERIFIED' | 'INVALID_CREDENTIALS' | 'OTHER';
  message?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }) => Promise<void>;
  logout: () => void;
  setCurrentOrganization: (organization: Organization) => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; organizations: Organization[]; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_CURRENT_ORGANIZATION'; payload: Organization }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  organizations: [],
  currentOrganization: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        organizations: action.payload.organizations,
        currentOrganization: action.payload.organizations[0] || null,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        organizations: [],
        currentOrganization: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        organizations: [],
        currentOrganization: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_CURRENT_ORGANIZATION':
      return {
        ...state,
        currentOrganization: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const bypassEmailVerification = import.meta.env.VITE_BYPASS_EMAIL_VERIFICATION === 'true';

  useEffect(() => {
    const checkAuth = async () => {
      const token = apiService.getToken();
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: bypassEmailVerification ? { ...response.data.user, emailVerified: true } : response.data.user,
                organizations: response.data.organizations,
                token,
              },
            });
          } else {
            dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to get user data' });
          }
        } catch (error) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await apiService.login(email, password);

      if (response.success && response.data) {
        const { user } = response.data;
        // Store last attempted email for verification page prefill
        try { localStorage.setItem('lastLoginEmail', email); } catch {}
        // Skip email verification check when bypass flag is enabled
        if (!bypassEmailVerification && !user.emailVerified) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Please verify your email to continue.' });
          return { success: false, reason: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email to continue.' };
        }
        apiService.setToken(response.data.token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: bypassEmailVerification ? { ...response.data.user, emailVerified: true } : response.data.user,
            organizations: response.data.organizations,
            token: response.data.token,
          },
        });
        return { success: true };
      } else {
        const message = response.message || 'Login failed';
        const isUnverified = /verify your email|not active/i.test(message);
        try { localStorage.setItem('lastLoginEmail', email); } catch {}
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        return { success: false, reason: isUnverified ? 'EMAIL_NOT_VERIFIED' : 'OTHER', message };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      const isUnverified = /verify your email|not active/i.test(message);
      try { localStorage.setItem('lastLoginEmail', email); } catch {}
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, reason: isUnverified ? 'EMAIL_NOT_VERIFIED' : 'OTHER', message };
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        apiService.setToken(response.data.token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            organizations: response.data.organizations,
            token: response.data.token,
          },
        });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message || 'Registration failed' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
    }
  };

  const logout = () => {
    apiService.clearToken();
    dispatch({ type: 'LOGOUT' });
  };

  const setCurrentOrganization = (organization: Organization) => {
    dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: organization });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            organizations: response.data.organizations,
            token: apiService.getToken() || '',
          },
        });
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    setCurrentOrganization,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;