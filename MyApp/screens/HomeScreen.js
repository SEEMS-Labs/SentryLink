import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue, off  } from "firebase/database";
import { getAuth, signOut } from "firebase/auth";

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState({
    airQuality: "",
    humidity: "",
    pressure: "",
    temperature: "",
  });

  useEffect(() => {
    const sensorRef = ref(database, "sentry/readings");

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Round the values
        const roundedData = {
          airQuality: data.airQuality ? Math.round(Number(data.airQuality)) : 0,
          humidity: data.humidity ? Math.round(Number(data.humidity)) : 0,
          pressure: data.pressure ? Math.round(Number(data.pressure)) : 0,
          temperature: data.temperature ? Math.round(Number(data.temperature)) : 0,
          noise: data.noise ? Math.round(Number(data.noise)) : 0,
          //distance: data.distance ? Math.round(Number(data.distance)) : 0,
        };

        setSensorData(roundedData); // Update state with rounded data
      } else {
        console.log("No data available");
      }
    });
    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Readings</Text>
      <Button title="Sign Out" onPress={() => signOut(getAuth())} />
      <View style={styles.textContainer}>
      <Text style={styles.text}>Temperature: {" "}<Text style={{ color: 'red' }}>{sensorData.temperature}°C</Text></Text>
      <Text style={styles.text}>Humidity: {"     "}<Text style={{ color: 'blue' }}>{sensorData.humidity}%</Text></Text>
      <Text style={styles.text}>Air Quality: {"   "}<Text style={{ color: 'green' }}>{sensorData.airQuality} AQI</Text></Text>
      <Text style={styles.text}>Pressure: {" "}<Text style={{ color: 'purple' }}>{sensorData.pressure} hPa</Text></Text>
      <Text style={styles.text}>Noise Level: {"  "}<Text style={{ color: 'orange' }}>{sensorData.noise} dB</Text></Text>
      {/* <Text style={styles.text}>Distance: {"  "}<Text style={{ color: 'cyan' }}>{sensorData.distance} dB</Text></Text> */}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#25292e",
    paddingTop: "5%",
    width: "100%",
  },
  textContainer: {
    backgroundColor: "#333",
    padding: 30,
    marginVertical: 140,
    borderRadius: 10,
    width: "100%", // Adjusted to 70% of the page
  },
  header: {
    color: "violet",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 20,
  },
  text: {
    color: "#fff",
    fontSize: 32,
    marginVertical: 12,
    alignSelf: "flex-start", // Align text to the left
    paddingLeft: 25, // Adjust the left spacing as needed
  },
});
