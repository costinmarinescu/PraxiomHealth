// services/WearableService.js
import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

class WearableService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isScanning = false;
  }

  // Request all necessary permissions for BLE
  async requestPermissions() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+ (API 31+)
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and Location permissions are required to connect to your PineTime watch. Please grant all permissions.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else {
        // Android 11 and below
        const locationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth scanning requires location permission on Android.',
            buttonPositive: 'OK',
          }
        );

        if (locationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Location permission is required for Bluetooth scanning on Android.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    }

    // Check if Bluetooth is powered on (with retry for state sync)
    try {
      const state = await this.manager.state();
      if (state !== 'PoweredOn') {
        // Wait a moment and check again (state might not be synced yet)
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryState = await this.manager.state();
        
        if (retryState !== 'PoweredOn') {
          // Only show error if still not powered on after retry
          console.log('Bluetooth state:', retryState);
          return true; // Allow scan anyway - some devices report incorrect state initially
        }
      }
    } catch (error) {
      console.log('Error checking Bluetooth state:', error);
      // Continue anyway - better to try scanning than block the user
    }

    return true;
  }

  // Start scanning for PineTime watches
  async startScan(onDeviceFound) {
    try {
      // Request permissions first
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return;
      }

      this.isScanning = true;

      // Stop any existing scan
      await this.manager.stopDeviceScan();

      console.log('Starting BLE scan for PineTime watches...');

      // Scan for devices with PineTime in name or specific service UUID
      this.manager.startDeviceScan(
        null, // Scan for all devices
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            Alert.alert('Scan Error', error.message);
            this.isScanning = false;
            return;
          }

          // Filter for PineTime watches
          if (
            device.name &&
            (device.name.includes('InfiniTime') ||
              device.name.includes('PineTime') ||
              device.name.includes('Pinetime'))
          ) {
            console.log('Found PineTime watch:', device.name, device.id);
            onDeviceFound(device);
          }
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(() => {
        this.stopScan();
      }, 10000);
    } catch (error) {
      console.error('Failed to start scan:', error);
      Alert.alert('Error', `Failed to start scanning: ${error.message}`);
      this.isScanning = false;
    }
  }

  // Stop scanning
  async stopScan() {
    try {
      await this.manager.stopDeviceScan();
      this.isScanning = false;
      console.log('Stopped BLE scan');
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  }

  // Connect to a device
  async connect(deviceId) {
    try {
      console.log('Connecting to device:', deviceId);

      // Connect to the device
      this.device = await this.manager.connectToDevice(deviceId, {
        timeout: 15000,
      });

      console.log('Connected to:', this.device.name);

      // Discover services and characteristics
      await this.device.discoverAllServicesAndCharacteristics();
      console.log('Discovered services');

      // Save connected device ID
      await AsyncStorage.setItem('connectedWatchId', deviceId);

      return true;
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', error.message);
      return false;
    }
  }

  // Disconnect from device
  async disconnect() {
    try {
      if (this.device) {
        await this.device.cancelConnection();
        this.device = null;
        await AsyncStorage.removeItem('connectedWatchId');
        console.log('Disconnected from watch');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  // Check if connected
  isConnected() {
    return this.device !== null;
  }

  // Get connected device name
  getDeviceName() {
    return this.device ? this.device.name : null;
  }

  // Send Bio-Age to watch
  async sendBioAge(bioAge) {
    if (!this.device) {
      Alert.alert('Error', 'No watch connected');
      return false;
    }

    try {
      // Praxiom Service UUIDs
      const SERVICE_UUID = '19000000-78fc-48fe-8e23-433b3a1942d0';
      const WRITE_CHAR_UUID = '19000001-78fc-48fe-8e23-433b3a1942d0';

      // Convert Bio-Age to 4-byte buffer (uint32_t, little-endian)
      const ageBuffer = Buffer.alloc(4);
      ageBuffer.writeUInt32LE(bioAge, 0);

      // Encode to base64 for BLE transmission
      const ageBase64 = ageBuffer.toString('base64');

      console.log(`Sending Bio-Age ${bioAge} to watch...`);

      // Write to characteristic
      await this.device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        WRITE_CHAR_UUID,
        ageBase64
      );

      console.log('Bio-Age sent successfully');
      Alert.alert('Success', `Bio-Age ${bioAge} sent to watch!`);
      return true;
    } catch (error) {
      console.error('Error sending Bio-Age:', error);
      Alert.alert('Error', `Failed to send Bio-Age: ${error.message}`);
      return false;
    }
  }

  // Listen for Bio-Age updates from watch (notifications)
  async subscribeToUpdates(callback) {
    if (!this.device) {
      console.error('No device connected');
      return;
    }

    try {
      const SERVICE_UUID = '19000000-78fc-48fe-8e23-433b3a1942d0';
      const NOTIFY_CHAR_UUID = '19000002-78fc-48fe-8e23-433b3a1942d0';

      // Subscribe to notifications
      this.device.monitorCharacteristicForService(
        SERVICE_UUID,
        NOTIFY_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Notification error:', error);
            return;
          }

          // Decode Bio-Age from base64
          const buffer = Buffer.from(characteristic.value, 'base64');
          const bioAge = buffer.readUInt32LE(0);

          console.log('Received Bio-Age update from watch:', bioAge);
          callback(bioAge);
        }
      );

      console.log('Subscribed to Bio-Age updates');
    } catch (error) {
      console.error('Error subscribing to updates:', error);
    }
  }

  // Reconnect to last connected device
  async reconnectToLastDevice() {
    try {
      const deviceId = await AsyncStorage.getItem('connectedWatchId');
      if (deviceId) {
        console.log('Attempting to reconnect to:', deviceId);
        return await this.connect(deviceId);
      }
      return false;
    } catch (error) {
      console.error('Reconnection error:', error);
      return false;
    }
  }

  // Clean up
  destroy() {
    this.manager.destroy();
  }
}

// Export singleton instance
export default new WearableService();
