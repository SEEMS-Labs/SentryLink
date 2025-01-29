import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { database } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";

export default function Mainpg() {
  const [sensorData, setSensorData] = useState({
    airQuality: "",
    humidity: "",
    pressure: "",
    temperature: "",
  });

  useEffect(() => {
    const sensorRef = ref(database, "readings"); // Reference to "readings" in the database

    onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData(snapshot.val()); // Update state with fetched data
      } else {
        console.log("No data available");
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Air Quality: {sensorData.airQuality}</Text>
      <Text style={styles.text}>Humidity: {sensorData.humidity}</Text>
      <Text style={styles.text}>Pressure: {sensorData.pressure}</Text>
      <Text style={styles.text}>Temperature: {sensorData.temperature}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
  },
  text: {
    color: "#FFF",
    fontSize: 18,
    marginVertical: 5,
  },
});
