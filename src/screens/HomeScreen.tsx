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
    isOnline
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



  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <SyncStatusBar showDetails={true} />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>📱 Couchbase Post Manager</Text>
            <Text style={styles.headerSubtitle}>Fetch, store, and sync posts with Capella</Text>
          </View>

          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Text style={styles.postTitle}>📄 Current Post</Text>
              {post?.id && <Text style={styles.postId}>ID: {post.id}</Text>}
            </View>
            
            {post ? (
              <>
                <View style={styles.postField}>
                  <Text style={styles.fieldLabel}>👤 User ID</Text>
                  <Text style={styles.fieldValue}>{post.userId}</Text>
                </View>
                <View style={styles.postField}>
                  <Text style={styles.fieldLabel}>📝 Title</Text>
                  <Text style={styles.fieldValue}>{post.title}</Text>
                </View>
                <View style={styles.postField}>
                  <Text style={styles.fieldLabel}>📄 Content</Text>
                  <Text style={styles.fieldValue}>{post.body}</Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No post loaded</Text>
                <Text style={styles.emptyStateSubtext}>Tap "Fetch Random Post" to get started</Text>
              </View>
            )}
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.fetchButton]} 
              onPress={onPressFetch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>🎲</Text>
                  <Text style={styles.buttonText}>Fetch Random Post</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.addButton]} 
              onPress={onPressAddToDb}
              disabled={!post || loading}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>💾</Text>
                <Text style={styles.buttonText}>Add to Couchbase</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#34C759' : '#FF3B30' }]}>
              <Text style={styles.statusIcon}>{isOnline ? '🟢' : '🔴'}</Text>
              <Text style={styles.statusText}>
                {isOnline ? 'Online - Syncing with Capella' : 'Offline - Changes will sync when online'}
              </Text>
            </View>
            
            {syncStatus.isSyncing && (
              <View style={styles.syncIndicator}>
                <ActivityIndicator color="#007AFF" size="small" />
                <Text style={styles.syncText}>Syncing with Capella...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  postContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  postId: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  postField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#e53e3e',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 6,
  },
  fetchButton: {
    backgroundColor: '#6366f1',
  },
  addButton: {
    backgroundColor: '#10b981',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    flex: 1,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  syncText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default HomeScreen;
