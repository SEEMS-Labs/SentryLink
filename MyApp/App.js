import React, { useEffect, useState } from "react";
import { Animated, Alert, TouchableOpacity, StyleSheet, View , PermissionsAndroid } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { CurvedBottomBarExpo } from "react-native-curved-bottom-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, database } from './Firebase/firebaseConfig';
import { getAuth, signOut } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

import LoginScreen from "./screens/authen";
import HomeScreen from "./screens/home";
import CameraScreen  from "./screens/Cam";
import CustomScreen from './screens/custom';
//import WiFiSetup from "./screens/WiFiSetup";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

async function requestPermissions() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Location permission granted");
    } else {
      console.log("Location permission denied");
    }
  } catch (err) {
    console.warn(err);
  }
}

function MyTabs() {
  const handleLogout = async () => {
    try {
      await signOut(getAuth()); 
      console.log('User signed out');
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2c3338',
          borderTopWidth: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Custom"
        component={CustomScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Logout"
        component={LoginScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // Prevent navigation
            handleLogout(); // Call logout function
          },
        }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("User: ", user);
      setUser(user);
    const db = getDatabase();
    const userStatusRef = ref(db, "sentrylink/user_in_app");

    // Update the database element: true if user exists, false otherwise
    set(userStatusRef, user ? true : false)
      .then(() => console.log("User in app status updated"))
      .catch((error) => console.error("Error updating user status:", error));
  });

    return () => unsubscribe(); // Clean up listener
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {user ? (
    <>
      {/* After login, direct the user to WiFiSetup first */}
       {/* <Stack.Screen name="WiFiSetup" component={WiFiSetup} options={{ headerShown: false }} />  */}
      <Stack.Screen name="Inside" component={MyTabs} options={{ headerShown: false }} />
    </>
  ) : (
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
  )}
</Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}