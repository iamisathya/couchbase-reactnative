import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSync } from '../hooks/useSync';

interface SyncStatusBarProps {
  showDetails?: boolean;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ showDetails = false }) => {
  const { syncStatus, networkStatus, isOnline } = useSync();

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusText, { color: isOnline ? '#4CAF50' : '#F44336' }]}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </Text>
        
        {syncStatus.isSyncing && (
          <Text style={styles.syncText}>🔄 Syncing...</Text>
        )}
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          {syncStatus.lastSyncTime && (
            <Text style={styles.detailText}>
              Last sync: {syncStatus.lastSyncTime.toLocaleTimeString()}
            </Text>
          )}
          
          {syncStatus.error && (
            <Text style={[styles.detailText, styles.errorText]}>
              Error: {syncStatus.error}
            </Text>
          )}
          
          {networkStatus.type && (
            <Text style={styles.detailText}>
              Connection: {networkStatus.type}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncText: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  errorText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
});