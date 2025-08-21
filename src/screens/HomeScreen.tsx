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
import { NetworkMonitor } from '../components/NetworkMonitor/NetworkMonitor';
import AppStateManager from '../utils/appStateManager';
// import Snackbar from 'react-native-snackbar';

function HomeScreen() {
  const dbService = useDatabase();
  const { loading, post, error, refetch } = useFetchRandomPost();

  const onPressFetch = () => {
    console.log('👆 USER: Fetch/Refresh button pressed');
    refetch();
  };

  const onPressAddToDb = async () => {
    console.log('👆 USER: Add to couchbase button pressed', {
      postId: post?.id,
      hasPost: !!post,
    });
    const docId = await dbService.savePost(post);
    if (docId) {
      console.log('✅ USER: Post added to database successfully', {
        docId,
        postId: post?.id,
      });
      // Snackbar.show({
      //   text: 'Post added successfully',
      //   duration: Snackbar.LENGTH_SHORT,
      // });
      refetch();
    } else {
      console.error('❌ USER: Failed to add post to database');
    }
  };

  const onPressResetNetwork = async () => {
    console.log('👆 USER: Reset Network button pressed');
    await AppStateManager.forceNetworkCheck();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <NetworkMonitor />
        <View style={styles.postContainer}>
          <Text style={styles.text}>{post?.id}</Text>
          <Text style={styles.text}>{post?.userId}</Text>
          <Text style={styles.text}>{post?.title}</Text>
          <Text style={styles.text}>{post?.body}</Text>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={onPressFetch}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Fetch/Refresh</Text>
          )}
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.button} onPress={onPressAddToDb}>
          <Text style={styles.buttonText}>Add to couchbase</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.button} onPress={onPressResetNetwork}>
          <Text style={styles.buttonText}>Reset Network</Text>
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
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  headline: {
    paddingTop: 24,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
