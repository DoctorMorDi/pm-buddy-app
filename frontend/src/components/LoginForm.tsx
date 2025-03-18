import React, { useState } from 'react';
import { loginUser, registerUser } from '../api/supabaseApi';
import { setAuth, clearAuth } from '../utils/authUtils';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    
    try {
      if (isLogin) {
        // Handle login
        const response = await loginUser({ email, password });
        
        if (response.token && response.user) {
          setAuth(response.token, response.user);
          setSuccessMessage('Login successful!');
          
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        // Handle registration
        const response = await registerUser({ email, password });
        
        if (response.success) {
          setSuccessMessage('Registration successful! You can now log in.');
          setIsLogin(true); // Switch to login mode
        } else {
          throw new Error('Registration failed');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'An error occurred during authentication'
      );
      // Clear any existing auth in case of errors
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>{isLogin ? 'Login to PM Buddy' : 'Create Account'}</h2>
      
      {error && <div style={errorStyle}>{error}</div>}
      {successMessage && <div style={successStyle}>{successMessage}</div>}
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formGroupStyle}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />
        </div>
        
        <div style={formGroupStyle}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          style={buttonStyle}
          disabled={loading}
        >
          {loading 
            ? 'Processing...' 
            : isLogin 
              ? 'Login' 
              : 'Create Account'}
        </button>
      </form>
      
      <div style={toggleStyle}>
        <button 
          onClick={() => setIsLogin(!isLogin)}
          style={toggleButtonStyle}
          disabled={loading}
        >
          {isLogin 
            ? 'Need an account? Register' 
            : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '40px auto',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
};

const titleStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
  color: '#333'
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#555'
};

const inputStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '16px'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  cursor: 'pointer',
  marginTop: '10px'
};

const toggleStyle: React.CSSProperties = {
  marginTop: '20px',
  textAlign: 'center'
};

const toggleButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#3498db',
  cursor: 'pointer',
  fontSize: '14px'
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#f8d7da',
  color: '#721c24',
  padding: '10px',
  borderRadius: '4px',
  marginBottom: '15px',
  fontSize: '14px'
};

const successStyle: React.CSSProperties = {
  backgroundColor: '#d4edda',
  color: '#155724',
  padding: '10px',
  borderRadius: '4px',
  marginBottom: '15px',
  fontSize: '14px'
};

export default LoginForm;