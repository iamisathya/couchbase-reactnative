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
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring() {
    // Get initial network state
    NetInfo.fetch().then(this.handleNetworkChange);

    // Listen for network changes
    NetInfo.addEventListener(this.handleNetworkChange);
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

    console.log('Network Status:', newStatus);
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
    return this.currentStatus.isConnected && 
           (this.currentStatus.isInternetReachable === null || this.currentStatus.isInternetReachable);
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
        if (status.isConnected && 
            (status.isInternetReachable === null || status.isInternetReachable)) {
          clearTimeout(timeoutId);
          this.removeListener(checkListener);
          resolve(true);
        }
      };

      this.addListener(checkListener);
    });
  }

  /**
   * Clean up network monitoring
   */
  public cleanup() {
    NetInfo.removeEventListener(this.handleNetworkChange);
    this.listeners = [];
  }
}

export default new NetworkService();