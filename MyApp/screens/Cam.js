import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue, off, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const parseControllerData = (rawData) => {
  return {
    controllerOn: rawData & 0b1, // Extract the first bit (controller on/off)
    controlMode: (rawData >> 1) & 0b11, // Extract bits [1, 2] (control mode)
    dpadDirection: (rawData >> 3) & 0b11, // Extract bits [3, 4] (dpad direction)
    joystickX: (rawData >> 5) & 0x3FF, // Extract bits [5-14] (joystick X position)
    joystickY: (rawData >> 15) & 0x3FF, // Extract bits [15-24] (joystick Y position)
  };
};

const reconvertControllerData = (data) => {
  let rawData = 0;
  rawData |= (data.controllerOn & 0b1); // Set the first bit
  rawData |= (data.controlMode & 0b11) << 1; // Set bits [1, 2]
  rawData |= (data.dpadDirection & 0b11) << 3; // Set bits [3, 4]
  rawData |= (data.joystickX & 0x3FF) << 5; // Set bits [5-14]
  rawData |= (data.joystickY & 0x3FF) << 15; // Set bits [15-24]
  return rawData;
};


const sendControllerData = async () => {
  await update(ref(database, 'sentrylink'), {
    controller: reconvertControllerData,
  });
};

const CamScreen = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState(0);
  const [motorState, setMotorState] = useState(null);
  const [manualControlEnabled, setManualControlEnabled] = useState(false);

  const streamUrl = 'http://192.168.137.7/capture';

  useEffect(() => {
     const direction = (dir) => {
       if (!manualControlEnabled) return;
       direction = dir; // Update direction when manual control is enabled
     }; // Properly close the function block
    const motorRef = ref(database, 'sentrylink/controller');
    const unsubscribe = onValue(motorRef, (snapshot) => {
      const rawData = snapshot.val();
      const parsedData = parseControllerData(rawData);
      console.log('Motor state:', parsedData);
      setMotorState(parsedData);
    });

    // const intervalId = setInterval(() => {
    //   console.log('Motor state (every 10 sec):', motorState);
    // }, 10000);

    return () => {
      off(motorRef, 'value', unsubscribe);
      clearInterval(intervalId);
    };
  }, []);
    
  const handleDirection = (direction) => {
    if (!manualControlEnabled) return;
    console.log(`Direction: ${direction}`);
    const updateControllerData = (updatedData) => {
      const rawData = reconvertControllerData(updatedData);
      update(ref(database, 'sentrylink'), { controller: rawData })
      .then(() => console.log(`Direction ${direction} sent to Firebase`))
      .catch((error) => console.error('Error updating direction:', error));
    }
  };

  const handleWebViewMessage = (event) => {
    const value = parseInt(event.nativeEvent.data);
    if (!isNaN(value)) setFps(value);
  };

  const getWebViewContent = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: black;
            overflow: hidden;
            height: 100%;
          }
          #cam {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img id="cam" src="" />
<script>
  const img = document.getElementById('cam');
  let count = 0;
  let start = Date.now();

  function update() {
    img.src = '${streamUrl}?t=' + new Date().getTime();
  }

  img.onload = () => {
    count++;
    const now = Date.now();
    if (now - start >= 1000) {
      window.ReactNativeWebView.postMessage(count.toString());
      count = 0;
      start = now;
    }
    setTimeout(update, 0.1); // timer for 0.1ms
  };

  update();
</script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      {isStreaming && (
        <View style={{ height: 305, width: '100%' }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: getWebViewContent() }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            style={{ flex: 1 }}
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
            <TouchableOpacity style={styles.directionButton} onPress={() => handleDirection('UP')}>
              <Ionicons name="arrow-up" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.directionButton} onPress={() => handleDirection('LEFT')}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.directionButton} onPress={() => handleDirection('RIGHT')}>
              <Ionicons name="arrow-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.directionButton} onPress={() => handleDirection('DOWN')}>
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
  fpsText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
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
