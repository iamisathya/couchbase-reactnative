# Cloud Sync Setup Guide

This guide will help you configure cloud sync functionality for your React Native app with Couchbase Capella.

## Prerequisites

1. A Couchbase Capella account
2. A Capella database with App Service enabled
3. Network connectivity for the app

## Step 1: Configure Capella Database

### 1.1 Create a Capella Database
1. Log in to your Couchbase Capella account
2. Create a new database or use an existing one
3. Enable App Service for the database

### 1.2 Configure App Service
1. Go to your database in Capella
2. Navigate to App Service
3. Create a new App Service or use existing one
4. Configure the sync function to handle the collections:
   - `inventory.hotel`
   - `inventory.landmark`
   - `inventory.post`
   - `inventory.airline`
   - `inventory.airport`
   - `inventory.route`

### 1.3 Create User
1. In your App Service configuration, create a user with the following credentials:
   - Username: `demo@example.com`
   - Password: `P@ssw0rd12`
2. Assign appropriate permissions to this user

## Step 2: Update Configuration

### 2.1 Update Capella Configuration
Edit `src/config/capella.config.ts` and replace the placeholder values:

```typescript
export const CAPELLA_CONFIG = {
  // Replace with your actual App Service endpoint
  SYNC_GATEWAY_URL: 'wss://your-app-service.apps.cloud.couchbase.com:4984/your-database',
  
  // Update database name if different
  DATABASE_NAME: 'travel',
  
  // Update with your actual credentials
  AUTH: {
    username: 'demo@example.com',
    password: 'P@ssw0rd12',
  },
  // ... rest of config
};
```

### 2.2 Get Your App Service URL
1. In Capella, go to your App Service
2. Copy the WebSocket URL
3. Replace `your-app-service` and `your-database` in the configuration

## Step 3: Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install @react-native/community/netinfo
# or
yarn add @react-native/community/netinfo
```

## Step 4: Platform-Specific Setup

### iOS Setup
1. Navigate to the iOS folder: `cd ios`
2. Install pods: `pod install`
3. Return to root: `cd ..`

### Android Setup
No additional setup required for Android.

## Step 5: Test the Setup

1. Start the app: `npm run ios` or `npm run android`
2. Check the console for sync status messages
3. Use the sync buttons in the app to test functionality

## Features Implemented

### ✅ Cloud Sync Features
- **Automatic Sync**: Syncs with Capella when online
- **Manual Sync**: Manual sync buttons for testing
- **Offline Support**: Works offline, syncs when back online
- **Network Monitoring**: Monitors network connectivity
- **Sync Status**: Real-time sync status display
- **Error Handling**: Comprehensive error handling and user feedback

### ✅ JSONPlaceholder Integration
- **Fetch Posts**: Fetches posts from JSONPlaceholder API
- **Save to Local**: Saves posts to local Couchbase database
- **Sync to Cloud**: Syncs local posts to Capella database
- **Offline Queue**: Queues changes when offline

### ✅ UI Features
- **Network Status**: Shows online/offline status
- **Sync Status**: Shows current sync status and last sync time
- **Sync Buttons**: Manual sync controls
- **Loading States**: Visual feedback during sync operations
- **Error Messages**: User-friendly error messages

## Troubleshooting

### Common Issues

1. **Configuration Error**
   - Ensure you've updated the Capella configuration with your actual credentials
   - Check that the App Service URL is correct

2. **Authentication Error**
   - Verify the username and password in your App Service configuration
   - Ensure the user has appropriate permissions

3. **Network Issues**
   - Check your internet connection
   - Verify the App Service is accessible from your network

4. **Sync Not Working**
   - Check the console for error messages
   - Verify the collections exist in your Capella database
   - Ensure the sync function is properly configured

### Debug Information

The app logs detailed information to the console:
- Network status changes
- Sync status updates
- Error messages
- Database operations

## Next Steps

### For Production
1. **Security**: Use environment variables for sensitive configuration
2. **Error Handling**: Implement more sophisticated error handling
3. **Conflict Resolution**: Add conflict resolution strategies
4. **Performance**: Optimize sync performance for large datasets
5. **Monitoring**: Add analytics and monitoring

### Additional Features
1. **Selective Sync**: Sync only specific collections
2. **Sync Filters**: Filter data during sync
3. **Background Sync**: Sync in background when app is not active
4. **Sync Scheduling**: Schedule sync operations
5. **Data Validation**: Validate data before sync

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your Capella configuration
3. Test network connectivity
4. Review the troubleshooting section above

For additional help, refer to the Couchbase documentation or contact support.