# Couchbase React Native App Setup Guide

## Overview
This app fetches posts from JSON Placeholder API and stores them in Couchbase with automatic sync to Capella.

## Current Configuration

### Capella Settings (Already Configured)
- **Cluster**: couchbasecluster
- **Connection**: couchbases://cb.dmnidi5d1-4hjh3a.cloud.couchbase.com
- **Bucket**: couchbase-app-bucket
- **App Service**: wss://lrmbc7notplwhjuy.apps.cloud.couchbase.com:4984/couchbase-app-endpoint
- **Username**: appserviceuser
- **Password**: 1@Password

## How It Works

### 1. Home Screen
- **Fetch Random Post**: Gets a random post from JSON Placeholder API
- **Add to Couchbase**: Saves the post to local Couchbase database and automatically syncs to Capella
- **Live Status**: Shows online/offline status and sync progress

### 2. List Screen
- Shows all posts stored in the local database
- Posts are automatically synced from Capella when available
- Supports pull-to-refresh
- **Clear All Posts**: Removes all posts from device and cloud

### 3. Features Screen
- Comprehensive overview of all app features
- Tech stack information
- Beautiful UI showcasing capabilities

### 3. Live Sync
- Replicator runs continuously
- Posts are synced to Capella immediately when saved
- Changes from Capella are synced to local database

## Key Features

✅ **Simple Post Fetching**: Get random posts from JSON Placeholder  
✅ **One-Click Save**: Add posts to Couchbase with automatic Capella sync  
✅ **Live Sync**: Real-time synchronization with Capella  
✅ **List View**: Display all stored posts  
✅ **Offline Support**: Works offline, syncs when online  

## Usage

1. **Fetch a Post**: Click "Fetch Random Post" on Home screen
2. **Save to Couchbase**: Click "Add to Couchbase" to store and sync to Capella automatically
3. **View Posts**: Go to List tab to see all stored posts
4. **Edit/Delete**: Use the buttons on each post in the list
5. **Clear All**: Use "Clear All Posts" in List tab to remove all posts from device and cloud
6. **Explore Features**: Check out the Features tab to see all app capabilities

## Technical Details

- **Database**: Couchbase Lite for local storage
- **Scope**: `social` scope with `posts` collection
- **Sync**: Continuous replicator to Capella App Service
- **API**: JSON Placeholder for sample posts
- **UI**: React Native with Legend List for performance

## Troubleshooting

If posts don't appear in the List:
1. Check network connection
2. Verify Capella credentials in `src/config/capella.config.ts`
3. Check console logs for sync errors
4. Try pull-to-refresh on List screen

## Files Modified

- `src/screens/HomeScreen.tsx` - Simplified post saving
- `src/screens/PostScreen.tsx` - Fixed data structure issues
- `database.service.ts` - Added live sync support
- `src/config/capella.config.ts` - Your Capella configuration