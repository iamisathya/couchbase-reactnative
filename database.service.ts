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
      try {
        console.log('🗑️ Force syncing deletions to cloud...');
        
        // Check if replicator is already running
        const currentStatus = this.replicator.status;
        console.log('🔄 Current replicator status:', {
          activity: currentStatus?.activity || 'undefined',
          error: currentStatus?.error?.message || 'No error'
        });
        
        // Stop the replicator if it's running and status is available
        if (currentStatus && currentStatus.activity !== ReplicatorActivityLevel.STOPPED) {
          await this.replicator.stop();
          console.log('🛑 Replicator stopped');
          
          // Wait a moment for the stop to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log('🔄 Replicator is already stopped or status unavailable');
        }
        
        // Restart the replicator
        await this.replicator.start(true);
        console.log('🔄 Replicator restarted');
        
        // Wait for sync to complete with better status detection
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log('⏰ Deletion sync timeout reached');
            reject(new Error('Deletion sync timeout - operation took too long'));
          }, 30000);
          
          let checkCount = 0;
          const maxChecks = 30; // Maximum 30 checks (30 seconds)
          
          const checkStatus = () => {
            checkCount++;
            const status = this.syncStatus;
            
            console.log(`🔍 Checking deletion sync status (${checkCount}/${maxChecks}):`, {
              activity: status?.activity || 'undefined',
              hasError: !!status?.error,
              errorMessage: status?.error?.message || 'No error message',
              progress: status?.progress ? `${status.progress.completed}/${status.progress.total}` : '0/0'
            });
            
            // Check if we have a valid status
            if (!status || status.activity === undefined) {
              if (checkCount >= 10) { // Increased to 10 checks to give more time
                clearTimeout(timeout);
                console.error('❌ Deletion sync failed: Replicator status is undefined after 10 checks');
                console.error('🔍 This usually means the replicator is not connecting to Capella');
                console.error('🔍 Check your network connection and Capella App Service status');
                reject(new Error('Deletion sync failed: Replicator status is undefined - check connection'));
                return;
              }
              // Continue checking if status is still undefined
              setTimeout(checkStatus, 1000);
              return;
            }
            
            if (status.activity === ReplicatorActivityLevel.IDLE) {
              clearTimeout(timeout);
              console.log('✅ Deletion sync completed successfully');
              resolve();
            } else if (status.error) {
              clearTimeout(timeout);
              const errorMessage = status.error.message || 'Unknown deletion sync error';
              console.error('❌ Deletion sync failed with error:', errorMessage);
              reject(new Error(`Deletion sync failed: ${errorMessage}`));
            } else if (status.activity === ReplicatorActivityLevel.OFFLINE) {
              clearTimeout(timeout);
              console.error('❌ Deletion sync failed: Replicator is offline');
              reject(new Error('Deletion sync failed: Replicator is offline'));
            } else if (status.activity === ReplicatorActivityLevel.STOPPED) {
              clearTimeout(timeout);
              console.error('❌ Deletion sync failed: Replicator stopped unexpectedly');
              reject(new Error('Deletion sync failed: Replicator stopped unexpectedly'));
            } else if (checkCount >= maxChecks) {
              clearTimeout(timeout);
              console.error('❌ Deletion sync failed: Maximum checks reached');
              reject(new Error('Deletion sync failed: Maximum checks reached - sync may be stuck'));
            } else {
              // Continue checking
              setTimeout(checkStatus, 1000);
            }
          };
          
          // Start checking after a short delay
          setTimeout(checkStatus, 1000);
        });
      } catch (error) {
        console.error('❌ Error during force sync deletions:', error);
        throw error;
      }
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
   * Test replicator connection
   */
  public async testReplicatorConnection(): Promise<boolean> {
    if (!this.replicator) {
      console.log('❌ Replicator not initialized');
      return false;
    }

    try {
      console.log('🔍 Testing replicator connection...');
      
      // Get current status
      const status = this.replicator.status;
      console.log('📊 Current replicator status:', {
        activity: status?.activity || 'undefined',
        error: status?.error?.message || 'No error',
        progress: status?.progress ? `${status.progress.completed}/${status.progress.total}` : '0/0'
      });

      // Try to start the replicator
      await this.replicator.start(true);
      console.log('✅ Replicator started successfully');

      // Wait a moment for status to update
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check status again
      const newStatus = this.replicator.status;
      console.log('📊 Updated replicator status:', {
        activity: newStatus?.activity || 'undefined',
        error: newStatus?.error?.message || 'No error',
        progress: newStatus?.progress ? `${newStatus.progress.completed}/${newStatus.progress.total}` : '0/0'
      });

      const isConnected = newStatus?.activity === ReplicatorActivityLevel.IDLE || 
                         newStatus?.activity === ReplicatorActivityLevel.BUSY ||
                         newStatus?.activity === ReplicatorActivityLevel.CONNECTING;

      console.log(`🔍 Connection test result: ${isConnected ? '✅ Connected' : '❌ Not connected'}`);
      return isConnected;

    } catch (error) {
      console.error('❌ Replicator connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if replicator is properly connected
   */
  public isReplicatorConnected(): boolean {
    if (!this.replicator) {
      console.log('🔍 Replicator connection check: No replicator instance');
      return false;
    }
    
    try {
      const status = this.replicator.status;
      
      // Check if status is available
      if (!status) {
        console.log('🔍 Replicator connection check: Status is undefined');
        return false;
      }
      
      const isConnected = status.activity === ReplicatorActivityLevel.IDLE || 
                         status.activity === ReplicatorActivityLevel.BUSY ||
                         status.activity === ReplicatorActivityLevel.CONNECTING;
      
      console.log('🔍 Replicator connection check:', {
        hasReplicator: !!this.replicator,
        hasStatus: !!status,
        activity: status.activity || 'undefined',
        isConnected,
        error: status.error?.message || 'No error'
      });
      
      return isConnected;
    } catch (error) {
      console.error('🔍 Replicator connection check error:', error);
      return false;
    }
  }

  /**
   * returns type of activities in the inventory.location collection
   */
  public async getActivities() {
    const queryStr =
      'SELECT DISTINCT activity FROM inventory.landmark as activity WHERE landmark.activity IS NOT MISSING';
    return this.database?.createQuery(queryStr).execute();
  }

  /**
   * Retrieves the collections from the database.
   *
   * This function fetches the default collection and any other available collections.
   * If no specific collections exist, it will use the default collection.
   *
   * @returns {Promise<Collection[]>} A promise that resolves to an array of `Collection` objects.
   * @throws Will throw an error if the database is not initialized.
   */
  private async getCollections(): Promise<Collection[]> {
    const collections: Collection[] = [];
    
    try {
      // First, try to get the default collection
      const defaultCollection = await this.database?.defaultCollection();
      if (defaultCollection) {
        collections.push(defaultCollection);
        console.log('✅ Using default collection for sync');
      }
      
      // Try to get other collections if they exist
      const allCollections = await this.database?.collections();
      if (allCollections && allCollections.length > 0) {
        console.log(`Found ${allCollections.length} collections:`, allCollections.map(c => c.name));
        
        // Add all available collections
        for (const collection of allCollections) {
          if (!collections.find(c => c.name === collection.name)) {
            collections.push(collection);
          }
        }
      }
      
      console.log(`📦 Total collections for sync: ${collections.length}`);
      return collections;
    } catch (error) {
      console.error('Error getting collections:', error);
      // Fallback to default collection
      const defaultCollection = await this.database?.defaultCollection();
      if (defaultCollection) {
        return [defaultCollection];
      }
      throw new Error('No collections available for sync');
    }
  }

  /**
   * returns an array of ResultSet objects for the hotels that match the Full Text Search term in the inventory.hotel collection
   * @param searchTerm
   */
  public async getHotelsBySearchTerm(searchTerm: string) {
    const queryStr = `SELECT * FROM inventory.hotel as hotel WHERE MATCH(idxTextSearch, '${searchTerm}')`;
    return this.database?.createQuery(queryStr).execute();
  }

  /**
   * returns all hotels in the inventory.hotel collection
   */
  public async getHotels() {
    try {
      const queryStr = 'SELECT * FROM inventory.hotel as hotel';
      return this.database?.createQuery(queryStr).execute();
    } catch (error) {
      console.debug(`Error: ${error}`);
      throw error;
    }
  }

    /**
   * returns all hotels in the inventory.hotel collection
   */
  public async getPosts() {
    try {
      // Try to query from inventory.post first
      let queryStr = `
        SELECT 
          post.*, 
          meta().id AS docId 
        FROM inventory.post AS post
      `;
      
      try {
        return await this.database?.createQuery(queryStr).execute();
      } catch (error) {
        console.log('⚠️ inventory.post collection not found, querying from default collection');
        
        // Fallback to default collection
        queryStr = `
          SELECT 
            doc.*, 
            meta().id AS docId 
          FROM _default._default AS doc
          WHERE doc.type = 'post'
        `;
        return await this.database?.createQuery(queryStr).execute();
      }
    } catch (error) {
      console.debug(`Error: ${error}`);
      throw error;
    }
  }

  /**
   * returns all hotels in the inventory.hotel collection
   */
  public async deletePost(docId: string) {
    try {
      let postCollection;
      
      try {
        // Try to get the post collection from inventory scope
        postCollection = await this.database?.collection('post', 'inventory');
      } catch (error) {
        console.log('⚠️ Post collection not found in inventory scope, using default collection');
        // Fallback to default collection
        postCollection = await this.database?.defaultCollection();
      }
      
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
      let postCollection;
      
      try {
        // Try to get the post collection from inventory scope
        postCollection = await this.database?.collection('post', 'inventory');
      } catch (error) {
        console.log('⚠️ Post collection not found in inventory scope, using default collection');
        // Fallback to default collection
        postCollection = await this.database?.defaultCollection();
      }
      
      if (!postCollection) throw new Error('No collection available for deleting posts');

      // Query to find the document by post ID
      let queryStr;
      try {
        queryStr = `SELECT meta().id as docId FROM inventory.post WHERE post.id = '${postId}'`;
        const result = await this.database?.createQuery(queryStr).execute();
        if (result && result.length > 0) {
          const docId = result[0].docId;
          return await this.deletePost(docId);
        }
      } catch (error) {
        console.log('⚠️ inventory.post collection not found, querying from default collection');
        
        // Fallback to default collection
        queryStr = `SELECT meta().id as docId FROM _default._default WHERE type = 'post' AND id = '${postId}'`;
        const result = await this.database?.createQuery(queryStr).execute();
        if (result && result.length > 0) {
          const docId = result[0].docId;
          return await this.deletePost(docId);
        }
      }
      
      throw new Error(`Post with ID ${postId} not found`);
    } catch (error) {
      console.error(`❌ Failed to delete post by ID ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all posts from the database
   */
  public async deleteAllPosts(): Promise<number> {
    try {
      let postCollection;
      
      try {
        // Try to get the post collection from inventory scope
        postCollection = await this.database?.collection('post', 'inventory');
      } catch (error) {
        console.log('⚠️ Post collection not found in inventory scope, using default collection');
        // Fallback to default collection
        postCollection = await this.database?.defaultCollection();
      }
      
      if (!postCollection) throw new Error('No collection available for deleting posts');

      // Query to find all post documents
      let queryStr;
      let deletedCount = 0;
      
      try {
        queryStr = `SELECT meta().id as docId FROM inventory.post`;
        const result = await this.database?.createQuery(queryStr).execute();
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
      } catch (error) {
        console.log('⚠️ inventory.post collection not found, querying from default collection');
        
        // Fallback to default collection
        queryStr = `SELECT meta().id as docId FROM _default._default WHERE type = 'post'`;
        const result = await this.database?.createQuery(queryStr).execute();
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
      }
      
      console.log(`✅ Deleted ${deletedCount} posts from local database`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to delete all posts:', error);
      throw error;
    }
  }

  /**
   * returns an array of ResultSet objects for the locations that match the search terms of searchName, searchLocation, and activityType in the inventory.location collection
   * @param searchName - string value to search in the name or title fields
   * @param searchLocation - string value to search in the address, city, state, or country fields
   * @param activityType - string value to filter for in the activity field
   */
  public async getLandmarkBySearchTerm(
    searchName: string,
    searchLocation: string,
    activityType: string,
  ) {
    /*
        for the first set we will allow for a search on the name, title, and content fields with the value being upper case or lower case by converting the search term to lower case and then searching for it in the lower case version of the fields
         */
    const nameLower = searchName.toLowerCase();
    let queryStr = `SELECT * FROM inventory.landmark as landmark WHERE `;
    let conditions: string[] = [];
    if (nameLower !== '') {
      conditions.push(
        `(LOWER(landmark.name) LIKE '%${nameLower}%' OR LOWER(landmark.title) LIKE '%${nameLower}%' OR LOWER(landmark.content) LIKE '%${nameLower}%')`,
      );
    }

    /*
       for locations - the term must be the exact value and is case-sensitive to how it's stored in the database
        */
    if (searchLocation !== '') {
      conditions.push(
        `(landmark.address LIKE '%${searchLocation}%' OR landmark.city LIKE '%${searchLocation}%' OR landmark.state LIKE '%${searchLocation}%' OR landmark.country LIKE '%${searchLocation}%')`,
      );
    }

    //we always filter by activity
    conditions.push(
      `landmark.activity = '${activityType}' ORDER BY landmark.name`,
    );

    if (conditions.length > 1) {
      queryStr += conditions.join(' AND ');
    } else {
      queryStr += conditions.join();
    }
    return this.database?.createQuery(queryStr).execute();
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
      if (this.replicator === undefined) {
        await this.setupReplicator();
      }
      await this.replicator?.start(true);
    } catch (error) {
      console.log(`Error: ${error}`);
      throw error;
    }
  }

  async getHotelCollection() {
    if (!this.database) throw new Error('Database not initialized');
    const collection = await this.database.collection('hotel', 'inventory');
    return collection;
  }

  async getPostCollection() {
    if (!this.database) throw new Error('Database not initialized');
    
    try {
      // Try to get the post collection from inventory scope
      const collection = await this.database.collection('post', 'inventory');
      this.postCollection = collection;
      return collection;
    } catch (error) {
      console.log('⚠️ Post collection not found in inventory scope, using default collection');
      // Fallback to default collection
      const defaultCollection = await this.database.defaultCollection();
      this.postCollection = defaultCollection;
      return defaultCollection;
    }
  }

  /**
   * Sets up the database with the necessary configurations and collections.
   * @private
   * @throws Will throw an error if the database setup fails.
   */
  private async setupDatabase() {
    try {
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
      
      // Only create collections if they don't exist and if we're in development mode
      if (collections.length === 1 && __DEV__) {
        console.log('🔧 Development mode: Creating sample collections...');
        try {
          await this.database.createCollection('airline', 'inventory');
          await this.database.createCollection('airport', 'inventory');
          await this.database.createCollection('hotel', 'inventory');
          await this.database.createCollection('post', 'inventory');
          await this.database.createCollection('landmark', 'inventory');
          await this.database.createCollection('route', 'inventory');
          await this.database.createCollection('users', 'tenant_agent_00');
          await this.database.createCollection('bookings', 'tenant_agent_00');
          console.log('✅ Sample collections created');
        } catch (error) {
          console.log('⚠️ Could not create sample collections (this is normal for production):', error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to setup database hotel:', error);
      throw error;
    }
  }

  async saveToCollection() {
    const collection = await this.database?.defaultCollection();
    if (!collection) return;

    //create a document
    const mutableDoc = new MutableDocument('doc-1');
    mutableDoc.setFloat('version', 3.1);
    mutableDoc.setString('type', 'SDK');

    //save it to the database
    await collection.save(mutableDoc);

    //update the document
    const document2 = await collection.document('doc-1');
    const mutableDoc2 = MutableDocument.fromDocument(document2);
    if (mutableDoc2) {
      mutableDoc2.setString('language', 'Typescript');
      await collection.save(mutableDoc2);
    }

    //create a query to get the documents of type SDK
    const query = this.database?.createQuery(
      'SELECT * FROM _default._default WHERE type = "SDK"',
    );

    //run the query
    const results = await query?.execute();
    if (!results) return;

    console.log('Number of documents of type SDK: ' + results.length);

    //loop through the results and do something with them
    for (const item of results) {
      //to something with the data
      const doc = item['_default'];
      console.log(doc.type);
      console.log(doc.language);
    }
  }

  /**
   * Sets up the indexes for the `hotel` collection in the database.
   *
   * This function creates the following indexes for the `hotel` collection:
   * - `idxTextSearch`: A full-text index on the `address`, `city`, `country`, and `description` fields.
   * - `idxVacancy`: A value index on the `vacancy` field.
   *
   * The full-text index (`idxTextSearch`) is configured to ignore accents.
   *
   * @private
   * @throws Will throw an error if the index creation fails.
   */
  private async setupHotelIndexes() {
    const hotelCollection = await this.database?.collection(
      'hotel',
      'inventory',
    );
    //setup full text index for hotel collection
    const ipAddress = FullTextIndexItem.property('address');
    const ipCity = FullTextIndexItem.property('city');
    const ipCountry = FullTextIndexItem.property('country');
    const ipDescription = FullTextIndexItem.property('description');
    const idxFullTextSearch = IndexBuilder.fullTextIndex(
      ipAddress,
      ipCity,
      ipCountry,
      ipDescription,
    ).setIgnoreAccents(true);

    await hotelCollection?.createIndex('idxTextSearch', idxFullTextSearch);

    //setup index to filter hotels by vacancy
    const vacancyValueIndex = IndexBuilder.valueIndex(
      ValueIndexItem.property('vacancy'),
    );
    await hotelCollection?.createIndex('idxVacancy', vacancyValueIndex);
  }

  /**
   * Sets up the indexes for the `hotel` and `landmark` collections in the database.
   *
   * This function calls the `setupHotelIndexes` and `setupLandmarkIndexes` methods
   * to create the necessary indexes for the `hotel` and `landmark` collections.
   *
   * @private
   * @throws Will throw an error if the database is not initialized.
   */
  private async setupIndexes() {
    if (this.database !== undefined) {
      await this.setupHotelIndexes();
      await this.setupPostIndexes();
      await this.setupLandmarkIndexes();
    }
  }

  /**
   * Sets up the indexes for the `landmark` collection in the database.
   *
   * This function creates the following indexes for the `landmark` collection:
   * - `idxLandmarkActivity`: A value index on the `activity` and `name` fields to ensure only valid activities with names are indexed.
   * - `idxLandmarkTextSearch`: A value index on the `title`, `name`, `address`, `city`, `state`, `country`, and `activity` fields for text search.
   *
   * @private
   * @throws Will throw an error if the index creation fails.
   */
  private async setupLandmarkIndexes() {
    const landmarkCollection = await this.database?.collection(
      'landmark',
      'inventory',
    );
    /*
        setup landmark activity index - we need to make sure we only grab activities that have names because the dataset is not clean and has some rubbish in it
         */
    const activityValueIndex = IndexBuilder.valueIndex(
      ValueIndexItem.property('activity'),
      ValueIndexItem.property('name'),
    );
    await landmarkCollection?.createIndex(
      'idxLandmarkActivity',
      activityValueIndex,
    );

    //standard indexed fields for text search
    const idxLandmarkTextSearch = IndexBuilder.valueIndex(
      ValueIndexItem.property('title'),
      ValueIndexItem.property('name'),
      ValueIndexItem.property('address'),
      ValueIndexItem.property('city'),
      ValueIndexItem.property('state'),
      ValueIndexItem.property('country'),
      ValueIndexItem.property('activity'),
    );
    await landmarkCollection?.createIndex(
      'idxLandmarkTextSearch',
      idxLandmarkTextSearch,
    );
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
      
      const targetUrl = new URLEndpoint(capellaConfig.SYNC_GATEWAY_URL);
      const auth = new BasicAuthenticator(
        capellaConfig.AUTH.username,
        capellaConfig.AUTH.password
      );

      const config = new ReplicatorConfiguration(targetUrl);
      config.addCollections(collections);
      config.setAuthenticator(auth);
      config.setContinuous(capellaConfig.SYNC.continuous);
      config.setAcceptOnlySelfSignedCerts(capellaConfig.SYNC.acceptSelfSignedCerts);
      
      // Add additional configuration for better connection handling
      config.setHeartbeat(60); // 60 second heartbeat
      config.setMaxAttempts(5); // 5 retry attempts
      config.setMaxAttemptWaitTime(300); // 5 minutes max wait time
      
      console.log(`🔄 Setting up replicator with ${collections.length} collections:`, collections.map(c => c.name));
      
      this.replicator = await Replicator.create(config);
      
      // Set up replicator listener for status updates
      this.replicator.addChangeListener((change) => {
        this.syncStatus = change.status;
        this.isOnline = change.status.activity !== ReplicatorActivityLevel.OFFLINE;
        
        // Notify all listeners
        this.syncListeners.forEach(listener => {
          listener(change.status);
        });
        
        // Enhanced status logging with better error handling
        const activity = change.status.activity || 'undefined';
        const progress = change.status.progress ? `${change.status.progress.completed}/${change.status.progress.total}` : '0/0';
        
        console.log(`🔄 Sync Status: ${activity}, Progress: ${progress}`);
        
        if (change.status.error) {
          console.error('❌ Sync Error Details:', {
            error: change.status.error,
            code: change.status.error.code,
            domain: change.status.error.domain,
            message: change.status.error.message,
            activity: change.status.activity,
            progress: change.status.progress
          });
          
          // Provide specific guidance for common errors
          if (change.status.error.message?.includes('Unauthorized')) {
            console.error('🔐 Authentication Error: Check your username/password in src/config/capella.config.ts');
            console.error('   Make sure the user exists in your Capella App Service');
          } else if (change.status.error.message?.includes('Connection refused')) {
            console.error('🌐 Connection Error: Check your App Service URL in src/config/capella.config.ts');
            console.error('   Verify the App Service is running and accessible');
          } else if (change.status.error.message?.includes('Database not found')) {
            console.error('🗄️ Database Error: Check your database name in the URL');
            console.error('   Ensure the database exists in your Capella cluster');
          } else if (change.status.error.message?.includes('Collection') && change.status.error.message?.includes('not found')) {
            console.error('📦 Collection Error: Your Capella database only has the default collection');
            console.error('   The app has been updated to work with your database structure');
            console.error('   All data will be stored in the default collection');
          } else {
            console.error('❓ Unknown Sync Error: Check your Capella configuration and network connection');
          }
        } else if (change.status.activity === ReplicatorActivityLevel.IDLE) {
          console.log('✅ Sync Status: IDLE - Sync completed successfully');
        } else if (change.status.activity === ReplicatorActivityLevel.OFFLINE) {
          console.log('⚠️ Sync Status: OFFLINE - No network connection');
        } else if (change.status.activity === ReplicatorActivityLevel.CONNECTING) {
          console.log('🔄 Sync Status: CONNECTING - Establishing connection...');
        } else if (change.status.activity === ReplicatorActivityLevel.BUSY) {
          console.log('🔄 Sync Status: BUSY - Syncing data...');
        } else if (change.status.activity === ReplicatorActivityLevel.STOPPED) {
          console.log('🛑 Sync Status: STOPPED - Replicator is stopped');
        } else if (!change.status.activity) {
          console.log('❓ Sync Status: UNDEFINED - Replicator status is not available');
          console.log('🔍 This might indicate a connection issue or replicator not properly initialized');
        }
      });
    } else {
      throw new Error('No collections found to set replicator to');
    }
  }

  public async saveHotel(hotelData: {
    name: string;
    address: string;
    city: string;
    country: string;
    description: string;
    vacancy: boolean;
  }) {
    try {
      const hotelCollection = await this.database?.collection(
        'hotel',
        'inventory',
      );
      if (!hotelCollection) throw new Error('Hotel collection not found');

      const docId = `hotel_${new Date().getTime()}`;
      const doc = new MutableDocument(docId);

      doc.setString('name', hotelData.name);
      doc.setString('address', hotelData.address);
      doc.setString('city', hotelData.city);
      doc.setString('country', hotelData.country);
      doc.setString('description', hotelData.description);
      doc.setBoolean('vacancy', hotelData.vacancy);

      await hotelCollection.save(doc);
      console.log(`✅ Hotel document ${docId} saved.`);
      return docId;
    } catch (error) {
      console.error('❌ Failed to save hotel:', error);
      throw error;
    }
  }

   /**
   * Sets up the indexes for the `hotel` collection in the database.
   *
   * This function creates the following indexes for the `hotel` collection:
   * - `idxTextSearch`: A full-text index on the `address`, `city`, `country`, and `description` fields.
   * - `idxVacancy`: A value index on the `vacancy` field.
   *
   * The full-text index (`idxTextSearch`) is configured to ignore accents.
   *
   * @private
   * @throws Will throw an error if the index creation fails.
   */
  private async setupPostIndexes() {
    const postCollection = await this.database?.collection(
      'post',
      'inventory',
    );
    //setup full text index for hotel collection
    const ipId = FullTextIndexItem.property('id');
    const ipUserId = FullTextIndexItem.property('userId');
    const ipTitle = FullTextIndexItem.property('title');
    const ipBody = FullTextIndexItem.property('body');
    const idxFullTextSearch = IndexBuilder.fullTextIndex(
      ipId,
      ipUserId,
      ipTitle,
      ipBody,
    ).setIgnoreAccents(true);

    await postCollection?.createIndex('idxTextSearch', idxFullTextSearch);

    //setup index to filter hotels by vacancy
    const vacancyValueIndex = IndexBuilder.valueIndex(
      ValueIndexItem.property('vacancy'),
    );
    await postCollection?.createIndex('idxVacancy', vacancyValueIndex);
  }


  public async savePost(postData: {
    userId: string;
    id: string;
    title: string;
    body: string;
  }) {
    try {
      let postCollection;
      
      try {
        // Try to get the post collection from inventory scope
        postCollection = await this.database?.collection('post', 'inventory');
      } catch (error) {
        console.log('⚠️ Post collection not found in inventory scope, using default collection');
        // Fallback to default collection
        postCollection = await this.database?.defaultCollection();
      }
      
      if (!postCollection) throw new Error('No collection available for saving posts');

      const docId = `post_${new Date().getTime()}`;
      const doc = new MutableDocument(docId);

      doc.setString('id', postData.id);
      doc.setString('userId', postData.userId);
      doc.setString('title', postData.title);
      doc.setString('body', postData.body);
      doc.setString('type', 'post'); // Add type for filtering in default collection

      await postCollection.save(doc);
      console.log(`✅ Post document ${docId} saved.`);
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
      let postCollection;
      
      try {
        // Try to get the post collection from inventory scope
        postCollection = await this.database?.collection('post', 'inventory');
      } catch (error) {
        console.log('⚠️ Post collection not found in inventory scope, using default collection');
        // Fallback to default collection
        postCollection = await this.database?.defaultCollection();
      }
      
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
      console.log(`✅ Document ${docId} updated successfully.`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update post ${docId}:`, error);
      throw error;
    }
  }


  public getCachedPostCollection(): Collection {
    if (!this.postCollection) {
      throw new Error('Collection not initialized. Call init() first.');
    }
    return this.postCollection;
  }
}
