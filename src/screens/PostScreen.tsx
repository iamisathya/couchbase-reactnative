/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { useDatabase } from '../../DatabaseProvider';

function PostScreen() {
  const [allHotels, setAllHotels] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const dbService = useDatabase();

  useEffect(() => {
    let listenerToken: any;
    let postCollection: any;

    const setup = async () => {
      const getHotels = async () => {
        const posts = await dbService.getPosts();
        let maps = posts?.map(i => i.post);
        setAllHotels(maps);
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
    let maps = posts?.map(i => i.post);
    setRefreshing(false);
    setAllHotels(maps);
  };

  const renderListItem = ({ index, item }) => {
    return (
      <View style={styles.itcontainer} key={index.toString()}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.userId}>Post ID: {item.id}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={allHotels}
        renderItem={renderListItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // Optional: Customize colors for Android
            colors={['#9Bd35A', '#689F38']}
            // Optional: Customize background color for Android
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
  itcontainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginHorizontal: 12,
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
});

export default PostScreen;
