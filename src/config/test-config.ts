/**
 * Test Configuration for Capella
 * 
 * Use this file to test your Capella connection before updating the main config
 */

export const TEST_CAPELLA_CONFIG = {
  // Your actual Capella configuration
  SYNC_GATEWAY_URL: 'wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint',
  DATABASE_NAME: 'couchbase-app-bucket',
  AUTH: {
    username: 'appserviceuser',
    password: '1@Password',
  },
};

/**
 * Test your configuration here
 */
export const testCapellaConnection = () => {
  console.log('🧪 Testing Capella Configuration...');
  console.log('URL:', TEST_CAPELLA_CONFIG.SYNC_GATEWAY_URL);
  console.log('Username:', TEST_CAPELLA_CONFIG.AUTH.username);
  console.log('Database:', TEST_CAPELLA_CONFIG.DATABASE_NAME);
  
  // Check if configuration is properly set
  if (TEST_CAPELLA_CONFIG.SYNC_GATEWAY_URL.includes('YOUR-APP-SERVICE') || 
      TEST_CAPELLA_CONFIG.SYNC_GATEWAY_URL.includes('xxxxxx')) {
    console.error('❌ Please update the test configuration with your actual values');
    return false;
  }
  
  console.log('✅ Test configuration looks good!');
  return true;
};

/**
 * Instructions for updating the main config
 */
export const updateMainConfig = () => {
  console.log('📝 To update the main configuration:');
  console.log('1. Copy the values from TEST_CAPELLA_CONFIG');
  console.log('2. Paste them into src/config/capella.config.ts');
  console.log('3. Restart the app');
};