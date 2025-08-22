# Scope Conflict Fix

## 🔍 **Issue Identified**

**Error**: `All collections must be from the same database and scope`

**Root Cause**: The database service was trying to add collections from different scopes to the replicator:
- `_default` collection (from the default scope)
- `hotel` and `landmark` collections (from the `inventory` scope)

Couchbase requires all collections in a replicator to be from the same database and scope.

## 🔧 **Solution Applied**

### **1. Simplified Collection Management**
- **Before**: Mixed collections from different scopes
- **After**: Use only the default collection

### **2. Updated getCollections() Method**
```typescript
private async getCollections(): Promise<Collection[]> {
  const collections: Collection[] = [];
  
  // Only use the default collection to avoid scope conflicts
  const defaultCollection = await this.database?.defaultCollection();
  if (defaultCollection) {
    collections.push(defaultCollection);
    console.log('✅ Using default collection for sync');
  }
  
  console.log(`📦 Total collections for sync: ${collections.length}:`, collections.map(c => c.name));
  return collections;
}
```

### **3. Removed Multi-Scope Collection Creation**
- Removed creation of `inventory` scope collections
- Removed unused index setup methods
- Simplified database setup

### **4. Updated All Document Operations**
- All operations now use only the default collection
- Removed fallback logic for different scopes
- Simplified error handling

## 🚀 **Testing the Fix**

### **Step 1: Restart the App**
```bash
npm run android
# or
npm run ios
```

### **Step 2: Check Initial Setup**
Look for these logs:
```
✅ Using default collection for sync
📦 Total collections for sync: 1: ["_default"]
🔧 Setting up replicator with configuration: {
  url: "wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint",
  username: "appserviceuser",
  database: "couchbase-app-bucket",
  collections: ["_default"]
}
🔄 Setting up replicator with 1 collections: ["_default"]
✅ Replicator created successfully
```

### **Step 3: Test Document Operations**
1. Add a post using "Add to couchbase" button
2. Check if document appears in the list
3. Try "Clear All" to delete posts
4. Check if documents sync to Capella

## 📊 **Expected Behavior**

### **No More Scope Conflict Error:**
- App should start without the scope conflict error
- Replicator should be created successfully
- All operations should work with the default collection

### **Document Operations:**
```
✅ Post document post_1234567890 saved.
✅ Post document post_1234567890 deleted successfully.
✅ Deleted 2 posts from local database
🗑️ Force syncing deletions to cloud...
✅ Force sync deletions completed
```

## 🔍 **Key Changes Made**

### **1. Collection Management**
- **Removed**: Multi-scope collection handling
- **Added**: Single default collection approach

### **2. Database Setup**
- **Removed**: Creation of `inventory` scope collections
- **Simplified**: Only default collection setup

### **3. Document Operations**
- **Updated**: All methods to use default collection only
- **Removed**: Complex fallback logic

### **4. Index Management**
- **Removed**: Unused index setup methods
- **Simplified**: No specific indexes needed

## 🎯 **Benefits of the Fix**

1. **Compatibility**: Follows Couchbase scope requirements
2. **Simplicity**: Single collection approach
3. **Reliability**: No scope conflicts
4. **Performance**: Reduced complexity
5. **Maintainability**: Easier to understand and debug

## 📋 **Verification Checklist**

- [ ] App starts without scope conflict error
- [ ] Replicator is created successfully
- [ ] Only default collection is used
- [ ] Documents can be saved
- [ ] Documents can be deleted
- [ ] Sync operations work
- [ ] No complex error messages

## 🔧 **If Issues Persist**

### **1. Check Collection Setup**
```javascript
// Verify only default collection is used:
const collections = await dbService.database.collections();
console.log('Collections:', collections.map(c => c.name));
```

### **2. Check Replicator Configuration**
```javascript
// Verify replicator setup:
console.log('Replicator config:', dbService.replicator?.config);
```

### **3. Test Basic Operations**
```javascript
// Test saving a document:
const post = {
  userId: "1",
  id: "test-123",
  title: "Test Post",
  body: "Test content"
};
await dbService.savePost(post);
```

## 🎯 **Next Steps**

### **1. Test All Operations**
- Add posts
- Delete posts
- Clear all posts
- Sync operations

### **2. Monitor Capella Dashboard**
- Check if documents appear in default collection
- Check if deletions sync
- Monitor sync status

### **3. Performance Testing**
- Test with multiple documents
- Test sync speed
- Test offline/online scenarios

The scope conflict fix should resolve the initialization error and allow the app to work properly with Couchbase Capella using only the default collection.