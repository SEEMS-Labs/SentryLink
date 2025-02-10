import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
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
      setUri('http://192.168.1.149/'); // Start the stream by setting the URI
    }
    setIsStreaming(!isStreaming); // Toggle the state
  };

  return (
    <View style={{ flex: 1 }}>
      <Button
        title={isStreaming ? 'Stop Stream' : 'Start Stream'}
        onPress={toggleStream}
      />
      {/* Only show WebView when the stream is active */}
      {isStreaming && (
        <WebView
          source={{ uri: uri }}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
};

export default CamScreen;
