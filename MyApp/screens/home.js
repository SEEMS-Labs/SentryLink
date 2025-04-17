import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { SafeAreaView, StatusBar } from 'react-native';

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState({
    airQuality: "",
    humidity: "",
    pressure: "",
    temperature: "",
    noise: ""
  });
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const sensorRef = ref(database, "sentry/readings");
  
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
  
        const roundedData = {
          airQuality: data.airQuality ? Math.round(Number(data.airQuality)) : 0,
          humidity: data.humidity ? Math.round(Number(data.humidity)) : 0,
          pressure: data.pressure ? Math.round(Number(data.pressure)) : 0,
          temperature: data.temperature ? Math.round(Number(data.temperature)) : 0,
          noise: data.noise ? Math.round(Number(data.noise)) : 0,
        };
  
        setSensorData(roundedData);
      } else {
        console.log("No sensor data available");
      }
    });

    return () => unsubscribe();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#25292e" barStyle="light-content" />
      <Text style={styles.header}>Readings</Text>

        <ScrollView
  contentContainerStyle={styles.dashboard}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  style={{ width: '100%' }} // Ensure ScrollView takes the full width
>
    
        <View style={styles.card}>
          <Ionicons name="thermometer" size={30} color="red" />
          <Text style={styles.cardTitle}>Temperature</Text>
          <Text style={styles.cardValue}>{(Math.round(sensorData.temperature *9/5+32))}°F</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="water" size={30} color="blue" />
          <Text style={styles.cardTitle}>Humidity</Text>
          <Text style={styles.cardValue}>{sensorData.humidity}%</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="speedometer" size={30} color="grey" />
          <Text style={styles.cardTitle}>Pressure</Text>
          <Text style={styles.cardValue}>{sensorData.pressure} hPa</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="leaf" size={30} color="green" />
          <Text style={styles.cardTitle}>Air Quality</Text>
          <Text style={styles.cardValue}>{sensorData.airQuality} AQI</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="volume-high" size={30} color="yellow" />
          <Text style={styles.cardTitle}>Noise</Text>
          <Text style={styles.cardValue}>{sensorData.noise} dB</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderColor: "#e8f0fe",
    borderWidth: 1,
  },
  cardTitle: {
    color: "#C57B57",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardValue: {
    color: "#fff",
    fontSize: 24,
  },
});
