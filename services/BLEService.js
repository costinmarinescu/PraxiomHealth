/**
 * Praxiom-PineTime BLE Communication Svc
 * Implements the InfiniTime BLE protocol for seamless watch integration
 * 
 * Based on the official InfiniTime BLE specification:
 * https://github.com/InfiniTimeOrg/InfiniTime/blob/main/doc/ble.md
 */

import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';

// Standard BLE Service UUIDs
const SERVICES = {
  CURRENT_TIME: '00001805-0000-1000-8000-00805f9b34fb',
  ALERT_NOTIFICATION: '00001811-0000-1000-8000-00805f9b34fb',
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  BATTERY: '0000180f-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO: '0000180a-0000-1000-8000-00805f9b34fb',
};

// Standard BLE Characteristic UUIDs
const CHARACTERISTICS = {
  CURRENT_TIME: '00002a2b-0000-1000-8000-00805f9b34fb',
  NEW_ALERT: '00002a46-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  FIRMWARE_REVISION: '00002a26-0000-1000-8000-00805f9b34fb',
  MANUFACTURER_NAME: '00002a29-0000-1000-8000-00805f9b34fb',
};

// Custom InfiniTime Service UUIDs (base: xxxxxxxx-78fc-48fe-8e23-433b3a1942d0)
const INFINTIME_SERVICES = {
  MUSIC: '00000000-78fc-48fe-8e23-433b3a1942d0',
  NAVIGATION: '00010000-78fc-48fe-8e23-433b3a1942d0',
  MOTION: '00030000-78fc-48fe-8e23-433b3a1942d0',
  WEATHER: '00050000-78fc-48fe-8e23-433b3a1942d0',
  // Praxiom custom service for biological age
  PRAXIOM: '00060000-78fc-48fe-8e23-433b3a1942d0',
};

// Custom InfiniTime Characteristics
const INFINTIME_CHARACTERISTICS = {
  STEP_COUNT: '00030001-78fc-48fe-8e23-433b3a1942d0',
  MUSIC_EVENT: '00000001-78fc-48fe-8e23-433b3a1942d0',
  WEATHER_DATA: '00050001-78fc-48fe-8e23-433b3a1942d0',
  // Praxiom custom characteristic for biological age
  PRAXIOM_AGE: '00060001-78fc-48fe-8e23-433b3a1942d0',
};

