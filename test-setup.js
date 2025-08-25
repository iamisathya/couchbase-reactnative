/**
 * Simple test script to verify Capella configuration
 * Run this to check if your setup is working
 */

const { getCapellaConfig, validateCapellaConfig } = require('./src/config/capella.config.ts');

console.log('🧪 Testing Capella Configuration...\n');

try {
  // Test configuration
  const config = getCapellaConfig();
  console.log('✅ Configuration loaded successfully');
  console.log('📡 Sync Gateway URL:', config.SYNC_GATEWAY_URL);
  console.log('👤 Username:', config.AUTH.username);
  console.log('🗄️ Database:', config.DATABASE_NAME);
  
  // Validate configuration
  validateCapellaConfig();
  console.log('\n🎉 All tests passed! Your app should work correctly.');
  
} catch (error) {
  console.error('❌ Configuration test failed:', error.message);
  console.log('\n🔧 Please check your Capella configuration in src/config/capella.config.ts');
}

console.log('\n📱 To test the app:');
console.log('1. Run: npm run android');
console.log('2. Go to Home tab');
console.log('3. Click "Fetch Random Post"');
console.log('4. Click "Add to Couchbase"');
console.log('5. Go to List tab to see the post');