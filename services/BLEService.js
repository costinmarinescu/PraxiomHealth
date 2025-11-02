import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import base64 from 'base-64';

// Praxiom Watch BLE UUIDs
const PRAXIOM_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const BIO_AGE_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const HEALTH_DATA_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

class BLEService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isScanning = false;
    this.listeners = [];
  }

  // Request Bluetooth permissions
  async requestPermissions() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
          granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
        );
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === 'granted';
      }
    }
    return true; // iOS permissions handled by Info.plist
  }

  // Scan for Praxiom watches
  async scanForDevices(onDeviceFound) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    this.isScanning = true;
    const devices = new Map();

    this.manager.startDeviceScan(
      [PRAXIOM_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          this.isScanning = false;
          return;
        }

        if (device && device.name && !devices.has(device.id)) {
          devices.set(device.id, device);
          onDeviceFound(device);
        }
      }
    );

    // Stop scanning after 10 seconds
    setTimeout(() => {
      this.stopScan();
    }, 10000);
  }

  stopScan() {
    this.manager.stopDeviceScan();
    this.isScanning = false;
  }

  // Connect to a device
  async connectToDevice(deviceId) {
    try {
      console.log('Connecting to device:', deviceId);
      
      this.device = await this.manager.connectToDevice(deviceId);
      console.log('Connected to device:', this.device.name);

      await this.device.discoverAllServicesAndCharacteristics();
      console.log('Services discovered');

      // Monitor characteristics for incoming data
      this.monitorCharacteristics();

      // Save device ID for auto-reconnect
      await AsyncStorage.setItem('lastConnectedDevice', deviceId);

      return this.device;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  // Monitor characteristics for data from watch
  monitorCharacteristics() {
    if (!this.device) return;

    // Monitor bio-age characteristic
    this.device.monitorCharacteristicForService(
      PRAXIOM_SERVICE_UUID,
      BIO_AGE_CHAR_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Monitor error:', error);
          return;
        }

        if (characteristic?.value) {
          const age = this.decodeBioAge(characteristic.value);
          this.notifyListeners({ praxiomAge: age });
        }
      }
    );

    // Monitor health data characteristic
    this.device.monitorCharacteristicForService(
      PRAXIOM_SERVICE_UUID,
      HEALTH_DATA_CHAR_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Monitor error:', error);
          return;
        }

        if (characteristic?.value) {
          const healthData = this.decodeHealthData(characteristic.value);
          this.notifyListeners(healthData);
        }
      }
    );
  }

  // Decode bio-age (2 bytes, UInt16LE, age × 10)
  decodeBioAge(base64Value) {
    try {
      const decoded = base64.decode(base64Value);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      if (bytes.length >= 2) {
        const view = new DataView(bytes.buffer);
        const ageRaw = view.getUint16(0, true); // true = little-endian
        return ageRaw / 10.0;
      }
    } catch (error) {
      console.error('Decode bio-age error:', error);
    }
    return null;
  }

  // Decode health data package (5 bytes)
  decodeHealthData(base64Value) {
    try {
      const decoded = base64.decode(base64Value);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      if (bytes.length >= 5) {
        const view = new DataView(bytes.buffer);
        return {
          praxiomAge: view.getUint16(0, true) / 10.0,
          oralHealth: bytes[2],
          systemicHealth: bytes[3],
          fitnessScore: bytes[4],
        };
      }
    } catch (error) {
      console.error('Decode health data error:', error);
    }
    return null;
  }

  // Write bio-age to watch (2 bytes, UInt16LE)
  async writeBioAge(age) {
    if (!this.device) {
      throw new Error('No device connected');
    }

    try {
      const ageRaw = Math.round(age * 10);
      const bytes = new Uint8Array(2);
      const view = new DataView(bytes.buffer);
      view.setUint16(0, ageRaw, true); // true = little-endian

      // Convert to base64
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Value = base64.encode(binary);

      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        BIO_AGE_CHAR_UUID,
        base64Value
      );

      console.log('Bio-age written to watch:', age);
    } catch (error) {
      console.error('Write bio-age error:', error);
      throw error;
    }
  }

  // Write health data package to watch (5 bytes)
  async writeHealthData(age, oralHealth, systemicHealth, fitnessScore) {
    if (!this.device) {
      throw new Error('No device connected');
    }

    try {
      const ageRaw = Math.round(age * 10);
      const bytes = new Uint8Array(5);
      const view = new DataView(bytes.buffer);
      
      view.setUint16(0, ageRaw, true); // Bio-age (little-endian)
      bytes[2] = Math.round(oralHealth);
      bytes[3] = Math.round(systemicHealth);
      bytes[4] = Math.round(fitnessScore);

      // Convert to base64
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Value = base64.encode(binary);

      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        HEALTH_DATA_CHAR_UUID,
        base64Value
      );

      console.log('Health data written to watch');
    } catch (error) {
      console.error('Write health data error:', error);
      throw error;
    }
  }

  // Register listener for data updates
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  notifyListeners(data) {
    this.listeners.forEach(callback => callback(data));
  }

  // Disconnect from device
  async disconnect() {
    if (this.device) {
      try {
        await this.device.cancelConnection();
        this.device = null;
        console.log('Disconnected from device');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  // Check if connected
  isConnected() {
    return this.device !== null;
  }

  // Get last connected device and auto-reconnect
  async autoReconnect() {
    try {
      const deviceId = await AsyncStorage.getItem('lastConnectedDevice');
      if (deviceId) {
        await this.connectToDevice(deviceId);
        return true;
      }
    } catch (error) {
      console.error('Auto-reconnect error:', error);
    }
    return false;
  }
}

// Singleton instance
export default new BLEService();
