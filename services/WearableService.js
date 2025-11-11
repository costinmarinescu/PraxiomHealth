import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import base64 from 'react-native-base64';

// BLE Service UUIDs
const HEART_RATE_SERVICE = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_MEASUREMENT = '00002A37-0000-1000-8000-00805F9B34FB';
const MOTION_SERVICE = '00030000-78fc-48fe-8e23-433b3a1942d0';
const STEP_COUNT_CHAR = '00030001-78fc-48fe-8e23-433b3a1942d0';
const BATTERY_SERVICE = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_LEVEL = '00002A19-0000-1000-8000-00805F9B34FB';
const CURRENT_TIME_SERVICE = '00001805-0000-1000-8000-00805F9B34FB';
const CURRENT_TIME_CHAR = '00002A2B-0000-1000-8000-00805F9B34FB';

// ✅ FIXED: Custom Praxiom Health Service
const PRAXIOM_SERVICE = '00001900-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR = '00001901-78fc-48fe-8e23-433b3a1942d0';
const HEALTH_REQUEST_CHAR = '00001902-78fc-48fe-8e23-433b3a1942d0'; // ✅ Fixed: Added missing '0'

class WearableService {
  constructor() {
    this.bleManager = new BleManager();
    this.connectedDevice = null;
    this.isScanning = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;

    // Data listeners
    this.dataUpdateListeners = [];
    this.connectionListeners = [];

    // Cached data
    this.latestData = {
      heartRate: null,
      steps: null,
      battery: null,
      hrv: null,
      sleepEfficiency: null,
    };

    // Initialize BLE manager with retry logic
    this.initializeBLE();
  }

  async initializeBLE() {
    try {
      const state = await this.bleManager.state();
      console.log('Initial BLE state:', state);

      if (state !== 'PoweredOn') {
        console.log('Waiting for Bluetooth to be ready...');
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

      console.log('BLE Manager initialized successfully');
    } catch (error) {
      console.error('BLE initialization error:', error);
    }
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
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
        // Android 11 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions automatically
  }

  async scanForDevices(duration = 10000) {
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
          const name = device.name.toLowerCase();
          // Look for InfiniTime watches (PineTime, Sealed, etc.)
          if (name.includes('infini') || name.includes('pine') || name.includes('sealed')) {
            const exists = devices.find(d => d.id === device.id);
            if (!exists) {
              console.log('Found watch:', device.name, device.id);
              devices.push({
                id: device.id,
                name: device.name,
                rssi: device.rssi,
              });
            }
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
      console.log('Connecting to device:', deviceId);

      // Connect to device
      const device = await this.bleManager.connectToDevice(deviceId, {
        autoConnect: false,
        requestMTU: 256,
      });

      console.log('Connected, discovering services...');
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);

      // Set up disconnect handler
      device.onDisconnected((error, disconnectedDevice) => {
        console.log('Device disconnected:', error);
        this.handleDisconnection();
      });

      // Sync time first
      await this.syncTime(device);

      // Subscribe to all services
      await this.subscribeToServices(device);

      console.log('All services subscribed successfully');
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      this.connectedDevice = null;
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  async syncTime(device) {
    try {
      console.log('Syncing time...');
      const now = new Date();
      const timeData = new Uint8Array(10);

      // Year (little-endian)
      const year = now.getFullYear();
      timeData[0] = year & 0xFF;
      timeData[1] = (year >> 8) & 0xFF;

      // Month (1-12)
      timeData[2] = now.getMonth() + 1;

      // Day
      timeData[3] = now.getDate();

      // Hour
      timeData[4] = now.getHours();

      // Minute
      timeData[5] = now.getMinutes();

      // Second
      timeData[6] = now.getSeconds();

      // Day of week (1=Monday, 7=Sunday)
      const dayOfWeek = ((now.getDay() + 6) % 7) + 1;
      timeData[7] = dayOfWeek;

      // Fractions256
      timeData[8] = 0;

      // Adjust reason (0 = manual)
      timeData[9] = 0;

      const base64Data = base64.encode(String.fromCharCode(...timeData));

      await device.writeCharacteristicWithResponseForService(
        CURRENT_TIME_SERVICE,
        CURRENT_TIME_CHAR,
        base64Data
      );

      console.log('Time synchronized successfully');
    } catch (error) {
      console.error('Time sync error:', error);
      // Non-critical error, continue with connection
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
      console.log('✅ Subscribed to Heart Rate');
    } catch (error) {
      console.error('Failed to subscribe to HR:', error);
    }

    // Subscribe to Steps
    try {
      device.monitorCharacteristicForService(
        MOTION_SERVICE,
        STEP_COUNT_CHAR,
        (error, characteristic) => {
          if (error) {
            console.error('Steps monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleStepData(characteristic.value);
          }
        }
      );
      console.log('✅ Subscribed to Step Count');
    } catch (error) {
      console.error('Failed to subscribe to steps:', error);
    }

    // Subscribe to Battery
    try {
      device.monitorCharacteristicForService(
        BATTERY_SERVICE,
        BATTERY_LEVEL,
        (error, characteristic) => {
          if (error) {
            console.error('Battery monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleBatteryData(characteristic.value);
          }
        }
      );
      console.log('✅ Subscribed to Battery Level');
    } catch (error) {
      console.error('Failed to subscribe to battery:', error);
    }

    // Subscribe to Health Request (if watch supports it)
    try {
      device.monitorCharacteristicForService(
        PRAXIOM_SERVICE,
        HEALTH_REQUEST_CHAR,
        (error, characteristic) => {
          if (error) {
            console.error('Health request monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            console.log('✅ Watch requested Bio-Age update');
            // Notify app that watch wants fresh data
            this.notifyDataUpdate({ requestUpdate: true });
          }
        }
      );
      console.log('✅ Subscribed to Praxiom Health Request (custom firmware detected)');
    } catch (error) {
      console.log('⚠️ Custom Praxiom service not available (may be stock InfiniTime)');
    }
  }

  handleHeartRateData(base64Value) {
    try {
      const data = base64.decode(base64Value);
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }

      const flags = bytes[0];
      const isUint16 = (flags & 0x01) !== 0;

      let heartRate;
      if (isUint16) {
        heartRate = bytes[1] | (bytes[2] << 8);
      } else {
        heartRate = bytes[1];
      }

      this.latestData.heartRate = heartRate;
      this.notifyDataUpdate({ heartRate });

      // Parse RR intervals for HRV if present
      if ((flags & 0x10) !== 0 && bytes.length > 3) {
        const rrIntervals = [];
        let offset = isUint16 ? 3 : 2;

        while (offset < bytes.length - 1) {
          const rr = bytes[offset] | (bytes[offset + 1] << 8);
          const rrMs = (rr / 1024.0) * 1000;
          rrIntervals.push(rrMs); // ✅ Fixed: Changed from .append() to .push()
          offset += 2;
        }

        if (rrIntervals.length > 0) {
          // Calculate simple HRV score (RMSSD)
          const hrv = this.calculateHRV(rrIntervals);
          this.latestData.hrv = hrv;
          this.notifyDataUpdate({ hrv });
        }
      }
    } catch (error) {
      console.error('Error parsing HR data:', error);
    }
  }

  handleStepData(base64Value) {
    try {
      const data = base64.decode(base64Value);
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }

      const steps = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
      this.latestData.steps = steps;
      this.notifyDataUpdate({ steps });
    } catch (error) {
      console.error('Error parsing step data:', error);
    }
  }

  handleBatteryData(base64Value) {
    try {
      const data = base64.decode(base64Value);
      const battery = data.charCodeAt(0);
      this.latestData.battery = battery;
      this.notifyDataUpdate({ battery });
    } catch (error) {
      console.error('Error parsing battery data:', error);
    }
  }

  calculateHRV(rrIntervals) {
    if (rrIntervals.length < 2) return null;

    // Calculate RMSSD (Root Mean Square of Successive Differences)
    let sumSquaredDiffs = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      const diff = rrIntervals[i] - rrIntervals[i - 1];
      sumSquaredDiffs += diff * diff;
    }

    const rmssd = Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));

    // Convert to HRV score (0-100)
    // Typical RMSSD: 20-80ms, higher is better
    const hrvScore = Math.min(100, Math.max(0, (rmssd / 80) * 100));
    return Math.round(hrvScore);
  }

