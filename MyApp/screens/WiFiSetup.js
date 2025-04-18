// WiFiSetup.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import base64 from "react-native-base64";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../Firebase/firebaseConfig";
import { ref, get } from "firebase/database";

const SERVICE_UUID        = "ab3b4f86-a60b-439f-98a0-ebb022b74550";
const CHARACTERISTIC_UUID = "e8f99c04-2c62-4660-bc38-30e488e1fd5d";
const MAX_ACK_ATTEMPTS    = 30;
const POLL_INTERVAL_MS    = 2000;

const COLORS = {
  background:      "#2c3338",
  primary:         "#4e9cff",
  danger:          "#e74c3c",
  card:            "#3a3f47",
  text:            "#ffffff",
  inputBackground: "#ffffff",
  modalOverlay:    "rgba(0,0,0,0.8)",
};

export default function WiFiSetup({ setSkipWiFi }) {
  const [isScanning, setIsScanning]           = useState(false);
  const [devices, setDevices]                 = useState([]);
  const [modalVisible, setModalVisible]       = useState(false);
  const [selectedDevice, setSelectedDevice]   = useState(null);
  const [ssid, setSsid]                       = useState("");
  const [password, setPassword]               = useState("");
  const [ssidSent, setSsidSent]               = useState(false);
  const [ackAttemptsLeft, setAckAttemptsLeft] = useState(null);
  const [isConnecting, setIsConnecting]       = useState(false);

  const previousIpRef = useRef(null);
  const manager = new BleManager();

  useEffect(() => {
    manager.stopDeviceScan();
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setDevices([]);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setIsScanning(false);
        return;
      }
      setDevices(prev =>
        prev.some(d => d.id === device.id) ? prev : [...prev, device]
      );
    });
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async device => {
    try {
      manager.stopDeviceScan();
      if (!(await device.isConnected())) {
        await device.connect();
      }
      await device.discoverAllServicesAndCharacteristics();
      setSelectedDevice(device);
      Alert.alert("✔ Connected", `to ${device.name || device.id}`);
      setModalVisible(true);
    } catch (e) {
      Alert.alert("Connection Error", e.message);
    }
  };

  const sendSSID = async () => {
    try {
      await selectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64.encode(`0${ssid}`)
      );
      setSsidSent(true);
      Alert.alert("Success", "SSID sent.");
    } catch (e) {
      Alert.alert("Error", "Failed to send SSID.");
    }
  };

  const sendPassword = async () => {
    try {
      // store previous IP
      try {
        const snap = await get(ref(database, "/sentry/camera/ip"));
        previousIpRef.current = snap.val();
      } catch {
        previousIpRef.current = null;
      }

      await selectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64.encode(`1${password}`)
      );

      const totalSecs = (MAX_ACK_ATTEMPTS * POLL_INTERVAL_MS) / 1000;
      Alert.alert(
        "Connecting…",
        `This may take up to ${totalSecs} seconds.`
      );

      await new Promise(res => setTimeout(res, 12000));
      await selectedDevice.cancelConnection();
      setModalVisible(false);

      setIsConnecting(true);
      setAckAttemptsLeft(MAX_ACK_ATTEMPTS);
      setTimeout(() => pollForIp(MAX_ACK_ATTEMPTS), 1000);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const pollForIp = async attemptsLeft => {
    setAckAttemptsLeft(attemptsLeft);

    if (attemptsLeft <= 0) {
      setIsConnecting(false);
      Alert.alert(
        "Timeout",
        "Connection failed. Please try again.",
        [{ text: "OK", onPress: () => setModalVisible(true) }],
        { cancelable: false }
      );
      setSsidSent(false);
      setAckAttemptsLeft(null);
      return;
    }

    try {
      const snap = await get(ref(database, "/sentry/camera/ip"));
      const ip = snap.val();
      if (ip && ip !== previousIpRef.current) {
        setIsConnecting(false);
        Alert.alert("Success", "Connected! Welcome to SEEMS!", [
          {
            text: "OK",
            onPress: async () => {
              await AsyncStorage.setItem("wifi_ssid", ssid);
              await AsyncStorage.setItem("wifi_pass", password);
              setSsid("");
              setPassword("");
              setSsidSent(false);
              setAckAttemptsLeft(null);
              setSkipWiFi(true);
            },
          },
        ]);
        return;
      }
    } catch {
      // ignore
    }

    setTimeout(() => pollForIp(attemptsLeft - 1), POLL_INTERVAL_MS);
  };

  const skipWiFiSetup = () => setSkipWiFi?.(true);

  const renderDevice = ({ item }) => (
    <View style={styles.deviceCard}>
      <TouchableOpacity
        style={[
          styles.button,
          isConnecting && { opacity: 0.6 },
        ]}
        disabled={isConnecting}
        onPress={() => connectToDevice(item)}
      >
        <Text style={styles.buttonText}>
          Connect to {item.name || item.id}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isConnecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>Connecting…</Text>
        </View>
      )}

      <Text style={styles.header}>WiFi Setup</Text>

      <TouchableOpacity
        style={[
          styles.button,
          (isScanning || isConnecting) && { opacity: 0.6 },
        ]}
        disabled={isScanning || isConnecting}
        onPress={startScanning}
      >
        <Text style={styles.buttonText}>
          {isScanning ? "Scanning…" : "Start Scanning"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scanList}
      />

      <TouchableOpacity
        style={[
          styles.button,
          styles.dangerButton,
          isConnecting && { opacity: 0.6 },
        ]}
        disabled={isConnecting}
        onPress={skipWiFiSetup}
      >
        <Text style={styles.buttonText}>Skip WiFi Setup</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Wi‑Fi Credentials</Text>

            <TextInput
              placeholder="SSID"
              placeholderTextColor="#888"
              value={ssid}
              onChangeText={setSsid}
              style={styles.input}
              editable={!isConnecting}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              editable={!isConnecting}
            />

            <TouchableOpacity
              style={[
                styles.button,
                ( !ssid || isConnecting ) && { opacity: 0.6 },
              ]}
              disabled={!ssid || isConnecting}
              onPress={sendSSID}
            >
              <Text style={styles.buttonText}>Send SSID</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                ( !ssidSent || !password || isConnecting ) && { opacity: 0.6 },
              ]}
              disabled={!ssidSent || !password || isConnecting}
              onPress={sendPassword}
            >
              <Text style={styles.buttonText}>Send Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton, isConnecting && { opacity: 0.6 }]}
              disabled={isConnecting}
              onPress={() => {
                setModalVisible(false);
                setSsidSent(false);
                setAckAttemptsLeft(null);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            {ackAttemptsLeft !== null && !isConnecting && (
              <View style={styles.checkingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text>Checking… Attempts left: {ackAttemptsLeft}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.background,
    alignItems:      "center",
    padding:         20,
  },
  header: {
    fontSize:     24,
    color:        COLORS.text,
    marginBottom: 20,
    fontWeight:   "bold",
  },
  scanList: {
    marginTop:    12,
    width:        "100%",
    alignItems:   "center",
  },
  deviceCard: {
    backgroundColor: COLORS.card,
    padding:         12,
    borderRadius:    8,
    marginVertical:  4,
    width:           "90%",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius:    8,
    alignItems:      "center",
    marginVertical:  6,
    width:           "100%",
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
  cancelButton: {
    backgroundColor: COLORS.card,
  },
  buttonText: {
    color:      COLORS.text,
    fontSize:   16,
    fontWeight: "600",
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius:    6,
    borderWidth:     1,
    borderColor:     "#ccc",
    padding:         10,
    marginBottom:    12,
    width:           "100%",
  },
  modalOverlay: {
    flex:            1,
    justifyContent:  "center",
    alignItems:      "center",
    backgroundColor: COLORS.modalOverlay,
  },
  modalContent: {
    backgroundColor: COLORS.inputBackground,
    padding:         20,
    borderRadius:    12,
    width:           "90%",
    alignItems:      "center",
  },
  modalTitle: {
    fontSize:     20,
    marginBottom: 16,
    fontWeight:   "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent:  "center",
    alignItems:      "center",
    zIndex:          10,
  },
  loadingText: {
    color:      COLORS.text,
    marginTop:  10,
    fontSize:   16,
  },
  checkingContainer: {
    marginTop:    20,
    alignItems:   "center",
  },
});
