import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CamScreen = () => {
  const [uri,seturi] = useState('')
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState(null);

  const streamUrl = 'http://192.168.25.13'; // Your MJPEG stream URL

  const htmlContent = `
    <html>
    <body style="margin:0; padding:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background-color:black;">
      <img id="stream" src="${streamUrl}" style="width:100vw; height:auto;" />
      <p id="fps" style="color:white; font-size:20px; position:absolute; top:10px; left:10px;"></p>

      <script>
        let frameCount = 0;
        let lastTime = performance.now();

        function trackFPS() {
          frameCount++;
          let now = performance.now();
          if (now - lastTime >= 1000) {
            document.getElementById("fps").innerText = "FPS: " + frameCount;
            window.ReactNativeWebView.postMessage(frameCount.toString());
            frameCount = 0;
            lastTime = now;
          }
          requestAnimationFrame(trackFPS);
        }

        trackFPS();
      </script>
    </body>
    </html>
  `;

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
