import React, { useEffect, useState } from 'react';
import { View, Text, Button} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const WiFiSetup = () => {
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
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setIsScanning(false);
        return;
      }
      setDevices((prevDevices) => [...prevDevices, device]);
    });
  };

  const connectToDevice = async (device) => {
    try {
      await device.connect();
      await device.discoverAllServicesAndCharacteristics();
      console.log('Connected to device:', device);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <View>
      <Text>WiFi Setup Screen</Text>
      <Button title={isScanning ? 'Scanning...' : 'Start Scanning'} onPress={startScanning} />
      <View>
        {devices.map((device, index) => (
          <Button key={index} title={`Connect to ${device.name}`} onPress={() => connectToDevice(device)} />
        ))}
      </View>
    </View>
  );
};

export default WiFiSetup;
