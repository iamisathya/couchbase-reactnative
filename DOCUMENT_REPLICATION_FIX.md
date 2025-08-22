# Document Replication Fix

## 🔍 **Issue Analysis**

You're absolutely right! The issue is that documents are not being properly replicated to Capella. The problem is that the replicator is only syncing collections that exist at startup, but when documents are saved to collections that don't exist yet (like `inventory.post`), those collections are not being synced.

### **Root Cause:**
- Documents are being saved to collections that are not included in the replicator configuration
- The replicator only syncs collections that exist when it's initialized
- New collections created after replicator setup are not automatically synced

## 🔧 **Fixes Applied**

### **1. Enhanced Collection Management**
- Improved `getCollections()` method to ensure all collections are included
- Better logging of which collections are being synced
- Fallback to default collection when specific collections don't exist

### **2. Dynamic Collection Sync**
- Added `ensureCollectionSynced()` method to add new collections to replicator
- Automatic collection detection and sync when documents are saved
- Restart replicator when new collections are added

### **3. Document Sync Triggering**
- Added `triggerDocumentSync()` method to ensure documents are replicated
- Automatic sync trigger after saving documents
- Better status monitoring for document replication

## 🚀 **Testing the Fixes**

### **Step 1: Restart the App**
```bash
npm run android
# or
npm run ios
```

### **Step 2: Check Initial Setup**
Look for these logs:
```
🔧 Setting up replicator with configuration: {
  url: "wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint",
  username: "appserviceuser",
  database: "couchbase-app-bucket",
  collections: ["_default"]
}
📦 Total collections for sync: 1: ["_default"]
✅ Replicator created successfully
```

### **Step 3: Test Document Creation**
1. Add a post using "Add to couchbase" button
2. Watch for the new replication logs
3. Check if document appears in Capella

## 📊 **Expected New Logs**

### **When Saving a Document:**
```
✅ Post document post_1234567890 saved.
🔍 Ensuring collection inventory.post is synced...
🔄 Adding collection inventory.post to replicator...
✅ Collection inventory.post added to replicator
🔄 Triggering document sync...
📊 Current status before document sync: {activity: "BUSY", error: "No error"}
✅ Replicator is already running
```

### **When Collection Already Exists:**
```
✅ Post document post_1234567890 saved.
🔍 Ensuring collection inventory.post is synced...
✅ Collection inventory.post is already being synced
🔄 Triggering document sync...
✅ Replicator is already running
```

### **When Using Default Collection:**
```
✅ Post document post_1234567890 saved.
🔄 Triggering document sync...
✅ Replicator is already running
```

## 🔍 **Troubleshooting Steps**

### **1. Check Collection Setup**
```javascript
// In app console, check which collections exist:
dbService.database.collections()
```

### **2. Check Replicator Configuration**
```javascript
// Check which collections are being synced:
dbService.replicator.config.collections
```

### **3. Test Document Creation**
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

### **4. Check Capella Dashboard**
- Go to your Capella dashboard
- Navigate to your bucket
- Check if documents are appearing

## 🎯 **Common Issues and Solutions**

### **Issue: "Collection not found"**
**Cause**: Collection doesn't exist in database
**Solution**: Collection will be created automatically when first document is saved

### **Issue: "Collection not synced"**
**Cause**: Collection not included in replicator configuration
**Solution**: New collections are automatically added to replicator

### **Issue: "Documents not appearing in Capella"**
**Cause**: Replicator not running or connection issues
**Solution**: Check replicator status and connection

## 📋 **Verification Checklist**

- [ ] App starts without collection errors
- [ ] Replicator includes all necessary collections
- [ ] Documents are saved successfully
- [ ] Collections are automatically synced
- [ ] Documents appear in Capella dashboard
- [ ] Sync status shows proper activity

## 🔧 **If Issues Persist**

### **1. Check Replicator Status**
```javascript
// Check if replicator is running:
dbService.isReplicatorConnected()
```

### **2. Test Manual Sync**
```javascript
// Trigger manual sync:
dbService.triggerSimpleSync()
```

### **3. Check Capella App Service**
- Verify App Service is running
- Check App Service logs for errors
- Verify user permissions

### **4. Check Network Connectivity**
```javascript
// Test network:
NetworkService.getDetailedNetworkInfo()
```

## 🎯 **Next Steps**

### **1. Test Document Creation**
- Add posts using the app
- Watch for replication logs
- Verify documents appear in Capella

### **2. Test Document Deletion**
- Delete posts using "Clear All"
- Watch for deletion sync logs
- Verify documents are removed from Capella

### **3. Test Sync Operations**
- Use "Sync to Capella" button
- Use "Sync from Capella" button
- Monitor sync status and progress

### **4. Monitor Performance**
- Check sync speed
- Monitor error rates
- Verify data consistency

## 🔍 **Key Improvements**

1. **Dynamic Collection Management**: Collections are automatically added to replicator when needed
2. **Automatic Sync Triggering**: Documents are synced immediately after saving
3. **Better Error Handling**: Clear error messages for replication issues
4. **Status Monitoring**: Detailed logging of replication status

The improved document replication system should ensure that all documents are properly synced to Capella, regardless of which collection they're saved to.