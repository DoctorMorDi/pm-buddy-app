import React, { useState, useEffect } from 'react';
import { getAuthState, clearAuth } from '../utils/authUtils';
import LoginForm from './LoginForm';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication on mount and whenever auth state changes
  useEffect(() => {
    const { isAuthenticated } = getAuthState();
    setIsAuthenticated(isAuthenticated);
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
  };
  
  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };
  
  // Show loading state initially
  if (isAuthenticated === null) {
    return <div style={loadingContainerStyle}>Checking authentication...</div>;
  }
  
  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }
  
  // Show content with logout button if authenticated
  return (
    <div>
      <div style={logoutContainerStyle}>
        <button onClick={handleLogout} style={logoutButtonStyle}>
          Logout
        </button>
      </div>
      {children}
    </div>
  );
};

// Styles
const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontSize: '18px',
  color: '#666'
};

const logoutContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '10px 20px'
};

const logoutButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#f8f9fa',
  border: '1px solid #ddd',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
};

export default AuthWrapper;