import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const networkUtils = {
  /**
   * Check if the device is connected to the internet using NetInfo
   */
  async checkConnectivity(): Promise<boolean> {
    console.log('🌐 CHECKING CONNECTIVITY...');
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected === true && state.isInternetReachable === true;
      
      console.log('📊 CONNECTIVITY STATUS:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        overallStatus: isConnected ? 'CONNECTED' : 'DISCONNECTED',
        timestamp: new Date().toISOString(),
      });
      
      return isConnected;
    } catch (error) {
      console.warn('⚠️ NetInfo connectivity check failed:', error);
      // Fallback to basic connectivity check
      try {
        console.log('🔄 FALLBACK: Using basic connectivity check...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const isConnected = response.ok;
        console.log('📊 FALLBACK CONNECTIVITY RESULT:', {
          status: response.status,
          ok: response.ok,
          isConnected,
        });
        return isConnected;
      } catch (fallbackError) {
        console.warn('❌ Fallback connectivity check failed:', fallbackError);
        return false;
      }
    }
  },

  /**
   * Get detailed network information
   */
  async getNetworkInfo() {
    console.log('📡 GETTING NETWORK INFO...');
    try {
      const state = await NetInfo.fetch();
      const networkInfo = {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        details: state.details,
        platform: Platform.OS,
        isSimulator: __DEV__,
      };
      
      console.log('📊 NETWORK INFO:', {
        ...networkInfo,
        timestamp: new Date().toISOString(),
        details: state.details ? JSON.stringify(state.details) : 'null',
      });
      
      return networkInfo;
    } catch (error) {
      console.warn('❌ Failed to get network info:', error);
      const fallbackInfo = {
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
        isWifi: false,
        isCellular: false,
        details: null,
        platform: Platform.OS,
        isSimulator: __DEV__,
      };
      
      console.log('📊 FALLBACK NETWORK INFO:', {
        ...fallbackInfo,
        timestamp: new Date().toISOString(),
      });
      
      return fallbackInfo;
    }
  },

  /**
   * Get platform-specific network info
   */
  getPlatformInfo() {
    const platformInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      isSimulator: __DEV__,
    };
    
    console.log('📱 PLATFORM INFO:', {
      ...platformInfo,
      timestamp: new Date().toISOString(),
    });
    
    return platformInfo;
  },

  /**
   * Log network configuration for debugging
   */
  async logNetworkConfig() {
    console.log('🔧 LOGGING NETWORK CONFIGURATION...');
    const networkInfo = await this.getNetworkInfo();
    console.log('📊 NETWORK CONFIGURATION:', {
      ...networkInfo,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Get recommended timeout based on platform and network conditions
   */
  async getRecommendedTimeout(): Promise<number> {
    console.log('⏱️ CALCULATING RECOMMENDED TIMEOUT...');
    try {
      const networkInfo = await this.getNetworkInfo();
      let timeout: number;
      
      // Simulator typically has faster network
      if (__DEV__) {
        timeout = 10000; // 10 seconds for development
        console.log('🖥️ DEVELOPMENT MODE: Using 10s timeout');
      } else {
        // Adjust timeout based on network type
        if (networkInfo.isCellular) {
          timeout = 20000; // 20 seconds for cellular (slower)
          console.log('📱 CELLULAR NETWORK: Using 20s timeout');
        } else if (networkInfo.isWifi) {
          timeout = 15000; // 15 seconds for WiFi
          console.log('📶 WIFI NETWORK: Using 15s timeout');
        } else {
          timeout = 25000; // 25 seconds for unknown/weak connections
          console.log('❓ UNKNOWN/WEAK NETWORK: Using 25s timeout');
        }
      }
      
      console.log('⏱️ RECOMMENDED TIMEOUT:', {
        timeout: timeout + 'ms',
        networkType: networkInfo.type,
        isDev: __DEV__,
        timestamp: new Date().toISOString(),
      });
      
      return timeout;
    } catch (error) {
      console.warn('⚠️ Failed to get network info for timeout, using default:', error);
      const defaultTimeout = __DEV__ ? 10000 : 15000;
      console.log('⏱️ DEFAULT TIMEOUT:', {
        timeout: defaultTimeout + 'ms',
        reason: 'Network info fetch failed',
        timestamp: new Date().toISOString(),
      });
      return defaultTimeout;
    }
  },

  /**
   * Monitor network state changes
   */
  addNetworkListener(callback: (state: any) => void) {
    console.log('👂 SETTING UP NETWORK LISTENER...');
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('📡 NETWORK STATE CHANGED:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        timestamp: new Date().toISOString(),
      });
      callback(state);
    });
    
    console.log('✅ NETWORK LISTENER SETUP COMPLETE');
    return unsubscribe;
  },

  /**
   * Check if network is stable enough for API calls
   */
  async isNetworkStable(): Promise<boolean> {
    console.log('🔍 CHECKING NETWORK STABILITY...');
    try {
      const networkInfo = await this.getNetworkInfo();
      
      // Consider network stable if connected and internet reachable
      if (!networkInfo.isConnected || !networkInfo.isInternetReachable) {
        console.log('❌ NETWORK UNSTABLE:', {
          reason: 'Not connected or no internet',
          isConnected: networkInfo.isConnected,
          isInternetReachable: networkInfo.isInternetReachable,
        });
        return false;
      }

      // Additional checks for cellular networks
      if (networkInfo.isCellular && networkInfo.details) {
        const cellularDetails = networkInfo.details as any;
        // Check for poor signal strength
        if (cellularDetails.cellularGeneration === '2g') {
          console.log('❌ NETWORK UNSTABLE:', {
            reason: '2G cellular network too slow',
            generation: cellularDetails.cellularGeneration,
          });
          return false; // 2G is too slow for reliable API calls
        }
      }

      console.log('✅ NETWORK STABLE:', {
        type: networkInfo.type,
        isConnected: networkInfo.isConnected,
        isInternetReachable: networkInfo.isInternetReachable,
      });
      return true;
    } catch (error) {
      console.warn('❌ Failed to check network stability:', error);
      return false;
    }
  },

  /**
   * Wait for network to become available
   */
  async waitForNetwork(timeoutMs: number = 30000): Promise<boolean> {
    console.log('⏳ WAITING FOR NETWORK...', {
      timeout: timeoutMs + 'ms',
      startTime: new Date().toISOString(),
    });
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await this.isNetworkStable()) {
        const elapsed = Date.now() - startTime;
        console.log('✅ NETWORK BECAME AVAILABLE:', {
          elapsed: elapsed + 'ms',
          timestamp: new Date().toISOString(),
        });
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    
    console.log('⏰ NETWORK WAIT TIMEOUT:', {
      timeout: timeoutMs + 'ms',
      elapsed: Date.now() - startTime + 'ms',
      timestamp: new Date().toISOString(),
    });
    return false;
  },
};
