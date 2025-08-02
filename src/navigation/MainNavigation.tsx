// src/navigation/MainNavigation.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ProfileScreen from '../screens/ProfileScreen';
import PostScreen from '../screens/PostScreen';
import Main from '../../Main';
import { Home, List, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

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
          return <User  />          
        },
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="List" component={PostScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
