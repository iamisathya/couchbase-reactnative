import { AppState, AppStateStatus } from 'react-native';
import { networkUtils } from './networkUtils';
import AxiosService from '../services/AxiosService';

class AppStateManager {
  private appState: AppStateStatus = AppState.currentState;
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) {
      console.log('🔄 AppStateManager already initialized');
      return;
    }

    console.log('🚀 Initializing AppStateManager...');
    
    // Listen for app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Initial network check
    this.checkNetworkOnAppStart();
    
    this.isInitialized = true;
    console.log('✅ AppStateManager initialized');
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log('📱 APP STATE CHANGE:', {
      from: this.appState,
      to: nextAppState,
      timestamp: new Date().toISOString(),
    });

    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('📱 APP FOREGROUNDED: Checking network and resetting services...');
      await this.handleAppForeground();
    } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to the background
      console.log('📱 APP BACKGROUNDED: Cleaning up...');
      await this.handleAppBackground();
    }

    this.appState = nextAppState;
  };

  private async handleAppForeground() {
    try {
      // Wait a bit for network to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check network connectivity
      const isConnected = await networkUtils.checkConnectivity();
      console.log('🌐 NETWORK CHECK ON FOREGROUND:', {
        isConnected,
        timestamp: new Date().toISOString(),
      });

      if (!isConnected) {
        console.log('⚠️ No network on foreground, waiting for network...');
        const networkAvailable = await networkUtils.waitForNetwork(10000); // Wait 10 seconds
        if (!networkAvailable) {
          console.log('❌ Network not available after waiting');
          return;
        }
      }

      // Reset and reinitialize AxiosService
      console.log('🔄 Resetting AxiosService on app foreground...');
      await AxiosService.reinitialize();
      
      console.log('✅ App foreground handling completed');
    } catch (error) {
      console.error('❌ Error handling app foreground:', error);
    }
  }

  private async handleAppBackground() {
    try {
      // Clear pending requests
      AxiosService.clearPendingRequests();
      console.log('🧹 Cleared pending requests on app background');
    } catch (error) {
      console.error('❌ Error handling app background:', error);
    }
  }

  private async checkNetworkOnAppStart() {
    try {
      console.log('🚀 CHECKING NETWORK ON APP START...');
      
      // Wait for network to be ready
      const networkAvailable = await networkUtils.waitForNetwork(5000); // Wait 5 seconds
      
      if (networkAvailable) {
        console.log('✅ Network available on app start');
      } else {
        console.log('⚠️ Network not immediately available on app start');
      }
    } catch (error) {
      console.error('❌ Error checking network on app start:', error);
    }
  }

  cleanup() {
    if (!this.isInitialized) {
      return;
    }

    console.log('🧹 Cleaning up AppStateManager...');
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.isInitialized = false;
    console.log('✅ AppStateManager cleanup completed');
  }

  // Method to force network check and service reset
  async forceNetworkCheck() {
    console.log('🔍 FORCE NETWORK CHECK...');
    try {
      const isConnected = await networkUtils.checkConnectivity();
      const networkInfo = await networkUtils.getNetworkInfo();
      
      console.log('📊 FORCE NETWORK CHECK RESULTS:', {
        isConnected,
        networkInfo,
        timestamp: new Date().toISOString(),
      });

      if (isConnected) {
        await AxiosService.reinitialize();
        console.log('✅ Force network check completed successfully');
      } else {
        console.log('❌ No network available for force check');
      }
    } catch (error) {
      console.error('❌ Error during force network check:', error);
    }
  }
}

export default new AppStateManager();


