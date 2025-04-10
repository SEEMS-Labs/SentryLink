import React, { useEffect, useState } from "react";
import { Alert, PermissionsAndroid, Platform, ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { auth } from './Firebase/firebaseConfig';
import { registerForPushNotificationsAsync } from './screens/NotificationHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from "./screens/authen";
import HomeScreen from "./screens/home";
import CameraScreen from "./screens/Cam";
import CustomScreen from './screens/custom';
import WiFiSetup from "./screens/WiFiSetup";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const allGranted = Object.values(granted).every(
        value => value === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        console.warn("Not all Bluetooth permissions granted");
      }
    } catch (err) {
      console.warn("Permission error:", err);
    }
  }
};

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
  const [skipWiFi, setSkipWiFi] = useState(false);
  const [isCheckingWiFi, setIsCheckingWiFi] = useState(true);

  useEffect(() => {
  requestBluetoothPermissions();

  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log("Notification received in foreground:", notification);
    Alert.alert(notification.request.content.title, notification.request.content.body);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log("User interacted with notification:", response);
  });

  const checkStoredWiFi = async (uid) => {
    try {
      const savedSSID = await AsyncStorage.getItem(`wifi_ssid_${uid}`);
      if (savedSSID) {
        setSkipWiFi(true);
      }
    } catch (error) {
      console.error("Error reading saved Wi-Fi:", error);
    } finally {
      setIsCheckingWiFi(false);
    }
  };

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("User: ", user);
    setUser(user);

    const db = getDatabase();
    const userStatusRef = ref(db, "sentrylink/user_in_app");
    set(userStatusRef, user ? true : false)
      .then(() => console.log("User in app status updated"))
      .catch((error) => console.error("Error updating user status:", error));

    if (user) {
      checkStoredWiFi(user.uid);
    } else {
      setIsCheckingWiFi(false);
    }
  });

  return () => {
    unsubscribe();
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}, [user]);

  return (
    <NavigationContainer>
  <Stack.Navigator>
    {isCheckingWiFi ? (
      <Stack.Screen name="Loading" options={{ headerShown: false }}>
        {() => (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2c3338" }}>
            <ActivityIndicator size="large" color="#C57B57" />
          </View>
        )}
      </Stack.Screen>
    ) : !user ? (
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    ) : !skipWiFi ? (
      <Stack.Screen name="WiFiSetup">
        {(props) => <WiFiSetup {...props} setSkipWiFi={setSkipWiFi} />}
      </Stack.Screen>
    ) : (
      <Stack.Screen name="Inside" component={MyTabs} options={{ headerShown: false }} />
    )}
  </Stack.Navigator>
</NavigationContainer>
  );
}
