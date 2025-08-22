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
   * This function fetches the `hotel` and `landmark` collections from the
   *`inventory` scope of the database. If the collections are found, they
   * are added to an array and returned.
   *
   * @returns {Promise<Collection[]>} A promise that resolves to an array of `Collection` objects.
   * @throws Will throw an error if the database is not initialized.
   */
  private async getCollections(): Promise<Collection[]> {
    const collections: Collection[] = [];
    
    // Get default collection for posts
    const defaultCollection = await this.database?.defaultCollection();
    if (defaultCollection) {
      collections.push(defaultCollection);
      console.log('✅ Using default collection for sync');
    }
    
    // Get hotel and landmark collections if they exist
    try {
      const hotelCollection = await this.database?.collection('hotel', 'inventory');
      if (hotelCollection !== undefined) {
        collections.push(hotelCollection);
        console.log('✅ Using hotel collection for sync');
      }
    } catch (error) {
      console.log('⚠️ Hotel collection not found');
    }
    
    try {
      const landmarkCollection = await this.database?.collection('landmark', 'inventory');
      if (landmarkCollection !== undefined) {
        collections.push(landmarkCollection);
        console.log('✅ Using landmark collection for sync');
      }
    } catch (error) {
      console.log('⚠️ Landmark collection not found');
    }
    
    console.log(`📦 Total collections for sync: ${collections.length}:`, collections.map(c => c.name));
    return collections;
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
   * returns all posts from the default collection
   */
  public async getPosts() {
    try {
      const queryStr = `
        SELECT 
          doc.*, 
          meta().id AS docId 
        FROM _default._default AS doc
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
      const postCollection = await this.database?.defaultCollection();
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
   * Delete all posts from the default collection
   */
  public async deleteAllPosts(): Promise<number> {
    try {
      const postCollection = await this.database?.defaultCollection();
      if (!postCollection) throw new Error('No collection available for deleting posts');

      // Query to find all post documents
      const queryStr = `SELECT meta().id as docId FROM _default._default WHERE type = 'post'`;
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
    
    //check to see if we are missing the travel sample collections, if so then create them
    if (collections.length === 1) {
      console.log('🔧 Creating sample collections...');
      await this.database.createCollection('airline', 'inventory');
      await this.database.createCollection('airport', 'inventory');
      await this.database.createCollection('hotel', 'inventory');
      await this.database.createCollection('landmark', 'inventory');
      await this.database.createCollection('route', 'inventory');
      await this.database.createCollection('users', 'tenant_agent_00');
      await this.database.createCollection('bookings', 'tenant_agent_00');
      console.log('✅ Sample collections created');
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
      
      console.log(`🔄 Setting up replicator with ${collections.length} collections:`, collections.map(c => c.name));
      
      this.replicator = await Replicator.create(config);
      
      console.log('✅ Replicator created successfully');
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
      // Use default collection for posts
      const postCollection = await this.database?.defaultCollection();
      if (!postCollection) throw new Error('No collection available for saving posts');

      const docId = `post_${new Date().getTime()}`;
      const doc = new MutableDocument(docId);

      doc.setString('id', postData.id);
      doc.setString('userId', postData.userId);
      doc.setString('title', postData.title);
      doc.setString('body', postData.body);
      doc.setString('type', 'post'); // Add type for filtering

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
