// Enhanced API utilities with retry logic, timeout, and error handling

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuthRedirect?: boolean;
}

class NetworkError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Enhanced fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new NetworkError('Request timeout', 408);
    }
    throw error;
  }
}

/**
 * Retry logic with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    ...fetchOptions
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🌐 Fetch attempt ${attempt + 1}/${retries + 1}: ${url}`);
      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        timeout,
      });

      // Don't retry on 4xx errors (client errors) except 408, 429
      if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 408 &&
        response.status !== 429
      ) {
        return response;
      }

      // Retry on 5xx errors (server errors) and specific 4xx
      if (response.status >= 500 || response.status === 408 || response.status === 429) {
        throw new NetworkError(
          `Server error: ${response.status}`,
          response.status
        );
      }

      return response;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Fetch attempt ${attempt + 1} failed:`, error.message);

      // Don't retry on network/DNS errors on last attempt
      if (attempt === retries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = retryDelay * Math.pow(2, attempt);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new NetworkError('Request failed after all retries');
}

/**
 * Enhanced API call with automatic error handling
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    skipAuthRedirect = false,
    headers = {},
    ...fetchOptions
  } = options;

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const url = `${baseURL}${endpoint}`;

  const token = localStorage.getItem('token');
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithRetry(url, {
      ...fetchOptions,
      headers: requestHeaders,
      retries: 2, // Retry twice (3 total attempts)
      timeout: 30000, // 30 second timeout
    });

    // Handle authentication errors
    if (response.status === 401 && !skipAuthRedirect) {
      console.warn('⚠️ 401 Unauthorized - Clearing auth and redirecting');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on auth page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      
      throw new NetworkError('Session expired. Please login again.', 401);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle non-2xx responses
    if (!response.ok) {
      throw new NetworkError(
        data?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error: any) {
    console.error('❌ API Call Failed:', {
      endpoint,
      error: error.message,
      status: error.status,
    });

    // Enhance error message for user
    if (error instanceof NetworkError) {
      throw error;
    } else if (error.name === 'AbortError') {
      throw new NetworkError('Request was cancelled', 0);
    } else if (!navigator.onLine) {
      throw new NetworkError('No internet connection', 0);
    } else {
      throw new NetworkError(
        'Network error. Please check your connection and try again.',
        0
      );
    }
  }
}

/**
 * Create an abortable API call
 */
export function createAbortableRequest<T = any>(
  endpoint: string,
  options: FetchOptions = {}
) {
  const controller = new AbortController();

  const promise = apiCall<T>(endpoint, {
    ...options,
    signal: controller.signal,
  });

  return {
    promise,
    abort: () => controller.abort(),
  };
}

/**
 * Check network status
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for network to be online
 */
export function waitForOnline(timeout = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve(true);
      return;
    }

    const onlineHandler = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onlineHandler);
      resolve(true);
    };

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeout);

    window.addEventListener('online', onlineHandler);
  });
}

export { NetworkError };
