import { createClient } from '@supabase/supabase-js';

// Get environment variables with strict validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || typeof supabaseUrl !== 'string') {
  throw new Error('Missing or invalid VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
  throw new Error('Missing or invalid VITE_SUPABASE_ANON_KEY environment variable');
}

// Log Supabase URL for debugging (will be removed in production by terser)
console.log('Connecting to Supabase URL:', supabaseUrl);

// Create and export the Supabase client with performance options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // Automatically refresh tokens
    persistSession: true,    // Persist session in local storage
  },
  global: {
    fetch: customFetch, // Use custom fetch with timeout
  }
  // Note: Realtime features will not work due to CSP restrictions
  // that block WebSocket connections to supabase.co
});

// Extract base domain for storage URLs - used for proper storage URL construction
export const supabaseBaseDomain = new URL(supabaseUrl).hostname;

// Custom fetch implementation with timeout
function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // 10 second timeout for all requests
  const FETCH_TIMEOUT = 10000;
  
  return new Promise((resolve, reject) => {
    // Set up abort controller for the timeout
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Merge signal with existing init object
    const fetchInit = init ? { ...init, signal } : { signal };
    
    // Set timeout to abort the request after FETCH_TIMEOUT milliseconds
    const timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`Supabase request timed out after ${FETCH_TIMEOUT}ms`));
    }, FETCH_TIMEOUT);
    
    // Perform the fetch
    fetch(input, fetchInit)
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

// Utility function to get public URL for storage items
export const getPublicStorageUrl = (bucket: string, path: string): string => {
  // Ensure path doesn't start with a slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
};

// Export connection status checker for app health monitoring
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple check to ensure Supabase connection is working
    const { error } = await supabase.from('health_check').select('count').limit(1).single();
    
    // If we got a response at all, consider it connected
    // We're checking for a response, not for data specifically
    return !error || error.code !== 'PGRST301';
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};