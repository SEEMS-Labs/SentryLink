import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { auth } from './Firebase/firebaseConfig';

import LoginScreen from "./screens/authen";
import HomeScreen from "./screens/home";
import CameraScreen from "./screens/Cam";
import CustomScreen from './screens/custom';
import WiFiSetup from "./screens/WiFiSetup";
import { registerForPushNotificationsAsync } from './screens/NotificationHandler';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabs() {
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      console.log('User signed out');
    } catch (error) {
      console.error("Sign out error:", error.message);
    }
  };

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#2c3338' } }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tab.Screen name="Custom" component={CustomScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />
      <Tab.Screen name="Camera" component={CameraScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} /> }} />
      <Tab.Screen name="Logout" component={LoginScreen} listeners={{ tabPress: (e) => { e.preventDefault(); handleLogout(); } }} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="log-out" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Push notification token:", token);
        // TODO: Send token to server here if needed
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received in foreground:", notification);
      Alert.alert(notification.request.content.title, notification.request.content.body);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("User interacted with notification:", response);
      // navigate or handle the notification 
    });

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

    return () => {
      unsubscribe();
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {user ? (
          <Stack.Screen name="Inside" component={MyTabs} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
