import AxiosService from './AxiosService';
import { useDatabase } from '../../DatabaseProvider';
import NetworkService, { NetworkStatus } from './NetworkService';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  pendingChanges: number;
}

class SyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    pendingChanges: 0,
  };
  private listeners: Array<(status: SyncStatus) => void> = [];
  private dbService: any = null;

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Set database service reference
   */
  public setDatabaseService(dbService: any) {
    this.dbService = dbService;
  }

  /**
   * Initialize network listener for automatic sync
   */
  private initializeNetworkListener() {
    NetworkService.addListener((status: NetworkStatus) => {
      if (status.isConnected && status.isInternetReachable) {
        // Network is back online, trigger sync
        this.syncFromCloud();
      }
    });
  }

  /**
   * Add sync status listener
   */
  public addListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.syncStatus);
  }

  /**
   * Remove sync status listener
   */
  public removeListener(listener: (status: SyncStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Update sync status and notify listeners
   */
  private updateSyncStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => {
      listener(this.syncStatus);
    });
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Fetch posts from JSONPlaceholder API and sync to local database
   */
  public async syncFromCloud(): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    if (!NetworkService.isOnline()) {
      console.log('Network offline, skipping cloud sync');
      return;
    }

    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      console.log('🔄 Starting cloud sync...');

      // Fetch multiple posts from JSONPlaceholder
      const posts = await this.fetchPostsFromAPI();
      
      // Save posts to local database
      let savedCount = 0;
      for (const post of posts) {
        try {
          await this.dbService.savePost({
            userId: post.userId.toString(),
            id: post.id.toString(),
            title: post.title,
            body: post.body,
          });
          savedCount++;
        } catch (error) {
          console.error(`Failed to save post ${post.id}:`, error);
        }
      }

      this.updateSyncStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });

      console.log(`✅ Cloud sync completed. Saved ${savedCount} posts.`);
    } catch (error) {
      console.error('❌ Cloud sync failed:', error);
      this.updateSyncStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Fetch posts from JSONPlaceholder API
   */
  private async fetchPostsFromAPI(): Promise<any[]> {
    try {
      // Fetch multiple posts (1-10) for demonstration
      const posts = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const post = await AxiosService.getRandomPost();
          posts.push(post);
        } catch (error) {
          console.error(`Failed to fetch post ${i}:`, error);
        }
      }
      return posts;
    } catch (error) {
      console.error('Failed to fetch posts from API:', error);
      throw error;
    }
  }

  /**
   * Sync local changes to cloud when online
   */
  public async syncToCloud(): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    if (!NetworkService.isOnline()) {
      console.log('Network offline, local changes will sync when online');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      console.log('🔄 Syncing local changes to cloud...');

      // Trigger Couchbase replicator sync
      await this.dbService.triggerSync();

      this.updateSyncStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });

      console.log('✅ Local changes synced to cloud.');
    } catch (error) {
      console.error('❌ Failed to sync to cloud:', error);
      this.updateSyncStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Manual sync - fetch from cloud and sync to cloud
   */
  public async manualSync(): Promise<void> {
    try {
      await this.syncFromCloud();
      await this.syncToCloud();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }

  /**
   * Wait for network and then sync
   */
  public async waitForNetworkAndSync(timeout: number = 30000): Promise<boolean> {
    const networkAvailable = await NetworkService.waitForNetwork(timeout);
    if (networkAvailable) {
      await this.manualSync();
      return true;
    }
    return false;
  }

  /**
   * Get pending changes count
   */
  public async getPendingChangesCount(): Promise<number> {
    // This would typically check the replicator status
    // For now, we'll return 0 as a placeholder
    return 0;
  }

  /**
   * Clean up sync service
   */
  public cleanup() {
    NetworkService.removeListener(this.initializeNetworkListener);
    this.listeners = [];
  }
}

export default new SyncService();