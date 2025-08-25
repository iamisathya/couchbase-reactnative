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
  ScrollView,
  Alert,
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
    isOnline, 
    clearAllPosts
  } = useSync();

  const onPressFetch = () => {
    refetch();
  };

  const onPressAddToDb = async () => {
    try {
      const docId = await dbService.savePost(post);
      if (docId) {
        Snackbar.show({
          text: 'Post added to Couchbase and syncing to Capella...',
          duration: Snackbar.LENGTH_SHORT,
        });
        refetch();
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      Snackbar.show({
        text: 'Failed to save post',
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
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            <Text style={styles.text}>Post ID: {post?.id}</Text>
            <Text style={styles.text}>User ID: {post?.userId}</Text>
            <Text style={styles.text}>Title: {post?.title}</Text>
            <Text style={styles.text}>Body: {post?.body}</Text>
          </View>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <TouchableOpacity style={styles.button} onPress={onPressFetch}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Fetch Random Post</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.spacer} />
          
          <TouchableOpacity 
            style={[styles.button, styles.addButton]} 
            onPress={onPressAddToDb}
            disabled={!post}
          >
            <Text style={styles.buttonText}>Add to Couchbase</Text>
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
          
          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  spacer: {
    height: 24,
  },
  postContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 24,
    backgroundColor: '#f8f9fa',
  },
  text: {
    fontSize: 16,
    paddingBottom: 12,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default HomeScreen;
