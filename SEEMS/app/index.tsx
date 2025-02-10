import React from 'react';
import { View, StyleSheet } from 'react-native';
import Mainpg from '../Screens/Mainpg'; // Import your Mainpg component
import Cam from '../Screens/Cam'; // Import Cam component
import "../firebaseConfig"; // Import firebase configuration (firebaseConfig.js) file
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  return (
    <View style={styles.container}>
      {/* Mainpg will handle displaying sensor data */}
      <Cam />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
});
