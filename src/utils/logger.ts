// Simple logging utility for network debugging
export const logger = {
  // Network-related logs
  network: (message: string, data?: any) => {
    console.log(`🌐 NETWORK: ${message}`, data || '');
  },
  
  // Request-related logs
  request: (message: string, data?: any) => {
    console.log(`📤 REQUEST: ${message}`, data || '');
  },
  
  // Response-related logs
  response: (message: string, data?: any) => {
    console.log(`📥 RESPONSE: ${message}`, data || '');
  },
  
  // Error logs
  error: (message: string, data?: any) => {
    console.error(`❌ ERROR: ${message}`, data || '');
  },
  
  // Success logs
  success: (message: string, data?: any) => {
    console.log(`✅ SUCCESS: ${message}`, data || '');
  },
  
  // Warning logs
  warning: (message: string, data?: any) => {
    console.warn(`⚠️ WARNING: ${message}`, data || '');
  },
  
  // Info logs
  info: (message: string, data?: any) => {
    console.log(`ℹ️ INFO: ${message}`, data || '');
  },
  
  // Debug logs (only in development)
  debug: (message: string, data?: any) => {
    if (__DEV__) {
      console.log(`🔍 DEBUG: ${message}`, data || '');
    }
  },
  
  // Performance logs
  performance: (message: string, data?: any) => {
    console.log(`⚡ PERFORMANCE: ${message}`, data || '');
  },
  
  // User interaction logs
  user: (message: string, data?: any) => {
    console.log(`👆 USER: ${message}`, data || '');
  },
  
  // Component lifecycle logs
  component: (message: string, data?: any) => {
    console.log(`🖥️ COMPONENT: ${message}`, data || '');
  },
  
  // Hook logs
  hook: (message: string, data?: any) => {
    console.log(`🪝 HOOK: ${message}`, data || '');
  },
  
  // Utility to log network request lifecycle
  requestLifecycle: {
    start: (url: string, method: string) => {
      logger.request(`START ${method.toUpperCase()} ${url}`, {
        timestamp: new Date().toISOString(),
      });
    },
    
    success: (url: string, status: number, duration: number) => {
      logger.success(`${url} completed`, {
        status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    },
    
    error: (url: string, error: any, duration?: number) => {
      logger.error(`${url} failed`, {
        error: error.message || error,
        code: error.code,
        status: error.response?.status,
        duration: duration ? `${duration}ms` : 'unknown',
        timestamp: new Date().toISOString(),
      });
    },
    
    retry: (url: string, attempt: number, maxAttempts: number, delay: number) => {
      logger.warning(`${url} retry ${attempt}/${maxAttempts}`, {
        delay: `${delay}ms`,
        timestamp: new Date().toISOString(),
      });
    },
  },
  
  // Utility to log network state changes
  networkState: {
    change: (oldState: any, newState: any) => {
      logger.network('State changed', {
        from: {
          isConnected: oldState?.isConnected,
          type: oldState?.type,
        },
        to: {
          isConnected: newState?.isConnected,
          type: newState?.type,
        },
        timestamp: new Date().toISOString(),
      });
    },
    
    stable: (state: any) => {
      logger.success('Network stable', {
        type: state.type,
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        timestamp: new Date().toISOString(),
      });
    },
    
    unstable: (state: any, reason: string) => {
      logger.warning('Network unstable', {
        reason,
        type: state.type,
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        timestamp: new Date().toISOString(),
      });
    },
  },
};


