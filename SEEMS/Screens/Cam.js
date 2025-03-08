import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CamScreen = () => {
  // State to manage whether the stream is active or not
  const [isStreaming, setIsStreaming] = useState(false);
  const [uri, setUri] = useState('');

  // Toggle stream start/stop
  const toggleStream = () => {
    if (isStreaming) {
      setUri(''); // Stop the stream by clearing the URI
    } else {
      setUri('http://192.168.135.13'); // Start the stream by setting the URI
    }
    setIsStreaming(!isStreaming); // Toggle the state
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Only show WebView when the stream is active */}
      {isStreaming && (
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: uri }}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          style={[styles.button, isStreaming ? styles.stopButton : styles.startButton]}
          onPress={toggleStream}
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