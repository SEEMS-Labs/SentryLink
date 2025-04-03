import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";

const CustomScreen = () => {
  // State for sensor values
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [pressure, setPressure] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [noise, setNoise] = useState(null);

  // State for thresholds – default values can be modified
  const [temperatureThreshold, setTemperatureThreshold] = useState(25);
  const [humidityThreshold, setHumidityThreshold] = useState(50);
  const [pressureThreshold, setPressureThreshold] = useState(1013);
  const [airQualityThreshold, setAirQualityThreshold] = useState(100);
  const [noiseThreshold, setNoiseThreshold] = useState(60);

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

  // Fetch the sensor values from AsyncStorage and check thresholds
  const fetchData = async () => {
    const tempValue = await getItemInStorage("temperature");
    const humidityValue = await getItemInStorage("humidity");
    const pressureValue = await getItemInStorage("pressure");
    const airQualityValue = await getItemInStorage("airQuality");
    const noiseValue = await getItemInStorage("noise");

    // Convert the fetched string values into numbers
    const parsedTemp = tempValue ? Number(tempValue) : null;
    const parsedHumidity = humidityValue ? Number(humidityValue) : null;
    const parsedPressure = pressureValue ? Number(pressureValue) : null;
    const parsedAirQuality = airQualityValue ? Number(airQualityValue) : null;
    const parsedNoise = noiseValue ? Number(noiseValue) : null;

    // Update state with sensor values
    setTemperature(parsedTemp);
    setHumidity(parsedHumidity);
    setPressure(parsedPressure);
    setAirQuality(parsedAirQuality);
    setNoise(parsedNoise);

    // Check thresholds and trigger alerts if needed
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
      `Temperature: ${temperatureThreshold}°C\nHumidity: ${humidityThreshold}%\nPressure: ${pressureThreshold} hPa\nAir Quality: ${airQualityThreshold} AQI\nNoise: ${noiseThreshold}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Custom Sensor Settings</Text>

      {/* Temperature  convert to F*/}   
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

      {/* Noise  Add 24 inches to 156 inches for presens*/}
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
          minimumTrackTintColor="#8A2BE2"
          maximumTrackTintColor="#000000"
          thumbTintColor="#8A2BE2"
        />
      </View> 

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={confirmThresholds}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c3338",
    padding: 20,
    paddingTop: 50,
    justifyContent: "flex-start",
  },
  header: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  sensorContainer: {
    marginBottom: 30,
  },
  sensorLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  confirmButton: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#C57B57",
  padding: 10,
  borderRadius: 50,
  marginBottom: 30,
  alignSelf: "center", // centers the button
  width: 150,         // fixed width for the button
},
confirmButtonText: {
  color: "#fff",
  fontSize: 16,
},
});

export default CustomScreen;
