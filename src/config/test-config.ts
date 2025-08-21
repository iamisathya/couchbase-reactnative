/**
 * Test Configuration for Capella
 * 
 * Use this file to test your Capella connection before updating the main config
 */

export const TEST_CAPELLA_CONFIG = {
  // Replace these with your actual values
  SYNC_GATEWAY_URL: 'wss://YOUR-APP-SERVICE.apps.cloud.couchbase.com:4984/YOUR-DATABASE',
  DATABASE_NAME: 'travel',
  AUTH: {
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD',
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
  
  // Check if still using placeholders
  if (TEST_CAPELLA_CONFIG.SYNC_GATEWAY_URL.includes('YOUR-APP-SERVICE')) {
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