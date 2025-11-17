/**
 * Praxiom Health - DIAGNOSTIC WearableService
 * Enhanced logging to debug watch display issue
 */

import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BLE SERVICE & CHARACTERISTIC UUIDs
const HEART_RATE_SERVICE = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_MEASUREMENT = '00002A37-0000-1000-8000-00805F9B34FB';

const BATTERY_SERVICE = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_LEVEL = '00002A19-0000-1000-8000-00805F9B34FB';

const CTS_SERVICE_UUID = '00001805-0000-1000-8000-00805F9B34FB';
const CURRENT_TIME_CHAR_UUID = '00002A2B-0000-1000-8000-00805F9B34FB';

const MOTION_SERVICE = '00030000-78fc-48fe-8e23-433b3a1942d0';
const STEP_COUNT_CHAR = '00030001-78fc-48fe-8e23-433b3a1942d0';

// Praxiom Custom Service - CORRECTED to match firmware broadcast
const PRAXIOM_SERVICE = '00190000-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR = '01190000-78fc-48fe-8e23-433b3a1942d0';

const DEVICE_NAME = 'InfiniTime';

class WearableService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
    this.isScanning = false;
    
    this.cachedData = {
      heartRate: 0,
      steps: 0,
      battery: 0,
      hrv: 0,
      bioAge: 0,
      lastUpdate: null
    };
    
    this.subscriptions = [];
    this.pollingInterval = null;
    this.timeSyncInterval = null;
    this.transmissionLog = [];
    
    this.availableServices = {
      praxiom: false,
      heartRate: false,
      battery: false,
      motion: false,
      timeSync: false
    };
  }

  // ===================================
  // INITIALIZATION
  // ===================================

  async initialize() {
    try {
      if (Platform.OS === 'android') {
        const granted = await this.requestAndroidPermissions();
        if (!granted) {
          this.log('❌ BLE permissions denied');
          return false;
        }
      }

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

  async init() {
    return this.initialize();
  }

  async requestAndroidPermissions() {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) {
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
          null,
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              this.log(`❌ Scan error: ${error.message}`);
              this.stopScan();
              resolve([]);
              return;
            }

            if (device && device.name) {
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
      this.stopScan();

      this.device = await this.manager.connectToDevice(deviceId);
      this.log(`✅ Connected to ${this.device.name}`);

      await this.device.discoverAllServicesAndCharacteristics();
      this.log('✅ Services discovered');

      await this.detectAvailableServices();

      if (this.availableServices.timeSync) {
        await this.syncTimeToWatch();
      }

      this.device.onDisconnected((error, device) => {
        this.log(`Disconnected from ${device.name}`);
        this.handleDisconnection();
      });

      this.isConnected = true;
      await AsyncStorage.setItem('lastConnectedDevice', deviceId);
      await this.startMonitoring();
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
        this.stopMonitoring();
        this.stopPeriodicTimeSync();
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
  }

  // ===================================
  // SERVICE DETECTION
  // ===================================

  async detectAvailableServices() {
    try {
      if (!this.device) {
        return;
      }

      this.log('🔍 Detecting available services...');

      const services = await this.device.services();
      const serviceUUIDs = services.map(s => s.uuid.toUpperCase());

      this.availableServices.praxiom = serviceUUIDs.includes(PRAXIOM_SERVICE.toUpperCase());
      this.availableServices.heartRate = serviceUUIDs.includes(HEART_RATE_SERVICE.toUpperCase());
      this.availableServices.battery = serviceUUIDs.includes(BATTERY_SERVICE.toUpperCase());
      this.availableServices.motion = serviceUUIDs.includes(MOTION_SERVICE.toUpperCase());
      this.availableServices.timeSync = serviceUUIDs.includes(CTS_SERVICE_UUID.toUpperCase());

      this.log(`📊 Service Detection Results:`);
      this.log(`   Praxiom Bio-Age: ${this.availableServices.praxiom ? '✅' : '❌'}`);
      this.log(`   Heart Rate: ${this.availableServices.heartRate ? '✅' : '❌'}`);
      this.log(`   Battery: ${this.availableServices.battery ? '✅' : '❌'}`);
      this.log(`   Motion/Steps: ${this.availableServices.motion ? '✅' : '❌'}`);
      this.log(`   Time Sync: ${this.availableServices.timeSync ? '✅' : '❌'}`);

      if (this.availableServices.praxiom) {
        const timestamp = new Date().toLocaleTimeString();
        this.addTransmissionLog(`[${timestamp}] ✅ Praxiom service detected and ready`);
      } else {
        const timestamp = new Date().toLocaleTimeString();
        this.addTransmissionLog(
          `[${timestamp}] ⚠️ Warning: Praxiom bio-age service not available. ` +
          `Flash custom Praxiom firmware to enable bio-age display.`
        );
      }

      return this.availableServices;
    } catch (error) {
      this.log(`⚠️ Service detection failed: ${error.message}`);
      return this.availableServices;
    }
  }

  isPraxiomServiceAvailable() {
    return this.availableServices.praxiom;
  }

  getAvailableServices() {
    return { ...this.availableServices };
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
      const timeData = new Uint8Array(10);
      
      const year = now.getFullYear();
      timeData[0] = year & 0xFF;
      timeData[1] = (year >> 8) & 0xFF;
      timeData[2] = now.getMonth() + 1;
      timeData[3] = now.getDate();
      timeData[4] = now.getHours();
      timeData[5] = now.getMinutes();
      timeData[6] = now.getSeconds();
      
      const dayOfWeek = now.getDay();
      timeData[7] = dayOfWeek === 0 ? 7 : dayOfWeek;
      timeData[8] = 0;
      timeData[9] = 1;

      const base64Data = this.bufferToBase64(timeData);

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
    this.timeSyncInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.syncTimeToWatch();
      }
    }, 3600000);
  }

  stopPeriodicTimeSync() {
    if (this.timeSyncInterval) {
      clearInterval(this.timeSyncInterval);
      this.timeSyncInterval = null;
    }
  }

  // ===================================
  // BIO-AGE TRANSMISSION (DIAGNOSTIC VERSION)
  // ===================================

  async sendBioAge(bioAge) {
    try {
      if (!this.device) {
        throw new Error('No device connected');
      }

      if (!this.availableServices.praxiom) {
        throw new Error(
          'Praxiom service not available. Flash custom Praxiom firmware.'
        );
      }

      if (bioAge < 18 || bioAge > 120) {
        throw new Error('Bio-age must be between 18 and 120');
      }

      const buffer = new Uint8Array(4);
      buffer[0] = bioAge & 0xFF;
      buffer[1] = (bioAge >> 8) & 0xFF;
      buffer[2] = (bioAge >> 16) & 0xFF;
      buffer[3] = (bioAge >> 24) & 0xFF;

      const base64Data = this.bufferToBase64(buffer);

      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );

      this.cachedData.bioAge = bioAge;
      
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] ✅ Bio-Age ${bioAge} sent successfully`);
      
      this.log(`✅ Bio-Age sent to watch: ${bioAge}`);
      return { success: true, bioAge };

    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] ❌ Failed: ${error.message}`);
      this.log(`❌ Failed to send bio-age: ${error.message}`);
      throw error;
    }
  }

  // ===================================
  // TEST MODE (DIAGNOSTIC VERSION)
  // ===================================

  async sendTestAge(age) {
    try {
      this.log('═══════════════════════════════════════');
      this.log('🔬 DIAGNOSTIC MODE - DETAILED LOGGING');
      this.log('═══════════════════════════════════════');
      
      if (!this.device) {
        throw new Error('No device connected');
      }
      this.log('✅ Step 1: Device connected');

      if (!this.availableServices.praxiom) {
        throw new Error(
          'Praxiom Bio-Age Service Not Found\n\n' +
          'Your watch is running standard InfiniTime firmware. ' +
          'Flash custom Praxiom firmware to enable bio-age display.'
        );
      }
      this.log('✅ Step 2: Praxiom service available');

      const bioAge = Math.round(age);
      if (bioAge < 18 || bioAge > 120) {
        throw new Error('Age must be between 18 and 120');
      }
      this.log(`✅ Step 3: Age validated: ${bioAge}`);

      // Create buffer with detailed logging
      const buffer = new Uint8Array(4);
      buffer[0] = bioAge & 0xFF;
      buffer[1] = (bioAge >> 8) & 0xFF;
      buffer[2] = (bioAge >> 16) & 0xFF;
      buffer[3] = (bioAge >> 24) & 0xFF;

      this.log('📦 Step 4: Buffer created');
      this.log(`   Byte 0: ${buffer[0].toString(16).padStart(2, '0')} (${buffer[0]})`);
      this.log(`   Byte 1: ${buffer[1].toString(16).padStart(2, '0')} (${buffer[1]})`);
      this.log(`   Byte 2: ${buffer[2].toString(16).padStart(2, '0')} (${buffer[2]})`);
      this.log(`   Byte 3: ${buffer[3].toString(16).padStart(2, '0')} (${buffer[3]})`);
      this.log(`   Hex: ${Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

      const base64Data = this.bufferToBase64(buffer);
      this.log(`📝 Step 5: Base64 encoded: ${base64Data}`);

      this.log('📤 Step 6: Writing to characteristic...');
      this.log(`   Service: ${PRAXIOM_SERVICE}`);
      this.log(`   Characteristic: ${BIO_AGE_CHAR}`);
      this.log(`   Data length: ${buffer.length} bytes`);

      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );

      this.log('✅ Step 7: Write completed successfully!');
      this.log('═══════════════════════════════════════');

      this.cachedData.bioAge = bioAge;
      
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] 📤 DIAGNOSTIC: Sent ${bioAge} as bytes [${Array.from(buffer).join(', ')}]`);
      this.addTransmissionLog(`[${timestamp}] ✅ Write confirmed by watch`);
      
      return {
        success: true,
        bioAge: bioAge,
        deviceName: this.device.name,
        timestamp: new Date().toISOString(),
        diagnostics: {
          bytes: Array.from(buffer),
          hex: Array.from(buffer).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '),
          base64: base64Data
        }
      };

    } catch (error) {
      this.log('❌ ERROR occurred:');
      this.log(`   Message: ${error.message}`);
      this.log(`   Stack: ${error.stack}`);
      this.log('═══════════════════════════════════════');
      
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] ❌ Test failed: ${error.message}`);
      throw error;
    }
  }

  addTransmissionLog(message) {
    this.transmissionLog.push(message);
    if (this.transmissionLog.length > 50) {
      this.transmissionLog.shift();
    }
  }

  getTransmissionLog() {
    return [...this.transmissionLog];
  }

  clearTransmissionLog() {
    this.transmissionLog = [];
  }

  // ===================================
  // DATA MONITORING
  // ===================================

  async startMonitoring() {
    try {
      this.log('📊 Starting wearable data monitoring...');
      await this.monitorHeartRate();
      await this.monitorBattery();
      this.startStepPolling();
      this.log('✅ Monitoring started');
    } catch (error) {
      this.log(`⚠️ Monitoring setup failed: ${error.message}`);
    }
  }

  stopMonitoring() {
    this.subscriptions.forEach(sub => sub.remove());
    this.subscriptions = [];

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
    this.pollingInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.readSteps();
      }
    }, 10000);
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
          if (steps !== this.cachedData.steps) {
            this.cachedData.steps = steps;
            this.cachedData.lastUpdate = new Date();
            this.log(`👟 Steps: ${steps}`);
          }
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  // ===================================
  // DATA PARSING
  // ===================================

  parseHeartRate(data) {
    const flags = data[0];
    const isUint16 = (flags & 0x01) !== 0;

    if (isUint16) {
      return data[1] | (data[2] << 8);
    } else {
      return data[1];
    }
  }

  parseSteps(data) {
    return data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
  }

  // ===================================
  // DATA ACCESS
  // ===================================

  getCachedData() {
    return { ...this.cachedData };
  }

  getLatestData() {
    return this.getCachedData();
  }

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

const wearableService = new WearableService();

export default wearableService;
