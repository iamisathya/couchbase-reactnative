/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */


import React from 'react';
import { DatabaseProvider } from './DatabaseProvider';
import MainNavigation from './src/navigation/MainNavigation';
import { NavigationContainer } from '@react-navigation/native';

function App() {
  return (
    <DatabaseProvider>
      <NavigationContainer>
        <MainNavigation/>
      </NavigationContainer>
    </DatabaseProvider>
  );
}


export default App;
