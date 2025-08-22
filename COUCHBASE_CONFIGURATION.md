# Couchbase Capella Configuration

## ✅ **Configuration Updated Successfully**

Your Couchbase Capella configuration has been updated with the following details:

### 🏗️ **Infrastructure Details:**
- **Cluster Name**: `couchbasecluster`
- **Public Connection String**: `couchbases://cb.dmnidi5d1-4hjh3a.cloud.couchbase.com`
- **Bucket Name**: `couchbase-app-bucket`
- **Cluster Access**: `admin` / `1@Password`

### 🔗 **App Service Configuration:**
- **App Service Name**: `couchbase-app-service`
- **App Endpoint Name**: `couchbase-app-endpoint`
- **Public Connection**: `wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint`
- **App Service User**: `appserviceuser` / `1@Password`
- **Linked Cluster**: `couchbasecluster`

### 📱 **App Configuration:**
```typescript
export const CAPELLA_CONFIG = {
  SYNC_GATEWAY_URL: 'wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint',
  DATABASE_NAME: 'couchbase-app-bucket',
  AUTH: {
    username: 'appserviceuser',
    password: '1@Password',
  },
  // ... rest of config
};
```

## 🔧 **What's Been Configured:**

### ✅ **Database Service:**
- Updated to use your bucket name: `couchbase-app-bucket`
- Configured with your App Service endpoint
- Uses your App Service user credentials

### ✅ **Sync Configuration:**
- Continuous sync enabled
- Uses default collection (works with your bucket structure)
- Proper authentication with your credentials

### ✅ **Validation:**
- Configuration validation updated
- Clear logging of your setup
- Error handling for your specific configuration

## 🚀 **How to Test the Configuration:**

### **Step 1: Restart the App**
```bash
# Stop the current app and restart
npm run ios
# or
npm run android
```

### **Step 2: Check Console Logs**
You should see:
```
🔍 Validating Capella Configuration...
URL: wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint
Username: appserviceuser
Database: couchbase-app-bucket
Cluster: couchbasecluster
Bucket: couchbase-app-bucket
✅ Capella configuration validated successfully
✅ Ready for replication and sync with Capella
```

### **Step 3: Test Sync Operations**
1. **Fetch & Sync to Capella**: Should work with your configuration
2. **Sync from Capella**: Should download data from your bucket
3. **Manual Sync**: Should sync both directions

## 📊 **Expected Behavior:**

### ✅ **What Should Work:**
- **Local Database**: Uses `couchbase-app-bucket` as database name
- **Cloud Sync**: Connects to your App Service endpoint
- **Authentication**: Uses `appserviceuser` credentials
- **Data Storage**: All data goes to your bucket
- **Replication**: Continuous sync with your Capella cluster

### 🔄 **Sync Operations:**
- **Fetch from JSONPlaceholder**: Gets posts and saves to local database
- **Sync to Capella**: Uploads local data to your bucket
- **Sync from Capella**: Downloads data from your bucket
- **Clear All**: Removes data from both local and cloud

## 🔍 **Troubleshooting:**

### **If Sync Fails:**

#### **1. Check App Service Status:**
- Ensure your App Service is running in Capella
- Verify the endpoint is accessible

#### **2. Check User Permissions:**
- Ensure `appserviceuser` exists in your App Service
- Verify the user has proper permissions

#### **3. Check Network:**
- Ensure your device has internet access
- Try different network (WiFi vs cellular)

#### **4. Check Console Logs:**
Look for specific error messages:
```
❌ Sync Error Details: {
  error: {...},
  code: "401", // Unauthorized
  domain: "CBLWebSocketDomain",
  message: "Unauthorized"
}
```

### **Common Issues:**

#### **Unauthorized (401):**
- **Cause**: User doesn't exist or wrong password
- **Solution**: Create `appserviceuser` in App Service with password `1@Password`

#### **Connection Refused:**
- **Cause**: App Service not running or wrong URL
- **Solution**: Check App Service status in Capella console

#### **Database Not Found:**
- **Cause**: Bucket doesn't exist
- **Solution**: Ensure `couchbase-app-bucket` exists in your cluster

## 📋 **Verification Steps:**

### **1. Check Capella Console:**
- Go to your Capella dashboard
- Navigate to App Services
- Verify `couchbase-app-service` is running
- Check that `appserviceuser` exists

### **2. Test in App:**
1. **Add Data**: Use "Add to couchbase" button
2. **Sync to Cloud**: Use "Sync to Capella" button
3. **Check Bucket**: Verify data appears in your bucket
4. **Sync from Cloud**: Use "Sync from Capella" button

### **3. Monitor Logs:**
Watch console for:
```
✅ Capella configuration validated successfully
🔄 Sync Status: CONNECTING - Establishing connection...
🔄 Sync Status: BUSY - Syncing data...
✅ Sync Status: IDLE - Sync completed successfully
```

## 🎯 **Next Steps:**

### **1. Test Basic Operations:**
- Fetch posts from JSONPlaceholder
- Save to local database
- Sync to Capella
- Verify data in your bucket

### **2. Test Sync Operations:**
- Sync from Capella
- Manual sync
- Clear all posts
- Force sync deletions

### **3. Monitor Performance:**
- Check sync speed
- Monitor error rates
- Verify data consistency

Your Couchbase Capella configuration is now complete and ready for replication and syncing! The app will connect to your `couchbase-app-bucket` and sync data through your App Service endpoint.