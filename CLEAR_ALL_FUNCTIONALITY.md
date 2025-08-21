# Clear All Posts Functionality

## Overview
The app now includes a "Clear All" button that allows you to delete all posts from both your local device and the Capella cloud database. This feature is available in both the HomeScreen and PostScreen.

## 🗑️ **Clear All Features**

### ✅ **What It Does:**
1. **Deletes All Posts Locally**: Removes all posts from your device's Couchbase database
2. **Syncs Deletions to Cloud**: Automatically syncs the deletions to your Capella cloud database
3. **Confirmation Dialog**: Shows a confirmation dialog to prevent accidental deletions
4. **Progress Feedback**: Shows loading state and success/error messages
5. **Offline Support**: Works offline (clears locally, syncs when back online)

### 📱 **Where to Find It:**

#### **PostScreen (List View):**
- **Location**: Header at the top of the posts list
- **Button**: Red "Clear All" button next to the post count
- **Shows**: "Posts (X)" where X is the number of posts
- **Disabled**: When no posts exist or when syncing

#### **HomeScreen:**
- **Location**: Bottom of the screen with other sync buttons
- **Button**: Purple "Clear All Posts" button
- **Disabled**: When syncing is in progress

## 🔧 **How to Use**

### **Step 1: Access Clear All**
1. Go to the PostScreen (list view) or HomeScreen
2. Look for the "Clear All" or "Clear All Posts" button

### **Step 2: Confirm Deletion**
1. Tap the Clear All button
2. A confirmation dialog will appear showing:
   - Number of posts to be deleted
   - Warning that the action cannot be undone
   - "Cancel" and "Clear All" options

### **Step 3: Execute Deletion**
1. Tap "Clear All" to proceed
2. The app will:
   - Delete all posts from local database
   - Sync deletions to Capella cloud
   - Show success message with count of deleted posts

## 📊 **Technical Implementation**

### **Database Operations:**
```typescript
// 1. Query all post documents
const queryStr = `SELECT meta().id as docId FROM _default._default WHERE type = 'post'`;

// 2. Delete each document individually
for (const item of result) {
  await this.deletePost(item.docId);
}

// 3. Force sync deletions to cloud
await this.forceSyncDeletions();
```

### **Sync Process:**
1. **Local Deletion**: All posts are deleted from local database
2. **Tombstone Creation**: Couchbase creates deletion tombstones
3. **Cloud Sync**: Tombsones are synced to Capella
4. **Cloud Cleanup**: Posts are removed from cloud database

## 🎯 **Use Cases**

### **Scenario 1: Fresh Start**
- You want to clear all test data
- Start with a clean database
- Remove all posts from both device and cloud

### **Scenario 2: Data Cleanup**
- Remove old or unwanted posts
- Free up storage space
- Maintain data hygiene

### **Scenario 3: Testing**
- Clear data between test runs
- Verify sync functionality
- Test deletion processes

## ⚠️ **Important Warnings**

### **⚠️ Irreversible Action:**
- **Cannot be undone**: Once cleared, posts cannot be recovered
- **Affects both device and cloud**: Data is removed from both locations
- **No backup**: Make sure you have backups if needed

### **⚠️ Network Dependency:**
- **Online**: Deletions sync immediately to cloud
- **Offline**: Deletions sync when back online
- **Partial sync**: If sync fails, some posts may remain in cloud

## 🔍 **Debug Information**

### **Console Logs:**
```
🗑️ Clearing all posts...
✅ Deleted 15 posts from local database
🗑️ Force syncing deletions to cloud...
✅ Deletion sync completed
✅ Cleared 15 posts from local and cloud databases
```

### **User Feedback:**
- **Success**: "Cleared X posts from device and cloud"
- **Error**: "Failed to clear all posts"
- **No Posts**: "No posts to clear"

## 🚨 **Troubleshooting**

### **Clear All Not Working:**
1. **Check Network**: Ensure you're online for cloud sync
2. **Check Permissions**: Verify Capella credentials
3. **Check Console**: Look for error messages
4. **Try Again**: Sometimes retry helps

### **Posts Still in Cloud:**
1. **Check Sync Status**: Look for sync errors
2. **Force Sync**: Use "Force Sync Deletions" button
3. **Check Network**: Ensure stable connection
4. **Restart App**: Sometimes needed for sync issues

### **Partial Deletion:**
1. **Check Console**: Look for individual deletion errors
2. **Manual Sync**: Use sync buttons to complete
3. **Check Capella**: Verify what's actually in the cloud

## 📋 **Best Practices**

### **Before Clearing:**
1. **Backup Important Data**: Export if needed
2. **Check Network**: Ensure stable connection
3. **Verify Intent**: Make sure you really want to clear all

### **After Clearing:**
1. **Verify Deletion**: Check both device and cloud
2. **Test Sync**: Add new posts to verify sync works
3. **Monitor Logs**: Watch for any sync errors

## 🔮 **Future Enhancements**

### **Potential Improvements:**
1. **Selective Clearing**: Clear by date range or criteria
2. **Soft Delete**: Mark as deleted instead of hard delete
3. **Recovery Options**: Undo functionality for recent deletions
4. **Bulk Operations**: Clear specific types of data
5. **Progress Indicator**: Show deletion progress for large datasets

## 📱 **UI Features**

### **PostScreen Header:**
- **Post Count**: Shows "Posts (X)" with current count
- **Clear Button**: Red button that's disabled when no posts
- **Loading State**: Shows "Clearing..." when in progress

### **HomeScreen Button:**
- **Purple Color**: Distinct from other buttons
- **Disabled State**: When syncing is in progress
- **Confirmation**: Alert dialog with clear warning

The Clear All functionality provides a powerful way to manage your data, but use it carefully as it permanently removes all posts from both your device and cloud database!