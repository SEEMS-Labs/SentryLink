import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { CurvedBottomBarExpo } from "react-native-curved-bottom-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Animated, Alert, TouchableOpacity, StyleSheet, View } from "react-native";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/Auth";
import CamScreen from "./screens/Cam";
import WiFiSetupScreen from "./screens/WifiSetup";
import { onAuthStateChanged, User } from "firebase/auth";
import { set } from "firebase/database";
import { auth } from "./Firebase/firebaseConfig";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
 
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function InsideLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Cam") iconName = "camera";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cam" component={CamScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("User: ", user);
      setUser(user);
    });

    return () => unsubscribe(); // Clean up listener
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {user ? (
            <Stack.Screen name="Inside" component={InsideLayout} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// import React, { useState } from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import { CurvedBottomBarExpo } from "react-native-curved-bottom-bar";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { Animated, Alert, TouchableOpacity, StyleSheet, View } from "react-native";
// import HomeScreen from "./screens/HomeScreen";
// import LoginScreen from "./screens/Auth";
// import CamScreen from "./screens/Cam";
// import WiFiSetupScreen from "./screens/WifiSetup";

// const Stack = createStackNavigator();

// export default function App() {
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <NavigationContainer>
//         <Stack.Navigator initialRouteName={LoginScreen}>
//           <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
//           <Stack.Screen name="HomeScreen" component={HomeScreen} />
//           <Stack.Screen name="Cam" component={CamScreen} />
//           <Stack.Screen name="WifiSetup" component={WifiSetupScreen} />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </GestureHandlerRootView>;
//   }

// // Separate Bottom Tabs Navigation
// function MainTabs() {
//   const _renderIcon = (routeName, selectedTab) => {
//     let icon = "";
//     switch (routeName) {
//       case "Home":
//         icon = "ios-home-outline";
//         break;
//       case "Cam":
//         icon = "camera-outline";
//         break;
//       case "Wifi":
//         icon = "wifi-outline";
//         break;
//     }
//     return (
//       <Ionicons
//         name={icon}
//         size={25}
//         color={routeName === selectedTab ? "black" : "gray"}
//       />
//     );
//   };

//   const renderTabBar = ({ routeName, selectedTab, navigate }) => {
//     return (
//       <TouchableOpacity
//         onPress={() => navigate(routeName)}
//         style={styles.tabbarItem}
//       >
//         {_renderIcon(routeName, selectedTab)}
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <CurvedBottomBarExpo.Navigator
//       type="DOWN"
//       style={styles.bottomBar}
//       shadowStyle={styles.shadow}
//       height={55}
//       circleWidth={50}
//       bgColor="white"
//       initialRouteName="Home"
//       borderTopLeftRight
//       renderCircle={({ selectedTab, navigate }) => (
//         <Animated.View style={styles.btnCircleUp}>
//           <TouchableOpacity
//             style={styles.button}
//             onPress={() => Alert.alert("Circle Action")}
//           >
//             <Ionicons name={"apps-sharp"} color="gray" size={25} />
//           </TouchableOpacity>
//         </Animated.View>
//       )}
//       tabBar={renderTabBar}
//     >
//       <CurvedBottomBarExpo.Screen name="Home" component={HomeScreen} />
//       <CurvedBottomBarExpo.Screen name="Cam" component={CamScreen} />
//       <CurvedBottomBarExpo.Screen name="Wifi" component={WiFiSetupScreen} />
//     </CurvedBottomBarExpo.Navigator>
//   );
// }

// // Styles
// const styles = StyleSheet.create({
//   bottomBar: {},
//   shadow: {
//     shadowColor: "#DDDDDD",
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 1,
//     shadowRadius: 5,
//   },
//   button: { flex: 1, justifyContent: "center" },
//   btnCircleUp: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#E8E8E8",
//     bottom: 30,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.41,
//     elevation: 1,
//   },
//   tabbarItem: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });