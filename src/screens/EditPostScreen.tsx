/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { BackHandler, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import Snackbar from 'react-native-snackbar';

import { useDatabase } from '../../DatabaseProvider';
import CBTextInput from '../components/CBTextInput/CBTextInput';
import CBButtonPrimary from '../components/CBButtonPrimary/CBButtonPrimary';
import { ArrowLeftIcon, Backpack } from 'lucide-react-native';

function EditPostScreen({ route }) {
  const {
    item: { post },
  } = route.params;
  const [title, setTitle] = useState<any>(post.title);
  const [body, setBody] = useState<any>(post.body);
  const [titleError, setTitleError] = useState<any>('');
  const [bodyError, setBodyError] = useState<any>('');
  const dbService = useDatabase();
  const navigation = useNavigation();

  useEffect(() => {
    // Optional cleanup
    return () => {};
  }, [dbService]);

  const onPressUpdate = async () => {
    if (!title) {
      setTitleError("Title field shouldn't be empty!");
    } else {
      setTitleError('');
    }
    if (!body) {
      setBodyError("Body field shouldn't be empty!");
    } else {
      setBodyError('');
    }

    try {
      const status = await dbService.updatePost(route.params.item.docId, {
        title,
        body,
      });
      if (status) {
        Snackbar.show({
          text: 'Post updated successfully',
          duration: Snackbar.LENGTH_SHORT,
        });
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      console.error('Error while updating document ❌');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeftIcon size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Post</Text>
          </View>
          <View style={styles.screenContainer}>
            <CBTextInput
              label="Title"
              value={title}
              placeholder="Title"
              onChangeText={setTitle}
              error={titleError}
              multiline
            />
            <CBTextInput
              label="Body"
              value={body}
              placeholder="Body"
              onChangeText={setBody}
              error={bodyError}
              multiline
            />
            <CBButtonPrimary title="Update" onPress={onPressUpdate} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default EditPostScreen;
