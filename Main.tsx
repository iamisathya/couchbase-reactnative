/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from './DatabaseProvider';

const hotelData = {
    name: 'Palm Tree Resort',
    address: '123 Ocean Drive',
    city: 'Goa',
    country: 'India',
    description: 'A peaceful beach resort.',
    vacancy: true,
  };

function Main() {
  const dbService = useDatabase();

  useEffect(() => {

    
    const saveHotelExample = async () => {      
      try {
        setTimeout(async() => {
          const id = await dbService.saveHotel(hotelData);
          console.log('Hotel saved with ID:', id);
        }, 2000);
      } catch (err) {
        console.error(err);
      }
    };
    
    const getHotels = async() => {
      console.log('hotes', await dbService.getHotels());
    }

    saveHotelExample();
    getHotels();
  }, [dbService])
  
  return (
    <View style={styles.container}>
      <Text>Sathya</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:"#f0df0f0"
   },
});

export default Main;
