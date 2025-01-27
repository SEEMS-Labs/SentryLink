import { Text, View, StyleSheet, ImageBackground } from "react-native";
import Weather from '../Screens/Weather';
import { StatusBar } from "expo-status-bar";
import React from 'react';


export default function Index() {
  return (
    <View style= {styles.container} >
      <Weather />
      
      <StatusBar style="auto" />
    </View>
  ); 
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e" , 
  },
  text: {
    color: "#FFF",
  },
});