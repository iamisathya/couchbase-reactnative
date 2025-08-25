import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

class NetworkService {
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private currentStatus: NetworkStatus = {
    isConnected: false,
    isInternetReachable: null,
    type: null,
  };

  constructor() {
    // Network monitoring disabled
    // this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring() {
    // Get initial network state
    // NetInfo.fetch().then(this.handleNetworkChange);

    // Listen for network changes
    // NetInfo.addEventListener(this.handleNetworkChange);
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: any) => {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type ?? null,
    };

    this.currentStatus = newStatus;
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      listener(newStatus);
    });

    // Enhanced logging for debugging
    console.log('🌐 Network Status Update:', {
      isConnected: newStatus.isConnected,
      isInternetReachable: newStatus.isInternetReachable,
      type: newStatus.type,
      isOnline: this.isOnline(),
      isInternetReachableStrict: this.isInternetReachable()
    });
  };

  /**
   * Add a network status listener
   */
  public addListener(listener: (status: NetworkStatus) => void) {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.currentStatus);
  }

  /**
   * Remove a network status listener
   */
  public removeListener(listener: (status: NetworkStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Get current network status
   */
  public getCurrentStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    // Network monitoring disabled - always return true
    return true;
  }

  /**
   * Check if internet is reachable (more strict check)
   */
  public isInternetReachable(): boolean {
    // Network monitoring disabled - always return true
    return true;
  }

  /**
   * Wait for network to be available
   */
  public async waitForNetwork(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        this.removeListener(checkListener);
        resolve(false);
      }, timeout);

      const checkListener = (status: NetworkStatus) => {
        if (status.isConnected) {
          clearTimeout(timeoutId);
          this.removeListener(checkListener);
          resolve(true);
        }
      };

      this.addListener(checkListener);
    });
  }

  /**
   * Test internet connectivity by making a simple HTTP request
   */
  public async testInternetConnectivity(): Promise<boolean> {
    try {
      console.log('🧪 Testing internet connectivity...');
      
      // Try to fetch a simple resource
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        timeout: 5000,
      });
      
      const isConnected = response.ok;
      console.log('🧪 Internet connectivity test result:', isConnected);
      
      return isConnected;
    } catch (error) {
      console.log('🧪 Internet connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Get detailed network information for debugging
   */
  public async getDetailedNetworkInfo(): Promise<any> {
    try {
      const netInfo = await NetInfo.fetch();
      const connectivityTest = await this.testInternetConnectivity();
      
      const detailedInfo = {
        netInfo,
        connectivityTest,
        isOnline: this.isOnline(),
        isInternetReachable: this.isInternetReachable(),
        timestamp: new Date().toISOString(),
      };
      
      console.log('🔍 Detailed Network Info:', detailedInfo);
      return detailedInfo;
    } catch (error) {
      console.error('🔍 Failed to get detailed network info:', error);
      return null;
    }
  }

  /**
   * Clean up network monitoring
   */
  public cleanup() {
    // Network monitoring disabled
    // NetInfo.removeEventListener(this.handleNetworkChange);
    this.listeners = [];
  }
}

export default new NetworkService();