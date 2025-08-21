# Fixing "Unauthorized" Error in Capella Sync

## Problem
You're getting an "Unauthorized" error when trying to sync with Capella. This means the authentication credentials are incorrect or the user doesn't exist.

## Solution Steps

### Step 1: Get Your Capella App Service URL

1. **Log into Couchbase Capella**
   - Go to https://cloud.couchbase.com
   - Sign in to your account

2. **Navigate to Your Database**
   - Click on your database
   - Go to the "App Services" tab

3. **Get the WebSocket URL**
   - Find your App Service
   - Click on it to open the details
   - Look for the "WebSocket URL" or "Sync Gateway URL"
   - It should look like: `wss://your-app-service.apps.cloud.couchbase.com:4984/your-database`

### Step 2: Create a User in App Service

1. **Open App Service Configuration**
   - In your App Service, go to "Configuration"
   - Look for "Users" or "Authentication" section

2. **Create a New User**
   - Click "Add User" or "Create User"
   - Set username: `demo@example.com`
   - Set password: `P@ssw0rd12`
   - Save the user

3. **Alternative: Use Different Credentials**
   - If you prefer different credentials, note them down
   - You'll need to update the config file

### Step 3: Update Configuration File

Edit `src/config/capella.config.ts` and replace the placeholder values:

```typescript
export const CAPELLA_CONFIG = {
  // Replace this with your actual App Service URL
  SYNC_GATEWAY_URL: 'wss://YOUR-ACTUAL-APP-SERVICE.apps.cloud.couchbase.com:4984/YOUR-DATABASE-NAME',
  
  // Update database name if different
  DATABASE_NAME: 'travel',
  
  // Update with your actual credentials
  AUTH: {
    username: 'demo@example.com',  // or your chosen username
    password: 'P@ssw0rd12',        // or your chosen password
  },
  // ... rest of config
};
```

### Step 4: Verify App Service Configuration

1. **Check Sync Function**
   - In your App Service, go to "Functions"
   - Ensure you have a sync function that handles your collections
   - The sync function should allow access to your collections

2. **Example Sync Function**
   ```javascript
   function sync(doc, oldDoc) {
     // Allow all documents to sync
     channel("public");
   }
   ```

### Step 5: Test the Connection

1. **Restart the App**
   ```bash
   # Stop the current app
   # Then restart
   npm run ios
   # or
   npm run android
   ```

2. **Check Console Logs**
   - Look for authentication success messages
   - Check for any remaining errors

## Common Issues and Solutions

### Issue 1: "User not found"
**Solution**: Create the user in your App Service configuration

### Issue 2: "Invalid credentials"
**Solution**: Double-check username and password spelling

### Issue 3: "Connection refused"
**Solution**: Verify the App Service URL is correct

### Issue 4: "Database not found"
**Solution**: Check that the database name in the URL matches your actual database

## Debug Information

### Check Current Configuration
The app will log the current configuration on startup. Look for:
```
✅ Capella configuration validated
```

### Test Network Connectivity
The app shows network status. Ensure you see:
```
🟢 Online
```

### Monitor Sync Status
Watch the console for sync status messages:
```
Sync Status: CONNECTING
Sync Status: IDLE
```

## Alternative: Use Environment Variables

For better security, you can use environment variables:

1. **Create `.env` file** (add to .gitignore):
   ```
   CAPELLA_URL=wss://your-app-service.apps.cloud.couchbase.com:4984/your-database
   CAPELLA_USERNAME=demo@example.com
   CAPELLA_PASSWORD=P@ssw0rd12
   ```

2. **Update config to use environment variables**:
   ```typescript
   export const CAPELLA_CONFIG = {
     SYNC_GATEWAY_URL: process.env.CAPELLA_URL || 'wss://xxxxxx.apps.cloud.couchbase.com:4984/travel-location',
     AUTH: {
       username: process.env.CAPELLA_USERNAME || 'demo@example.com',
       password: process.env.CAPELLA_PASSWORD || 'P@ssw0rd12',
     },
     // ... rest
   };
   ```

## Still Having Issues?

1. **Check Capella Documentation**: https://docs.couchbase.com/cloud/
2. **Verify App Service Status**: Ensure your App Service is running
3. **Test with curl**: Try connecting with curl to verify credentials
4. **Contact Support**: If issues persist, contact Couchbase support

## Quick Test

After updating the configuration, you should see:
- ✅ "Capella configuration validated" in console
- 🟢 "Online" status in the app
- No "Unauthorized" errors when syncing