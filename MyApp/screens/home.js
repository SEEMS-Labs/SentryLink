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
  });
  const [maxTemperature, setMaxTemperature] = useState(100);

  useEffect(() => {
    fetchData();
    getTempFromStorage();
  }, []);

  // setItemInStorgae('dataItem', dataItem.toString()); this is an example of how to set an item in storage


  const fetchData = () => {
    const sensorRef = ref(database, "sentry/readings");

    const unsubscribe = onValue(sensorRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        // Round the values
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
        setSensorData(roundedData);
      } else {
        console.log("No data available");
      }
    });
    return () => unsubscribe();

  };

  //Helpers
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
    }

    try {
      const maxTemperatureFromStorage = await AsyncStorage.getItem("maxTemperature");
      const sensorRef = ref(database, "sentry/readings");

      onValue(sensorRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = await snapshot.val();

          if (maxTemperatureFromStorage) {
            var parsed = parseInt(maxTemperatureFromStorage);
            await setVal(data.temperature, parsed);
          }
          else {
            await setVal(data.temperature, 100);
          }
        } else {
          if (maxTemperatureFromStorage) {
            var parsed = parseInt(maxTemperatureFromStorage);
            await setVal(parsed, 100);
          }
          else {
            await setVal(100);
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  const setItemInStorgae = async (name, val) => {
    await AsyncStorage.setItem(name, val);
  }


  // Only works on reload
  // const updateStorageOnChange = async () => {
  //   const sensorRef = ref(database, "sentry/readings");

  //   onValue(sensorRef, async (snapshot) => {
  //     if (snapshot.exists()) {
  //       const data = await snapshot.val();
  //       await setItemInStorgae('temperature', data.temperature.toString());
  //       await setItemInStorgae('humidity', data.humidity.toString());
  //       await setItemInStorgae('pressure', data.pressure.toString());
  //       await setItemInStorgae('airQuality', data.airQuality.toString());
  //       await setItemInStorgae('noise', data.noise.toString());
  //     }
  //   }
  //   );
  // }

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.header}>Readings</Text>

      {/* Refresh Button */}
      <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      {/* Sensor Data Display */}
      <View style={styles.dashboard}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Temperature</Text>
          <View style={styles.cardContent}>
            <CircularProgress
              value={sensorData.temperature}
              maxValue={(maxTemperature > sensorData.temperature) ? maxTemperature : sensorData.temperature}
              radius={35}
              activeStrokeColor="#FF6347"
              inActiveStrokeColor="#E8F0FE"
              activeStrokeWidth={6}
              inActiveStrokeWidth={6}
            />
            <Text style={styles.cardValue}>
              {sensorData.temperature}°C
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Humidity</Text>
          <View style={styles.cardContent}>
            <CircularProgress
              value={sensorData.humidity}
              maxValue={100}
              radius={35}
              activeStrokeColor="#00BFFF"
              inActiveStrokeColor="#E8F0FE"
              activeStrokeWidth={6}
              inActiveStrokeWidth={6}
            />
            <Text style={styles.cardValue}>
              {sensorData.humidity}%
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pressure</Text>
          <Text style={styles.cardValue}>
            {sensorData.pressure} hPa
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Air Quality</Text>
          <Text style={styles.cardValue}>
            {sensorData.airQuality} AQI
          </Text>
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
    paddingTop: "5%",
    paddingHorizontal: 20,
  },
  header: {
    color: "#e8f0fe",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 20,
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
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "80%",
    marginBottom: 20,
    padding: 20,
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
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: {
    color: "#fff",
    fontSize: 32,
    marginLeft: 20,
  },
});
