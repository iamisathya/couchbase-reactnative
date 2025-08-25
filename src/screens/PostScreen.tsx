/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useDatabase } from '../../DatabaseProvider';
import { LegendList } from '@legendapp/list';
import { useNavigation } from '@react-navigation/native';
import { useSync } from '../hooks/useSync';
import Snackbar from 'react-native-snackbar';

function PostScreen() {
  const [allHotels, setAllHotels] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const dbService = useDatabase();
  const navigation = useNavigation();
  const { clearAllPosts, syncStatus, isOnline } = useSync();

  useEffect(() => {
    let listenerToken: any;
    let postCollection: any;

    const setup = async () => {
      const getHotels = async () => {
        const posts = await dbService.getPosts();
        setAllHotels(posts || []);
      };

      await getHotels();
      postCollection = await dbService.getPostCollection();
      listenerToken = postCollection.addChangeListener(async () => {
        await getHotels();
      });
    };

    setup();

    // Optional cleanup
    return () => {
      if (listenerToken) {
        postCollection?.removeChangeListener(listenerToken);
      }
    };
  }, [dbService]);

  const onRefresh = async () => {
    setRefreshing(true);
    const posts = await dbService.getPosts();
    setRefreshing(false);
    setAllHotels(posts || []);
  };

  const onPressDelete = async (docId: string) => {
     Alert.alert('Delete', 'Are you sure, you want tot delete this post', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'OK', style: 'destructive', onPress: async () => {
        // const result = await dbService.deletePosts(docId);    
        const cllection = await dbService.getCachedPostCollection();
        const doc = await cllection.getDocument(docId);
        if (doc) {          
          await cllection.deleteDocument(doc);
        }        
      }},
    ]);
  }

  const onPressEditPost = (item) => {
    // Create the expected structure for EditPost screen
    const editItem = {
      post: {
        id: item.id,
        title: item.title,
        body: item.body
      },
      docId: item.docId
    };
    navigation.navigate('EditPost', {item: editItem})
  }

  const onPressClearAll = async () => {
    if (allHotels.length === 0) {
      Snackbar.show({
        text: 'No posts to clear',
        duration: Snackbar.LENGTH_SHORT,
      });
      return;
    }

    Alert.alert(
      'Clear All Posts',
      `Are you sure you want to delete all ${allHotels.length} posts? This action cannot be undone.`,
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

  const renderListItem = ({ index, item }) => {
    // Handle the data structure from database query
    const { body, id, title, docId } = item;
    
    return (
      <View style={styles.postCard} key={index.toString()}>
        <View style={styles.postContent}>
          <View style={styles.postHeader}>
            <Text style={styles.postTitle}>{title || 'No Title'}</Text>
            <Text style={styles.postId}>ID: {id || 'No ID'}</Text>
          </View>
          <Text style={styles.postBody}>{body || 'No Content'}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => onPressEditPost(item)}
          >
            <Text style={styles.editButtonIcon}>✏️</Text>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => onPressDelete(docId)}
          >
            <Text style={styles.deleteButtonIcon}>🗑️</Text>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Clear All button */}
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>📋 Stored Posts</Text>
            <Text style={styles.headerSubtitle}>{allHotels.length} posts in database</Text>
          </View>
          <TouchableOpacity 
            style={[styles.clearAllButton, { opacity: allHotels.length === 0 ? 0.5 : 1 }]} 
            onPress={onPressClearAll}
            disabled={allHotels.length === 0 || syncStatus.isSyncing}
          >
            <Text style={styles.clearAllButtonIcon}>🗑️</Text>
            <Text style={styles.clearAllButtonText}>
              {syncStatus.isSyncing ? 'Clearing...' : 'Clear All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Network Status */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineIcon}>⚠️</Text>
            <Text style={styles.offlineText}>Offline - Changes will sync when online</Text>
          </View>
        )}

        {allHotels.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Posts you add from the Home screen will appear here
            </Text>
          </View>
        ) : (
          <LegendList
            data={allHotels}
            renderItem={renderListItem}
            recycleItems
            keyExtractor={(item, _) => item.docId || item.id }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007AFF', '#34C759']}
                progressBackgroundColor="#fff"
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearAllButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  clearAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  postCard: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  postContent: {
    padding: 20,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  postId: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  postBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  editButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  deleteButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default PostScreen;
