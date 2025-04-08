import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { database } from "../Firebase/firebaseConfig"; // Custom firebaseConfig
import { ref, onValue, off } from "firebase/database"; // Correct Firebase imports

const CustomScreen = () => {
  // State for sensor data
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(50);
  const [pressure, setPressure] = useState(1015);
  const [airQuality, setAirQuality] = useState(75);
  const [noise, setNoise] = useState(55);

  // State for thresholds
  const [temperatureThreshold, setTemperatureThreshold] = useState(25);
  const [humidityThreshold, setHumidityThreshold] = useState(60);
  const [pressureThreshold, setPressureThreshold] = useState(1020);
  const [airQualityThreshold, setAirQualityThreshold] = useState(100);
  const [noiseThreshold, setNoiseThreshold] = useState(60);

  // State for alert flags (to prevent repeated alerts)
  const [temperatureAlertShown, setTemperatureAlertShown] = useState(false);
  const [humidityAlertShown, setHumidityAlertShown] = useState(false);
  const [pressureAlertShown, setPressureAlertShown] = useState(false);
  const [airQualityAlertShown, setAirQualityAlertShown] = useState(false);
  const [noiseAlertShown, setNoiseAlertShown] = useState(false);

  // Function to check thresholds and send alert once
  const checkThresholds = () => {
    if (temperature > temperatureThreshold && !temperatureAlertShown) {
      Alert.alert("Temperature Alert", `Temperature exceeds threshold: ${temperature}°C`);
      setTemperatureAlertShown(true); // Prevent repeated alert
    }
    if (humidity > humidityThreshold && !humidityAlertShown) {
      Alert.alert("Humidity Alert", `Humidity exceeds threshold: ${humidity}%`);
      setHumidityAlertShown(true); // Prevent repeated alert
    }
    if (pressure > pressureThreshold && !pressureAlertShown) {
      Alert.alert("Pressure Alert", `Pressure exceeds threshold: ${pressure} hPa`);
      setPressureAlertShown(true); // Prevent repeated alert
    }
    if (airQuality > airQualityThreshold && !airQualityAlertShown) {
      Alert.alert("Air Quality Alert", `Air Quality exceeds threshold: ${airQuality}`);
      setAirQualityAlertShown(true); // Prevent repeated alert
    }
    if (noise > noiseThreshold && !noiseAlertShown) {
      Alert.alert("Noise Alert", `Noise exceeds threshold: ${noise} dB`);
      setNoiseAlertShown(true); // Prevent repeated alert
    }
  };

  // UseEffect to simulate data fetch and threshold checks
  useEffect(() => {
    // Set up Firebase listeners to fetch real-time data
    const temperatureRef = ref(database, '/sensorData/temperature');
    const humidityRef = ref(database, '/sensorData/humidity');
    const pressureRef = ref(database, '/sensorData/pressure');
    const airQualityRef = ref(database, '/sensorData/airQuality');
    const noiseRef = ref(database, '/sensorData/noise');

    // Listen for changes in the sensor values (but only update every 10 seconds)
    const intervalId = setInterval(() => {
      // Fetch the latest sensor values
      onValue(temperatureRef, snapshot => {
        if (snapshot.exists()) {
          setTemperature(snapshot.val());  // Update temperature
        }
      });

      onValue(humidityRef, snapshot => {
        if (snapshot.exists()) {
          setHumidity(snapshot.val());  // Update humidity
        }
      });

      onValue(pressureRef, snapshot => {
        if (snapshot.exists()) {
          setPressure(snapshot.val());  // Update pressure
        }
      });

      onValue(airQualityRef, snapshot => {
        if (snapshot.exists()) {
          setAirQuality(snapshot.val());  // Update air quality
        }
      });

      onValue(noiseRef, snapshot => {
        if (snapshot.exists()) {
          setNoise(snapshot.val());  // Update noise
        }
      });

      // Check the thresholds after values are updated
      checkThresholds();
    }, 10000); // 10 seconds

    // Clean up listeners and interval when the component unmounts
    return () => {
      off(temperatureRef);
      off(humidityRef);
      off(pressureRef);
      off(airQualityRef);
      off(noiseRef);
      clearInterval(intervalId); // Clear the interval when component unmounts
    };
  }, [temperature, humidity, pressure, airQuality, noise]); // Dependencies ensure that the checks happen every time data changes

  // Reset alert flags when data is updated
  const resetAlertFlags = () => {
    setTemperatureAlertShown(false);
    setHumidityAlertShown(false);
    setPressureAlertShown(false);
    setAirQualityAlertShown(false);
    setNoiseAlertShown(false);
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
          minimumTrackTintColor="#FF6347"
          maximumTrackTintColor="#000000"
          thumbTintColor="#FF6347"
        />
      </View>
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
});

export default CustomScreen;
