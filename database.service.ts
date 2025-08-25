import {
  BasicAuthenticator,
  CblReactNativeEngine,
  Collection,
  Database,
  DatabaseConfiguration,
  FileSystem,
  FullTextIndexItem,
  IndexBuilder,
  LogDomain,
  LogLevel,
  MutableDocument,
  Replicator,
  ReplicatorConfiguration,
  ReplicatorType,
  URLEndpoint,
  ValueIndexItem,
  ReplicatorStatus,
  ReplicatorActivityLevel,
} from 'cbl-reactnative';
import { getCapellaConfig, validateCapellaConfig } from './src/config/capella.config';

/**
 * Service class for managing the database and its replication.
 */
export class DatabaseService {
  private database: Database | undefined;
  private replicator: Replicator | undefined;
  private engine: CblReactNativeEngine | undefined;
  private postCollection: Collection | null = null;
  private syncStatus: ReplicatorStatus | null = null;
  private isOnline: boolean = false;
  private syncListeners: Array<(status: ReplicatorStatus) => void> = [];

  constructor() {
    //must create a new engine to use the SDK in a React Native environment
    //this must only be done once for the entire app.  This will be implemented as singleton, so it's Ok here.
    this.engine = new CblReactNativeEngine();
  }

  /**
   * Add a listener for sync status changes
   */
  public addSyncListener(listener: (status: ReplicatorStatus) => void) {
    this.syncListeners.push(listener);
  }

  /**
   * Remove a sync status listener
   */
  public removeSyncListener(listener: (status: ReplicatorStatus) => void) {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): ReplicatorStatus | null {
    return this.syncStatus;
  }

  /**
   * Check if the app is currently online and syncing
   */
  public isOnlineAndSyncing(): boolean {
    return this.isOnline && this.syncStatus?.activity === ReplicatorActivityLevel.IDLE;
  }

  /**
   * Manually trigger a sync
   */
  public async triggerSync(): Promise<void> {
    if (this.replicator) {
      console.log('🔄 Triggering manual sync...');
      await this.replicator.start(true);
      
      // Wait for sync to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Sync timeout reached');
          reject(new Error('Sync timeout - operation took too long'));
        }, 30000); // 30 second timeout
        
        const checkStatus = () => {
          console.log('🔍 Checking sync status:', {
            activity: this.syncStatus?.activity,
            hasError: !!this.syncStatus?.error,
            errorMessage: this.syncStatus?.error?.message || 'No error message'
          });
          
          if (this.syncStatus?.activity === ReplicatorActivityLevel.IDLE) {
            clearTimeout(timeout);
            console.log('✅ Manual sync completed successfully');
            resolve();
          } else if (this.syncStatus?.error) {
            clearTimeout(timeout);
            const errorMessage = this.syncStatus.error.message || 'Unknown sync error';
            console.error('❌ Sync failed with error:', errorMessage);
            reject(new Error(`Sync failed: ${errorMessage}`));
          } else if (this.syncStatus?.activity === ReplicatorActivityLevel.OFFLINE) {
            clearTimeout(timeout);
            console.error('❌ Sync failed: Replicator is offline');
            reject(new Error('Sync failed: Replicator is offline'));
          } else {
            // Continue checking
            setTimeout(checkStatus, 1000); // Check every 1 second
          }
        };
        
