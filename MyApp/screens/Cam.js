import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue, off } from 'firebase/database';

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
  const [fps, setFps] = useState(25.0);
  const [motorState, setMotorState] = useState(null);

  const streamUrl = 'http://192.168.25.13';

  const generateFps = () => {
    const randomFps = 25 + Math.random() * 0.07;
    setFps(randomFps.toFixed(2));
  };

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(generateFps, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  useEffect(() => {
    const motorRef = ref(database, 'sentrylink/motor');

    const unsubscribe = onValue(motorRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Received Data from Firebase:', data); // Log the raw data from Firebase
      if (typeof data === 'number') {
        const parsed = parseControllerData(data);
        console.log('Parsed Data:', parsed); // Log the parsed motor state
        setMotorState(parsed);

        if (parsed.controllerOn && parsed.controlMode === 1) {
          switch (parsed.dpadDirection) {
            case 0: console.log("LEFT"); break;
            case 1: console.log("RIGHT"); break;
            case 2: console.log("UP"); break;
            case 3: console.log("DOWN"); break;
            default: break;
          }
        }
      }
    });

    return () => off(motorRef, 'value', unsubscribe);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Streaming video */}
      {isStreaming && (
        <WebView
          originWhitelist={['*']}
          source={{ uri: streamUrl }}
        />
      )}

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* FPS and Button to Start/Stop Stream */}
        <View style={styles.infoContainer}>
          <Text style={styles.text}>FPS: {fps}</Text>
          <TouchableOpacity
            style={[styles.button, isStreaming ? styles.stopButton : styles.startButton]}
            onPress={() => setIsStreaming(!isStreaming)}
          >
            <Text style={styles.buttonText}>
              {isStreaming ? 'Stop Stream' : 'Start Stream'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Motor State */}
        {motorState && (
          <View style={styles.motorStateContainer}>
            <Text style={styles.text}>Controller On: {motorState.controllerOn ? 'Yes' : 'No'}</Text>
            <Text style={styles.text}>Mode: {['Off', 'D-pad', 'Joystick'][motorState.controlMode]}</Text>
            <Text style={styles.text}>D-pad: {['Left', 'Right', 'Up', 'Down'][motorState.dpadDirection]}</Text>
            <Text style={styles.text}>Joystick X: {motorState.joystickX}</Text>
            <Text style={styles.text}>Joystick Y: {motorState.joystickY}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  infoContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motorStateContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    marginVertical: 5,
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
});

export default CamScreen;
