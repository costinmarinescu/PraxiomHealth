/**
 * WearableService.js
 * 
 * Enhanced BLE service with Praxiom Age transmission to PineTime watch
 * 
 * CHANGES:
 * - Added sendPraxiomAgeToWatch() function
 * - Integrated with existing BLE connection
 * - Handles uint32 little-endian encoding
 */

import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BLE Service UUIDs
const PRAXIOM_SERVICE = '00001900-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR = '00001901-78fc-48fe-8e23-433b3a1942d0';
const HEART_RATE_SERVICE = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_CHAR = '00002A37-0000-1000-8000-00805F9B34FB';
const BATTERY_SERVICE = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_CHAR = '00002A19-0000-1000-8000-00805F9B34FB';
const MOTION_SERVICE = '00030000-78fc-48fe-8e23-433b3a1942d0';
const STEP_COUNT_CHAR = '00030001-78fc-48fe-8e23-433b3a1942d0';

class WearableService {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.isInitialized = false;
    
    // Cached data
    this.heartRate = 0;
    this.steps = 0;
    this.battery = 0;
    this.hrv = 0;
    
    // Connection callbacks
    this.onConnectionChange = null;
    this.onDataUpdate = null;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('WearableService already initialized');
        return true;
      }

      const state = await this.manager.state();
      console.log('BLE Manager state:', state);

      if (state !== 'PoweredOn') {
        console.log('Bluetooth not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.isInitialized = true;
      console.log('✅ BLE initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing BLE:', error);
      return false;
    }
  }

  async scanAndConnect() {
    try {
      await this.initialize();

      console.log('🔍 Starting scan for PineTime...');
      
      return new Promise((resolve, reject) => {
        this.manager.startDeviceScan(null, null, async (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            reject(error);
            return;
          }

          if (device && device.name && 
              (device.name.includes('InfiniTime') || device.name.includes('Pinetime'))) {
            console.log(`✅ Found device: ${device.name}`);
            this.manager.stopDeviceScan();
            
            try {
              await this.connectToDevice(device);
              resolve(device);
            } catch (connectError) {
              reject(connectError);
            }
          }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          this.manager.stopDeviceScan();
          reject(new Error('Scan timeout - no device found'));
        }, 30000);
      });
    } catch (error) {
      console.error('Error in scanAndConnect:', error);
      throw error;
    }
  }

  async connectToDevice(device) {
    try {
      console.log(`🔗 Connecting to ${device.name}...`);
      
      const connected = await device.connect();
      console.log('✅ Connected!');
      
      const deviceWithServices = await connected.discoverAllServicesAndCharacteristics();
      this.connectedDevice = deviceWithServices;
      
      console.log('🔍 Services discovered');
      
      // Subscribe to notifications
      await this.subscribeToNotifications();
      
      // Keep connection alive
      this.startKeepAlive();
      
      // Notify connection status
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      
      // Try to sync any stored Praxiom Age on connection
      await this.syncStoredPraxiomAge();
      
      return deviceWithServices;
    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  }

  async subscribeToNotifications() {
    if (!this.connectedDevice) return;

    try {
      // Heart Rate
      await this.connectedDevice.monitorCharacteristicForService(
        HEART_RATE_SERVICE,
        HEART_RATE_CHAR,
        (error, characteristic) => {
          if (error) {
            console.error('HR monitoring error:', error);
            return;
          }
          if (characteristic?.value) {
            const hr = this.parseHeartRate(characteristic.value);
            this.heartRate = hr;
            console.log(`💓 Heart Rate: ${hr} bpm`);
            if (this.onDataUpdate) this.onDataUpdate();
          }
        }
      );

      // Steps
      await this.connectedDevice.monitorCharacteristicForService(
        MOTION_SERVICE,
        STEP_COUNT_CHAR,
        (error, characteristic) => {
          if (error) {
            console.error('Steps monitoring error:', error);
            return;
          }
          if (characteristic?.value) {
            const steps = this.parseSteps(characteristic.value);
            this.steps = steps;
            console.log(`👟 Steps: ${steps}`);
            if (this.onDataUpdate) this.onDataUpdate();
          }
        }
      );

      // Battery
      await this.connectedDevice.monitorCharacteristicForService(
        BATTERY_SERVICE,
        BATTERY_CHAR,
        (error, characteristic) => {
          if (error) {
            console.error('Battery monitoring error:', error);
            return;
          }
          if (characteristic?.value) {
            const battery = this.parseBattery(characteristic.value);
            this.battery = battery;
            console.log(`🔋 Battery: ${battery}%`);
            if (this.onDataUpdate) this.onDataUpdate();
          }
        }
      );

      console.log('✅ Subscribed to all notifications');
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  parseHeartRate(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      const flags = buffer[0];
      const isUint16 = (flags & 0x01) !== 0;
      
      if (isUint16) {
        return buffer[1] + (buffer[2] << 8);
      } else {
        return buffer[1];
      }
    } catch (error) {
      console.error('Error parsing HR:', error);
      return 0;
    }
  }

  parseSteps(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      return buffer[0] + (buffer[1] << 8) + (buffer[2] << 16) + (buffer[3] << 24);
    } catch (error) {
      console.error('Error parsing steps:', error);
      return 0;
    }
  }

  parseBattery(base64Value) {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      return buffer[0];
    } catch (error) {
      console.error('Error parsing battery:', error);
      return 0;
    }
  }

  /**
   * 🆕 NEW FUNCTION: Send Praxiom Age to Watch
   * 
   * This sends the calculated biological age to the PineTime watch
   * for display on the custom watchface.
   * 
   * @param {number} age - The biological age (18-120)
   * @returns {Promise<boolean>} - Success status
   */
  async sendPraxiomAgeToWatch(age) {
    if (!this.connectedDevice) {
      console.log('❌ No device connected - cannot send Praxiom Age');
      return false;
    }

    try {
      // Validate age range
      if (age < 18 || age > 120 || isNaN(age)) {
        console.error(`❌ Invalid age value: ${age}`);
        return false;
      }

      const ageInt = Math.round(age);
      console.log(`📤 Sending Praxiom Age to watch: ${ageInt}`);

      // Convert age to 4-byte uint32 (little-endian)
      const buffer = new Uint8Array(4);
      buffer[0] = ageInt & 0xFF;
      buffer[1] = (ageInt >> 8) & 0xFF;
      buffer[2] = (ageInt >> 16) & 0xFF;
      buffer[3] = (ageInt >> 24) & 0xFF;

      // Convert to base64 for react-native-ble-plx
      const base64Value = Buffer.from(buffer).toString('base64');

      console.log(`   Raw bytes: [${Array.from(buffer).join(', ')}]`);
      console.log(`   Base64: ${base64Value}`);

      // Write to watch
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Value
      );

      console.log(`✅ Praxiom Age ${ageInt} sent successfully!`);
      console.log(`👀 Check your watch - it should now display: ${ageInt}`);
      
      // Store for auto-sync on reconnection
      await AsyncStorage.setItem('lastPraxiomAge', ageInt.toString());

      return true;
    } catch (error) {
      console.error(`❌ Error sending Praxiom Age: ${error.message}`);
      console.log('   Possible causes:');
      console.log('   1. Watch firmware doesn\'t have Praxiom service');
      console.log('   2. Characteristic UUID mismatch');
      console.log('   3. Connection lost');
      return false;
    }
  }

  /**
   * Sync stored Praxiom Age on connection
   * This ensures the watch shows the correct age even after reconnecting
   */
  async syncStoredPraxiomAge() {
    try {
      const storedAge = await AsyncStorage.getItem('lastPraxiomAge');
      if (storedAge) {
        const age = parseInt(storedAge);
        console.log(`🔄 Syncing stored Praxiom Age: ${age}`);
        await this.sendPraxiomAgeToWatch(age);
      }
    } catch (error) {
      console.log('Could not sync stored age:', error);
    }
  }

  startKeepAlive() {
    // Send keep-alive every 30 seconds
    this.keepAliveInterval = setInterval(async () => {
      if (this.connectedDevice) {
        try {
          await this.connectedDevice.readCharacteristicForService(
            BATTERY_SERVICE,
            BATTERY_CHAR
          );
        } catch (error) {
          console.log('Keep-alive failed, connection may be lost');
        }
      }
    }, 30000);
  }

  async disconnect() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
    }
  }

  isConnected() {
    return this.connectedDevice !== null;
  }

  getWearableData() {
    return {
      heartRate: this.heartRate,
      steps: this.steps,
      battery: this.battery,
      hrv: this.hrv,
    };
  }
}

// Export singleton instance
export default new WearableService();
