// Constants for localStorage keys
export const TOKEN_KEY = 'pm_buddy_auth_token';
export const USER_KEY = 'pm_buddy_user';

// Interfaces
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// Store authentication data
export const setAuth = (token: string, user: User): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Clear authentication data (logout)
export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Get current auth state
export const getAuthState = (): AuthState => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  let user: User | null = null;
  
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error('Error parsing user data from localStorage', e);
    clearAuth();
  }
  
  return {
    token,
    user,
    isAuthenticated: !!token && !!user
  };
};

// Get authorization header
export const getAuthHeader = (): { Authorization?: string } => {
  const { token } = getAuthState();
  
  return token ? { Authorization: `Bearer ${token}` } : {};
};