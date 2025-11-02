import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob, encode as btoa } from 'base-64';

// BLE Service and Characteristic UUIDs for Praxiom Health
const PRAXIOM_SERVICE_UUID = '00001000-0000-1000-8000-00805f9b34fb';
const AGE_CHARACTERISTIC_UUID = '00001001-0000-1000-8000-00805f9b34fb';
const HEALTH_DATA_CHARACTERISTIC_UUID = '00001002-0000-1000-8000-00805f9b34fb';

class BLEService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
    this.dataCallbacks = [];
    this.connectionCallbacks = [];
  }

  /**
   * Initialize BLE manager and request permissions
   */
  async initialize() {
    if (Platform.OS === 'android') {
      const granted = await this.requestAndroidPermissions();
      if (!granted) {
        throw new Error('Bluetooth permissions not granted');
      }
    }

    const state = await this.manager.state();
    if (state !== 'PoweredOn') {
      Alert.alert(
        'Bluetooth Required',
        'Please enable Bluetooth to connect to your Praxiom watch.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  }

  /**
   * Request Android Bluetooth permissions
   */
  async requestAndroidPermissions() {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 31) {
      // Android 12+
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(results).every(result => result === 'granted');
    } else {
      // Android 11 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth Low Energy requires location permission',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  /**
   * Scan for Praxiom watches
   */
  async scanForDevices(callback) {
    await this.initialize();

    const devices = [];
    
    this.manager.startDeviceScan(
      [PRAXIOM_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device && device.name && device.name.includes('Praxiom')) {
          const exists = devices.find(d => d.id === device.id);
          if (!exists) {
            devices.push({
              id: device.id,
              name: device.name,
              rssi: device.rssi,
            });
            callback(devices);
          }
        }
      }
    );

    // Stop scanning after 10 seconds
    setTimeout(() => {
      this.manager.stopDeviceScan();
    }, 10000);
  }

  /**
   * Connect to a Praxiom watch
   */
  async connectToDevice(deviceId) {
    try {
      console.log('Connecting to device:', deviceId);
      
      this.device = await this.manager.connectToDevice(deviceId, {
        autoConnect: false,
        requestMTU: 517,
      });

      console.log('Connected, discovering services...');
      await this.device.discoverAllServicesAndCharacteristics();

      this.isConnected = true;
      this.notifyConnectionChange(true);

      // Save device ID for auto-reconnect
      await AsyncStorage.setItem('lastConnectedDevice', deviceId);

      // Start monitoring characteristics
      this.startMonitoring();

      return this.device;
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  /**
   * Disconnect from watch
   */
  async disconnect() {
    if (this.device) {
      try {
        await this.device.cancelConnection();
        this.isConnected = false;
        this.device = null;
        this.notifyConnectionChange(false);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  /**
   * Start monitoring watch characteristics for data updates
   */
  startMonitoring() {
    if (!this.device) return;

    // Monitor age updates
    this.device.monitorCharacteristicForService(
      PRAXIOM_SERVICE_UUID,
      AGE_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Age monitoring error:', error);
          return;
        }

        if (characteristic?.value) {
          const age = this.decodeAge(characteristic.value);
          console.log('Received age update:', age);
          this.notifyDataReceived({ praxiomAge: age });
        }
      }
    );

    // Monitor health data updates
    this.device.monitorCharacteristicForService(
      PRAXIOM_SERVICE_UUID,
      HEALTH_DATA_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Health data monitoring error:', error);
          return;
        }

        if (characteristic?.value) {
          const healthData = this.decodeHealthData(characteristic.value);
          console.log('Received health data:', healthData);
          this.notifyDataReceived(healthData);
        }
      }
    );
  }

  /**
   * Decode age from BLE characteristic value
   * Format: 4 bytes representing a float (IEEE 754)
   */
  decodeAge(base64Value) {
    try {
      // Decode base64 to binary string
      const binaryString = atob(base64Value);
      
      // Convert to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Read as float (little-endian)
      const dataView = new DataView(bytes.buffer);
      const age = dataView.getFloat32(0, true); // true = little-endian
      
      return parseFloat(age.toFixed(1));
    } catch (error) {
      console.error('Age decode error:', error);
      return 0;
    }
  }

  /**
   * Decode health data from BLE characteristic value
   * Format: Multiple bytes representing various health metrics
   */
  decodeHealthData(base64Value) {
    try {
      // Decode base64 to binary string
      const binaryString = atob(base64Value);
      
      // Convert to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create DataView for reading floats
      const dataView = new DataView(bytes.buffer);
      
      // Example format (adjust based on your watch firmware):
      // Bytes 0-3: Oral health score (float)
      // Bytes 4-7: Systemic health score (float)
      // Bytes 8-11: Fitness score (float)
      
      return {
        oralHealthScore: bytes.length >= 4 ? dataView.getFloat32(0, true) : 0,
        systemicHealthScore: bytes.length >= 8 ? dataView.getFloat32(4, true) : 0,
        fitnessScore: bytes.length >= 12 ? dataView.getFloat32(8, true) : 0,
      };
    } catch (error) {
      console.error('Health data decode error:', error);
      return {};
    }
  }

  /**
   * Write age to watch
   */
  async writeAge(age) {
    if (!this.device || !this.isConnected) {
      throw new Error('Not connected to watch');
    }

    try {
      // Encode age as float (4 bytes) using DataView
      const buffer = new ArrayBuffer(4);
      const dataView = new DataView(buffer);
      dataView.setFloat32(0, age, true); // true = little-endian
      
      // Convert to base64
      const bytes = new Uint8Array(buffer);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64Value = btoa(binaryString);

      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        AGE_CHARACTERISTIC_UUID,
        base64Value
      );

      console.log('Age written to watch:', age);
    } catch (error) {
      console.error('Write age error:', error);
      throw error;
    }
  }

  /**
   * Write health data to watch
   */
  async writeHealthData(healthData) {
    if (!this.device || !this.isConnected) {
      throw new Error('Not connected to watch');
    }

    try {
      // Encode health data as floats (12 bytes total) using DataView
      const buffer = new ArrayBuffer(12);
      const dataView = new DataView(buffer);
      dataView.setFloat32(0, healthData.oralHealthScore || 0, true);
      dataView.setFloat32(4, healthData.systemicHealthScore || 0, true);
      dataView.setFloat32(8, healthData.fitnessScore || 0, true);
      
      // Convert to base64
      const bytes = new Uint8Array(buffer);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64Value = btoa(binaryString);

      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        HEALTH_DATA_CHARACTERISTIC_UUID,
        base64Value
      );

      console.log('Health data written to watch:', healthData);
    } catch (error) {
      console.error('Write health data error:', error);
      throw error;
    }
  }

  /**
   * Read current age from watch
   */
  async readAge() {
    if (!this.device || !this.isConnected) {
      throw new Error('Not connected to watch');
    }

    try {
      const characteristic = await this.device.readCharacteristicForService(
        PRAXIOM_SERVICE_UUID,
        AGE_CHARACTERISTIC_UUID
      );

      if (characteristic?.value) {
        return this.decodeAge(characteristic.value);
      }
      
      return 0;
    } catch (error) {
      console.error('Read age error:', error);
      throw error;
    }
  }

  /**
   * Register callback for data updates from watch
   */
  onDataReceived(callback) {
    this.dataCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all registered callbacks of data updates
   */
  notifyDataReceived(data) {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Data callback error:', error);
      }
    });
  }

  /**
   * Notify all registered callbacks of connection changes
   */
  notifyConnectionChange(isConnected) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Connection callback error:', error);
      }
    });
  }

  /**
   * Auto-reconnect to last connected device
   */
  async autoReconnect() {
    try {
      const lastDeviceId = await AsyncStorage.getItem('lastConnectedDevice');
      if (lastDeviceId) {
        console.log('Auto-reconnecting to:', lastDeviceId);
        await this.connectToDevice(lastDeviceId);
        return true;
      }
    } catch (error) {
      console.error('Auto-reconnect error:', error);
    }
    return false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get connected device info
   */
  getDeviceInfo() {
    if (this.device) {
      return {
        id: this.device.id,
        name: this.device.name,
      };
    }
    return null;
  }
}

// Export singleton instance
export default new BLEService();
