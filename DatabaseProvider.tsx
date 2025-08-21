// context/DatabaseProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from './database.service';
import { Text, View } from 'react-native';



const DatabaseContext = createContext<DatabaseService | null>(null);

export const DatabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [dbService, setDbService] = useState<DatabaseService | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const service = new DatabaseService();
      try {
        await service.initializeDatabase(); // awaits DB init
        setDbService(service);
        setIsReady(true);
      } catch (e) {
        console.error('Failed to initialize DB', e);
      }
    };

    init();
  }, []);

  if (!isReady) {
    return <LoadingScreen />; // or null or splash
  }

  return (
    <DatabaseContext.Provider value={dbService}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within DatabaseProvider');
  return context;
};

// You can make a better loading UI
const LoadingScreen = () => (
  <View style={{backgroundColor: 'black'}}>
    <Text>Loading</Text>
  </View>
);
