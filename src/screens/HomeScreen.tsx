/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */


import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFetchRandomPost } from '../hooks/useRandomPost';
import { useDatabase } from '../../DatabaseProvider';

function HomeScreen() {
  const dbService = useDatabase();
  const { loading, post, error, refetch } = useFetchRandomPost();

  const onPressFetch = () => {
    refetch()
  }

  const onPressAddToDb = async() => {
    await dbService.savePost(post);
    refetch()
  }
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.postContainer}>
          <Text style={styles.text}>{post?.id}</Text>
          <Text style={styles.text}>{post?.userId}</Text>
          <Text style={styles.text}>{post?.title}</Text>
          <Text style={styles.text}>{post?.body}</Text>
        </View>
        {error && <Text>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={onPressFetch}>
          {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Fetch</Text>}
        </TouchableOpacity>
        <View style={styles.spacer}/>
        <TouchableOpacity style={styles.button} onPress={onPressAddToDb}>
          <Text style={styles.buttonText}>Add to couchbase</Text>
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
    color: 'red'
   },
   spacer: {
    height: 24
   },
   postContainer: {
    borderWidth: 1,
    borderRadius: 9,
    marginVertical: 24
   },
   text: {
    fontSize: 16,
    paddingBottom: 9,
    paddingLeft: 9
   },
   textInput: {
    borderWidth: 2,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 12,
    marginBottom: 12
   },
   button: {
    backgroundColor: 'black',
    borderWidth: 2,
    borderRadius: 9,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center'
   },
   buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold'
   },
   headline: {
    paddingTop: 24,
    fontSize: 24,
    fontWeight: 'bold',

   }
});

export default HomeScreen;
