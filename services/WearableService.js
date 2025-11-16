/**
 * Praxiom Health - Wearable Service
 * Handles BLE communication with PineTime watch running Praxiom firmware
 * 
 * FIXED: Added missing methods for WatchScreen compatibility
 */

import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===================================
// BLE SERVICE & CHARACTERISTIC UUIDs
// ===================================

// Standard BLE Services
const HEART_RATE_SERVICE = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_MEASUREMENT = '00002A37-0000-1000-8000-00805F9B34FB';

const BATTERY_SERVICE = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_LEVEL = '00002A19-0000-1000-8000-00805F9B34FB';

// Current Time Service (for time sync)
const CTS_SERVICE_UUID = '00001805-0000-1000-8000-00805F9B34FB';
const CURRENT_TIME_CHAR_UUID = '00002A2B-0000-1000-8000-00805F9B34FB';

// InfiniTime Custom Services
const MOTION_SERVICE = '00030000-78fc-48fe-8e23-433b3a1942d0';
const STEP_COUNT_CHAR = '00030001-78fc-48fe-8e23-433b3a1942d0';

// Praxiom Custom Service
const PRAXIOM_SERVICE = '00001900-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR = '00001901-78fc-48fe-8e23-433b3a1942d0';

// Device name to scan for
const DEVICE_NAME = 'InfiniTime'; // or 'Praxiom' if you renamed it

