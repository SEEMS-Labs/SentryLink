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
        const data = snapshot.val();
        
        // Round the values
        const roundedData = {
          airQuality: data.airQuality ? Math.round(Number(data.airQuality)) : 0,
          humidity: data.humidity ? Math.round(Number(data.humidity)) : 0,
          pressure: data.pressure ? Math.round(Number(data.pressure)) : 0,
          temperature: data.temperature ? Math.round(Number(data.temperature)) : 0,
        };

        setSensorData(roundedData); // Update state with rounded data
      } else {
        console.log("No data available");
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Temperature: {"    "}{sensorData.temperature}</Text>
      <Text style={styles.text}>Humidity: {"    "}{sensorData.humidity}%</Text>
      <Text style={styles.text}>Air Quality: {"    "}{sensorData.airQuality}</Text>
      <Text style={styles.text}>Pressure: {"    "}{sensorData.pressure}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#25292e",
    paddingTop: "10%",
    width: "100%",
  },
  text: {
    color: "#FFF",
    fontSize: 32,
    marginVertical: 12,
    alignSelf: "flex-start", // Align text to the left
    paddingLeft: 15, // Adjust the left spacing as needed
  },
});
