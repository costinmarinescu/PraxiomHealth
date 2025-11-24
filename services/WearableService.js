/**
 * Praxiom Health - iOS-Enhanced WearableService
 * With improved BLE reliability for iOS devices
 * Version: 2.0 - iOS Compatible
 */

import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, AppState, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// BLE SERVICE & CHARACTERISTIC UUIDs
const HEART_RATE_SERVICE = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_MEASUREMENT = '00002A37-0000-1000-8000-00805F9B34FB';

const BATTERY_SERVICE = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_LEVEL = '00002A19-0000-1000-8000-00805F9B34FB';

const CTS_SERVICE_UUID = '00001805-0000-1000-8000-00805F9B34FB';
const CURRENT_TIME_CHAR_UUID = '00002A2B-0000-1000-8000-00805F9B34FB';

const MOTION_SERVICE = '00030000-78fc-48fe-8e23-433b3a1942d0';
const STEP_COUNT_CHAR = '00030001-78fc-48fe-8e23-433b3a1942d0';

// Praxiom Custom Service
const PRAXIOM_SERVICE = '00190000-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR = '00190100-78fc-48fe-8e23-433b3a1942d0';

const DEVICE_NAME = 'InfiniTime';

// iOS-specific constants
const IOS_CONNECTION_TIMEOUT = 15000; // 15 seconds
const IOS_WRITE_TIMEOUT = 10000; // 10 seconds
const IOS_RETRY_MAX_ATTEMPTS = 3;
const IOS_RETRY_DELAY_BASE = 1000; // 1 second base delay

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
      hrv: null,
      bioAge: 0,
      lastUpdate: null
    };
    
    this.rrIntervals = [];
    this.maxRRIntervals = 20;
    
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
    
    this.appStateSubscription = null;
    this.shouldAutoReconnect = true;
    
    // iOS-specific properties
    this.negotiatedMTU = 23; // Default minimum MTU
    this.lastConnectionAttempt = 0;
    this.connectionRetryCount = 0;
    
    this.initializeAppStateListener();
  }

  // ===================================
  // INITIALIZATION
  // ===================================

  async initialize() {
    try {
      this.log('🔧 Initializing BLE Service...');
      
      if (Platform.OS === 'android') {
        const granted = await this.requestAndroidPermissions();
        if (!granted) {
          this.log('❌ BLE permissions denied');
          return false;
        }
      } else if (Platform.OS === 'ios') {
        // Request location permission for iOS BLE scanning
        const locationGranted = await this.requestIOSPermissions();
        if (!locationGranted) {
          this.log('❌ Location permission denied (required for iOS BLE scanning)');
          Alert.alert(
            'Permission Required',
            'Location access is required by iOS to scan for Bluetooth devices. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
      }

      const state = await this.manager.state();
      if (state !== 'PoweredOn') {
        this.log('⚠️ Bluetooth is not enabled');
        Alert.alert(
          'Bluetooth Disabled',
          'Please enable Bluetooth to connect to your PineTime watch.',
          [{ text: 'OK' }]
        );
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

  // ===================================
  // iOS PERMISSIONS
  // ===================================

  async requestIOSPermissions() {
    try {
      this.log('📍 Requesting iOS location permission for BLE scanning...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        this.log('✅ Location permission granted');
        return true;
      } else {
        this.log('❌ Location permission denied');
        return false;
      }
    } catch (error) {
      this.log(`❌ iOS permission request failed: ${error.message}`);
      return false;
    }
  }

  initializeAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        this.log('📱 App came to foreground');
        
        if (this.shouldAutoReconnect && !this.isConnected) {
          this.log('🔄 Attempting auto-reconnect...');
          await this.tryAutoReconnect();
        }
      } else if (nextAppState === 'background') {
        this.log('📱 App moved to background');
        // On iOS, BLE connections can persist in background
        // but we should stop intensive operations
        if (Platform.OS === 'ios') {
          this.stopStepPolling();
        }
      }
    });
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
          { 
            allowDuplicates: false,
            scanMode: Platform.OS === 'android' ? 2 : undefined // Low latency on Android
          },
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
                  this.log(`📱 Found device: ${device.name} (${device.id}) RSSI: ${device.rssi}`);
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
  // DEVICE CONNECTION (iOS-ENHANCED)
  // ===================================

  async connectToDevice(deviceId) {
    try {
      this.log(`🔗 Connecting to device: ${deviceId}`);
      this.stopScan();

      // iOS: Prevent rapid reconnection attempts
      const now = Date.now();
      if (Platform.OS === 'ios' && now - this.lastConnectionAttempt < 2000) {
        this.log('⚠️ iOS: Waiting before retry to avoid connection issues...');
        await this.delay(2000);
      }
      this.lastConnectionAttempt = now;

      // iOS: Connection with timeout
      const connectionPromise = this.manager.connectToDevice(deviceId, {
        autoConnect: false,
        requestMTU: 185 // Request larger MTU for iOS
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), IOS_CONNECTION_TIMEOUT)
      );

      this.device = await Promise.race([connectionPromise, timeoutPromise]);
      this.log(`✅ Connected to ${this.device.name}`);

      // Discover services
      await this.device.discoverAllServicesAndCharacteristics();
      this.log('✅ Services discovered');

      // iOS: Request MTU negotiation
      if (Platform.OS === 'ios') {
        try {
          const mtu = await this.device.requestMTU(185);
          this.negotiatedMTU = mtu;
          this.log(`✅ MTU negotiated: ${mtu} bytes`);
        } catch (error) {
          this.log(`⚠️ MTU negotiation failed, using default: ${error.message}`);
        }
      }

      await this.detectAvailableServices();

      if (this.availableServices.timeSync) {
        await this.syncTimeToWatch();
      }

      this.device.onDisconnected((error, device) => {
        this.log(`❌ Disconnected from ${device.name}`);
        if (error) {
          this.log(`   Reason: ${error.message}`);
        }
        this.handleDisconnection();
      });

      this.isConnected = true;
      this.connectionRetryCount = 0; // Reset retry count on success
      await AsyncStorage.setItem('lastConnectedDevice', deviceId);
      this.shouldAutoReconnect = true;
      
      await this.startMonitoring();
      this.startPeriodicTimeSync();

      return true;
    } catch (error) {
      this.log(`❌ Connection failed: ${error.message}`);
      this.device = null;
      this.isConnected = false;
      
      // iOS: Exponential backoff for retries
      if (Platform.OS === 'ios' && this.connectionRetryCount < 3) {
        this.connectionRetryCount++;
        const delay = Math.pow(2, this.connectionRetryCount) * 1000;
        this.log(`⏳ iOS: Retrying in ${delay}ms (attempt ${this.connectionRetryCount}/3)...`);
        await this.delay(delay);
        return this.connectToDevice(deviceId);
      }
      
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
        
        this.shouldAutoReconnect = false;
        this.connectionRetryCount = 0;
        await AsyncStorage.removeItem('lastConnectedDevice');
        
        this.log('✅ Disconnected successfully (auto-reconnect disabled)');
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
    this.rrIntervals = [];
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

    } catch (error) {
      this.log(`⚠️ Service detection failed: ${error.message}`);
    }
  }

  // ===================================
  // TIME SYNCHRONIZATION
  // ===================================

  async syncTimeToWatch() {
    try {
      if (!this.availableServices.timeSync) {
        this.log('⏰ Time sync service not available');
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
      
      let dayOfWeek = now.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      timeData[7] = dayOfWeek;
      
      timeData[8] = 0;
      timeData[9] = 1;

      const base64Data = this.bufferToBase64(timeData);

      // iOS: Use write with retry
      await this.writeWithRetry(
        CTS_SERVICE_UUID,
        CURRENT_TIME_CHAR_UUID,
        base64Data
      );

      this.log(`⏰ Time synced: ${now.toLocaleString()}`);
      return true;

    } catch (error) {
      this.log(`⚠️ Time sync failed: ${error.message}`);
      return false;
    }
  }

  startPeriodicTimeSync() {
    this.timeSyncInterval = setInterval(async () => {
      if (this.isConnected && this.availableServices.timeSync) {
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
  // BIO-AGE TRANSMISSION (iOS-ENHANCED)
  // ===================================

  async sendBioAge(bioAge) {
    try {
      if (!this.device) {
        throw new Error('No device connected');
      }

      if (!this.availableServices.praxiom) {
        throw new Error('Praxiom service not available on this device');
      }

      this.log('═══════════════════════════════════════');
      this.log(`📤 SENDING BIO-AGE: ${bioAge}`);
      
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] Sending Bio-Age: ${bioAge}`);

      const buffer = new Uint8Array(4);
      const bioAgeInt = Math.round(bioAge * 10);
      
      buffer[0] = bioAgeInt & 0xFF;
      buffer[1] = (bioAgeInt >> 8) & 0xFF;
      buffer[2] = (bioAgeInt >> 16) & 0xFF;
      buffer[3] = (bioAgeInt >> 24) & 0xFF;

      this.log(`   Integer value: ${bioAgeInt} (age * 10)`);
      this.log(`   Bytes: [${Array.from(buffer).join(', ')}]`);
      this.log(`   Hex: [${Array.from(buffer).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);

      const base64Data = this.bufferToBase64(buffer);
      this.log(`   Base64: ${base64Data}`);

      // iOS: Use enhanced write with retry and timeout
      this.log('📡 Writing to characteristic...');
      await this.writeWithRetry(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );

      this.log('✅ Bio-Age sent successfully!');
      this.log('═══════════════════════════════════════');
      
      this.cachedData.bioAge = bioAge;
      this.addTransmissionLog(`[${timestamp}] ✅ Bio-Age sent successfully`);
      
      return true;

    } catch (error) {
      this.log('❌ ERROR sending Bio-Age:');
      this.log(`   Message: ${error.message}`);
      this.log('═══════════════════════════════════════');
      
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  // iOS: Enhanced write method with retry logic and timeout
  async writeWithRetry(serviceUUID, characteristicUUID, base64Data, maxAttempts = IOS_RETRY_MAX_ATTEMPTS) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log(`📝 Write attempt ${attempt}/${maxAttempts}...`);
        
        // Create timeout promise
        const writePromise = this.device.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          base64Data
        );

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Write timeout')), IOS_WRITE_TIMEOUT)
        );

        // Race between write and timeout
        await Promise.race([writePromise, timeoutPromise]);
        
        this.log(`✅ Write successful on attempt ${attempt}`);
        return true;

      } catch (error) {
        lastError = error;
        this.log(`⚠️ Write attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxAttempts) {
          const delayMs = IOS_RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          this.log(`⏳ Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }
    
    throw new Error(`Write failed after ${maxAttempts} attempts: ${lastError.message}`);
  }

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

      const bioAgeInt = Math.round(age * 10);
      if (bioAgeInt < 180 || bioAgeInt > 1200) {
        throw new Error('Age must be between 18 and 120');
      }
      this.log(`✅ Step 3: Age validated: ${age} (sending as ${bioAgeInt})`);

      const buffer = new Uint8Array(4);
      buffer[0] = bioAgeInt & 0xFF;
      buffer[1] = (bioAgeInt >> 8) & 0xFF;
      buffer[2] = (bioAgeInt >> 16) & 0xFF;
      buffer[3] = (bioAgeInt >> 24) & 0xFF;

      this.log('📦 Step 4: Buffer created');
      this.log(`   Original age: ${age}`);
      this.log(`   Multiplied by 10: ${bioAgeInt}`);
      this.log(`   Byte 0: 0x${buffer[0].toString(16).padStart(2, '0')} (${buffer[0]})`);
      this.log(`   Byte 1: 0x${buffer[1].toString(16).padStart(2, '0')} (${buffer[1]})`);
      this.log(`   Byte 2: 0x${buffer[2].toString(16).padStart(2, '0')} (${buffer[2]})`);
      this.log(`   Byte 3: 0x${buffer[3].toString(16).padStart(2, '0')} (${buffer[3]})`);
      this.log(`   Hex: ${Array.from(buffer).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

      const base64Data = this.bufferToBase64(buffer);
      this.log(`📝 Step 5: Base64 encoded: ${base64Data}`);

      this.log('📤 Step 6: Writing to characteristic...');
      this.log(`   Service: ${PRAXIOM_SERVICE}`);
      this.log(`   Characteristic: ${BIO_AGE_CHAR}`);
      this.log(`   Data length: ${buffer.length} bytes`);
      this.log(`   Platform: ${Platform.OS}`);
      this.log(`   MTU: ${this.negotiatedMTU} bytes`);

      // Use enhanced write method for iOS
      await this.writeWithRetry(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );

      this.log('✅ Step 7: Write completed successfully!');
      this.log('   Watch should display: ' + Math.round(age));
      this.log('═══════════════════════════════════════');

      this.cachedData.bioAge = age;
      
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] 📤 Sending Bio-Age: ${age}`);
      this.addTransmissionLog(`[${timestamp}] ✅ Bio-Age sent successfully`);
      
      return {
        success: true,
        bioAge: age,
        deviceName: this.device.name,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        mtu: this.negotiatedMTU
      };

    } catch (error) {
      this.log('❌ ERROR in sendTestAge:');
      this.log(`   Message: ${error.message}`);
      this.log(`   Platform: ${Platform.OS}`);
      this.log('═══════════════════════════════════════');
      
      const timestamp = new Date().toLocaleTimeString();
      this.addTransmissionLog(`[${timestamp}] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  async testBioAgeTransmission(bioAge) {
    return this.sendTestAge(bioAge);
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
  // MONITORING
  // ===================================

  async startMonitoring() {
    this.log('📊 Starting device monitoring...');

    if (this.availableServices.heartRate) {
      await this.monitorHeartRate();
    }

    if (this.availableServices.battery) {
      await this.monitorBattery();
    }

    if (this.availableServices.motion) {
      this.startStepPolling();
    }
  }

  stopMonitoring() {
    this.subscriptions.forEach(sub => sub.remove());
    this.subscriptions = [];
    this.stopStepPolling();
    this.log('⏹️ Monitoring stopped');
  }

  stopStepPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
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
            
            const result = this.parseHeartRateWithRR(hrData);
            
            if (result.heartRate > 0) {
              this.cachedData.heartRate = result.heartRate;
              this.cachedData.lastUpdate = new Date();
              this.log(`❤️ HR: ${result.heartRate} bpm`);
              
              if (result.rrIntervals && result.rrIntervals.length > 0) {
                this.addRRIntervals(result.rrIntervals);
                this.calculateHRV();
              }
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
    // On iOS, reduce polling frequency when in background
    const pollingInterval = Platform.OS === 'ios' ? 15000 : 10000;
    
    this.pollingInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.readSteps();
      }
    }, pollingInterval);
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

  parseHeartRateWithRR(data) {
    const flags = data[0];
    const isUint16 = (flags & 0x01) !== 0;
    const hasRRInterval = (flags & 0x10) !== 0;

    let heartRate;
    let offset;

    if (isUint16) {
      heartRate = data[1] | (data[2] << 8);
      offset = 3;
    } else {
      heartRate = data[1];
      offset = 2;
    }

    const rrIntervals = [];
    
    if (hasRRInterval && data.length > offset) {
      while (offset < data.length - 1) {
        const rr = data[offset] | (data[offset + 1] << 8);
        const rrMs = (rr / 1024.0) * 1000;
        rrIntervals.push(rrMs);
        offset += 2;
      }
      
      if (rrIntervals.length > 0) {
        this.log(`📊 RR Intervals: ${rrIntervals.map(r => r.toFixed(0)).join(', ')} ms`);
      }
    }

    return {
      heartRate,
      rrIntervals
    };
  }

  parseSteps(data) {
    return data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
  }

  // ===================================
  // HRV CALCULATION
  // ===================================

  addRRIntervals(intervals) {
    this.rrIntervals.push(...intervals);
    
    if (this.rrIntervals.length > this.maxRRIntervals) {
      this.rrIntervals = this.rrIntervals.slice(-this.maxRRIntervals);
    }
  }

  calculateHRV() {
    if (this.rrIntervals.length < 2) {
      return null;
    }

    let sumSquaredDiff = 0;
    
    for (let i = 1; i < this.rrIntervals.length; i++) {
      const diff = this.rrIntervals[i] - this.rrIntervals[i - 1];
      sumSquaredDiff += diff * diff;
    }
    
    const rmssd = Math.sqrt(sumSquaredDiff / (this.rrIntervals.length - 1));
    
    this.cachedData.hrv = Math.round(rmssd);
    
    this.log(`📈 HRV (RMSSD): ${this.cachedData.hrv} ms (from ${this.rrIntervals.length} intervals)`);
    
    return this.cachedData.hrv;
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
      deviceId: this.device ? this.device.id : null,
      mtu: this.negotiatedMTU,
      platform: Platform.OS
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

  getHRV() {
    return this.cachedData.hrv;
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [WearableService] ${message}`);
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
      name: this.device.name,
      mtu: this.negotiatedMTU
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
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    await this.disconnect();
    this.manager.destroy();
    this.log('🗑️ Service destroyed');
  }
}

const wearableService = new WearableService();

export default wearableService;