class WearableService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
    this.isScanning = false;
    
    // Cached wearable data
    this.cachedData = {
      heartRate: 0,
      steps: 0,
      battery: 0,
      hrv: 0,
      bioAge: 0,
      lastUpdate: null
    };
    
    // Monitoring subscriptions
    this.subscriptions = [];
    this.pollingInterval = null;
    this.timeSyncInterval = null;
  }

  // ===================================
  // INITIALIZATION & PERMISSIONS
  // ===================================

  async initialize() {
    try {
      // Request BLE permissions on Android
      if (Platform.OS === 'android') {
        const granted = await this.requestAndroidPermissions();
        if (!granted) {
          this.log('❌ BLE permissions denied');
          return false;
        }
      }

      // Check if Bluetooth is enabled
      const state = await this.manager.state();
      if (state !== 'PoweredOn') {
        this.log('⚠️ Bluetooth is not enabled');
        return false;
      }

      this.log('✅ BLE initialized successfully');
      return true;
    } catch (error) {
      this.log(`❌ BLE initialization failed: ${error.message}`);
      return false;
    }
  }

  // ✅ FIX: Add alias for WatchScreen compatibility
  async init() {
    return this.initialize();
  }

  async requestAndroidPermissions() {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) {
          // Android 12+ (API 31+)
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          return (
            granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          // Android 11 and below
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          ]);

          return (
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      }
      return true;
    } catch (error) {
      this.log(`❌ Permission request failed: ${error.message}`);
      return false;
    }
  }

  // ===================================
  // DEVICE SCANNING
  // ===================================

  // ✅ FIX: Make scanForDevices return a Promise that resolves with array
  async scanForDevices(timeoutSeconds = 10) {
    try {
      if (this.isScanning) {
        this.log('⚠️ Already scanning');
        return [];
      }

      this.isScanning = true;
      this.log('🔍 Starting BLE scan...');

      const foundDevices = new Map();

      return new Promise((resolve) => {
        this.manager.startDeviceScan(
          null, // UUIDs to scan for (null = all)
          { allowDuplicates: false }, // Options object
          (error, device) => {
            if (error) {
              this.log(`❌ Scan error: ${error.message}`);
              this.stopScan();
              resolve([]); // Return empty array on error
              return;
            }

            if (device && device.name) {
              // Look for InfiniTime, Praxiom, or PineTime devices
              const name = device.name.toLowerCase();
              if (name.includes('infinit') || 
                  name.includes('pinetime') || 
                  name.includes('praxiom') ||
                  name.includes('sealed')) {
                if (!foundDevices.has(device.id)) {
                  foundDevices.set(device.id, {
                    id: device.id,
                    name: device.name,
                    rssi: device.rssi
                  });
                  this.log(`📱 Found device: ${device.name} (${device.id})`);
                }
              }
            }
          }
        );

        // Auto-stop scan after timeout and return results
        setTimeout(() => {
          if (this.isScanning) {
            this.stopScan();
            const devices = Array.from(foundDevices.values());
            this.log(`✅ Scan completed. Found ${devices.length} device(s)`);
            resolve(devices);
          }
        }, timeoutSeconds * 1000);
      });

    } catch (error) {
      this.log(`❌ Scan failed: ${error.message}`);
      this.isScanning = false;
      return [];
    }
  }

  stopScan() {
    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
      this.log('⏹️ Scan stopped');
    }
  }

  // ===================================
  // DEVICE CONNECTION
  // ===================================

  async connectToDevice(deviceId) {
    try {
      this.log(`Connecting to device: ${deviceId}`);

      // Stop scanning if active
      this.stopScan();

      // Connect to device
      this.device = await this.manager.connectToDevice(deviceId);
      this.log(`✅ Connected to ${this.device.name}`);

      // Discover services and characteristics
      await this.device.discoverAllServicesAndCharacteristics();
      this.log('✅ Services discovered');

      // Sync time immediately after connection
      await this.syncTimeToWatch();

      // Monitor disconnection
      this.device.onDisconnected((error, device) => {
        this.log(`Disconnected from ${device.name}`);
        this.handleDisconnection();
      });

      this.isConnected = true;

      // Save device ID for auto-reconnect
      await AsyncStorage.setItem('lastConnectedDevice', deviceId);

      // Start monitoring wearable data
      await this.startMonitoring();

      // Start periodic time sync (every hour)
      this.startPeriodicTimeSync();

      return true;
    } catch (error) {
      this.log(`❌ Connection failed: ${error.message}`);
      this.device = null;
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.device) {
        // Stop all monitoring
        this.stopMonitoring();
        this.stopPeriodicTimeSync();

        // Disconnect device
        await this.device.cancelConnection();
        this.device = null;
        this.isConnected = false;
        this.log('✅ Disconnected successfully');
      }
    } catch (error) {
      this.log(`⚠️ Disconnect error: ${error.message}`);
    }
  }

  handleDisconnection() {
    this.device = null;
    this.isConnected = false;
    this.stopMonitoring();
    this.stopPeriodicTimeSync();
    // App can trigger auto-reconnect here if needed
  }

  // ===================================
  // TIME SYNCHRONIZATION
  // ===================================

  async syncTimeToWatch() {
    try {
      if (!this.device) {
        this.log('⚠️ No device connected');
        return false;
      }

      const now = new Date();
      
      // Create 10-byte time data buffer according to CTS protocol
      const timeData = new Uint8Array(10);
      
      // Year (little-endian uint16)
      const year = now.getFullYear();
      timeData[0] = year & 0xFF;
      timeData[1] = (year >> 8) & 0xFF;
      
      // Month (1-12)
      timeData[2] = now.getMonth() + 1;
      
      // Day (1-31)
      timeData[3] = now.getDate();
      
      // Hours (0-23)
      timeData[4] = now.getHours();
      
      // Minutes (0-59)
      timeData[5] = now.getMinutes();
      
      // Seconds (0-59)
      timeData[6] = now.getSeconds();
      
      // Day of week (1=Monday, 7=Sunday)
      const dayOfWeek = now.getDay();
      timeData[7] = dayOfWeek === 0 ? 7 : dayOfWeek;
      
      // Fractions256 (1/256 of a second)
      timeData[8] = 0;
      
      // Adjust reason (manual time update = 1)
      timeData[9] = 1;

      const base64Data = this.bufferToBase64(timeData);

      // Write to Current Time characteristic
      await this.device.writeCharacteristicWithResponseForService(
        CTS_SERVICE_UUID,
        CURRENT_TIME_CHAR_UUID,
        base64Data
      );

      this.log(`✅ Time synced to watch: ${now.toLocaleString()}`);
      return true;

    } catch (error) {
      this.log(`❌ Failed to sync time: ${error.message}`);
      return false;
    }
  }

  startPeriodicTimeSync() {
    // Sync time every hour
    this.timeSyncInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.syncTimeToWatch();
      }
    }, 3600000); // 1 hour
  }

  stopPeriodicTimeSync() {
    if (this.timeSyncInterval) {
      clearInterval(this.timeSyncInterval);
      this.timeSyncInterval = null;
    }
  }

  // ===================================
  // BIO-AGE TRANSMISSION
  // ===================================

  async sendBioAge(bioAge) {
    try {
      if (!this.device) {
        this.log('⚠️ No device connected');
        return false;
      }

      // Validate bio-age (18-120)
      if (bioAge < 18 || bioAge > 120) {
        this.log(`⚠️ Invalid bio-age: ${bioAge}`);
        return false;
      }

      // Convert bio-age to 4-byte uint32 (little-endian)
      const buffer = new Uint8Array(4);
      buffer[0] = bioAge & 0xFF;
      buffer[1] = (bioAge >> 8) & 0xFF;
      buffer[2] = (bioAge >> 16) & 0xFF;
      buffer[3] = (bioAge >> 24) & 0xFF;

      const base64Data = this.bufferToBase64(buffer);

      // Write to Praxiom Bio-Age characteristic
      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );

      this.cachedData.bioAge = bioAge;
      this.log(`✅ Bio-Age sent to watch: ${bioAge}`);
      return true;

    } catch (error) {
      this.log(`❌ Failed to send bio-age: ${error.message}`);
      return false;
    }
  }

  // ===================================
  // DATA MONITORING
  // ===================================

  async startMonitoring() {
    try {
      this.log('📊 Starting wearable data monitoring...');

      // Monitor heart rate
      await this.monitorHeartRate();

      // Monitor battery level
      await this.monitorBattery();

      // Monitor steps (polling-based, as InfiniTime only sends when screen is on)
      this.startStepPolling();

      this.log('✅ Monitoring started');
    } catch (error) {
      this.log(`⚠️ Monitoring setup failed: ${error.message}`);
    }
  }

  stopMonitoring() {
    // Unsubscribe from all notifications
    this.subscriptions.forEach(sub => sub.remove());
    this.subscriptions = [];

    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.log('⏹️ Monitoring stopped');
  }

  async monitorHeartRate() {
    try {
      const subscription = this.device.monitorCharacteristicForService(
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            this.log(`⚠️ HR monitor error: ${error.message}`);
            return;
          }

          if (characteristic && characteristic.value) {
            const hrData = this.base64ToBuffer(characteristic.value);
            const hr = this.parseHeartRate(hrData);
            
            if (hr > 0) {
              this.cachedData.heartRate = hr;
              this.cachedData.lastUpdate = new Date();
              this.log(`💓 Heart Rate: ${hr} BPM`);
            }
          }
        }
      );

      this.subscriptions.push(subscription);
    } catch (error) {
      this.log(`⚠️ HR monitoring failed: ${error.message}`);
    }
  }

  async monitorBattery() {
    try {
      const subscription = this.device.monitorCharacteristicForService(
        BATTERY_SERVICE,
        BATTERY_LEVEL,
        (error, characteristic) => {
          if (error) {
            this.log(`⚠️ Battery monitor error: ${error.message}`);
            return;
          }

          if (characteristic && characteristic.value) {
            const batteryData = this.base64ToBuffer(characteristic.value);
            const batteryLevel = batteryData[0];
            
            this.cachedData.battery = batteryLevel;
            this.cachedData.lastUpdate = new Date();
            this.log(`🔋 Battery: ${batteryLevel}%`);
          }
        }
      );

      this.subscriptions.push(subscription);
    } catch (error) {
      this.log(`⚠️ Battery monitoring failed: ${error.message}`);
    }
  }

  startStepPolling() {
    // Poll steps every 10 seconds
    // Note: InfiniTime only broadcasts steps when screen is ON
    this.pollingInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.readSteps();
      }
    }, 10000); // 10 seconds
  }

  async readSteps() {
    try {
      const characteristic = await this.device.readCharacteristicForService(
        MOTION_SERVICE,
        STEP_COUNT_CHAR
      );

      if (characteristic && characteristic.value) {
        const stepData = this.base64ToBuffer(characteristic.value);
        const steps = this.parseSteps(stepData);
        
        if (steps >= 0) {
          // Only update if changed
          if (steps !== this.cachedData.steps) {
            this.cachedData.steps = steps;
            this.cachedData.lastUpdate = new Date();
            this.log(`👟 Steps: ${steps}`);
          }
        }
      }
    } catch (error) {
      // Silently fail - steps may not be available if screen is off
    }
  }

  // ===================================
  // DATA PARSING
  // ===================================

  parseHeartRate(data) {
    // Heart Rate Measurement format:
    // Byte 0: Flags
    // Byte 1-2: Heart Rate Value (uint8 or uint16)
    const flags = data[0];
    const isUint16 = (flags & 0x01) !== 0;

    if (isUint16) {
      return data[1] | (data[2] << 8);
    } else {
      return data[1];
    }
  }

  parseSteps(data) {
    // Step count is 4-byte uint32 (little-endian)
    return data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
  }

  // ===================================
  // DATA ACCESS (WatchScreen compatibility)
  // ===================================

  getCachedData() {
    return { ...this.cachedData };
  }

  // ✅ FIX: Add getLatestData() for WatchScreen
  getLatestData() {
    return this.getCachedData();
  }

  // ✅ FIX: Add getConnectionStatus() for WatchScreen
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      deviceName: this.device ? this.device.name : null,
      deviceId: this.device ? this.device.id : null
    };
  }

  getHeartRate() {
    return this.cachedData.heartRate;
  }

  getSteps() {
    return this.cachedData.steps;
  }

  getBattery() {
    return this.cachedData.battery;
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  log(message) {
    console.log(`[WearableService] ${message}`);
  }

  // ===================================
  // CONNECTION STATE
  // ===================================

  isDeviceConnected() {
    return this.isConnected;
  }

  getConnectedDevice() {
    return this.device ? {
      id: this.device.id,
      name: this.device.name
    } : null;
  }

  // ===================================
  // AUTO-RECONNECT
  // ===================================

  async tryAutoReconnect() {
    try {
      const lastDeviceId = await AsyncStorage.getItem('lastConnectedDevice');
      if (lastDeviceId) {
        this.log(`🔄 Attempting auto-reconnect to ${lastDeviceId}`);
        return await this.connectToDevice(lastDeviceId);
      }
      return false;
    } catch (error) {
      this.log(`⚠️ Auto-reconnect failed: ${error.message}`);
      return false;
    }
  }

  // ===================================
  // CLEANUP
  // ===================================

  async destroy() {
    await this.disconnect();
    this.manager.destroy();
    this.log('🗑️ Service destroyed');
  }
}

// Create singleton instance
const wearableService = new WearableService();

export default wearableService;
