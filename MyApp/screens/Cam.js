import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue, off } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const parseControllerData = (rawData) => {
  return {
    controllerOn: (rawData & 0b1) === 1,
    controlMode: (rawData >> 1) & 0b11,
    dpadDirection: (rawData >> 3) & 0b11,
    joystickX: (rawData >> 5) & 0x3FF,
    joystickY: (rawData >> 15) & 0x3FF,
  };
};

const CamScreen = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState("");
  const [motorState, setMotorState] = useState(null);
  const [manualControlEnabled, setManualControlEnabled] = useState(false);

  const streamUrl = 'http://192.168.1.149';

  const fetchFps = async () => {
    try {
      const response = await fetch('http://192.168.1.149/fps');
      const text = await response.text();
      setFps(text);
    } catch (error) {
      console.error('Failed to fetch FPS:', error);
      setFps('N/A');
    }
  };

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(fetchFps, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  useEffect(() => {
    const motorRef = ref(database, 'sentrylink/motor');

    const unsubscribe = onValue(motorRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Received Data from Firebase:', data);
      const parsed = parseControllerData(data);
      console.log('Parsed Data:', parsed);
      setMotorState(parsed);
    });

    // Cleanup when the component is unmounted
    return () => {
      off(motorRef, 'value', unsubscribe);
    };
  }, []);

  const handleDirection = (direction) => {
    if (!manualControlEnabled) return;
    console.log(`Direction: ${direction}`);
    // TODO: Send control command to Firebase here
  };

  return (
    <View style={{ flex: 1 }}>
      {isStreaming && (
        <View style={{ flex: 1, marginTop: 20 }}>
          <WebView
            originWhitelist={['*']}
            source={{ uri: streamUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            onError={(error) => console.error('WebView error:', error)}
            onHttpError={(error) => console.error('HTTP error:', error)}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoContainer}>
          <Text style={styles.fpsText}>FPS: {fps}</Text>
          <TouchableOpacity
            style={[styles.button, isStreaming ? styles.stopButton : styles.startButton]}
            onPress={() => setIsStreaming(!isStreaming)}
          >
            <Text style={styles.buttonText}>
              {isStreaming ? 'Stop Stream' : 'Start Stream'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.directionButtonsContainer}>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={() => handleDirection('UP')}
            >
              <Ionicons name="arrow-up" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={() => handleDirection('LEFT')}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={() => handleDirection('RIGHT')}
            >
              <Ionicons name="arrow-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={() => handleDirection('DOWN')}
            >
              <Ionicons name="arrow-down" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: manualControlEnabled ? '#4CAF50' : '#888' }]}
          onPress={() => setManualControlEnabled(!manualControlEnabled)}
        >
          <Text style={styles.buttonText}>
            {manualControlEnabled ? 'Manual Control: ON' : 'Enable Manual Control'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#25292e',
    alignItems: 'center',
    padding: 10,
  },
  infoContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  directionButtonsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  directionButton: {
    backgroundColor: '#3B82F6',
    padding: 20,
    margin: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CamScreen;
