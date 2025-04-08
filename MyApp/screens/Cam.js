import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CamScreen = () => {
  const [uri,seturi] = useState('')
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState(null);

  const streamUrl = 'http://192.168.25.13'; // Your MJPEG stream URL

  
  return (
    <View style={{ flex: 1 }}>
      {isStreaming && (
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          onMessage={(event) => setFps(event.nativeEvent.data)}
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