  async sendBioAge(data) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const { praxiomAge } = data;

      // ✅ FIXED: Send 4-byte uint32 (matching firmware expectation)
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, Math.round(praxiomAge), true);

      // Convert to base64
      const bytes = new Uint8Array(buffer);
      const base64Data = base64.encode(String.fromCharCode(...bytes));

      console.log('📤 Sending Bio-Age to watch:', Math.round(praxiomAge));
      console.log('🔧 Using service UUID:', PRAXIOM_SERVICE);
      console.log('🔧 Using characteristic UUID:', BIO_AGE_CHAR);

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );

      console.log('✅ Bio-Age data sent successfully to watch');
      return true;
    } catch (error) {
      console.error('❌ Error sending Bio-Age:', error);

      // If service not found, it means watch doesn't have custom firmware yet
      if (error.message && (error.message.includes('not found') || error.message.includes('Unknown'))) {
        throw new Error(
          'Watch firmware does not support Praxiom Health Service. ' +
          'Please ensure you have the Praxiom custom firmware installed on your watch.'
        );
      }

      throw error;
    }
  }

  async disconnect() {
    if (this.connectedDevice) {
      try {
        await this.bleManager.cancelDeviceConnection(this.connectedDevice.id);
        this.connectedDevice = null;
        this.notifyConnectionChange(false);
        console.log('Disconnected successfully');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  handleDisconnection() {
    this.connectedDevice = null;
    this.notifyConnectionChange(false);

    // Attempt reconnection if not at max attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      setTimeout(() => {
        this.attemptReconnection();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  async attemptReconnection() {
    try {
      const devices = await this.scanForDevices(5000);
      if (devices.length > 0) {
        await this.connectToDevice(devices[0].id);
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  async isConnected() {
    if (!this.connectedDevice) return false;

    try {
      const connected = await this.connectedDevice.isConnected();
      return connected;
    } catch {
      return false;
    }
  }

  getLatestData() {
    return { ...this.latestData };
  }

  // Listener management
  onDataUpdate(callback) {
    this.dataUpdateListeners.push(callback);
    // Return unsubscribe function
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
    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection change listener:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    if (this.isScanning) {
      this.bleManager.stopDeviceScan();
    }

    if (this.connectedDevice) {
      this.disconnect();
    }

    this.bleManager.destroy();
    this.dataUpdateListeners = [];
    this.connectionListeners = [];
  }
}

// ✅ CORRECTED FIX: Export singleton instance instead of class
// This fixes the "WearableService.isConnected is not a function" crash
const wearableServiceInstance = new WearableService();
export default wearableServiceInstance;
