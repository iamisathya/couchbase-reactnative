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
  SYNC_GATEWAY_URL: 'wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint',
  
  // Database name (should match your Capella database name)
  DATABASE_NAME: 'couchbase-app-bucket',
  
  // Authentication credentials
  AUTH: {
    username: 'appserviceuser',
    password: '1@Password',
  },
  
  // Sync configuration
  SYNC: {
    continuous: true,
    acceptSelfSignedCerts: false,
    // Collections to sync (will use default collection if others don't exist)
    collections: ['_default'],
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
  console.log('Cluster:', 'couchbasecluster');
  console.log('Bucket:', 'couchbase-app-bucket');
  
  // Validate that we have proper configuration
  if (!config.SYNC_GATEWAY_URL || config.SYNC_GATEWAY_URL.includes('xxxxxx')) {
    throw new Error(
      '❌ Capella configuration not set up. Please update src/config/capella.config.ts with your actual Capella credentials.'
    );
  }
  
  if (!config.AUTH.username || !config.AUTH.password) {
    throw new Error(
      '❌ Authentication credentials not configured. Please update username and password.'
    );
  }
  
  console.log('✅ Capella configuration validated successfully');
  console.log('✅ Ready for replication and sync with Capella');
  return config;
};