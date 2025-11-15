/**
 * WearableService.js - FIXED VERSION
 * 
 * Unified BLE service with all required functions
 * Compatible with both Tier1BiomarkerInputScreen and WatchScreen
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Standard BLE Services
const HEART_RATE_SERVICE = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_MEASUREMENT = '00002A37-0000-1000-8000-00805F9B34FB';
const MOTION_SERVICE = '00030000-78fc-48fe-8e23-433b3a1942d0';
const STEP_COUNT_CHAR = '00030001-78fc-48fe-8e23-433b3a1942d0';
const BATTERY_SERVICE = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_LEVEL = '00002A19-0000-1000-8000-00805F9B34FB';

// Custom Praxiom Health Service
const PRAXIOM_SERVICE = '00001900-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR = '00001901-78fc-48fe-8e23-433b3a1942d0';

class WearableService {
  constructor() {
    this.bleManager = null;
    this.connectedDevice = null;
    this.keepAliveInterval = null;
    this.isScanning = false;

    // Data listeners
    this.dataUpdateListeners = [];
    this.connectionListeners = [];

    // Latest data cache
    this.latestData = {
      heartRate: null,
      steps: null,
      battery: null,
      hrv: null,
    };

    // Initialize BLE
    this.initializeBLE();
  }

  async initializeBLE() {
    try {
      this.bleManager = new BleManager();
      const state = await this.bleManager.state();
      console.log('✅ BLE initialized, state:', state);

      if (state !== 'PoweredOn') {
        console.log('Waiting for Bluetooth to power on...');
        await new Promise((resolve) => {
          const subscription = this.bleManager.onStateChange((newState) => {
            console.log('BLE state changed:', newState);
            if (newState === 'PoweredOn') {
              subscription.remove();
              resolve();
            }
          }, true);
        });
      }
    } catch (error) {
      console.error('❌ BLE initialization failed:', error);
    }
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          permissions['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
          permissions['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
          permissions['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
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

  async scanForDevices(duration = 10000) {
    if (!this.bleManager) {
      throw new Error('Bluetooth is not available');
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth permissions not granted');
    }

    const state = await this.bleManager.state();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth is not powered on');
    }

    const devices = [];
    this.isScanning = true;

    return new Promise((resolve, reject) => {
      this.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          this.isScanning = false;
          reject(error);
          return;
        }

        if (device && device.name) {
          const exists = devices.find(d => d.id === device.id);
          if (!exists) {
            console.log('Found device:', device.name, device.id);
            devices.push({
              id: device.id,
              name: device.name,
              rssi: device.rssi,
            });
          }
        }
      });

      setTimeout(() => {
        this.bleManager.stopDeviceScan();
        this.isScanning = false;
        console.log(`Scan complete. Found ${devices.length} device(s)`);
        resolve(devices);
      }, duration);
    });
  }

  async connectToDevice(deviceId) {
    try {
      console.log('🔗 Connecting to device:', deviceId);

      const device = await this.bleManager.connectToDevice(deviceId, {
        autoConnect: false,
        requestMTU: 256,
      });

      console.log('✅ Connected, discovering services...');
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;
      this.notifyConnectionChange(true);

      device.onDisconnected((error) => {
        console.log('Device disconnected:', error);
        this.handleDisconnection();
      });

      await this.subscribeToServices(device);
      this.startKeepAlive();

      console.log('✅ All services subscribed successfully');
      return true;
    } catch (error) {
      console.error('❌ Connection error:', error);
      this.connectedDevice = null;
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  async subscribeToServices(device) {
    // Subscribe to Heart Rate
    try {
      device.monitorCharacteristicForService(
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            console.error('HR monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleHeartRateData(characteristic.value);
          }
        }
      );
      console.log('✓ Heart Rate monitoring started');
    } catch (error) {
      console.log('⚠️ Heart Rate service not available');
    }

    // Subscribe to Steps
    try {
      device.monitorCharacteristicForService(
        MOTION_SERVICE,
        STEP_COUNT_CHAR,
        (error, characteristic) => {
          if (error) {
            console.error('Step monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleStepData(characteristic.value);
          }
        }
      );
      console.log('✓ Step Count monitoring started');
    } catch (error) {
      console.log('⚠️ Motion Service not available');
    }

    // Subscribe to Battery
    try {
      const battery = await device.readCharacteristicForService(
        BATTERY_SERVICE,
        BATTERY_LEVEL
      );

      if (battery?.value) {
        this.handleBatteryData(battery.value);
      }

      device.monitorCharacteristicForService(
        BATTERY_SERVICE,
        BATTERY_LEVEL,
        (error, characteristic) => {
          if (!error && characteristic?.value) {
            this.handleBatteryData(characteristic.value);
          }
        }
      );
      console.log('✓ Battery monitoring started');
    } catch (error) {
      console.log('⚠️ Battery service not available');
    }
  }

  handleHeartRateData(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      const flags = buffer[0];
      const isUint16 = (flags & 0x01) !== 0;

      let heartRate;
      if (isUint16) {
        heartRate = buffer[1] | (buffer[2] << 8);
      } else {
        heartRate = buffer[1];
      }

      this.latestData.heartRate = heartRate;
      this.notifyDataUpdate({ heartRate });
    } catch (error) {
      console.error('Error parsing HR data:', error);
    }
  }

  handleStepData(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      const steps = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);

      console.log('📊 Steps:', steps);
      this.latestData.steps = steps;
      this.notifyDataUpdate({ steps });
    } catch (error) {
      console.error('Error parsing step data:', error);
    }
  }

  handleBatteryData(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      const battery = buffer[0];

      console.log('🔋 Battery:', battery + '%');
      this.latestData.battery = battery;
      this.notifyDataUpdate({ battery });
    } catch (error) {
      console.error('Error parsing battery data:', error);
    }
  }

  /**
   * ✅ FIXED: Send Praxiom Age to Watch
   * This function name matches what Tier1BiomarkerInputScreen expects
   */
  async sendPraxiomAgeToWatch(age) {
    if (!this.connectedDevice) {
      console.log('❌ No device connected');
      return false;
    }

    try {
      // Validate age
      if (age < 18 || age > 120 || isNaN(age)) {
        console.error('❌ Invalid age:', age);
        return false;
      }

      const ageInt = Math.round(age);
      console.log('📤 Sending Praxiom Age to watch:', ageInt);

      // Create 4-byte buffer (uint32 little-endian)
      const buffer = Buffer.alloc(4);
      buffer.writeUInt32LE(ageInt, 0);

      // Convert to base64
      const base64Value = buffer.toString('base64');

      console.log(`   Raw bytes: [${Array.from(buffer).join(', ')}]`);
      console.log(`   Base64: ${base64Value}`);

      // Write to watch
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Value
      );

      console.log(`✅ Praxiom Age ${ageInt} sent successfully!`);
      
      // Store for auto-sync
      await AsyncStorage.setItem('lastPraxiomAge', ageInt.toString());

      return true;
    } catch (error) {
      console.error('❌ Error sending Praxiom Age:', error.message);
      
      if (error.message && error.message.includes('not found')) {
        console.log('⚠️ Watch may not have custom Praxiom firmware installed');
      }
      
      return false;
    }
  }

  /**
   * Sync stored age on connection
   */
  async syncStoredPraxiomAge() {
    try {
      const storedAge = await AsyncStorage.getItem('lastPraxiomAge');
      if (storedAge) {
        const age = parseInt(storedAge);
        console.log('🔄 Syncing stored age:', age);
        await this.sendPraxiomAgeToWatch(age);
      }
    } catch (error) {
      console.log('Could not sync stored age:', error);
    }
  }

  startKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(async () => {
      if (this.connectedDevice) {
        try {
          await this.connectedDevice.readCharacteristicForService(
            BATTERY_SERVICE,
            BATTERY_LEVEL
          );
        } catch (error) {
          console.warn('Keep-alive failed:', error.message);
        }
      }
    }, 30000);

    console.log('✅ Keep-alive started');
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      console.log('🛑 Keep-alive stopped');
    }
  }

  async disconnect() {
    this.stopKeepAlive();

    if (this.connectedDevice) {
      try {
        await this.bleManager.cancelDeviceConnection(this.connectedDevice.id);
        this.connectedDevice = null;
        this.notifyConnectionChange(false);
        console.log('✅ Disconnected successfully');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  handleDisconnection() {
    this.stopKeepAlive();
    this.connectedDevice = null;
    this.notifyConnectionChange(false);
  }

  isConnected() {
    return this.connectedDevice !== null;
  }

  getLatestData() {
    return { ...this.latestData };
  }

  onDataUpdate(callback) {
    this.dataUpdateListeners.push(callback);
    return () => {
      this.dataUpdateListeners = this.dataUpdateListeners.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback) {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
    };
  }

  notifyDataUpdate(data) {
    this.dataUpdateListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data update listener:', error);
      }
    });
  }

  notifyConnectionChange(isConnected) {
    // Sync age when connected
    if (isConnected) {
      setTimeout(() => {
        this.syncStoredPraxiomAge();
      }, 2000);
    }

    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }
}

export default new WearableService();
