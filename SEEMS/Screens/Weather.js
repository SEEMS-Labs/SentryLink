import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Weather = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Function to update the time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString()); // Formats time as hh:mm:ss AM/PM
    };

    // Update time every second
    const timer = setInterval(updateTime, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weather</Text>
      <Text style={styles.time}>{currentTime}</Text>
      <Text style={styles.info}>It's sunny today, 25°C</Text>
    </View>
  );
};

export default Weather;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#3b3b3b',
    borderRadius: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  time: {
    fontSize: 20,
    color: '#ffcc00',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: '#ccc',
  },
});