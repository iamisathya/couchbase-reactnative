/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */


import React, { useEffect } from 'react';
import { DatabaseProvider } from './DatabaseProvider';
import MainNavigation from './src/navigation/MainNavigation';
import { NavigationContainer } from '@react-navigation/native';
import AppStateManager from './src/utils/appStateManager';

function App() {
  useEffect(() => {
    console.log('🚀 APP STARTING: Initializing AppStateManager...');
    
    // Initialize app state manager
    AppStateManager.initialize();
    
    // Cleanup on app unmount
    return () => {
      console.log('🔄 APP UNMOUNTING: Cleaning up AppStateManager...');
      AppStateManager.cleanup();
    };
  }, []);

  return (
    <DatabaseProvider>
      <NavigationContainer>
        <MainNavigation/>
      </NavigationContainer>
    </DatabaseProvider>
  );
}


export default App;
