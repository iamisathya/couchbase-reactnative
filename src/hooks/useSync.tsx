import { useEffect, useState } from 'react';
import SyncService, { SyncStatus } from '../services/SyncService';
import NetworkService, { NetworkStatus } from '../services/NetworkService';
import { useDatabase } from '../../DatabaseProvider';

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncService.getSyncStatus());
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(NetworkService.getCurrentStatus());
  const dbService = useDatabase();

  useEffect(() => {
    // Set database service reference
    SyncService.setDatabaseService(dbService);

    // Add listeners
    const syncListener = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    const networkListener = (status: NetworkStatus) => {
      setNetworkStatus(status);
    };

    SyncService.addListener(syncListener);
    NetworkService.addListener(networkListener);

    // Cleanup
    return () => {
      SyncService.removeListener(syncListener);
      NetworkService.removeListener(networkListener);
    };
  }, [dbService]);

  const syncFromCloud = async () => {
    try {
      await SyncService.syncFromCloud();
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      throw error;
    }
  };

  const syncToCloud = async () => {
    try {
      await SyncService.syncToCloud();
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      throw error;
    }
  };

  const manualSync = async () => {
    try {
      await SyncService.manualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  };

  const waitForNetworkAndSync = async (timeout?: number) => {
    try {
      return await SyncService.waitForNetworkAndSync(timeout);
    } catch (error) {
      console.error('Wait for network and sync failed:', error);
      throw error;
    }
  };

  return {
    syncStatus,
    networkStatus,
    isOnline: NetworkService.isOnline(),
    syncFromCloud,
    syncToCloud,
    manualSync,
    waitForNetworkAndSync,
  };
};