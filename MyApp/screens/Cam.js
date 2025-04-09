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
    const [fps, setFps] = useState("");
    const [motorState, setMotorState] = useState(null);

    const streamUrl = 'http://192.168.25.13';

    const fetchFps = async () => {
      try {
        const response = await fetch('http://192.168.25.13/fps'); // replace with your ESP32 IP
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
        console.log('Received Data from Firebase:', data); // Log the raw data from Firebase
        
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
          
      });

      return () => off(motorRef, 'value', unsubscribe);
    }, []);

    const handleDirection = (direction) => {
      console.log(`Direction: ${direction}`);
      // Handle the action when the direction button is pressed, like updating the Firebase motor data
    };

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

          {/* Directional Control Buttons */}
          <View style={styles.directionButtonsContainer}>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.directionButton, styles.upButton]}
                onPress={() => handleDirection('UP')}
              >
                <Text style={styles.buttonText}>↑</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.directionButton, styles.leftButton]}
                onPress={() => handleDirection('LEFT')}
              >
                <Text style={styles.buttonText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.directionButton, styles.rightButton]}
                onPress={() => handleDirection('RIGHT')}
              >
                <Text style={styles.buttonText}>↓</Text>  //→
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.directionButton, styles.downButton]}
                onPress={() => handleDirection('DOWN')}
              >
                <Text style={styles.buttonText}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Motor State */}
          {/* {motorState && (
            <View style={styles.motorStateContainer}>
              <Text style={styles.text}>Controller On: {motorState.controllerOn ? 'Yes' : 'No'}</Text>
              <Text style={styles.text}>Mode: {['Off', 'D-pad', 'Joystick'][motorState.controlMode]}</Text>
              <Text style={styles.text}>D-pad: {['Left', 'Right', 'Up', 'Down'][motorState.dpadDirection]}</Text>
              <Text style={styles.text}>Joystick X: {motorState.joystickX}</Text>
              <Text style={styles.text}>Joystick Y: {motorState.joystickY}</Text>
            </View>
          )} */}
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
    directionButtonsContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
    },
    directionButton: {
      padding: 20,
      margin: 5,
      backgroundColor: 'blue',
      borderRadius: 50,  // Rounded button for better aesthetics
      justifyContent: 'center',
      alignItems: 'center',
    },
    upButton: {
      backgroundColor: 'green',
      transform: [{ rotate: '0deg' }],  // No rotation for up
    },
    downButton: {
      backgroundColor: 'red',
      transform: [{ rotate: '180deg' }],  // Rotate the DOWN button to make it visually downwards
    },
    leftButton: {
      backgroundColor: 'purple',
      transform: [{ rotate: '90deg' }],  // Rotate the LEFT button to make it visually left
    },
    rightButton: {
      backgroundColor: 'purple',
      transform: [{ rotate: '-90deg' }], // Rotate the RIGHT button to make it visually right
    },
  });

  export default CamScreen;