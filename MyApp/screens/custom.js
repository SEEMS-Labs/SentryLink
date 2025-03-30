import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomScreen = () => {
  useEffect(() => {
    fetchData();
  }, []);




  const fetchData = async () => {
    //let data = await getItemInStorage('somedata'), this is an example of how to get an item from storage
  }




  //Helpers
  const getItemInStorage = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return value;
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Custom Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3338',
    padding: 20,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
});

export default CustomScreen;
