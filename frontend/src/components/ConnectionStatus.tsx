import React, { useState, useEffect } from 'react';

// Flag to determine if we're in development mode
const IS_DEV = window.location.hostname === 'localhost';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'dev-mode'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = async () => {
    setStatus('checking');
    setErrorMessage(null);
    
    // In development mode, we can skip the real check and use a different UI state
    if (IS_DEV) {
      console.log('Running in development mode with mock API responses');
      setStatus('dev-mode');
      return;
    }
    
    try {
      // Basic connectivity check to Supabase - just check if the base URL is reachable
      const response = await fetch('https://lpgeocqtgovbdadctvfn.supabase.co/', {
        method: 'HEAD', // Just check if the server responds, don't need content
        cache: 'no-store', // Avoid caching
        mode: 'no-cors', // Avoid CORS issues
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // With no-cors mode, we can't actually check the status
      // But if fetch didn't throw, we assume it's connected
      setStatus('connected');
      console.log('Supabase connection test completed');
      
    } catch (error) {
      setStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown connection error';
      console.error('Connection check failed:', error);
      setErrorMessage(`Connection error: ${errorMsg}`);
    }
  };

  const handleRetryConnection = () => {
    setIsRetrying(true);
    checkConnection().finally(() => {
      setIsRetrying(false);
    });
  };

  // Check connection on component mount
  useEffect(() => {
    checkConnection();
    
    // Set up periodic connection check every 2 minutes
    const interval = setInterval(checkConnection, 120000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'connected') {
    return null; // Don't show anything when connected
  }

  // Special notification for development mode
  if (status === 'dev-mode') {
    return (
      <div style={devModeContainerStyle}>
        <div style={messageStyle}>
          <span>🛠️ Development Mode</span>
        </div>
        <div style={helpTextStyle}>
          Running with mock API responses due to CORS restrictions. In production:
          <ul>
            <li>API calls will go to the actual Supabase backend</li>
            <li>Authentication will use real credentials</li>
            <li>Chat functionality will connect to the real OpenAI integration</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {status === 'checking' ? (
        <div style={messageStyle}>
          <span>Checking connection...</span>
        </div>
      ) : (
        <div style={errorContainerStyle}>
          <div style={messageStyle}>
            <span style={errorTextStyle}>⚠️ Connection issue: </span>
            <span>{errorMessage || 'Failed to connect to Supabase'}</span>
          </div>
          <div style={helpTextStyle}>
            The app cannot connect to the Supabase backend. This may be due to:
            <ul>
              <li>Network connectivity issues</li>
              <li>The Supabase project being inactive</li>
              <li>The Supabase project URL has changed</li>
            </ul>
            <p style={actionItemsStyle}>Try these solutions:</p>
            <ol>
              <li>Ensure you have a working internet connection</li>
              <li>Verify the Supabase project is active in the Supabase dashboard</li>
              <li>Check browser console for more detailed error messages</li>
            </ol>
          </div>
          <button 
            style={retryButtonStyle} 
            onClick={handleRetryConnection}
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying...' : 'Retry Connection'}
          </button>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#fff8e1',
  border: '1px solid #ffd54f',
  borderRadius: '4px',
  padding: '12px 16px',
  marginBottom: '20px',
  fontSize: '14px'
};

const devModeContainerStyle: React.CSSProperties = {
  backgroundColor: '#e3f2fd',
  border: '1px solid #2196f3',
  borderRadius: '4px',
  padding: '12px 16px',
  marginBottom: '20px',
  fontSize: '14px'
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const messageStyle: React.CSSProperties = {
  fontWeight: 'bold'
};

const errorTextStyle: React.CSSProperties = {
  color: '#d32f2f'
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#555'
};

const actionItemsStyle: React.CSSProperties = {
  marginTop: '10px',
  marginBottom: '5px',
  fontWeight: 'bold'
};

const retryButtonStyle: React.CSSProperties = {
  backgroundColor: '#f0f0f0',
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: '13px',
  alignSelf: 'flex-start',
  marginTop: '5px'
};

export default ConnectionStatus;