# Sync Operations Guide

## Overview
The app now has clear, distinct operations for different types of data synchronization. This guide explains what each button does and when to use it.

## 🔄 **Sync Operations Explained**

### 📥 **Data Fetching Operations**

#### 1. **"Fetch from JSONPlaceholder"** (Green Button)
- **What it does**: Fetches random posts from `https://jsonplaceholder.typicode.com/posts`
- **Where it saves**: Saves posts to your **local** Couchbase database
- **Does NOT sync to cloud**: This is just fetching and storing locally
- **Use when**: You want to populate your local database with sample data

#### 2. **"Fetch & Sync to Capella"** (Green Button)
- **What it does**: 
  1. Fetches posts from JSONPlaceholder API
  2. Saves them to local database
  3. Immediately syncs them to your Capella cloud database
- **Use when**: You want to populate both local and cloud databases with sample data

### ☁️ **Capella Cloud Sync Operations**

#### 3. **"Sync from Capella"** (Blue Button)
- **What it does**: Downloads data from your Capella cloud database to your local device
- **Use when**: You want to get the latest data from the cloud (e.g., data added by other devices/users)

#### 4. **"Sync to Capella"** (Blue Button)
- **What it does**: Uploads your local database changes to your Capella cloud database
- **Use when**: You want to save your local changes to the cloud

#### 5. **"Manual Sync"** (Blue Button)
- **What it does**: 
  1. Syncs from Capella (downloads cloud data)
  2. Syncs to Capella (uploads local data)
- **Use when**: You want to ensure both directions are synced

### 🗑️ **Deletion Operations**

#### 6. **"Delete Current Post"** (Red Button)
- **What it does**: Deletes the currently displayed post from your local database
- **Does NOT sync to cloud**: Deletion stays local until you sync

#### 7. **"Force Sync Deletions"** (Red Button)
- **What it does**: Forces the replicator to sync deletions to the cloud
- **Use when**: You've deleted posts locally and want to ensure they're removed from the cloud

## 📊 **Data Flow Diagram**

```
JSONPlaceholder API ←→ Local Database ←→ Capella Cloud Database
       ↑                      ↑                    ↑
   "Fetch from"          "Add to couchbase"    "Sync to/from"
   "Fetch & Sync"        "Delete Current"      "Manual Sync"
```

## 🎯 **Common Use Cases**

### **Scenario 1: Populate with Sample Data**
1. Click "Fetch from JSONPlaceholder" → Gets sample posts locally
2. Click "Sync to Capella" → Uploads posts to cloud

### **Scenario 2: Get Latest Cloud Data**
1. Click "Sync from Capella" → Downloads latest data from cloud

### **Scenario 3: Add New Data and Sync**
1. Click "Add to couchbase" → Adds current post locally
2. Click "Sync to Capella" → Uploads to cloud

### **Scenario 4: Delete Data and Sync**
1. Click "Delete Current Post" → Deletes locally
2. Click "Force Sync Deletions" → Removes from cloud

### **Scenario 5: Full Sync**
1. Click "Manual Sync" → Syncs both directions

## ⚠️ **Important Notes**

### **JSONPlaceholder vs Capella**
- **JSONPlaceholder**: External API for sample data (not your cloud database)
- **Capella**: Your actual cloud database where your app data lives

### **Local vs Cloud**
- **Local**: Data stored on your device
- **Cloud**: Data stored in your Capella database

### **Sync Timing**
- **Immediate**: Local operations (add/delete) happen instantly
- **Delayed**: Cloud sync requires network and may take a few seconds

## 🔍 **Debug Information**

### **Console Logs to Watch For:**

#### **JSONPlaceholder Operations:**
```
🔄 Fetching posts from JSONPlaceholder...
✅ JSONPlaceholder fetch completed. Saved 10 posts.
```

#### **Capella Sync Operations:**
```
🔄 Syncing from Capella cloud...
✅ Capella sync completed.
🔄 Syncing local changes to cloud...
✅ Local changes synced to cloud.
```

#### **Deletion Operations:**
```
✅ Post document post_1234567890 deleted successfully.
🗑️ Force syncing deletions to cloud...
✅ Deletion sync completed.
```

## 🚨 **Troubleshooting**

### **"Sync from Capella" not working:**
- Check your Capella credentials
- Ensure your App Service is running
- Verify network connectivity

### **"Fetch from JSONPlaceholder" not working:**
- Check internet connection
- JSONPlaceholder API might be down

### **Deletions not syncing:**
- Use "Force Sync Deletions" button
- Check if you're online
- Verify Capella credentials

### **Data not appearing in cloud:**
- Make sure you clicked "Sync to Capella" after adding data
- Check console for error messages
- Verify your Capella database is accessible

## 📋 **Best Practices**

1. **Always sync after changes**: Use "Sync to Capella" after adding/deleting data
2. **Check network status**: Ensure you're online before syncing
3. **Use force sync for deletions**: Use "Force Sync Deletions" for reliable deletion sync
4. **Monitor console logs**: Watch for error messages and sync status
5. **Test with small data**: Start with a few posts to verify sync works

This guide should help you understand exactly what each sync operation does and when to use it!