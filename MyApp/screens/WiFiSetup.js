// WiFiSetup.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  Alert,
  TextInput,
  Modal,
  StyleSheet
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import base64 from "react-native-base64";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WiFiSetup = ({ navigation, setSkipWiFi }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [ssidSent, setSsidSent] = useState(false);

  const [serviceUUID, setServiceUUID] = useState(null);
  const [ssidCharUUID, setSsidCharUUID] = useState(null);
  const [passCharUUID, setPassCharUUID] = useState(null);
  const [statusCharUUID, setStatusCharUUID] = useState(null);

  const manager = new BleManager();

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setDevices([]);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Scan error:", error);
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
      const isConnected = await device.isConnected();
      if (!isConnected) {
        await device.connect();
      }
      await device.discoverAllServicesAndCharacteristics();
      await new Promise(r => setTimeout(r, 500));

      const services = await device.services();
      let sharedServiceUUID = null;
      let sharedCharUUID = null;

      for (const service of services) {
        const chars = await device.characteristicsForService(service.uuid);
        for (const c of chars) {
          if (
            c.uuid.toLowerCase() ===
            "e8f99c04-2c62-4660-bc38-30e488e1fd5d"
          ) {
            sharedServiceUUID = service.uuid;
            sharedCharUUID = c.uuid;
            break;
          }
        }
        if (sharedServiceUUID) break;
      }

      if (!sharedServiceUUID || !sharedCharUUID) {
        Alert.alert("Error", "Could not find the ESP32 BLE characteristic.");
        return;
      }

      setServiceUUID(sharedServiceUUID);
      setSsidCharUUID(sharedCharUUID);
      setPassCharUUID(sharedCharUUID);
      setStatusCharUUID(sharedCharUUID);
      setSelectedDevice(device);
      setModalVisible(true);
    } catch (error) {
      console.error("Connection failed:", error);
      Alert.alert("Connection Error", error.message || "Could not connect.");
    }
  };

  // Wait until ESP32 sends back Header 4 + Ack C with the assigned IP
  const waitForWifiAck = (timeoutMs = 20000) =>
    new Promise((resolve, reject) => {
      let subscription = null;

      subscription = selectedDevice.monitorCharacteristicForService(
        serviceUUID,
        statusCharUUID,
        (error, char) => {
          if (error) {
            subscription.remove();
            return reject(error);
          }
          if (!char?.value) return;

          const decoded = base64.decode(char.value);
          console.log("🔔 BLE Notification:", decoded);

          if (
            decoded.includes("Header Received: 4") &&
            decoded.includes("Ack Msg Received: C")
          ) {
            const match = decoded.match(/Data Received:\s*([\d.]+)/);
            const ip = match ? match[1] : null;
            subscription.remove();
            resolve(ip || decoded);
          }
        }
      );

      setTimeout(() => {
        subscription && subscription.remove();
        reject(new Error("Timed out waiting for ESP32 Wi‑Fi ACK"));
      }, timeoutMs);
    });

  const sendSSID = async () => {
    try {
      const payload = `0${ssid}`;
      await selectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        ssidCharUUID,
        base64.encode(payload)
      );
      setSsidSent(true);
      Alert.alert("Success", "SSID sent.");
    } catch (error) {
      console.error("SSID send error:", error);
      Alert.alert("Error", "Failed to send SSID.");
    }
  };

  const sendPassword = async () => {
    try {
      const payload = `1${password}`;
      await selectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        passCharUUID,
        base64.encode(payload)
      );

      Alert.alert("Waiting…", "ESP32 is connecting to Wi‑Fi");
      const assignedIp = await waitForWifiAck();
      Alert.alert("Wi‑Fi Setup Complete", `Assigned IP: ${assignedIp}`);

      await AsyncStorage.setItem("wifi_ssid", ssid);
      await AsyncStorage.setItem("wifi_pass", password);
      setSsid("");
      setPassword("");
      setSsidSent(false);

      setTimeout(() => {
        setModalVisible(false);
      }, 150);
    } catch (error) {
      console.error("Password/ACK error:", error);
      Alert.alert("Error", error.message);
    }+

    setTimeout(async () => {
      try {
        await selectedDevice.cancelConnection();
        console.log("Disconnected from ESP32");
      } catch (err) {
        console.error("Disconnect error:", err);
      }
    }, 1000);
  };

  const skipWiFiSetup = () => {
    if (typeof setSkipWiFi === "function") {
      setSkipWiFi(true);
    }
  };

  const renderDevice = ({ item }) => (
    <View style={{ marginVertical: 4 }}>
      <Button
        title={`Connect to ${item.name || item.id}`}
        onPress={() => connectToDevice(item)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>WiFi Setup Screen</Text>

      <Button
        title={isScanning ? "Scanning..." : "Start Scanning"}
        onPress={startScanning}
        disabled={isScanning}
      />

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={item => `${item.id}_${item.name}`}
        style={styles.scanList}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Skip WiFi Setup" onPress={skipWiFiSetup} color="red" />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              Enter Wi-Fi Credentials
            </Text>
            <TextInput
              placeholder="Wi-Fi SSID"
              value={ssid}
              onChangeText={setSsid}
              style={styles.input}
            />
            <TextInput
              placeholder="Wi-Fi Password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              style={styles.input}
            />
            <Button title="Send SSID" onPress={sendSSID} disabled={!ssid} />
            <View style={{ marginVertical: 10 }} />
            <Button
              title="Send Password"
              onPress={sendPassword}
              disabled={!ssidSent || !password}
            />
            <View style={{ marginTop: 10 }}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setSsidSent(false);
                }}
                color="gray"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c3338",
    padding: 20
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    color: "#fff"
  },
  scanList: {
    marginTop: 12,
    width: "90%"
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000aa"
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "90%"
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 8
  }
});

export default WiFiSetup;
