// src/navigation/MainNavigation.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import FeaturesScreen from '../screens/ProfileScreen';
import PostScreen from '../screens/PostScreen';

import { Home, List, Star } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import { createStackNavigator } from '@react-navigation/stack';
import EditPostScreen from '../screens/EditPostScreen';

const Tab = createBottomTabNavigator();

const PostStackNaviagtion = createStackNavigator();
function PostStack() {
  return (
    <PostStackNaviagtion.Navigator>
      <PostStackNaviagtion.Screen name="Post" component={PostScreen} />
      <PostStackNaviagtion.Screen name="EditPost" component={EditPostScreen} />
    </PostStackNaviagtion.Navigator>
  );
}


export default function MainNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Home />
          } else if (route.name === 'List') {
            return <List />
          } 
          return <Star  />          
        },
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="List" component={PostStack} options={{headerShown: false}} />
      <Tab.Screen name="Features" component={FeaturesScreen} />
    </Tab.Navigator>
  );
}
