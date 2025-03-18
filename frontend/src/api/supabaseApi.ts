import { getAuthHeader } from '../utils/authUtils';

// Set default timeout (ms)
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// Use the specific Supabase URL that was in the original code
const SUPABASE_URL = 'https://lpgeocqtgovbdadctvfn.supabase.co';

// Debug mode for more verbose logging
const DEBUG = true;

// Flag to determine if we're in development mode
const IS_DEV = window.location.hostname === 'localhost';

// For bypassing CORS in development mode
const PROXY_URL = IS_DEV ? 'https://cors-anywhere.herokuapp.com/' : '';

async function testSupabaseConnection() {
  try {
    // In dev mode, first try to connect through a CORS proxy
    if (IS_DEV) {
      try {
        const response = await fetch(`${PROXY_URL}${SUPABASE_URL}`, { 
          method: 'HEAD',
          cache: 'no-store',
          mode: 'cors'
        });
        
        if (DEBUG) {
          console.log(`Supabase base URL test via proxy: ${response.status} ${response.statusText}`);
        }
        
        return response.status < 500;
      } catch (proxyError) {
        console.warn('CORS proxy failed, falling back to no-cors mode:', proxyError);
        // Fall back to no-cors mode if proxy fails
      }
    }
    
    // Try with no-cors as fallback (this will give an opaque response)
    const response = await fetch(SUPABASE_URL, { 
      method: 'HEAD',
      cache: 'no-store',
      mode: 'no-cors' // This will prevent CORS errors but gives opaque response
    });
    
    if (DEBUG) {
      console.log('Supabase base URL test with no-cors mode completed');
    }
    
    // With no-cors, we can't actually check the status, so we'll assume it's ok
    // if the fetch didn't throw an error
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
}

// Use a mock API response for development when CORS is an issue
function getMockResponse(endpoint: string) {
  if (endpoint.includes('login') || endpoint.includes('register')) {
    return {
      token: 'mock-token-for-development',
      user: {
        id: '1',
        email: 'dev@example.com',
        name: 'Development User'
      },
      success: true
    };
  }
  
  if (endpoint.includes('chat')) {
    return {
      message: "This is a mock response since we can't connect to Supabase due to CORS restrictions in development. In production, this would be a real response from the AI.",
      success: true
    };
  }
  
  return {
    success: true,
    message: 'Mock response for development',
    data: []
  };
}

async function callEndpoint(endpoint: string, body: any, method: string = 'POST', retries = 0): Promise<any> {
  // Test basic connectivity first
  const isConnected = await testSupabaseConnection();
  if (!isConnected && retries === 0) {
    console.warn('Supabase connectivity test failed. Will try the API call anyway.');
  }
  
  // In development mode, if we're having CORS issues, use mock responses
  if (IS_DEV && (retries > 0 || !isConnected)) {
    console.warn(`Using mock response for ${endpoint} due to CORS issues in development`);
    return getMockResponse(endpoint);
  }
  
  // Including auth headers for protected endpoints
  const authHeader = getAuthHeader();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  
  try {
    // Use the CORS proxy in development if available
    const baseUrl = IS_DEV ? `${PROXY_URL}${SUPABASE_URL}` : SUPABASE_URL;
    const url = `${baseUrl}/functions/v1/${endpoint}`;
    
    if (DEBUG) console.log(`Calling endpoint: ${url}`, { method, body });
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      // In development, we try with cors mode first
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (DEBUG) console.log(`Response from ${endpoint}:`, { status: response.status, statusText: response.statusText });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (DEBUG) console.error(`Error response body:`, errorText);
      
      const error = new Error(`API request failed with status ${response.status}: ${errorText}`);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).responseText = errorText;
      
      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        (error as any).authError = true;
        console.error('Authentication error:', error);
      }
      
      throw error;
    }
    
    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle timeout separately
    if (error.name === 'AbortError') {
      console.error(`Request to ${endpoint} timed out after ${DEFAULT_TIMEOUT}ms`);
      throw new Error('Request timed out. Please try again.');
    }
    
    // Handle CORS errors in development mode
    if (IS_DEV && (error.message && error.message.includes('CORS'))) {
      console.warn('CORS error detected in development mode:', error);
      // Return mock data in development
      return getMockResponse(endpoint);
    }
    
    // Handle network errors
    if (error.message === 'Failed to fetch') {
      console.error('Network error when calling Supabase:', error);
      
      if (IS_DEV) {
        console.warn('Using mock data due to network error in development');
        return getMockResponse(endpoint);
      }
      
      throw new Error('Network error. Please check your connection and ensure the Supabase project is active.');
    }
    
    // Log the error for debugging
    console.error('API call error:', error);
    
    // Implement retries for non-auth errors
    if (retries < MAX_RETRIES && !error.authError && error.status !== 400) {
      console.log(`Retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})`);
      // Exponential backoff for retries
      const backoffTime = Math.min(1000 * Math.pow(2, retries), 8000);
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(callEndpoint(endpoint, body, method, retries + 1));
        }, backoffTime);
      });
    }
    
    // In development, use mock data as a last resort
    if (IS_DEV) {
      console.warn('Falling back to mock data due to API error in development');
      return getMockResponse(endpoint);
    }
    
    throw error;
  }
}

