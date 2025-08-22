# CBL Replicator Troubleshooting Guide

## 🔍 **Issue Analysis**

Based on the Couchbase Lite React Native documentation and your logs, the main issue is that the replicator status remains `undefined`, indicating that the replicator is not properly connecting to your Capella database.

### **Key Issues Identified:**
1. **Network Connectivity**: `isInternetReachable: false` suggests network issues
2. **Replicator Status**: Status remains `undefined` even after restart
3. **Connection Establishment**: Replicator not establishing proper connection to Capella

## 🔧 **Fixes Applied Based on CBL Documentation**

### **1. Enhanced Replicator Configuration**
Following the CBL React Native documentation patterns:

```typescript
// Added proper configuration parameters
config.setHeartbeat(60); // 60 second heartbeat
config.setMaxAttempts(5); // 5 retry attempts  
config.setMaxAttemptWaitTime(300); // 5 minutes max wait time
```

### **2. Improved Status Detection**
- Better handling of undefined replicator status
- Enhanced error detection and reporting
- Connection state tracking

### **3. Connection Testing**
- Added `testReplicatorConnection()` method
- Pre-connection verification
- Better error handling

## 🚀 **Testing the Fixes**

### **Step 1: Restart the App**
```bash
npm run ios
# or
npm run android
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
🔄 Setting up replicator with 1 collections: ["_default"]
```

### **Step 3: Test Connection**
The app will now test the replicator connection before sync operations.

## 📊 **Expected New Logs**

### **Successful Connection:**
```
🔍 Testing replicator connection...
📊 Current replicator status: {activity: "STOPPED", error: "No error", progress: "0/0"}
✅ Replicator started successfully
📊 Updated replicator status: {activity: "CONNECTING", error: "No error", progress: "0/0"}
🔍 Connection test result: ✅ Connected
✅ Replicator connection test passed
```

### **Connection Issues:**
```
🔍 Testing replicator connection...
📊 Current replicator status: {activity: "undefined", error: "No error", progress: "0/0"}
✅ Replicator started successfully
📊 Updated replicator status: {activity: "undefined", error: "No error", progress: "0/0"}
🔍 Connection test result: ❌ Not connected
⚠️ Replicator connection test failed, but proceeding with sync
```

## 🔍 **Troubleshooting Steps**

### **1. Check Network Connectivity**
```javascript
// In the app console, check:
NetworkService.getDetailedNetworkInfo()
```

**Expected Result:**
```
{
  isConnected: true,
  isInternetReachable: true,
  type: "wifi",
  connectivityTest: true
}
```

### **2. Verify Capella Configuration**
```javascript
// Check if configuration is loaded correctly:
getCapellaConfig()
```

**Expected Result:**
```
{
  SYNC_GATEWAY_URL: "wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint",
  DATABASE_NAME: "couchbase-app-bucket",
  AUTH: {username: "appserviceuser", password: "1@Password"}
}
```

### **3. Test Replicator Connection**
```javascript
// Test the replicator connection:
dbService.testReplicatorConnection()
```

### **4. Check Capella App Service**
- Go to your Capella dashboard
- Navigate to App Services
- Verify `couchbase-app-service` is running
- Check that `appserviceuser` exists with correct permissions

## 🎯 **Common Issues and Solutions**

### **Issue: "isInternetReachable: false"**
**Cause**: Network connectivity issues
**Solutions**:
1. Try switching between WiFi and cellular
2. Check if your network blocks WebSocket connections
3. Test with a different network
4. Check firewall settings

### **Issue: "Replicator status is undefined"**
**Cause**: Replicator not connecting to Capella
**Solutions**:
1. Verify Capella App Service is running
2. Check App Service endpoint URL
3. Verify user credentials
4. Check network connectivity

### **Issue: "Connection timeout"**
**Cause**: Network or configuration issues
**Solutions**:
1. Check your Capella App Service status
2. Verify the endpoint URL is correct
3. Ensure the user has proper permissions
4. Check network latency

## 📋 **Verification Checklist**

- [ ] App starts without configuration errors
- [ ] Network status shows as online and internet reachable
- [ ] Replicator configuration logs show correct settings
- [ ] Connection test passes
- [ ] Clear All posts works without undefined status
- [ ] Deletions sync to Capella successfully

## 🔧 **Advanced Troubleshooting**

### **If Connection Test Fails:**

#### **1. Check WebSocket Connectivity**
```javascript
// Test WebSocket connection manually
const ws = new WebSocket('wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint');
ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

#### **2. Verify App Service Configuration**
- Check App Service logs in Capella console
- Verify sync function configuration
- Check user permissions and roles

#### **3. Test with Different Network**
- Try cellular instead of WiFi
- Test on a different network
- Check if corporate firewall is blocking connections

## 🎯 **Next Steps**

### **1. Test the Improved Connection**
- The new implementation will test connection before sync
- Better error reporting will help identify issues
- Connection retry logic will handle temporary failures

### **2. Monitor the Logs**
- Watch for connection establishment logs
- Check for specific error messages
- Monitor network status changes

### **3. Verify Capella Sync**
- Check your Capella dashboard for sync activity
- Look for documents being synced
- Verify deletions are propagating

The improved error handling and connection testing should help identify the exact cause of the connection issues and provide better guidance for resolution.