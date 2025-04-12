import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { database } from "../Firebase/firebaseConfig";
import { ref, get, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerForPushNotificationsAsync } from './NotificationHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';  // Import AsyncStorage


//line283 for demo 
const CustomScreen = () => {

  //  useFocusEffect(
  //   useCallback(() => {
  //     const registerPushToken = async () => {
  //       const token = await registerForPushNotificationsAsync();
  //       const user = getAuth().currentUser;
  //       if (token && user) {
  //         const db = getDatabase();
  //         const userTokenRef = ref(db, `users/${user.uid}/push_token`);
  //         await update(userTokenRef, { push_token: token });
  //         console.log(" Push token registered for user");
  //         console.log(" CustomScreen focused. Attempting push registration...");
  //         console.log(" Saved token to Firebase for user:", user.uid);
  //       }
  //     };

  //     registerPushToken();
  //   }, [])
  // );
  
  const [thresholds, setThresholds] = useState({
    temperature: "",
    humidity: "",
    pressure: "",
    airQuality: "",
    noise: "",
    presence: "",
  });

  const [sensorValues, setSensorValues] = useState({
    temperature: null,
    humidity: null,
    pressure: null,
    airQuality: null,
    noise: null,
    presence: null,
  });

  // Load thresholds from AsyncStorage
  const loadThresholds = async () => {
  try {
    const saved = await AsyncStorage.getItem('thresholds');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all values are numbers
      const cleaned = Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, Number(v)])
      );
      setThresholds(cleaned);
      console.log(" Loaded thresholds from storage:", cleaned);
    } else {
      console.log(" No thresholds found in AsyncStorage");
    }
  } catch (error) {
    console.log(" Error loading thresholds", error);
  }
};

  // Save thresholds to AsyncStorage
  const saveThresholds = async () => {
    try {
      await AsyncStorage.setItem('thresholds', JSON.stringify(thresholds));  // Save current thresholds
    } catch (error) {
      console.log("Error saving thresholds", error);
    }
  };

  // Run loadThresholds when the component mounts
  useEffect(() => {
    const timeout = setTimeout(() => {
    loadThresholds();  // Load thresholds when app starts
  }, 1000); // debounce by 1000ms
    return () => clearTimeout(timeout);
  }, []);

  // Call saveThresholds whenever the thresholds change
  useEffect(() => {
  const timeout = setTimeout(() => {
    const isValid = Object.values(thresholds).every(val => typeof val === 'number' && !isNaN(val));
    if (isValid) {
      console.log(" Thresholds saved:", thresholds);
      saveThresholds();
    } else {
      console.log("⏸ Not saving thresholds. Invalid state:", thresholds);
    }
  }, 2000); // debounce by 2000ms

  return () => clearTimeout(timeout);
}, [thresholds]);


  const decodePresence = (value, alertMessages) => {
    // Assuming presence value is a bitmask or a set of states represented by a number
    const bitValue = value & 0xFF;

    const sensorStates = {
      right: (bitValue & 0b11),
      left: ((bitValue >> 2) & 0b11),
      back: ((bitValue >> 4) & 0b11),
      front: ((bitValue >> 6) & 0b11),
    };

    console.log("Decoded sensor states: ", sensorStates);
    console.log("Raw presence value (in decimal): ", value);
    console.log("Raw presence value (in binary): ", value.toString(2).padStart(8, "0"));

    // Checking the presence states and pushing alerts based on them
    for (const [sensor, state] of Object.entries(sensorStates)) {
      const messageBase = `${capitalize(sensor)} Sensor Alert`;
      switch (state) {
        case 0:
          console.log(`${messageBase}: No presence detected`);
          break;
        case 1:
          const msg1 = `⚠️ ${messageBase}: Weak presence detected.`;
          console.log(msg1);
          alertMessages.push(msg1);
          break;
        case 2:
          const msg2 = `⚠️ ${messageBase}: Moderate motion possible.`;
          console.log(msg2);
          alertMessages.push(msg2);
          break;
        case 3:
          const msg3 = `⚠️ ${messageBase}: Strong motion detected.`;
          console.log(msg3);
          alertMessages.push(msg3);
          break;
        default:
          break;
      }
    }
  };

  const fetchAndCheck = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      console.log("🚫 User not logged in, skipping fetchAndCheck");
      return;
    }

    const thresholdsReady = Object.values(thresholds).every(
    (v) => typeof v === 'number' && !isNaN(v)
  );
  if (!thresholdsReady) {
    console.log("⏸ Thresholds not ready yet, skipping fetchAndCheck.");
    return;
    }
    
    console.log("🔄 Running fetchAndCheck...");

    let alertMessages = [];

    try {
      const paths = ["temperature", "humidity", "pressure", "airQuality", "noise"];
      const newValues = {};

      for (const key of paths) {
        const snap = await get(ref(database, `/sentry/readings/${key}`));
        newValues[key] = snap.exists() ? snap.val() : null;
      }

      const noiseSnap = await get(ref(database, `/sentry/readings/noise`));
      if (noiseSnap.exists()) {
        newValues.noise = noiseSnap.val();
        if (newValues.noise > thresholds.noise) {
          alertMessages.push(`⚠️ Noise exceeds threshold: ${newValues.noise} dB`);
        }
      }

      const noiseStateSnap = await get(ref(database, `/sentry/alerts/noise`));
if (noiseStateSnap.exists()) {
  const noiseState = noiseStateSnap.val();
  const noiseMsgs = [
    null,
    "⚠️ Noise: Weak spike above threshold",
    "⚠️ Noise: Moderate spike above threshold",
    "⚠️ Noise: Strong spike above threshold",
  ];

  // ✅ Only show alert if noiseState is 2 or 3
  if (noiseState >= 2 && noiseMsgs[noiseState]) {
    alertMessages.push(noiseMsgs[noiseState]);
  }
} 

      const presenceSnap = await get(ref(database, `/sentry/alerts/presence`));
      if (presenceSnap.exists()) {
        newValues.presence = presenceSnap.val();
        decodePresence(newValues.presence, alertMessages);
      }

      setSensorValues(newValues);
      // Check Firebase alert states directly
      const alertStatesSnap = await get(ref(database, '/sentry/alerts'));
      if (alertStatesSnap.exists()) {
        const alertStates = alertStatesSnap.val();
        const alertMessagesFromFirebase = [];

        

       // Used to local check, now check firebase directly
      const thresholdsData = {};
      ["temperature", "humidity", "pressure", "airQuality"].forEach(sensor => {
        if (newValues[sensor] !== null) {
          const isAbove = newValues[sensor] > thresholds[sensor];
          thresholdsData[sensor] = isAbove;
          if (isAbove) alertMessages.push(`⚠️ ${capitalize(sensor)} exceeds threshold: ${newValues[sensor]}`);
        }
      });

      await update(ref(database, '/sentry/alerts'), {
        temperature: thresholdsData.temperature || false,
        humidity: thresholdsData.humidity || false,
        pressure: thresholdsData.pressure || false,
        airQuality: thresholdsData.airQuality || false,
        
      });
      console.log("Updated Firebase with alert states:", thresholdsData);
      console.log(" FINAL ALERT MESSAGES:", alertMessages);
      const fullMessage = alertMessages.filter(msg => !!msg).join("\n");
      console.log(" COMPILED MESSAGE:", fullMessage);

      if (alertMessages.length > 0) {
        if (!global.alertShown) {
          global.alertShown = true; // Set the flag to true when alert is shown
          Alert.alert("Sensor Alerts", fullMessage, [
            {
              text: "OK",
              onPress: () => {
                global.alertShown = false; // Reset the flag when "OK" is pressed
              },
            },
          ]);
          setTimeout(() => {
            global.alertShown = false; // Reset the flag after a delay
          }, 20000); // 20 seconds delay
      
          try {
            const wasNotified = await AsyncStorage.getItem('pushTokenSent');
            if (!wasNotified) {
              if (fullMessage && fullMessage.trim() !== "") {
                await registerForPushNotificationsAsync(fullMessage);
                console.log(" Push notification sent with message:", fullMessage);
              }
              await AsyncStorage.setItem('pushTokenSent', 'true');
            } else {
              console.log(" Push token already registered this session.");
            }
          } catch (err) {
            console.warn(" Failed to manage push token session flag:", err);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error during fetchAndCheck:", error);
  }
};

  useEffect(() => {
  const thresholdsReady = Object.values(thresholds).every(
    (v) => typeof v === 'number' && !isNaN(v)
  );

  if (!thresholdsReady) return;

  const interval = setInterval(() => {
    fetchAndCheck();
  }, 200000); // 200 seconds

  return () => clearInterval(interval);
}, [thresholds]);

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const renderSensor = (label, unit, min, max, color) => {
    const value = sensorValues[label]; // Use sensorValues here
    const threshold = thresholds[label];
    return (
      <View style={styles.sensorContainer}>
        <Text style={styles.sensorLabel}>
          {capitalize(label)}: {value != null ? `${label === "temperature" ? Math.round(value * (9 / 5) + 32) : value} ${unit}` : "Loading..."}
        </Text>
        <Text style={styles.sensorLabel}>
          Threshold: {label === "temperature" ? Math.round(threshold * (9 / 5) + 32) : threshold} {unit}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={Number(threshold) || 0}
          onValueChange={(val) =>
            setThresholds((prev) => ({
              ...prev,
              [label]: Math.round(val),
            }))
          }
          minimumTrackTintColor={color}
          maximumTrackTintColor="#000"
          thumbTintColor={color}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Custom Sensor Settings</Text>

      {renderSensor("temperature", "°F", -40, 70, "red")}
      {renderSensor("humidity", "%", 0, 100, "#00BFFF")}
      {renderSensor("pressure", "hPa", 300, 1300, "grey")}
      {renderSensor("airQuality", "AQI", 50, 500, "#32CD32")}
      {renderSensor("noise", "dB", 70, 120, "yellow")}

      <TouchableOpacity style={styles.button} onPress={() => { global.alertShown = false; fetchAndCheck(); }}>
        <Text style={styles.buttonText}>Manual Check Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#25292e",
  },
  header: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sensorContainer: {
    marginBottom: 20,
  },
  sensorLabel: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CustomScreen;
