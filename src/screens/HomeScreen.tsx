/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFetchRandomPost } from '../hooks/useRandomPost';
import { useDatabase } from '../../DatabaseProvider';
import { useSync } from '../hooks/useSync';
import { SyncStatusBar } from '../components/SyncStatusBar';
import Snackbar from 'react-native-snackbar';

function HomeScreen() {
  const dbService = useDatabase();
  const { loading, post, error, refetch } = useFetchRandomPost();
  const { 
    syncStatus, 
    networkStatus, 
    isOnline, 
    fetchFromJSONPlaceholder, 
    syncFromCapella,
    syncToCloud, 
    manualSync,
    forceSyncDeletions,
    fetchAndSyncToCapella,
    clearAllPosts
  } = useSync();

  const onPressFetch = () => {
    refetch();
  };

  const onPressAddToDb = async () => {
    const docId = await dbService.savePost(post);
    if (docId) {
      Snackbar.show({
        text: 'Post added successfully',
        duration: Snackbar.LENGTH_SHORT,
      });
      refetch();
    }
  };

  const onPressFetchFromJSONPlaceholder = async () => {
    try {
      await fetchFromJSONPlaceholder();
      Snackbar.show({
        text: 'Fetched posts from JSONPlaceholder',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      Snackbar.show({
        text: 'Failed to fetch from JSONPlaceholder',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const onPressSyncFromCapella = async () => {
    try {
      await syncFromCapella();
      Snackbar.show({
        text: 'Synced from Capella successfully',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      Snackbar.show({
        text: 'Failed to sync from Capella',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const onPressSyncToCloud = async () => {
    try {
      await syncToCloud();
      Snackbar.show({
        text: 'Synced to cloud successfully',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      Snackbar.show({
        text: 'Failed to sync to cloud',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const onPressManualSync = async () => {
    try {
      await manualSync();
      Snackbar.show({
        text: 'Manual sync completed',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      Snackbar.show({
        text: 'Manual sync failed',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const onPressFetchAndSyncToCapella = async () => {
    try {
      await fetchAndSyncToCapella();
      Snackbar.show({
        text: 'Fetched and synced to Capella',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      Snackbar.show({
        text: 'Failed to fetch and sync to Capella',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const onPressForceSyncDeletions = async () => {
    try {
      await forceSyncDeletions();
      Snackbar.show({
        text: 'Deletions synced to cloud',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      Snackbar.show({
        text: 'Failed to sync deletions',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const onPressDeletePost = async () => {
    if (!post?.id) {
      Snackbar.show({
        text: 'No post to delete',
        duration: Snackbar.LENGTH_SHORT,
      });
      return;
    }

    try {
      await dbService.deletePostById(post.id.toString());
      Snackbar.show({
        text: 'Post deleted locally',
        duration: Snackbar.LENGTH_SHORT,
      });
      refetch(); // Get a new post
    } catch (error) {
      Snackbar.show({
        text: 'Failed to delete post',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const onPressClearAllPosts = async () => {
    Alert.alert(
      'Clear All Posts',
      'Are you sure you want to delete all posts from device and cloud? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedCount = await clearAllPosts();
              Snackbar.show({
                text: `Cleared ${deletedCount} posts from device and cloud`,
                duration: Snackbar.LENGTH_LONG,
              });
            } catch (error) {
              Snackbar.show({
                text: 'Failed to clear all posts',
                duration: Snackbar.LENGTH_LONG,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <SyncStatusBar showDetails={true} />

        <View style={styles.postContainer}>
          <Text style={styles.text}>{post?.id}</Text>
          <Text style={styles.text}>{post?.userId}</Text>
          <Text style={styles.text}>{post?.title}</Text>
          <Text style={styles.text}>{post?.body}</Text>
        </View>
        {error && <Text>{error}</Text>}
        
        <TouchableOpacity style={styles.button} onPress={onPressFetch}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Fetch</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity style={styles.button} onPress={onPressAddToDb}>
          <Text style={styles.buttonText}>Add to couchbase</Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        {/* Data Source Buttons */}
        <TouchableOpacity 
          style={[styles.button, styles.fetchButton]} 
          onPress={onPressFetchFromJSONPlaceholder}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Fetching...' : 'Fetch from JSONPlaceholder'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity 
          style={[styles.button, styles.fetchButton]} 
          onPress={onPressFetchAndSyncToCapella}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Processing...' : 'Fetch & Sync to Capella'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        {/* Capella Sync Buttons */}
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]} 
          onPress={onPressSyncFromCapella}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync from Capella'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]} 
          onPress={onPressSyncToCloud}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync to Capella'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]} 
          onPress={onPressManualSync}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Manual Sync'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        {/* Deletion Controls */}
        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]} 
          onPress={onPressDeletePost}
        >
          <Text style={styles.buttonText}>Delete Current Post</Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]} 
          onPress={onPressForceSyncDeletions}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Force Sync Deletions'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity 
          style={[styles.button, styles.clearAllButton]} 
          onPress={onPressClearAllPosts}
          disabled={syncStatus.isSyncing}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Clearing...' : 'Clear All Posts'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  StatusBarText: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'red',
  },
  spacer: {
    height: 24,
  },
  postContainer: {
    borderWidth: 1,
    borderRadius: 9,
    marginVertical: 24,
  },
  text: {
    fontSize: 16,
    paddingBottom: 9,
    paddingLeft: 9,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: 'black',
    borderWidth: 2,
    borderRadius: 9,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  fetchButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  clearAllButton: {
    backgroundColor: '#8E44AD',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  headline: {
    paddingTop: 24,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
