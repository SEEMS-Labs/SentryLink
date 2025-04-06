import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue, set } from "firebase/database";
import { Ionicons } from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState({
    airQuality: "",
    humidity: "",
    pressure: "",
    temperature: "",
    ultrasonic: {
      right: "No presence detected",
      left: "No presence detected",
      back: "No presence detected",
      front: "No presence detected",
    },
  });
  const [maxTemperature, setMaxTemperature] = useState(100);

  useEffect(() => {
    fetchData();
    getTempFromStorage();
  }, []);

  const fetchData = () => {
    const sensorRef = ref(database, "sentry/readings");
    const presenceRef = ref(database, "sentry/alerts/presence");

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

        await setItemInStorgae('temperature', roundedData.temperature.toString());
        await setItemInStorgae('humidity', roundedData.humidity.toString());
        await setItemInStorgae('pressure', roundedData.pressure.toString());
        await setItemInStorgae('airQuality', roundedData.airQuality.toString());
        await setItemInStorgae('noise', roundedData.noise.toString());
        setSensorData(prevState => ({
          ...prevState,
          ...roundedData,
        }));
      } else {
        console.log("No data available");
      }
    });

    // Subscribe to presence data
    onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const presenceData = snapshot.val();
        decodeUltrasonicPresence(presenceData);
      } else {
        console.log("No presence data available");
      }
    });

    return () => unsubscribe();
  };

  const decodeUltrasonicPresence = (presenceData) => {
    // Convert the presence data from Firebase to binary and map each sensor's 2 bits
    const presenceValue = presenceData; // Assuming this is an 8-bit number received as a string or number
    const decodedPresence = {
      right: getUltrasonicState(presenceValue, 0),
      left: getUltrasonicState(presenceValue, 2),
      back: getUltrasonicState(presenceValue, 4),
      front: getUltrasonicState(presenceValue, 6),
    };

    setSensorData((prevState) => ({
      ...prevState,
      ultrasonic: decodedPresence,
    }));
  };

  const getUltrasonicState = (value, shift) => {
    const state = (value >> shift) & 0b11; // Extract the 2 bits for the sensor
    switch (state) {
      case 0:
        return "No presence detected";
      case 1:
        return "Presence weakly detected";
      case 2:
        return "Motion moderately detected";
      case 3:
        return "Motion strongly detected";
      default:
        return "Unknown state";
    }
  };

  const getTempFromStorage = async () => {
    const setVal = async function (one = null, two = null) {
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
          const data = await snapshot.val();

          if (maxTemperatureFromStorage) {
            var parsed = parseInt(maxTemperatureFromStorage);
            await setVal(data.temperature, parsed);
          } else {
            await setVal(data.temperature, 100);
          }
        } else {
          if (maxTemperatureFromStorage) {
            var parsed = parseInt(maxTemperatureFromStorage);
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

  const setItemInStorgae = async (name, val) => {
    await AsyncStorage.setItem(name, val);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Readings</Text>
      <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      <View style={styles.dashboard}>
        {/* Other sensor readings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Right Ultrasonic</Text>
          <Text style={styles.cardValue}>{sensorData.ultrasonic.right}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Left Ultrasonic</Text>
          <Text style={styles.cardValue}>{sensorData.ultrasonic.left}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Back Ultrasonic</Text>
          <Text style={styles.cardValue}>{sensorData.ultrasonic.back}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Front Ultrasonic</Text>
          <Text style={styles.cardValue}>{sensorData.ultrasonic.front}</Text>
        </View>

        {/* Other cards */}
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
    paddingTop: "5%",
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
    marginBottom: 20,
  },
  cardValue: {
    color: "#fff",
    fontSize: 32,
    marginLeft: 20,
  },
});