// Auth-specific endpoints (these don't require auth)
export const loginUser = async (credentials: any) => {
  return callEndpoint('auth/login', credentials);
};

export const registerUser = async (user: any) => {
  return callEndpoint('auth/register', user);
};

// Chat endpoints
export const chatWithOpenai = async (message: any) => {
  return callEndpoint('chat-with-openai', message);
};

export const chatWithRag = async (message: any) => {
  return callEndpoint('chat-with-rag', message);
};

export const chatWithOpenAI = async (messages: any[], useRag: boolean = false) => {
  const endpoint = useRag ? 'chat-with-rag' : 'chat-with-openai';
  return callEndpoint(endpoint, { messages });
};

// Document endpoints
export const uploadDocument = async (document: any) => {
  return callEndpoint('upload-document', document);
};

export const listDocuments = async () => {
  return callEndpoint('list-documents', {}, 'GET');
};

export const deleteDocument = async (docId: string) => {
  return callEndpoint('delete-document', { docId });
};

// Custom instructions endpoints
export const updateUserInstructions = async (instructions: string) => {
  return callEndpoint('update-instructions', { instructions });
};

export const manageCustomInstructions = async (instructions: any) => {
  return callEndpoint('manage-custom-instructions', instructions);
};

export const storeInstruction = async (instruction: any) => {
  return callEndpoint('store-instruction', instruction);
};

export const retrieveInstructions = async (params: any) => {
  return callEndpoint('retrieve-instructions', params);
};

export const getUserInstructions = async () => {
  return callEndpoint('get-instructions', {}, 'GET');
};

// Additional endpoints
export const uploadFile = async (fileData: any) => {
  return callEndpoint('upload-file', fileData);
};

export const retrieveFile = async (params: any) => {
  return callEndpoint('retrieve-file', params);
};

export const storeFeedback = async (feedback: any) => {
  return callEndpoint('store-feedback', feedback);
};

export const searchSerpApi = async (query: any) => {
  return callEndpoint('search-serp-api', query);
};

export const retrieveSearchResults = async (params: any) => {
  return callEndpoint('retrieve-search-results', params);
};

export const transcribeAudio = async (audioData: any) => {
  return callEndpoint('transcribe-audio', audioData);
};

export const storeEmbeddings = async (data: any) => {
  return callEndpoint('store-embeddings', data);
};

export const addArticleToCorpus = async (article: any) => {
  return callEndpoint('add-article-to-corpus', article);
};

export const retrieveArticles = async (params: any) => {
  return callEndpoint('retrieve-articles', params);
};