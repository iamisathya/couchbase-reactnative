/**
 * Couchbase Capella Setup Verification
 * 
 * This script helps verify that your Capella configuration is working correctly.
 */

import { getCapellaConfig } from './capella.config';
import NetworkService from '../services/NetworkService';

export const verifyCapellaSetup = async () => {
  console.log('🔍 Verifying Couchbase Capella Setup...');
  console.log('=====================================');
  
  try {
    // 1. Validate Configuration
    console.log('1️⃣ Validating configuration...');
    const config = getCapellaConfig();
    console.log('✅ Configuration validated');
    
    // 2. Check Network Status
    console.log('2️⃣ Checking network status...');
    const networkStatus = NetworkService.getCurrentStatus();
    console.log('Network Status:', {
      isConnected: networkStatus.isConnected,
      isInternetReachable: networkStatus.isInternetReachable,
      type: networkStatus.type,
      isOnline: NetworkService.isOnline()
    });
    
    if (!NetworkService.isOnline()) {
      console.log('⚠️ Network is offline - sync operations may not work');
    } else {
      console.log('✅ Network is online');
    }
    
    // 3. Test Internet Connectivity
    console.log('3️⃣ Testing internet connectivity...');
    const connectivityTest = await NetworkService.testInternetConnectivity();
    console.log('Internet Connectivity Test:', connectivityTest ? '✅ PASSED' : '❌ FAILED');
    
    // 4. Get Detailed Network Info
    console.log('4️⃣ Getting detailed network information...');
    const detailedInfo = await NetworkService.getDetailedNetworkInfo();
    console.log('Detailed Network Info:', detailedInfo);
    
    // 5. Configuration Summary
    console.log('5️⃣ Configuration Summary:');
    console.log('   Cluster: couchbasecluster');
    console.log('   Bucket: couchbase-app-bucket');
    console.log('   App Service: couchbase-app-service');
    console.log('   Endpoint: couchbase-app-endpoint');
    console.log('   User: appserviceuser');
    console.log('   URL: wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint');
    
    console.log('=====================================');
    console.log('✅ Capella setup verification completed');
    
    if (connectivityTest && NetworkService.isOnline()) {
      console.log('🎉 Your setup is ready for sync operations!');
    } else {
      console.log('⚠️ Some issues detected - check network connectivity');
    }
    
    return {
      configValid: true,
      networkOnline: NetworkService.isOnline(),
      internetReachable: connectivityTest,
      detailedInfo
    };
    
  } catch (error) {
    console.error('❌ Setup verification failed:', error);
    return {
      configValid: false,
      networkOnline: NetworkService.isOnline(),
      internetReachable: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Quick setup check
 */
export const quickSetupCheck = () => {
  console.log('🔍 Quick Setup Check...');
  
  try {
    const config = getCapellaConfig();
    const isOnline = NetworkService.isOnline();
    
    console.log('Configuration:', config.SYNC_GATEWAY_URL ? '✅ Valid' : '❌ Invalid');
    console.log('Network:', isOnline ? '✅ Online' : '❌ Offline');
    
    return {
      configValid: !!config.SYNC_GATEWAY_URL,
      networkOnline: isOnline
    };
  } catch (error) {
    console.error('Quick check failed:', error);
    return {
      configValid: false,
      networkOnline: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};