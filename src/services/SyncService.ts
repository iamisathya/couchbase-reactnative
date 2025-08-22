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
   * Fetch posts from JSONPlaceholder API and save to local database
   */
  public async fetchFromJSONPlaceholder(): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    if (!NetworkService.isOnline()) {
      console.log('Network offline, skipping JSONPlaceholder fetch');
      return;
    }

    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      console.log('🔄 Fetching posts from JSONPlaceholder...');

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

      console.log(`✅ JSONPlaceholder fetch completed. Saved ${savedCount} posts.`);
    } catch (error) {
      console.error('❌ JSONPlaceholder fetch failed:', error);
      this.updateSyncStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Sync data from Capella cloud database to local database
   */
  public async syncFromCapella(): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    if (!NetworkService.isOnline()) {
      console.log('Network offline, skipping Capella sync');
      return;
    }

    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      console.log('🔄 Syncing from Capella cloud...');

      // Trigger Couchbase replicator to pull from cloud
      await this.dbService.triggerSync();

      this.updateSyncStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });

      console.log('✅ Capella sync completed.');
    } catch (error) {
      console.error('❌ Capella sync failed:', error);
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
   * Force sync deletions to cloud
   */
  public async forceSyncDeletions(): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    if (!NetworkService.isOnline()) {
      console.log('Network offline, cannot sync deletions');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      console.log('🗑️ Force syncing deletions to cloud...');

      // Try to ensure replicator is running
      try {
        console.log('🔄 Ensuring replicator is running...');
        await this.dbService.triggerSimpleSync();
        
        // Wait a moment for connection
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log('⚠️ Failed to start replicator, proceeding anyway:', error);
      }

      // Force sync deletions
      await this.dbService.forceSyncDeletions();

      this.updateSyncStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });

      console.log('✅ Deletions synced to cloud.');
    } catch (error) {
      console.error('❌ Failed to sync deletions to cloud:', error);
      this.updateSyncStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Manual sync - sync from Capella and sync to Capella
   */
  public async manualSync(): Promise<void> {
    try {
      await this.syncFromCapella();
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
   * Fetch from JSONPlaceholder and sync to Capella
   */
  public async fetchAndSyncToCapella(): Promise<void> {
    try {
      await this.fetchFromJSONPlaceholder();
      
      // Use simple sync for this operation to avoid timeout issues
      if (!this.dbService) {
        throw new Error('Database service not initialized');
      }

      if (!NetworkService.isOnline()) {
        console.log('Network offline, will sync when online');
        return;
      }

      try {
        this.updateSyncStatus({ isSyncing: true, error: null });
        console.log('🔄 Triggering simple sync to Capella...');

        // Use simple sync instead of waiting for completion
        await this.dbService.triggerSimpleSync();

        this.updateSyncStatus({
          isSyncing: false,
          lastSyncTime: new Date(),
          error: null,
        });

        console.log('✅ Fetch and sync to Capella completed.');
      } catch (error) {
        console.error('❌ Failed to sync to Capella:', error);
        this.updateSyncStatus({
          isSyncing: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't throw error here, just log it
        console.log('⚠️ Sync failed but fetch was successful');
      }
    } catch (error) {
      console.error('Fetch and sync to Capella failed:', error);
      throw error;
    }
  }

  /**
   * Clear all posts from local database and sync deletions to Capella
   */
  public async clearAllPosts(): Promise<number> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    if (!NetworkService.isOnline()) {
      console.log('Network offline, clearing local posts only');
      // Still clear locally even if offline
      return await this.dbService.deleteAllPosts();
    }

    try {
      this.updateSyncStatus({ isSyncing: true, error: null });
      console.log('🗑️ Clearing all posts...');

      // Delete all posts from local database
      const deletedCount = await this.dbService.deleteAllPosts();

      // Force sync deletions to cloud
      await this.forceSyncDeletions();

      this.updateSyncStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });

      console.log(`✅ Cleared ${deletedCount} posts from local and cloud databases`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to clear all posts:', error);
      this.updateSyncStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
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