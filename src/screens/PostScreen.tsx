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
        // let maps = posts?.map(post => ({docId: post.docId, ...post}));
        setAllHotels(posts);
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
    setAllHotels(posts);
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
    navigation.navigate('EditPost', {item: item})
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
    const { post: { body, id, title} } = item
    return (
      <View style={styles.itcontainer} key={index.toString()}>
        <View style={styles.topContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.userId}>Post ID: {id}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.borderLine} />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.updateBtn} onPress={() => onPressEditPost(item)}>
            <Text>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onPressDelete(item.docId)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Clear All button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Posts ({allHotels.length})</Text>
        <TouchableOpacity 
          style={[styles.clearAllButton, { opacity: allHotels.length === 0 ? 0.5 : 1 }]} 
          onPress={onPressClearAll}
          disabled={allHotels.length === 0 || syncStatus.isSyncing}
        >
          <Text style={styles.clearAllButtonText}>
            {syncStatus.isSyncing ? 'Clearing...' : 'Clear All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Network Status */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ Offline - Changes will sync when online</Text>
        </View>
      )}

      <LegendList
        data={allHotels}
        renderItem={renderListItem}
        recycleItems
        keyExtractor={(item, _) => item.docId }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9Bd35A', '#689F38']}
            progressBackgroundColor="#fff"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
  },
  offlineText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  itcontainer: {
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  userId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  borderLine: {
    height: 1,
    color: 'black',
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    height: 42,
    alignItems: 'center',
    borderTopWidth: 2,
    marginVertical: 12,
  },
  topContainer: {
    padding: 16,
  },
  verticalBorder: {
    width: 2,
    height: '100%',
  },
  deleteText: {
    color: 'red',
    fontSize: 16,
    fontWeight:  'semibold'
  },
  updateBtn: {
    flex: 1,
    alignItems: 'center'
  },
   deleteBtn: {
    flex: 1,
    borderLeftWidth: 2,
    alignItems: 'center'
  }
});

export default PostScreen;
