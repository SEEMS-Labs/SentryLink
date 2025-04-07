import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, StatusBar } from 'react-native';

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState({
    airQuality: "",
    humidity: "",
    pressure: "",
    temperature: "",
    noise: ""
  });
  const [presence, setPresence] = useState(false);
  const [maxTemperature, setMaxTemperature] = useState(100);

  useEffect(() => {
    fetchData();
    getTempFromStorage();
    watchPresenceSensor();
  }, []);

  const fetchData = () => {
    const sensorRef = ref(database, "sentry/readings");

    const unsubscribe = onValue(sensorRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const roundedData = {
          airQuality: data.airQuality ? Math.round(Number(data.airQuality)) : 0,
          humidity: data.humidity ? Math.round(Number(data.humidity)) : 0,
          pressure: data.pressure ? Math.round(Number(data.pressure)) : 0,
          temperature: data.temperature ? Math.round(Number(data.temperature)) : 0,
          noise: data.noise ? Math.round(Number(data.noise)) : 0,
        };

        await setItemInStorage('temperature', roundedData.temperature.toString());
        await setItemInStorage('humidity', roundedData.humidity.toString());
        await setItemInStorage('pressure', roundedData.pressure.toString());
        await setItemInStorage('airQuality', roundedData.airQuality.toString());
        await setItemInStorage('noise', roundedData.noise.toString());

        setSensorData(roundedData);
      } else {
        console.log("No sensor data available");
      }
    });

    return () => unsubscribe();
  };

  const watchPresenceSensor = () => {
    const presenceRef = ref(database, "sentry/alerts");

    onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const alerts = snapshot.val();
        setPresence(alerts.presence === true);
      }
    });
  };

  const getTempFromStorage = async () => {
    const setVal = async (one = null, two = null) => {
      let val;
      if (one && two) {
        val = one > two ? one : two;
      } else if (one) {
        val = one;
      } else if (two) {
        val = two;
      }
      setMaxTemperature(val);
    };

    try {
      const maxTemperatureFromStorage = await AsyncStorage.getItem("maxTemperature");
      const sensorRef = ref(database, "sentry/readings");

      onValue(sensorRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (maxTemperatureFromStorage) {
            const parsed = parseInt(maxTemperatureFromStorage);
            await setVal(data.temperature, parsed);
          } else {
            await setVal(data.temperature, 100);
          }
        } else {
          if (maxTemperatureFromStorage) {
            const parsed = parseInt(maxTemperatureFromStorage);
            await setVal(parsed, 100);
          } else {
            await setVal(100);
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const setItemInStorage = async (name, val) => {
    await AsyncStorage.setItem(name, val);
  };

  return (
  <View style={styles.container}>
    <StatusBar backgroundColor="#25292e" barStyle="light-content" />

    <Text style={styles.header}>Readings</Text>

    <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
      <Ionicons name="refresh" size={20} color="#fff" />
      <Text style={styles.refreshText}>Refresh</Text>
    </TouchableOpacity>

    <View style={styles.dashboard}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Temperature</Text>
        <Text style={styles.cardValue}>{sensorData.temperature}°C</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Humidity</Text>
        <Text style={styles.cardValue}>{sensorData.humidity}%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pressure</Text>
        <Text style={styles.cardValue}>{sensorData.pressure} hPa</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Air Quality</Text>
        <Text style={styles.cardValue}>{sensorData.airQuality} AQI</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Noise</Text>
        <Text style={styles.cardValue}>{sensorData.noise} dB</Text>
      </View>

      
    </View>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#25292e",
    width: "100%",
    paddingTop: "1%",
    paddingHorizontal: 20,
  },
  header: {
    color: "#e8f0fe",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
  },
  refreshButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C57B57",
    padding: 10,
    borderRadius: 50,
    marginBottom: 30,
  },
  refreshText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
  },
  dashboard: {
    width: "100%",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "80%",
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderColor: "#e8f0fe",
    borderWidth: 1,
  },
  cardTitle: {
    color: "#e8f0fe",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardValue: {
    color: "#fff",
    fontSize: 24,
  },
});
