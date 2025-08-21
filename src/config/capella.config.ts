/**
 * Capella Database Configuration
 * 
 * To use this with your Capella database:
 * 1. Replace the placeholder values with your actual Capella database credentials
 * 2. Update the database name if needed
 * 3. Ensure your Capella App Service is configured with the correct sync function
 */

export const CAPELLA_CONFIG = {
  // Your Capella App Service endpoint URL
  // Format: wss://your-app-service.apps.cloud.couchbase.com:4984/your-database
  SYNC_GATEWAY_URL: 'wss://xxxxxx.apps.cloud.couchbase.com:4984/travel-location',
  
  // Database name (should match your Capella database name)
  DATABASE_NAME: 'travel',
  
  // Authentication credentials
  // Create these users in your Capella App Service configuration
  AUTH: {
    username: 'demo@example.com',
    password: 'P@ssw0rd12',
  },
  
  // Sync configuration
  SYNC: {
    continuous: true,
    acceptSelfSignedCerts: false,
    // Collections to sync
    collections: ['hotel', 'landmark', 'post', 'airline', 'airport', 'route'],
  },
  
  // Network configuration
  NETWORK: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
};

/**
 * Environment-specific configurations
 */
export const getCapellaConfig = () => {
  // You can add environment-specific logic here
  // For example, different configs for development, staging, production
  
  if (__DEV__) {
    // Development configuration
    return {
      ...CAPELLA_CONFIG,
      // Add development-specific overrides here
    };
  }
  
  // Production configuration
  return CAPELLA_CONFIG;
};

/**
 * Helper function to validate configuration
 */
export const validateCapellaConfig = () => {
  const config = getCapellaConfig();
  
  console.log('🔍 Validating Capella Configuration...');
  console.log('URL:', config.SYNC_GATEWAY_URL);
  console.log('Username:', config.AUTH.username);
  console.log('Database:', config.DATABASE_NAME);
  
  if (config.SYNC_GATEWAY_URL.includes('xxxxxx')) {
    throw new Error(
      '❌ Capella configuration not set up. Please update src/config/capella.config.ts with your actual Capella credentials.'
    );
  }
  
  if (config.SYNC_GATEWAY_URL === 'wss://xxxxxx.apps.cloud.couchbase.com:4984/travel-location') {
    throw new Error(
      '❌ Please replace the placeholder URL with your actual Capella App Service URL'
    );
  }
  
  if (config.AUTH.username === 'demo@example.com' && config.AUTH.password === 'P@ssw0rd12') {
    console.warn('⚠️ Using default credentials. Consider updating with your actual Capella user credentials.');
  }
  
  console.log('✅ Capella configuration validated');
  return config;
};