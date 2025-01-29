import { Text, View, StyleSheet, ImageBackground } from "react-native";
import Mainpg from '../Screens/Mainpg';
import { StatusBar } from "expo-status-bar";
import React from 'react';


export default function Index() {
  return (
    <View style= {styles.container} >
      <Mainpg />
      
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