class BLEService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.listeners = [];
    this.scanning = false;
    this.connected = false;
    this.characteristics = {};
  }

  /**
   * Request necessary BLE permissions (Android)
   */
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
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true; // iOS permissions handled by Info.plist
  }

  /**
   * Scan for PineTime/InfiniTime devices
   */
  async scanForDevices(onDeviceFound) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const state = await this.manager.state();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth is not enabled');
    }

    this.scanning = true;
    const devices = [];

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        this.scanning = false;
        return;
      }

      if (device && device.name) {
        // Look for InfiniTime or PineTime devices
        if (
          device.name.includes('InfiniTime') ||
          device.name.includes('Pinetime') ||
          device.name.includes('PineTime') ||
          device.name.includes('PRAXIOM')
        ) {
          if (!devices.find((d) => d.id === device.id)) {
            devices.push(device);
            onDeviceFound(device);
          }
        }
      }
    });

    // Stop scan after 10 seconds
    setTimeout(() => {
      this.stopScan();
    }, 10000);

    return devices;
  }

  /**
   * Stop BLE scanning
   */
  stopScan() {
    this.manager.stopDeviceScan();
    this.scanning = false;
  }

  /**
   * Connect to a PineTime device
   */
  async connectToDevice(device) {
    try {
      console.log(`Connecting to ${device.name} (${device.id})...`);
      
      this.device = await this.manager.connectToDevice(device.id, {
        autoConnect: true,
        requestMTU: 512, // Request larger MTU for better performance
      });

      await this.device.discoverAllServicesAndCharacteristics();
      this.connected = true;

      // Cache device ID for auto-reconnect
      await AsyncStorage.setItem('lastDeviceId', device.id);
      await AsyncStorage.setItem('lastDeviceName', device.name || 'Unknown');
      await AsyncStorage.setItem('watchConnected', 'true');

      // Discover and cache characteristics
      await this.discoverCharacteristics();

      // Sync time on connection
      await this.syncTime();

      // Enable notifications for heart rate and steps
      await this.enableHeartRateNotifications();
      await this.enableStepNotifications();

      // Monitor disconnection
      this.device.onDisconnected((error, device) => {
        console.log('Device disconnected:', device?.name);
        this.connected = false;
        this.device = null;
        AsyncStorage.setItem('watchConnected', 'false');
        this.notifyListeners({ type: 'disconnected' });
      });

      this.notifyListeners({ type: 'connected', device: this.device });

      return this.device;
    } catch (error) {
      console.error('Connection error:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Discover and cache all characteristics
   */
  async discoverCharacteristics() {
    if (!this.device) return;

    const services = await this.device.services();
    
    for (const service of services) {
      const characteristics = await service.characteristics();
      for (const char of characteristics) {
        this.characteristics[char.uuid] = char;
      }
    }

    console.log('Discovered characteristics:', Object.keys(this.characteristics).length);
  }

  /**
   * Auto-reconnect to last connected device
   */
  async autoReconnect() {
    const lastDeviceId = await AsyncStorage.getItem('lastDeviceId');
    if (!lastDeviceId) return false;

    try {
      const device = await this.manager.connectToDevice(lastDeviceId, {
        autoConnect: true,
      });
      await this.connectToDevice(device);
      return true;
    } catch (error) {
      console.log('Auto-reconnect failed:', error.message);
      return false;
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect() {
    if (this.device) {
      try {
        await this.manager.cancelDeviceConnection(this.device.id);
        this.device = null;
        this.connected = false;
        await AsyncStorage.setItem('watchConnected', 'false');
        this.notifyListeners({ type: 'disconnected' });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  /**
   * Sync time with watch (InfiniTime Current Time Service)
   */
  async syncTime() {
    if (!this.device) return;

    try {
      const now = new Date();
      
      // CTS time format: year(uint16) month day hours minutes seconds dayOfWeek fractions256
      const timeData = new Uint8Array(10);
      const year = now.getFullYear();
      
      timeData[0] = year & 0xFF;
      timeData[1] = (year >> 8) & 0xFF;
      timeData[2] = now.getMonth() + 1; // Month (1-12)
      timeData[3] = now.getDate(); // Day
      timeData[4] = now.getHours();
      timeData[5] = now.getMinutes();
      timeData[6] = now.getSeconds();
      timeData[7] = now.getDay(); // Day of week (0-6)
      timeData[8] = 0; // Fractions256
      timeData[9] = 1; // Adjust reason (manual time update)

      await this.writeCharacteristic(
        SERVICES.CURRENT_TIME,
        CHARACTERISTICS.CURRENT_TIME,
        Array.from(timeData)
      );

      console.log('Time synced with watch');
    } catch (error) {
      console.log('Time sync not available:', error.message);
    }
  }

  /**
   * Enable heart rate notifications
   */
  async enableHeartRateNotifications() {
    try {
      await this.subscribeToCharacteristic(
        SERVICES.HEART_RATE,
        CHARACTERISTICS.HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            console.error('HR notification error:', error);
            return;
          }

          const data = this.parseHeartRateData(characteristic.value);
          this.notifyListeners({ type: 'heartRate', data });
        }
      );
      console.log('Heart rate notifications enabled');
    } catch (error) {
      console.log('Heart rate not available:', error.message);
    }
  }

  /**
   * Enable step count notifications
   */
  async enableStepNotifications() {
    try {
      await this.subscribeToCharacteristic(
        INFINTIME_SERVICES.MOTION,
        INFINTIME_CHARACTERISTICS.STEP_COUNT,
        (error, characteristic) => {
          if (error) {
            console.error('Step notification error:', error);
            return;
          }

          const steps = this.parseStepData(characteristic.value);
          this.notifyListeners({ type: 'steps', data: steps });
        }
      );
      console.log('Step notifications enabled');
    } catch (error) {
      console.log('Step counter not available:', error.message);
    }
  }

  /**
   * Parse heart rate data (BLE Heart Rate Service format)
   */
  parseHeartRateData(base64Value) {
    const data = Buffer.from(base64Value, 'base64');
    const flags = data[0];
    const isUint16 = (flags & 0x01) !== 0;

    let heartRate;
    if (isUint16) {
      heartRate = data.readUInt16LE(1);
    } else {
      heartRate = data[1];
    }

    // Parse RR intervals for HRV if present
    const rrIntervals = [];
    if ((flags & 0x10) !== 0) {
      let offset = isUint16 ? 3 : 2;
      while (offset < data.length - 1) {
        const rr = data.readUInt16LE(offset);
        rrIntervals.push((rr / 1024.0) * 1000); // Convert to ms
        offset += 2;
      }
    }

    return {
      heartRate,
      rrIntervals,
      hasBodyContact: (flags & 0x06) === 0x06,
    };
  }

  /**
   * Parse step count data (InfiniTime format: uint32, little-endian)
   */
  parseStepData(base64Value) {
    const data = Buffer.from(base64Value, 'base64');
    return data.readUInt32LE(0);
  }

  /**
   * Send notification to watch (Alert Notification Service)
   */
  async sendNotification(category, title, message) {
    if (!this.device) return;

    try {
      // Category codes: 0=simple, 3=call, 5=sms, 9=instant message
      const notificationText = `${title}\x00${message}`;
      const data = Buffer.from([category, 1]); // category + number of alerts
      const textData = Buffer.from(notificationText, 'utf-8');
      const fullData = Buffer.concat([data, textData]);

      await this.writeCharacteristic(
        SERVICES.ALERT_NOTIFICATION,
        CHARACTERISTICS.NEW_ALERT,
        Array.from(fullData)
      );

      console.log('Notification sent to watch');
    } catch (error) {
      console.log('Notification not sent:', error.message);
    }
  }

  /**
   * Send Praxiom Age to watch
   * This writes to a custom Praxiom characteristic in the InfiniTime firmware
   */
  async sendPraxiomAge(age) {
    if (!this.device) {
      throw new Error('Device not connected');
    }

    try {
      // Send age as uint8 (biological age in years)
      const ageData = new Uint8Array([age]);

      await this.writeCharacteristic(
        INFINTIME_SERVICES.PRAXIOM,
        INFINTIME_CHARACTERISTICS.PRAXIOM_AGE,
        Array.from(ageData)
      );

      console.log(`Praxiom Age ${age} sent to watch`);
      
      // Also send a notification for immediate feedback
      await this.sendNotification(9, 'Praxiom Health', `Bio-Age updated: ${age} years`);
      
      return true;
    } catch (error) {
      console.error('Failed to send Praxiom Age:', error);
      throw error;
    }
  }

  /**
   * Read battery level
   */
  async readBatteryLevel() {
    try {
      const characteristic = await this.readCharacteristic(
        SERVICES.BATTERY,
        CHARACTERISTICS.BATTERY_LEVEL
      );
      const data = Buffer.from(characteristic.value, 'base64');
      const batteryLevel = data[0];
      
      this.notifyListeners({ type: 'battery', data: batteryLevel });
      return batteryLevel;
    } catch (error) {
      console.log('Battery level not available:', error.message);
      return null;
    }
  }

  /**
   * Read device information
   */
  async readDeviceInfo() {
    const info = {};

    try {
      const firmware = await this.readCharacteristic(
        SERVICES.DEVICE_INFO,
        CHARACTERISTICS.FIRMWARE_REVISION
      );
      info.firmware = Buffer.from(firmware.value, 'base64').toString('utf-8');
    } catch (error) {
      console.log('Firmware info not available');
    }

    try {
      const manufacturer = await this.readCharacteristic(
        SERVICES.DEVICE_INFO,
        CHARACTERISTICS.MANUFACTURER_NAME
      );
      info.manufacturer = Buffer.from(manufacturer.value, 'base64').toString('utf-8');
    } catch (error) {
      console.log('Manufacturer info not available');
    }

    return info;
  }

  /**
   * Generic write to characteristic
   */
  async writeCharacteristic(serviceUUID, characteristicUUID, data) {
    if (!this.device) throw new Error('Device not connected');

    const base64Data = Buffer.from(data).toString('base64');
    await this.device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Data
    );
  }

  /**
   * Generic read from characteristic
   */
  async readCharacteristic(serviceUUID, characteristicUUID) {
    if (!this.device) throw new Error('Device not connected');

    return await this.device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
  }

  /**
   * Subscribe to characteristic notifications
   */
  async subscribeToCharacteristic(serviceUUID, characteristicUUID, callback) {
    if (!this.device) throw new Error('Device not connected');

    this.device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      callback
    );
  }

  /**
   * Add listener for BLE events
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.device !== null;
  }

  /**
   * Get connected device
   */
  getDevice() {
    return this.device;
  }
}

// Export singleton instance
export default new BLEService();
