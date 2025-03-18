/*
import React from 'react';
import { Text, View, Button, StyleSheet } from 'react-native';
import Mainpg from '../Screens/Mainpg'; // Import your Mainpg component
import Cam from '../Screens/Cam'; // Import Cam component
import Auth1 from '../Screens/Auth1'; // Import Auth1 component
import { createStaticNavigation, useNavigation,} from '@react-navigation/native';
import "../Firebase/firebaseConfig"; // Import firebase configuration (firebaseConfig.js) file
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  return (
    <View style={styles.container}>
      {/* Mainpg will handle displaying sensor data }
      <Mainpg />
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
*/

import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Mainpg from '../Screens/Mainpg';
import Cam from '../Screens/Cam';
import Auth1 from '../Screens/Auth1';
import { create } from 'react-test-renderer';

const Stack = createStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator initialRouteName="Mainpg">
      <Stack.Screen name="Mainpg" component={Mainpg} />
      <Stack.Screen name="Cam" component={Cam} />
      <Stack.Screen name="Auth1" component={Auth1} />
    </Stack.Navigator>
  );
}



export default function App() {
  return (

    <Stack.Navigator initialRouteName="Mainpg">
      <Stack.Screen name="Mainpg" component={Mainpg} />
      <Stack.Screen name="Cam" component={Cam} />
      <Stack.Screen name="Auth1" component={Auth1} />
    </Stack.Navigator>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
});