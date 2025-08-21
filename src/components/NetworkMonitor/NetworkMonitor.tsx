import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { networkUtils } from '../../utils/networkUtils';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

export const NetworkMonitor: React.FC = () => {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('🖥️ NETWORK MONITOR: Component mounted');
    
    const updateNetworkState = async () => {
      console.log('📡 NETWORK MONITOR: Updating network state...');
      const info = await networkUtils.getNetworkInfo();
      console.log('📊 NETWORK MONITOR: Network state updated:', {
        isConnected: info.isConnected,
        isInternetReachable: info.isInternetReachable,
        type: info.type,
        timestamp: new Date().toISOString(),
      });
      setNetworkState({
        isConnected: info.isConnected || false,
        isInternetReachable: info.isInternetReachable || false,
        type: info.type,
        isWifi: info.isWifi,
        isCellular: info.isCellular,
      });
    };

    // Initial check
    updateNetworkState();

    // Set up network listener
    console.log('👂 NETWORK MONITOR: Setting up network listener...');
    const unsubscribe = networkUtils.addNetworkListener((state) => {
      console.log('📡 NETWORK MONITOR: Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        timestamp: new Date().toISOString(),
      });
      
      const newNetworkState = {
        isConnected: state.isConnected || false,
        isInternetReachable: state.isInternetReachable || false,
        type: state.type || 'unknown',
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      };
      
      setNetworkState(newNetworkState);
      
      // Show monitor for 5 seconds on network changes
      console.log('👁️ NETWORK MONITOR: Making monitor visible due to network change');
      setIsVisible(true);
    });

    // Show monitor for 5 seconds on network changes
    setIsVisible(true);
    const timer = setTimeout(() => {
      console.log('👁️ NETWORK MONITOR: Hiding monitor after 5 seconds');
      setIsVisible(false);
    }, 5000);

    return () => {
      console.log('🖥️ NETWORK MONITOR: Component unmounting, cleaning up...');
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (!isVisible || !networkState) {
    console.log('👁️ NETWORK MONITOR: Not rendering (not visible or no state)');
    return null;
  }

  const getStatusColor = () => {
    if (networkState.isConnected && networkState.isInternetReachable) {
      return '#4CAF50'; // Green
    } else if (networkState.isConnected) {
      return '#FF9800'; // Orange
    } else {
      return '#F44336'; // Red
    }
  };

  const getStatusText = () => {
    if (networkState.isConnected && networkState.isInternetReachable) {
      return 'Connected';
    } else if (networkState.isConnected) {
      return 'Connected (No Internet)';
    } else {
      return 'Disconnected';
    }
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();
  
  console.log('🎨 NETWORK MONITOR: Rendering with status:', {
    statusText,
    statusColor,
    networkType: networkState.type,
    timestamp: new Date().toISOString(),
  });

  return (
    <View style={[styles.container, { backgroundColor: statusColor }]}>
      <Text style={styles.text}>
        Network: {statusText} ({networkState.type})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
