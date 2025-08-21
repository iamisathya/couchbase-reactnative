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
    syncFromCloud, 
    syncToCloud, 
    manualSync,
    forceSyncDeletions
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

  const onPressSyncFromCloud = async () => {
    try {
      await syncFromCloud();
      Snackbar.show({
        text: 'Synced from cloud successfully',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      Snackbar.show({
        text: 'Failed to sync from cloud',
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
        
        {/* Sync Buttons */}
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]} 
          onPress={onPressSyncFromCloud}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync from Cloud'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]} 
          onPress={onPressSyncToCloud}
          disabled={syncStatus.isSyncing || !isOnline}
        >
          <Text style={styles.buttonText}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync to Cloud'}
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
  deleteButton: {
    backgroundColor: '#FF3B30',
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
