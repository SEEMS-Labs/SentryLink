import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CamScreen = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState(25.0);  // Default FPS to 25.0

  const streamUrl = 'http://192.168.25.13'; // Your MJPEG stream URL

  // Function to simulate a fluctuating FPS value
  const generateFps = () => {
    const randomFps = 25 + Math.random() * 0.07;  // Random value between 25.0 and 25.07
    setFps(randomFps.toFixed(2));  // Set the FPS with 2 decimal places
  };

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(generateFps, 1000); // Update FPS every second
      return () => clearInterval(interval);  // Clear the interval on component unmount
    }
  }, [isStreaming]);

  return (
    <View style={{ flex: 1 }}>
      {isStreaming && (
        <WebView
          originWhitelist={['*']}
          source={{ uri: streamUrl }}
          style={{ flex: 1 }}
        />
      )}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>FPS: {fps}</Text>
        <TouchableOpacity
          style={[styles.button, isStreaming ? styles.stopButton : styles.startButton]}
          onPress={() => setIsStreaming(!isStreaming)}
        >
          <Text style={styles.buttonText}>
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    margin: 10,
  },
  startButton: {
    backgroundColor: 'red',
  },
  stopButton: {
    backgroundColor: 'black',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CamScreen;
