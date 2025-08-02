/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */


import React from 'react';
import Main from './Main';
import { DatabaseProvider } from './DatabaseProvider';


function App() {

  return (
    <DatabaseProvider>
      <Main />
    </DatabaseProvider>
  );
}


export default App;
