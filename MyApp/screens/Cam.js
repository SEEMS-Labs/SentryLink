// CamScreen.js

/**
 * Note: To allow local (http) URLs on Android 9+,
 * set android:usesCleartextTraffic="true" in AndroidManifest.xml
 * or use a network_security_config that permits your local IP.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AppState
} from 'react-native';
import { WebView } from 'react-native-webview';
import { database } from "../Firebase/firebaseConfig";
import { ref, onValue, off, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

// Parses the 32‑bit controller integer into fields
const parseControllerData = (rawData) => ({
  controllerOn: rawData & 0b1,
  controlMode: (rawData >> 1) & 0b11,
  dpadDirection: (rawData >> 3) & 0b11,
  joystickX: (rawData >> 5) & 0x3FF,
  joystickY: (rawData >> 15) & 0x3FF,
});

// Re-encodes the fields into the 32‑bit integer
const reconvertControllerData = (data) => {
  let raw = 0;
  raw |= (data.controllerOn & 0b1);
  raw |= (data.controlMode & 0b11) << 1;
  raw |= (data.dpadDirection & 0b11) << 3;
  raw |= (data.joystickX & 0x3FF) << 5;
  raw |= (data.joystickY & 0x3FF) << 15;
  return raw;
};

const CamScreen = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState(0);
  const [motorState, setMotorState] = useState(null);
  const [manualControlEnabled, setManualControlEnabled] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [cloudflareUrl, setCloudflareUrl] = useState(null);
  const [localIp, setLocalIp] = useState(null);
  const [useLocalIp, setUseLocalIp] = useState(false);

  // Reset any one‑time alerts when the app backgrounds
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        global.alertShown = false;
      }
    });
    return () => sub.remove();
  }, []);

  // Load Cloudflare tunnel URL from Firebase
  useEffect(() => {
    const tunnelRef = ref(database, "/sentry/camera/tunnel");
    onValue(tunnelRef, (snap) => {
      const url = snap.val();
      if (!url) return;
      const full = `${url}/capture`;
      setCloudflareUrl(full);
      if (!useLocalIp) setStreamUrl(full);
      console.log("📡 Tunnel URL:", full);
    });
    return () => off(tunnelRef);
  }, [useLocalIp]);

  // Load Local IP from Firebase
  useEffect(() => {
    const ipRef = ref(database, "/sentry/camera/ip");
    onValue(ipRef, (snap) => {
      const ip = snap.val();
      if (!ip) return;
      const clean = ip.replace(/^https?:\/\//, "").trim();
      const full = `http://${clean}/capture`;
      setLocalIp(full);
      if (useLocalIp) setStreamUrl(full);
      console.log("📡 Local IP:", full);
    });
    return () => off(ipRef);
  }, [useLocalIp]);

  // Listen for motor state updates
  useEffect(() => {
    const motorRef = ref(database, "sentrylink/controller");
    onValue(motorRef, (snap) => {
      const val = snap.val();
      if (typeof val !== "number") {
        console.warn("⚠️ Expected number at /sentrylink/controller, got:", val);
        setMotorState(null);
        return;
      }
      const parsed = parseControllerData(val);
      setMotorState(parsed);
      console.log("✅ Motor state:", parsed);
    });
    return () => off(motorRef);
  }, []);

  // Send one of the four directions
  const handleDirection = (dir) => {
    if (!manualControlEnabled || !motorState) return;
    const updated = { ...motorState };
    switch (dir) {
      case 'LEFT':  updated.dpadDirection = 0; break;
      case 'RIGHT': updated.dpadDirection = 1; break;
      case 'UP':    updated.dpadDirection = 2; break;
      case 'DOWN':  updated.dpadDirection = 3; break;
      default: return;
    }
    const raw = reconvertControllerData(updated);
    update(ref(database, "sentrylink"), { controller: raw })
      .then(() => console.log(`✅ ${dir} sent`))
      .catch(err => console.error("❌ update error:", err));
  };

  // **NEW**: reset D-pad to 0
  const resetDpad = () => {
    if (!motorState) return;
    const reset = { ...motorState, dpadDirection: 0 };
    const raw = reconvertControllerData(reset);
    update(ref(database, "sentrylink"), { controller: raw })
      .then(() => console.log("✅ D-pad reset to 0"))
      .catch(err => console.error("❌ reset error:", err));
  };

  // FPS/WebView setup unchanged...
  const handleWebViewMessage = ({ nativeEvent }) => {
    const v = parseInt(nativeEvent.data);
    if (!isNaN(v)) setFps(v);
  };

  const getWebViewContent = () => `
    <!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <style>html,body{margin:0;padding:0;background:black}#cam{width:100%;height:100%;object-fit:contain}</style>
    </head><body>
      <img id="cam" src="" />
      <script>
        const img = document.getElementById('cam');
        let count=0, start=Date.now();
        function update(){
          img.src='${streamUrl}?t='+Date.now();
        }
        img.onload = () => {
          count++;
          if (Date.now()-start >=1000){
            window.ReactNativeWebView.postMessage(count.toString());
            count=0; start=Date.now();
          }
          setTimeout(update,10);
        };
        update();
      </script>
    </body></html>
  `;

  return (
    <View style={{ flex: 1 }}>
      {isStreaming && (
        <View style={{ height: 305, width: '100%' }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: getWebViewContent() }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            style={{ flex: 1 }}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.fpsText}>FPS: {fps}</Text>

        <TouchableOpacity
          style={[styles.button, isStreaming ? styles.stopButton : styles.startButton]}
          onPress={() => setIsStreaming(!isStreaming)}
        >
          <Text style={styles.buttonText}>
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </Text>
        </TouchableOpacity>

        {/* Toggle local vs. Cloudflare */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#6366F1' }]}
          onPress={() => {
            const next = !useLocalIp;
            setUseLocalIp(next);
            setStreamUrl(next && localIp ? localIp : cloudflareUrl);
          }}
        >
          <Text style={styles.buttonText}>
            Using: {useLocalIp ? 'Local IP' : 'Cloudflare'}
          </Text>
        </TouchableOpacity>

        {/* D-pad */}
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

        {/* Manual Control Toggle */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: manualControlEnabled ? '#4CAF50' : '#888' }]}
          onPress={() => setManualControlEnabled(e => !e)}
        >
          <Text style={styles.buttonText}>
            {manualControlEnabled ? 'Manual Control: ON' : 'Enable Manual Control'}
          </Text>
        </TouchableOpacity>

        {/* Reset D-pad */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#E53E3E' }]}
          onPress={resetDpad}
        >
          <Text style={styles.buttonText}>Reset D-pad</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25292e',
    padding: 10
  },
  fpsText: { color: 'white', fontSize: 18, marginBottom: 10 },
  button: { padding: 10, borderRadius: 5, alignItems: 'center', margin: 10 },
  startButton: { backgroundColor: 'red' },
  stopButton: { backgroundColor: 'black' },
  buttonText: { color: 'white', fontSize: 16 },
  directionButtonsContainer: { marginTop: 20, alignItems: 'center' },
  row: { flexDirection: 'row' },
  directionButton: {
    backgroundColor: '#3B82F6',
    padding: 20,
    margin: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default CamScreen;
