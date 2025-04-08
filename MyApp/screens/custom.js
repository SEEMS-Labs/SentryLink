import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { database } from "../Firebase/firebaseConfig";
import { ref, get } from "firebase/database";
import { registerForPushNotificationsAsync } from "./NotificationHandler";

const CustomScreen = () => {
  const [thresholds, setThresholds] = useState({
    temperature: 75, // Initial threshold set to 75°F for temperature
    humidity: 60,
    pressure: 1013,
    airQuality: 150,
    noise: 90,
    presence: "",
  });

  const [sensorValues, setSensorValues] = useState({
    temperature: "",
    humidity: "",
    pressure: "",
    airQuality: "",
    noise: "",
    presence: "",
  });

   // Decodes 8-bit presence value into individual sensor states
  const decodePresence = (value) => {
    const sensorStates = {
      right: (value & 0b11),        // Bits 0-1
      left: ((value >> 2) & 0b11),   // Bits 2-3
      back: ((value >> 4) & 0b11),   // Bits 4-5
      front: ((value >> 6) & 0b11),  // Bits 6-7
    };

    // Alert logic based on sensor state
    Object.entries(sensorStates).forEach(([sensor, state]) => {
      switch (state) {
        case 0:
          break; // No presence detected
        case 1:
          Alert.alert(`${capitalize(sensor)} Sensor Alert`, `${capitalize(sensor)} weak presence detected.`);
          registerForPushNotificationsAsync(`${capitalize(sensor)} weak presence detected.`);
          break;
        case 2:
          Alert.alert(`${capitalize(sensor)} Sensor Alert`, `${capitalize(sensor)} presence certain, motion possible.`);
          registerForPushNotificationsAsync(`${capitalize(sensor)} presence certain, motion possible.`);
          break;
        case 3:
          Alert.alert(`${capitalize(sensor)} Sensor Alert`, `${capitalize(sensor)} strong motion detected.`);
          registerForPushNotificationsAsync(`${capitalize(sensor)} strong motion detected.`);
          break;
        default:
          break;
      }
    });
  };

  const fetchAndCheck = async () => {
    try {
      const paths = ["temperature", "humidity", "pressure", "airQuality", "noise", "presence" ];
      const newValues = { ...sensorValues };

      for (const key of paths) {
        const snap = await get(ref(database, `/sentry/readings/${key}`));
        if (snap.exists()) {
          newValues[key] = snap.val();
        }
      }

      setSensorValues(newValues);

      // Decode and check the presence sensor value
      if (newValues.Presence !== undefined) {
        decodePresence(newValues.Presence);
      }

      // Debug: Log the fetched values
      console.log("Fetched sensor values: ", newValues);

      // Alert if over threshold, every time
      Object.entries(newValues).forEach(([key, value]) => {
        if (key !== "Presence" && value > thresholds[key]) {
          Alert.alert(`${capitalize(key)} Alert`, `${capitalize(key)} exceeds threshold: ${value}`);
          registerForPushNotificationsAsync(`${capitalize(key)} exceeds threshold: ${value}`);
        }
      });
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchAndCheck, 20000); // every 20 seconds
    return () => clearInterval(interval);
  }, [thresholds]);

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const renderSensor = (label, unit, min, max, color) => {
    const value = sensorValues[label];
    const threshold = thresholds[label];
    return (
      <View style={styles.sensorContainer}>
        <Text style={styles.sensorLabel}>
          {capitalize(label)}: {value != null ? `${label === "temperature" ? Math.round(value * (9/5) + 32) : value} ${unit}` : "Loading..."}
        </Text>
        <Text style={styles.sensorLabel}>
          Threshold: {label === "temperature" ? Math.round(threshold * (9/5) + 32) : threshold} {unit}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={threshold}
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

      {renderSensor("temperature", "°F", 30, 70, "red")}
      {renderSensor("humidity", "%", 0, 100, "#00BFFF")}
      {renderSensor("pressure", "hPa", 300, 1100, "grey")}
      {renderSensor("airQuality", "AQI", 50, 500, "#32CD32")}
      {renderSensor("noise", "dB", 80, 120, "yellow")}

      <TouchableOpacity style={styles.button} onPress={fetchAndCheck}>
        <Text style={styles.buttonText}>Manual Check Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#282828",
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