        // Start checking after a short delay
        setTimeout(checkStatus, 1000);
      });
    } else {
      throw new Error('Replicator not initialized');
    }
  }

  /**
   * Force sync deletions to cloud
   */
  public async forceSyncDeletions(): Promise<void> {
    if (this.replicator) {
      console.log('🗑️ Force syncing deletions to cloud...');
      await this.replicator.start(true);
      console.log('✅ Force sync deletions completed');
    } else {
      throw new Error('Replicator not initialized');
    }
  }

  /**
   * Stop the replicator
   */
  public async stopSync(): Promise<void> {
    if (this.replicator) {
      await this.replicator.stop();
    }
  }

  /**
   * Simple sync trigger without waiting for completion
   */
  public async triggerSimpleSync(): Promise<void> {
    if (this.replicator) {
      console.log('🔄 Triggering simple sync (no wait)...');
      await this.replicator.start(true);
      console.log('✅ Simple sync triggered successfully');
    } else {
      throw new Error('Replicator not initialized');
    }
  }

  /**
   * returns type of activities in the default collection
   */
  public async getActivities() {
    const queryStr =
      'SELECT DISTINCT type FROM _default._default as doc WHERE doc.type IS NOT MISSING';
    return this.database?.createQuery(queryStr).execute();
  }

  /**
   * Retrieves the collections from the database.
   *
   * This function fetches only the default collection to ensure all collections
   * are from the same database and scope.
   *
   * @returns {Promise<Collection[]>} A promise that resolves to an array of `Collection` objects.
   * @throws Will throw an error if the database is not initialized.
   */
  private async getCollections(): Promise<Collection[]> {
    const collections: Collection[] = [];
    
    // Create or get social.posts collection for posts
    try {
      const postsCollection = await this.database?.createCollection('posts', 'social');
      if (postsCollection) {
        collections.push(postsCollection);
        console.log('✅ Using social.posts collection for sync');
      } else {
        console.error('❌ social.posts collection is null');
      }
    } catch (error) {
      console.error('❌ Failed to create/get social.posts collection:', error);
    }
    
    console.log(`📦 Total collections for sync: ${collections.length}:`, collections.map(c => c.name));
    return collections;
  }

  /**
   * returns an array of ResultSet objects for the posts that match the search term in the default collection
   * @param searchTerm
   */
  public async getPostsBySearchTerm(searchTerm: string) {
    const queryStr = `SELECT * FROM social.posts as doc WHERE doc.type = 'post' AND (doc.title LIKE '%${searchTerm}%' OR doc.body LIKE '%${searchTerm}%')`;
    return this.database?.createQuery(queryStr).execute();
  }

  /**
   * returns all posts in the default collection
   */
  public async getAllPosts() {
    try {
      const queryStr = 'SELECT * FROM social.posts as doc WHERE doc.type = "post"';
      return this.database?.createQuery(queryStr).execute();
    } catch (error) {
      console.debug(`Error: ${error}`);
      throw error;
    }
  }

    /**
   * returns all posts from the default collection
   */
  public async getPosts() {
    try {
      const queryStr = `
        SELECT 
          doc.*, 
          meta().id AS docId 
        FROM social.posts AS doc
        WHERE doc.type = 'post'
      `;
      return await this.database?.createQuery(queryStr).execute();
    } catch (error) {
      console.debug(`Error: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a post from the default collection
   */
  public async deletePost(docId: string) {
    try {
      const postCollection = await this.getPostCollection();
      if (!postCollection) throw new Error('No collection available for deleting posts');

      // Get the document first
      const existingDoc = await postCollection.getDocument(docId);
      if (!existingDoc) {
        throw new Error(`Document with ID ${docId} not found`);
      }

      // Delete the document (this creates a tombstone for sync)
      await postCollection.deleteDocument(existingDoc);
      console.log(`✅ Post document ${docId} deleted successfully.`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete post ${docId}:`, error);
      throw error;
    }
  }

  public async deletePostById(postId: string) {
    try {
      const postCollection = await this.getPostCollection();
      if (!postCollection) throw new Error('No collection available for deleting posts');

      // Query to find the document by post ID
      const queryStr = `SELECT meta().id as docId FROM social.posts WHERE type = 'post' AND id = '${postId}'`;
      const result = await this.database?.createQuery(queryStr).execute();
      if (result && result.length > 0) {
        const docId = result[0].docId;
        return await this.deletePost(docId);
      }
      
      throw new Error(`Post with ID ${postId} not found`);
    } catch (error) {
      console.error(`❌ Failed to delete post by ID ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all posts from the default collection
   */
  public async deleteAllPosts(): Promise<number> {
    try {
      const postCollection = await this.getPostCollection();
      if (!postCollection) throw new Error('No collection available for deleting posts');

      // Query to find all post documents
      const queryStr = `SELECT meta().id as docId FROM social.posts WHERE type = 'post'`;
      const result = await this.database?.createQuery(queryStr).execute();
      let deletedCount = 0;
      
      if (result && result.length > 0) {
        for (const item of result) {
          try {
            await this.deletePost(item.docId);
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete post ${item.docId}:`, error);
          }
        }
      }
      
      console.log(`✅ Deleted ${deletedCount} posts from local database`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to delete all posts:', error);
      throw error;
    }
  }



  /**
   * Initializes the database by setting up logging and configuring the database.
   * @public
   * @throws Will throw an error if the database initialization fails.
   */
  public async initializeDatabase() {
    try {
      // Validate Capella configuration
      const config = validateCapellaConfig();
      console.log('✅ Capella configuration validated');
      
      //turned on database logging too verbose to see information in IDE
      await Database.setLogLevel(LogDomain.ALL, LogLevel.DEBUG);
      await this.setupDatabase();
      const path = await this.database?.getPath();
      console.debug(`Database Setup with path: ${path}`);
      await this.setupIndexes();
      
      // Ensure the posts collection exists before setting up replicator
      const postsCollection = await this.getPostCollection();
      console.log('✅ Posts collection created/ensured:', postsCollection.name);
      
      // Verify the collection is accessible
      const allCollections = await this.database?.collections();
      console.log('📊 All collections after posts creation:', allCollections?.map(c => c.name));
      
      if (this.replicator === undefined) {
        await this.setupReplicator();
      }
      await this.replicator?.start(true);
    } catch (error) {
      console.log(`Error: ${error}`);
      throw error;
    }
  }



  async getPostCollection() {
    if (!this.database) throw new Error('Database not initialized');
    
    // Create or get the posts collection from social scope
    const collection = await this.database.createCollection('posts', 'social');
    this.postCollection = collection;
    return collection;
  }

  /**
   * Sets up the database with the necessary configurations and collections.
   * @private
   * @throws Will throw an error if the database setup fails.
   */
  private async setupDatabase() {
    /* **
    * Note about encryption: In a real-world app, the encryption key
    * should not be hardcoded like it is here.

    * One strategy is to auto generate a unique encryption key per
    * user on initial app load, then store it securely in the
    * device's keychain for later retrieval.
    * **/
    const fileSystem = new FileSystem();
    const directoryPath = await fileSystem.getDefaultPath();

    const dc = new DatabaseConfiguration();
    dc.setDirectory(directoryPath);
    dc.setEncryptionKey('8e31f8f6-60bd-482a-9c70-69855dd02c39');
    

    const capellaConfig = getCapellaConfig();
    this.database = new Database(capellaConfig.DATABASE_NAME, dc);
    

    await this.database.open();
    const collections = await this.database.collections();
    console.log(`📊 Database opened. Found ${collections.length} collections:`, collections.map(c => c.name));
    
    console.log('✅ Database setup complete - social.posts collection will be created during initialization');
  }





  /**
   * Sets up the indexes for the database.
   *
   * Currently no specific indexes are needed for the social.posts collection.
   *
   * @private
   * @throws Will throw an error if the database is not initialized.
   */
  private async setupIndexes() {
    if (this.database !== undefined) {
      console.log('✅ No specific indexes needed for social.posts collection');
    }
  }



  /**
   * Sets up the replicator for the database.
   *
   * This function configures the replicator to synchronize the local database with a remote
   * Couchbase Sync Gateway or Capella App Service endpoint. It retrieves the collections
   * from the database and sets up the replicator with the specified target URL and authentication.
   *
   * The replicator is configured to run continuously and accept only self-signed certificates.
   *
   * @private
   * @throws Will throw an error if no collections are found to set the replicator to.
   */
  private async setupReplicator() {
    const collections = await this.getCollections();
    if (collections.length > 0) {
      const capellaConfig = getCapellaConfig();
      
      console.log('🔧 Setting up replicator with configuration:', {
        url: capellaConfig.SYNC_GATEWAY_URL,
        username: capellaConfig.AUTH.username,
        database: capellaConfig.DATABASE_NAME,
        collections: collections.map(c => c.name)
      });

      //****************************************************************
      //YOU MUST CHANGE THIS TO YOUR LOCAL IP ADDRESS OR TO YOUR CAPELLA CONNECTION STRING
      //****************************************************************
      const targetUrl = new URLEndpoint(capellaConfig.SYNC_GATEWAY_URL);

      //****************************************************************
      //YOU MUST CREATE THIS USER IN YOUR SYNC GATEWAY CONFIGURATION OR CAPPELLA APP SERVICE ENDPOINT
      //****************************************************************
      const auth = new BasicAuthenticator(
        capellaConfig.AUTH.username,
        capellaConfig.AUTH.password
      );

      const config = new ReplicatorConfiguration(targetUrl);
      config.addCollections(collections);
      config.setAuthenticator(auth);
      config.setContinuous(true);
      config.setAcceptOnlySelfSignedCerts(false);
      
      // Enable bidirectional sync
      config.setReplicatorType(ReplicatorType.PUSH_AND_PULL);
      
      console.log('🔧 Replicator configuration:', {
        type: 'PUSH_AND_PULL',
        continuous: true,
        collections: collections.map(c => c.name)
      });
      
      console.log(`🔄 Setting up replicator with ${collections.length} collections:`, collections.map(c => c.name));
      
      this.replicator = await Replicator.create(config);
      
      // Add replicator status listener
      this.replicator.addChangeListener((status) => {
        this.syncStatus = status;
        
        // Safely access progress data
        const progressInfo = status.progress 
          ? `${status.progress.completed || 0}/${status.progress.total || 0}`
          : 'No progress data';
          
        console.log('🔄 Replicator status changed:', {
          activity: status.activity || 'Unknown',
          error: status.error?.message || 'No error',
          progress: progressInfo
        });
        
        // Notify listeners
        this.syncListeners.forEach(listener => {
          try {
            listener(status);
          } catch (error) {
            console.error('Error in sync listener:', error);
          }
        });
      });
      
      console.log('✅ Replicator created successfully with status listener');
    } else {
      throw new Error('No collections found to set replicator to');
    }
  }





  public async savePost(postData: {
    userId: string;
    id: string;
    title: string;
    body: string;
  }) {
    try {
      // Use social.posts collection for posts
      const postCollection = await this.getPostCollection();
      if (!postCollection) throw new Error('No collection available for saving posts');

      const docId = `post_${new Date().getTime()}`;
      const doc = new MutableDocument(docId);

      doc.setString('id', postData.id);
      doc.setString('userId', postData.userId);
      doc.setString('title', postData.title);
      doc.setString('body', postData.body);
      doc.setString('type', 'post'); // Add type for filtering

      await postCollection.save(doc);
      console.log(`✅ Post document ${docId} saved to social.posts collection.`);
      
      // Ensure replicator is running for live sync
      if (this.replicator) {
        await this.ensureReplicatorRunning();
        console.log(`🔄 Post will be synced to Capella automatically`);
        
        // Log current replicator status
        const status = this.replicator.status;
        if(status) {
          const progressInfo = status.progress 
            ? `${status.progress.completed || 0}/${status.progress.total || 0}`
            : 'No progress data';
            
          console.log('📊 Current replicator status:', {
            activity: status.activity || 'Unknown',
            error: status.error?.message || 'No error',
            progress: progressInfo
          });
        } else {
          console.warn('⚠️ Replicator status not available');
        }
      } else {
        console.warn('⚠️ Replicator not available for sync');
      }
      
      return docId;
    } catch (error) {
      console.error('❌ Failed to save post:', error);
      throw error;
    }
  }

  public async updatePost(docId: string, updatedData: {
  title: string;
  body: string;
}) {
    try {
      const postCollection = await this.getPostCollection();
      if (!postCollection) throw new Error('No collection available for updating posts');

      const existingDoc = await postCollection.getDocument(docId);
      if (!existingDoc) {
        throw new Error(`Document with ID ${docId} not found`);
      }

      // Create a new MutableDocument using existing data
      const mutableDoc = new MutableDocument(docId);

      // Retain existing fields
      const existingData = existingDoc.toDictionary()// All existing fields as key-value pairs
      for (const key in existingData) {
        if (!(key in updatedData)) {
          mutableDoc.setValue(key, existingData[key]); // Retain untouched fields
        }
      }

      // Apply updated fields
      mutableDoc.setString('title', updatedData.title);
      mutableDoc.setString('body', updatedData.body);

      // Save the updated document
      await postCollection.save(mutableDoc);
      console.log(`✅ Document ${docId} updated successfully in social.posts collection.`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update post ${docId}:`, error);
      throw error;
    }
  }




  /**
   * Ensure replicator is running for live sync
   */
  private async ensureReplicatorRunning() {
    try {
      if (this.replicator) {
        const status = this.replicator.status;
        const activity = status.activity || 'Unknown';
        console.log('🔍 Current replicator status:', activity);
        
        if (status && activity === 'STOPPED') {
          console.log('🔄 Starting replicator for live sync...');
          await this.replicator.start();
        } else if (status && activity === 'IDLE') {
          console.log('✅ Replicator is already running and idle');
        } else {
          console.log('🔄 Replicator is currently:', activity);
        }
      }
    } catch (error) {
      console.error('Failed to ensure replicator is running:', error);
    }
  }

  /**
   * Get current replicator status for debugging
   */
  public getReplicatorStatus() {
    if (this.replicator) {
      const status = this.replicator.status;
      const progressInfo = status.progress 
        ? `${status.progress.completed || 0}/${status.progress.total || 0}`
        : 'No progress data';
        
      return {
        activity: status.activity || 'Unknown',
        error: status.error?.message || null,
        progress: progressInfo,
        isRunning: status.activity !== 'STOPPED'
      };
    }
    return null;
  }
}
