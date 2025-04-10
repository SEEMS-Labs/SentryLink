import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Alert, TextInput, Modal } from "react-native";
import { BleManager } from "react-native-ble-plx";
import base64 from 'react-native-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const USERNAME_CHAR_UUID = "12345678-1234-1234-1234-1234567890ac";
const PASSWORD_CHAR_UUID = "12345678-1234-1234-1234-1234567890ad";
const STATUS_CHAR_UUID = "12345678-1234-1234-1234-1234567890ae";

const WiFiSetup = ({ navigation, setSkipWiFi }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");

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

      setDevices((prev) => {
        if (!prev.some((d) => d.id === device.id)) {
          return [...prev, device];
        }
        return prev;
      });
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device) => {
    try {
      manager.stopDeviceScan(); // Ensure scanning is stopped before connecting

      const isConnected = await device.isConnected();
      if (!isConnected) {
        await device.connect();
      }

      await device.discoverAllServicesAndCharacteristics();
      setSelectedDevice(device);
      setModalVisible(true);

      // Subscribe to BLE Wi-Fi connection status
      device.monitorCharacteristicForService(SERVICE_UUID, STATUS_CHAR_UUID, (error, characteristic) => {
        if (error) {
          console.error("Status monitor error:", error);
          return;
        }

        const decoded = base64.decode(characteristic?.value || "");
        console.log("📶 Status from ESP32:", decoded);

        if (decoded === "CONNECTED") {
          Alert.alert("Wi-Fi Status", "ESP32 connected to Wi-Fi!");
          setSkipWiFi(true);
        } else if (decoded === "FAILED") {
          Alert.alert("Wi-Fi Status", "ESP32 failed to connect to Wi-Fi.");
        }
      });

    } catch (error) {
      console.error("Connection failed:", error);
      if (error.message?.includes("Operation was rejected")) {
        Alert.alert("BLE Error", "Connection rejected. Try restarting the ESP32 or your phone.");
      } else {
        Alert.alert("Connection Failed", error.message || "Unable to connect.");
      }
    }
  };

  const sendWiFiCredentials = async () => {
    try {
      await selectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        USERNAME_CHAR_UUID,
        base64.encode(ssid)
      );

      await selectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        PASSWORD_CHAR_UUID,
        base64.encode(password)
      );

      // Save credentials locally
      await AsyncStorage.setItem("wifi_ssid", ssid);
      await AsyncStorage.setItem("wifi_pass", password);

      Alert.alert("Success", "Credentials sent and saved.");
      setModalVisible(false);
      setSsid("");
      setPassword("");
    } catch (error) {
      console.error("Send error:", error);
      Alert.alert("Error", "Failed to send Wi-Fi credentials.");
    }
  };

  const skipWiFiSetup = () => {
    if (typeof setSkipWiFi === "function") {
      setSkipWiFi(true);
    }
  };

  const renderDevice = ({ item }) => (
    <View style={{ marginVertical: 5 }}>
      <Button title={`Connect to ${item.name || item.id}`} onPress={() => connectToDevice(item)} />
    </View>
  );

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#2c3338" }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>WiFi Setup Screen</Text>
      <Button title={isScanning ? "Scanning..." : "Start Scanning"} onPress={startScanning} disabled={isScanning} />
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => `${item.id}_${item.name}`}
        style={{ marginTop: 20, width: "100%" }}
      />
      <View style={{ marginTop: 20 }}>
        <Button title="Skip WiFi Setup" onPress={skipWiFiSetup} color="red" />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}>
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: "90%" }}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>Enter Wi-Fi Credentials</Text>
            <TextInput
              placeholder="Wi-Fi SSID"
              value={ssid}
              onChangeText={setSsid}
              style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
              placeholder="Wi-Fi Password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <Button title="Send" onPress={sendWiFiCredentials} />
            <View style={{ marginTop: 10 }}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WiFiSetup;
