import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { database } from "../Firebase/firebaseConfig";
import { update,ref, get, set } from "firebase/database";
import { registerForPushNotificationsAsync } from "./NotificationHandler";

const CustomScreen = () => {
  const [thresholds, setThresholds] = useState({
    temperature: 65, // Initial threshold set to 75°C for temperature
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
    const bitValue = value & 0xFF;  // Mask to 8 bits (values between 0-255)
    const sensorStates = {
      right: (bitValue & 0b11),
      left: ((bitValue >> 2) & 0b11),
      back: ((bitValue >> 4) & 0b11),
      front: ((bitValue >> 6) & 0b11),
    };

    console.log("Decoded sensor states: ", sensorStates);
    console.log("Raw presence value (in decimal): ", value);
    console.log("Raw presence value (in binary): ", value.toString(2).padStart(8, "0"));

    Object.entries(sensorStates).forEach(([sensor, state]) => {
      switch (state) {
        case 0:
          console.log(`${capitalize(sensor)}: No presence detected`);
          break;
        case 1:
          console.log(`${capitalize(sensor)}: Weak presence detected`);
          Alert.alert(`${capitalize(sensor)} Sensor Alert`, `${capitalize(sensor)} weak presence detected.`);
          registerForPushNotificationsAsync(`${capitalize(sensor)} weak presence detected.`);
          break;
        case 2:
          console.log(`${capitalize(sensor)}: Presence certain, motion possible`);
          Alert.alert(`${capitalize(sensor)} Sensor Alert`, `${capitalize(sensor)} presence certain, motion possible.`);
          registerForPushNotificationsAsync(`${capitalize(sensor)} presence certain, motion possible.`);
          break;
        case 3:
          console.log(`${capitalize(sensor)}: Strong motion detected`);
          Alert.alert(`${capitalize(sensor)} Sensor Alert`, `${capitalize(sensor)} strong motion detected.`);
          registerForPushNotificationsAsync(`${capitalize(sensor)} strong motion detected.`);
          break;
        default:
          break;
      }
    });
  };

 const sendThresholdsToFirebase = () => {
    // Log initial thresholds to verify what we're starting with
    console.log("Initial thresholds:", thresholds);

    // Apply bitwise mask and shift each value into its correct 64-bit position
    const temperatureThreshold = thresholds.temperature & 0x7F; // Masking 7 bits
    const humidityThreshold = thresholds.humidity & 0x1FF;   // Masking 9 bits
    const noiseThreshold = thresholds.noise & 0xFF;           // Masking 8 bits
    const presenceThreshold = thresholds.presence & 0x1FF;    // Masking 9 bits
    const airQualityThreshold = thresholds.airQuality & 0x1FF; // Masking 9 bits
    const pressureThreshold = thresholds.pressure & 0x7FF;    // Masking 11 bits

    // Shift each threshold into its correct position in the 64-bit value
    const combinedThresholds = 
        (temperatureThreshold << 0) |   // Shift temperature threshold (7 bits) into the lower bits
        (humidityThreshold << 7) |      // Shift humidity threshold (7 bits) into the next position
        (noiseThreshold << 14) |        // Shift noise threshold (7 bits) into the next position
        (presenceThreshold << 21) |     // Shift presence threshold (9 bits) into the next position
        (airQualityThreshold << 30) |   // Shift air quality threshold (9 bits) into the next position
        (pressureThreshold << 39);      // Shift pressure threshold (11 bits) into the next position

    // Log the combined 64-bit value to verify
    console.log("Combined Thresholds (64-bit):", combinedThresholds);

    // Send the combined 64-bit value to Firebase
    const thresholdsRef = ref(database, '/sentrylink/');
    update(thresholdsRef, {
        user_config: combinedThresholds,  // Send as a single 64-bit value
    }).then(() => {
        console.log("Thresholds successfully updated in Firebase");
    }).catch((error) => {
        console.error("Error sending thresholds to Firebase:", error);
    });
  };
  
  const fetchAndCheck = async () => {
    try {
      const paths = ["temperature", "humidity", "pressure", "airQuality", "noise", "presence"];
      const newValues = { ...sensorValues };

      for (const key of paths) {
        const snap = await get(ref(database, `/sentry/readings/${key}`));
        if (snap.exists()) {
          newValues[key] = snap.val();
        }
      }

      setSensorValues(newValues);

      if (newValues.presence !== undefined) {
        decodePresence(newValues.presence);
      }

      // Debug: Log the fetched values
      console.log("Fetched sensor values: ", newValues);

      // Check if any value exceeds its threshold
      Object.entries(newValues).forEach(([key, value]) => {
        if (key !== "presence" && value > thresholds[key]) {
          Alert.alert(`${capitalize(key)} Alert`, `${capitalize(key)} exceeds threshold: ${value}`);
          registerForPushNotificationsAsync(`${capitalize(key)} exceeds threshold: ${value}`);
        }
      });

      // Send thresholds to Firebase
      sendThresholdsToFirebase();

    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchAndCheck, 2000000); // every 2000 seconds
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
      {renderSensor("pressure", "hPa", 300, 1300, "grey")}
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
