import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Alert } from "react-native";
import { BleManager } from "react-native-ble-plx";

const WiFiSetup = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const manager = new BleManager();

  useEffect(() => {
    // Cleanup when the component unmounts
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setDevices([]); // Reset devices before starting a new scan
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setIsScanning(false);
        return;
      }
      setDevices((prevDevices) => {
        // Ensure that only unique devices are added to the list
        if (!prevDevices.some((d) => d.id === device.id)) {
          return [...prevDevices, device];
        }
        return prevDevices;
      });
    });
  };

  const connectToDevice = async (device) => {
    try {
      await device.connect();
      await device.discoverAllServicesAndCharacteristics();
      console.log("Connected to device:", device);
      // Navigate to next screen or handle device connection logic here
      Alert.alert("Device Connected", `Successfully connected to ${device.name}`);
    } catch (error) {
      console.error("Connection failed:", error);
      Alert.alert("Connection Failed", `Failed to connect to ${device.name}`);
    }
  };

  const skipWiFiSetup = () => {
    navigation.navigate("Home"); // Skip WiFi setup and go back to Home screen
  };

  const renderDevice = ({ item }) => {
    return (
      <View>
        <Button title={`Connect to ${item.name || item.id}`} onPress={() => connectToDevice(item)} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>WiFi Setup Screen</Text>
      <Button title={isScanning ? "Scanning..." : "Start Scanning"} onPress={startScanning} />
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => `${item.id}_${item.name}`}  // Ensuring a unique key
        style={{ marginTop: 20 }}
      />
      <Button title="Skip WiFi Setup" onPress={skipWiFiSetup} />
    </View>
  );
};

export default WiFiSetup;
