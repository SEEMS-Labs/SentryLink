import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Text } from "react-native";

export default function WiFiSetupScreen() {
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [error, setError] = useState("");

  const handleWiFiConnect = () => {
    // Connect to the Wi-Fi using the provided credentials (this step depends on platform)
    // Once connected, save these details to Firebase Realtime Database
    // Here we're assuming a method to save it on Firebase or locally
    if (wifiSSID && wifiPassword) {
      // Save Wi-Fi credentials in Firebase or local storage for future use
      const user = auth.currentUser;
      if (user) {
        // Save Wi-Fi details to Firebase (assume we have a path like 'users/{userId}/wifi')
        const userWiFiRef = ref(database, 'users/' + user.uid + '/wifi');
        set(userWiFiRef, { ssid: wifiSSID, password: wifiPassword })
          .then(() => {
            console.log("Wi-Fi details saved");
            // Now connect to SEEMS robot
            navigateToRobotConnection();
          })
          .catch((error) => {
            setError("Error saving Wi-Fi details.");
            console.log(error);
          });
      }
    } else {
      setError("Please enter valid Wi-Fi details.");
    }
  };

  const navigateToRobotConnection = () => {
    // Logic to connect to the SEEMS robot (likely via a local connection to the robot)
    // For simplicity, assume we trigger the connection here
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Wi-Fi SSID"
        value={wifiSSID}
        onChangeText={setWifiSSID}
      />
      <TextInput
        style={styles.input}
        placeholder="Wi-Fi Password"
        secureTextEntry
        value={wifiPassword}
        onChangeText={setWifiPassword}
      />
      <Button title="Connect to Wi-Fi" onPress={handleWiFiConnect} />
      {error && <Text>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#25292e",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    color: "#fff",
  },
});