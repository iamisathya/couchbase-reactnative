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

  const fetchFromJSONPlaceholder = async () => {
    try {
      await SyncService.fetchFromJSONPlaceholder();
    } catch (error) {
      console.error('Fetch from JSONPlaceholder failed:', error);
      throw error;
    }
  };

  const syncFromCapella = async () => {
    try {
      await SyncService.syncFromCapella();
    } catch (error) {
      console.error('Sync from Capella failed:', error);
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

  const forceSyncDeletions = async () => {
    try {
      await SyncService.forceSyncDeletions();
    } catch (error) {
      console.error('Force sync deletions failed:', error);
      throw error;
    }
  };

  const fetchAndSyncToCapella = async () => {
    try {
      await SyncService.fetchAndSyncToCapella();
    } catch (error) {
      console.error('Fetch and sync to Capella failed:', error);
      throw error;
    }
  };

  const clearAllPosts = async () => {
    try {
      return await SyncService.clearAllPosts();
    } catch (error) {
      console.error('Clear all posts failed:', error);
      throw error;
    }
  };

  return {
    syncStatus,
    networkStatus,
    isOnline: NetworkService.isOnline(),
    fetchFromJSONPlaceholder,
    syncFromCapella,
    syncToCloud,
    manualSync,
    waitForNetworkAndSync,
    forceSyncDeletions,
    fetchAndSyncToCapella,
    clearAllPosts,
  };
};