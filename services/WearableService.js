import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Praxiom Custom Service UUIDs (matching watch firmware)
const PRAXIOM_SERVICE_UUID = '00001900-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR_UUID = '00001901-78fc-48fe-8e23-433b3a1942d0';

// Standard BLE Service UUIDs (InfiniTime compatible)
const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT_UUID = '00002a37-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

// InfiniTime Motion Service (for steps)
const MOTION_SERVICE_UUID = '00030000-78fc-48fe-8e23-433b3a1942d0';
const STEP_COUNT_UUID = '00030001-78fc-48fe-8e23-433b3a1942d0';

class WearableService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
    this.listeners = [];
    
    // Data cache
    this.cachedData = {
      heartRate: null,
      steps: null,
      battery: null,
      hrv: null,
      lastBioAgeSent: null,
      lastUpdate: null
    };
    
    // Auto-reconnect settings
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    console.log('✅ WearableService initialized');
  }

  // Request necessary permissions (Android)
  async requestPermissions() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  }

  // Scan for PineTime devices
  async scanForDevices(timeoutSeconds = 10) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    console.log('📡 Scanning for devices...');
    const devices = [];
    
    return new Promise((resolve, reject) => {
      const subscription = this.manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            subscription.remove();
            reject(error);
            return;
          }

          if (device && device.name && 
              (device.name.includes('InfiniTime') || 
               device.name.includes('Pinetime') ||
               device.name.includes('Praxiom'))) {
            console.log(`Found device: ${device.name} (${device.id})`);
            devices.push({
              id: device.id,
              name: device.name,
              rssi: device.rssi
            });
          }
        }
      );

      setTimeout(() => {
        subscription.remove();
        this.manager.stopDeviceScan();
        console.log(`✅ Scan complete. Found ${devices.length} device(s)`);
        resolve(devices);
      }, timeoutSeconds * 1000);
    });
  }

  // Connect to a specific device
  async connectToDevice(deviceId) {
    try {
      console.log(`🔌 Connecting to device: ${deviceId}`);
      
      this.device = await this.manager.connectToDevice(deviceId);
      await this.device.discoverAllServicesAndCharacteristics();
      
      this.isConnected = true;
      this.shouldReconnect = true;
      this.reconnectAttempts = 0;
      
      await AsyncStorage.setItem('lastConnectedDevice', deviceId);
      
      this.device.onDisconnected((error, device) => {
        console.log('⚠️  Device disconnected');
        this.isConnected = false;
        this.device = null;
        this.notifyListeners({ type: 'disconnected' });
        
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => this.connectToDevice(deviceId), 5000);
        }
      });

      await this.setupNotifications();
      
      console.log('✅ Connected to device successfully');
      this.notifyListeners({ type: 'connected', deviceId });
      
      return true;
    } catch (error) {
      console.error('❌ Connection error:', error);
      this.isConnected = false;
      this.device = null;
      throw error;
    }
  }

  // Set up characteristic notifications
  async setupNotifications() {
    if (!this.device) return;

    try {
      // Monitor heart rate
      this.device.monitorCharacteristicForService(
        HEART_RATE_SERVICE_UUID,
        HEART_RATE_MEASUREMENT_UUID,
        (error, characteristic) => {
          if (error) return;
          if (characteristic && characteristic.value) {
            this.parseHeartRate(characteristic.value);
          }
        }
      );

      // Monitor steps
      this.device.monitorCharacteristicForService(
        MOTION_SERVICE_UUID,
        STEP_COUNT_UUID,
        (error, characteristic) => {
          if (error) return;
          if (characteristic && characteristic.value) {
            this.parseSteps(characteristic.value);
          }
        }
      );

      console.log('✅ Notifications set up');
    } catch (error) {
      console.error('Notification setup error:', error);
    }
  }

  // Parse heart rate data
  parseHeartRate(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      
      if (buffer.length >= 2) {
        const flags = buffer[0];
        const is16Bit = (flags & 0x01) !== 0;
        
        const heartRate = is16Bit 
          ? buffer[1] | (buffer[2] << 8)
          : buffer[1];
        
        this.cachedData.heartRate = heartRate;
        this.cachedData.lastUpdate = new Date().toISOString();
        
        // Simple HRV estimate
        if (heartRate > 0) {
          this.cachedData.hrv = Math.floor(60000 / heartRate);
        }
        
        console.log(`💓 Heart rate: ${heartRate} bpm`);
        
        this.notifyListeners({
          type: 'heartRate',
          data: { 
            heartRate,
            hrv: this.cachedData.hrv
          }
        });
      }
    } catch (error) {
      console.error('Error parsing heart rate:', error);
    }
  }

  // Parse step count data
  parseSteps(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      
      if (buffer.length >= 4) {
        const steps = buffer.readUInt32LE(0);
        
        this.cachedData.steps = steps;
        this.cachedData.lastUpdate = new Date().toISOString();
        
        console.log(`👟 Steps: ${steps}`);
        
        this.notifyListeners({
          type: 'steps',
          data: { steps }
        });
      }
    } catch (error) {
      console.error('Error parsing steps:', error);
    }
  }

  // Send biological age to watch
  async sendBioAge(bioAge) {
    if (!this.device || !this.isConnected) {
      console.warn('⚠️  Cannot send bio-age: not connected');
      return false;
    }

    try {
      // Convert float to 4-byte buffer (IEEE 754 little-endian)
      const buffer = Buffer.alloc(4);
      buffer.writeFloatLE(bioAge, 0);
      const base64Value = buffer.toString('base64');
      
      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        BIO_AGE_CHAR_UUID,
        base64Value
      );
      
      this.cachedData.lastBioAgeSent = bioAge;
      console.log(`✅ Bio-Age sent to watch: ${bioAge.toFixed(1)} years`);
      
      this.notifyListeners({
        type: 'bioAgeSent',
        data: { bioAge }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error sending bio-age:', error);
      return false;
    }
  }

  // Read current battery level
  async readBattery() {
    if (!this.device || !this.isConnected) return null;

    try {
      const characteristic = await this.device.readCharacteristicForService(
        BATTERY_SERVICE_UUID,
        BATTERY_LEVEL_UUID
      );
      
      if (characteristic && characteristic.value) {
        const buffer = Buffer.from(characteristic.value, 'base64');
        const batteryLevel = buffer[0];
        this.cachedData.battery = batteryLevel;
        
        this.notifyListeners({
          type: 'battery',
          data: { battery: batteryLevel }
        });
        
        return batteryLevel;
      }
    } catch (error) {
      console.error('Error reading battery:', error);
    }
    
    return null;
  }

  // Poll all data (call periodically)
  async pollData() {
    if (!this.device || !this.isConnected) return;
    
    try {
      await this.readBattery();
    } catch (error) {
      console.error('Error polling data:', error);
    }
  }

  // Get cached data
  getCachedData() {
    return { ...this.cachedData };
  }

  // Disconnect from device
  async disconnect() {
    this.shouldReconnect = false;
    
    if (this.device) {
      try {
        await this.device.cancelConnection();
        console.log('✅ Disconnected from device');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    this.device = null;
    this.isConnected = false;
    this.notifyListeners({ type: 'disconnected' });
  }

  // Add listener for wearable events
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // Check if device is connected
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      deviceId: this.device?.id || null,
      deviceName: this.device?.name || null
    };
  }

  // Attempt to reconnect to last device
  async reconnectToLastDevice() {
    try {
      const lastDeviceId = await AsyncStorage.getItem('lastConnectedDevice');
      if (lastDeviceId) {
        console.log('🔄 Attempting to reconnect to last device...');
        await this.connectToDevice(lastDeviceId);
        return true;
      }
    } catch (error) {
      console.error('Reconnection error:', error);
    }
    return false;
  }

  // Cleanup
  destroy() {
    this.shouldReconnect = false;
    this.disconnect();
    this.listeners = [];
    this.manager.destroy();
  }
}

// Export singleton instance
export default new WearableService();
