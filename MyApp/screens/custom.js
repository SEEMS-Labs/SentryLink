import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import PushNotification from "react-native-push-notification"; // Import push notification

const CustomScreen = () => {
  // State for sensor values
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [pressure, setPressure] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [noise, setNoise] = useState(null);
  const [presence, setPresence] = useState(null); // Presence detection

  // State for thresholds – default values can be modified
  const [temperatureThreshold, setTemperatureThreshold] = useState(25);
  const [humidityThreshold, setHumidityThreshold] = useState(50);
  const [pressureThreshold, setPressureThreshold] = useState(1013);
  const [airQualityThreshold, setAirQualityThreshold] = useState(100);
  const [noiseThreshold, setNoiseThreshold] = useState(60);
  const [presenceThreshold, setPresenceThreshold] = useState(2); // Threshold for presence detection

  // Helper: Get an item from AsyncStorage
  const getItemInStorage = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null ? value : null;
    } catch (e) {
      console.log(`Error retrieving ${key}:`, e);
      return null;
    }
  };

  // Helper: Parse presence sensor data
  const parsePresenceData = (data) => {
    let presenceStates = [];
    for (let i = 0; i < 4; i++) {
      const sensorState = (data >> (i * 2)) & 3; // Extract the 2 bits for each sensor
      presenceStates.push(sensorState);
    }
    return presenceStates;
  };

  // Function to send a push notification
  const sendPresenceNotification = () => {
    PushNotification.localNotification({
      channelId: "presence-channel", // Make sure this is configured in your Push Notification setup
      title: "Motion Detected!",
      message: "One of the presence sensors detected moderate motion (5-10% change in readings).",
    });
  };

  // Fetch the sensor values from AsyncStorage and check thresholds
  const fetchData = async () => {
    const tempValue = await getItemInStorage("temperature");
    const humidityValue = await getItemInStorage("humidity");
    const pressureValue = await getItemInStorage("pressure");
    const airQualityValue = await getItemInStorage("airQuality");
    const noiseValue = await getItemInStorage("noise");
    const presenceValue = await getItemInStorage("presence"); // 8-bit presence data

    // Convert the fetched string values into numbers
    const parsedTemp = tempValue ? Number(tempValue) : null;
    const parsedHumidity = humidityValue ? Number(humidityValue) : null;
    const parsedPressure = pressureValue ? Number(pressureValue) : null;
    const parsedAirQuality = airQualityValue ? Number(airQualityValue) : null;
    const parsedNoise = noiseValue ? Number(noiseValue) : null;
    const parsedPresence = presenceValue ? Number(presenceValue) : null;

    // Update state with sensor values
    setTemperature(parsedTemp);
    setHumidity(parsedHumidity);
    setPressure(parsedPressure);
    setAirQuality(parsedAirQuality);
    setNoise(parsedNoise);

    // Parse and set the presence states
    const presenceStates = parsedPresence !== null ? parsePresenceData(parsedPresence) : [];
    setPresence(presenceStates);

    // Check presence states for "Motion moderately detected" (state 2)
    presenceStates.forEach((state, index) => {
      if (state === 2) {
        sendPresenceNotification(); // Send notification when motion moderately detected
      }
    });

    // Check other thresholds and trigger alerts if needed
    if (parsedTemp !== null && parsedTemp > temperatureThreshold) {
      Alert.alert("Alert", `Temperature (${parsedTemp}°C) exceeds the threshold (${temperatureThreshold}°C)!`);
    }
    if (parsedHumidity !== null && parsedHumidity > humidityThreshold) {
      Alert.alert("Alert", `Humidity (${parsedHumidity}%) exceeds the threshold (${humidityThreshold}%)!`);
    }
    if (parsedPressure !== null && parsedPressure > pressureThreshold) {
      Alert.alert("Alert", `Pressure (${parsedPressure} hPa) exceeds the threshold (${pressureThreshold} hPa)!`);
    }
    if (parsedAirQuality !== null && parsedAirQuality > airQualityThreshold) {
      Alert.alert("Alert", `Air Quality (${parsedAirQuality} AQI) exceeds the threshold (${airQualityThreshold} AQI)!`);
    }
    if (parsedNoise !== null && parsedNoise > noiseThreshold) {
      Alert.alert("Alert", `Noise (${parsedNoise}) exceeds the threshold (${noiseThreshold})!`);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Function to finalize threshold changes
  const confirmThresholds = () => {
    // Here you can add any logic to persist the thresholds,
    // for now we simply show an alert confirming the values.
    Alert.alert(
      "Thresholds Confirmed",
      `Temperature: ${temperatureThreshold}°C\nHumidity: ${humidityThreshold}%\nPressure: ${pressureThreshold} hPa\nAir Quality: ${airQualityThreshold} AQI\nNoise: ${noiseThreshold}\nPresence Threshold: ${presenceThreshold}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Custom Sensor Settings</Text>

      {/* Temperature */}
      <View style={styles.sensorContainer}>
        <Text style={styles.sensorLabel}>Temperature: {temperature !== null ? temperature + "°C" : "Loading..."}</Text>
        <Text style={styles.sensorLabel}>Threshold: {temperatureThreshold}°C</Text>
        <Slider
          style={styles.slider}
          minimumValue={-40}
          maximumValue={85}
          value={temperatureThreshold}
          onValueChange={(value) => setTemperatureThreshold(Math.round(value))}
          onSlidingComplete={() => {
            if (temperature !== null && temperature > temperatureThreshold) {
              Alert.alert("Alert", `Temperature (${temperature}°C) exceeds the threshold (${temperatureThreshold}°C)!`);
            }
          }}
          minimumTrackTintColor="#FF6347"
          maximumTrackTintColor="#000000"
          thumbTintColor="#FF6347"
        />
      </View>

      {/* Humidity */}
      <View style={styles.sensorContainer}>
        <Text style={styles.sensorLabel}>Humidity: {humidity !== null ? humidity + "%" : "Loading..."}</Text>
        <Text style={styles.sensorLabel}>Threshold: {humidityThreshold}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={humidityThreshold}
          onValueChange={(value) => setHumidityThreshold(Math.round(value))}
          onSlidingComplete={() => {
            if (humidity !== null && humidity > humidityThreshold) {
              Alert.alert("Alert", `Humidity (${humidity}%) exceeds the threshold (${humidityThreshold}%)!`);
            }
          }}
          minimumTrackTintColor="#00BFFF"
          maximumTrackTintColor="#000000"
          thumbTintColor="#00BFFF"
        />
      </View>

      {/* Pressure */}
      <View style={styles.sensorContainer}>
        <Text style={styles.sensorLabel}>Pressure: {pressure !== null ? pressure + " hPa" : "Loading..."}</Text>
        <Text style={styles.sensorLabel}>Threshold: {pressureThreshold} hPa</Text>
        <Slider
          style={styles.slider}
          minimumValue={300}
          maximumValue={1100}
          value={pressureThreshold}
          onValueChange={(value) => setPressureThreshold(Math.round(value))}
          onSlidingComplete={() => {
            if (pressure !== null && pressure > pressureThreshold) {
              Alert.alert("Alert", `Pressure (${pressure} hPa) exceeds the threshold (${pressureThreshold} hPa)!`);
            }
          }}
          minimumTrackTintColor="#32CD32"
          maximumTrackTintColor="#000000"
          thumbTintColor="#32CD32"
        />
      </View>

      {/* Air Quality */}
      <View style={styles.sensorContainer}>
        <Text style={styles.sensorLabel}>Air Quality: {airQuality !== null ? airQuality + " AQI" : "Loading..."}</Text>
        <Text style={styles.sensorLabel}>Threshold: {airQualityThreshold} AQI</Text>
        <Slider
          style={styles.slider}
          minimumValue={50}
          maximumValue={500}
          value={airQualityThreshold}
          onValueChange={(value) => setAirQualityThreshold(Math.round(value))}
          onSlidingComplete={() => {
            if (airQuality !== null && airQuality > airQualityThreshold) {
              Alert.alert("Alert", `Air Quality (${airQuality} AQI) exceeds the threshold (${airQualityThreshold} AQI)!`);
            }
          }}
          minimumTrackTintColor="#FFD700"
          maximumTrackTintColor="#000000"
          thumbTintColor="#FFD700"
        />
      </View>

      {/* Noise */}
      <View style={styles.sensorContainer}>
        <Text style={styles.sensorLabel}>Noise: {noise !== null ? noise : "Loading..."}</Text>
        <Text style={styles.sensorLabel}>Threshold: {noiseThreshold}</Text>
        <Slider
          style={styles.slider}
          minimumValue={80}
          maximumValue={120}
          value={noiseThreshold}
          onValueChange={(value) => setNoiseThreshold(Math.round(value))}
          onSlidingComplete={() => {
            if (noise !== null && noise > noiseThreshold) {
              Alert.alert("Alert", `Noise (${noise}) exceeds the threshold (${noiseThreshold})!`);
            }
          }}
          minimumTrackTintColor="#FF6347"
          maximumTrackTintColor="#000000"
          thumbTintColor="#FF6347"
        />
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={confirmThresholds}>
        <Text style={styles.confirmButtonText}>Confirm Thresholds</Text>
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
  confirmButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CustomScreen;
