/**
 * Praxiom-PineTime BLE Communication Service
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
  // ✅ FIXED: Praxiom custom service UUID (matching firmware: 0x1900)
  PRAXIOM: '00001900-78fc-48fe-8e23-433b3a1942d0',
};

// Custom InfiniTime Characteristics
const INFINTIME_CHARACTERISTICS = {
  STEP_COUNT: '00030001-78fc-48fe-8e23-433b3a1942d0',
  MUSIC_EVENT: '00000001-78fc-48fe-8e23-433b3a1942d0',
  WEATHER_DATA: '00050001-78fc-48fe-8e23-433b3a1942d0',
  // ✅ FIXED: Praxiom custom characteristic UUID (matching firmware: 0x1901)
  PRAXIOM_AGE: '00001901-78fc-48fe-8e23-433b3a1942d0',
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

  async requestPermissions() {
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
        return granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  }

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

    setTimeout(() => {
      this.stopScan();
    }, 10000);
    return devices;
  }

  stopScan() {
    this.manager.stopDeviceScan();
    this.scanning = false;
  }

  async connectToDevice(device) {
    try {
      console.log(`Connecting to ${device.name} (${device.id})...`);
      this.device = await this.manager.connectToDevice(device.id, {
        autoConnect: true,
        requestMTU: 512,
      });
      await this.device.discoverAllServicesAndCharacteristics();
      this.connected = true;

      await AsyncStorage.setItem('lastDeviceId', device.id);
      await AsyncStorage.setItem('lastDeviceName', device.name || 'Unknown');
      await AsyncStorage.setItem('watchConnected', 'true');

      await this.discoverCharacteristics();
      await this.syncTime();
      await this.enableHeartRateNotifications();
      await this.enableStepNotifications();

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

  async syncTime() {
    if (!this.device) return;

    try {
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
      timeData[7] = now.getDay();
      timeData[8] = 0;
      timeData[9] = 1;

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

    const rrIntervals = [];
    if ((flags & 0x10) !== 0) {
      let offset = isUint16 ? 3 : 2;
      while (offset < data.length - 1) {
        const rr = data.readUInt16LE(offset);
        rrIntervals.push((rr / 1024.0) * 1000);
        offset += 2;
      }
    }

    return {
      heartRate,
      rrIntervals,
      hasBodyContact: (flags & 0x06) === 0x06,
    };
  }

  parseStepData(base64Value) {
    const data = Buffer.from(base64Value, 'base64');
    return data.readUInt32LE(0);
  }

  async sendNotification(category, title, message) {
    if (!this.device) return;

    try {
      const notificationText = `${title}\x00${message}`;
      const data = Buffer.from([category, 1]);
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
   * ✅ FIXED: Now sends 4-byte uint32 (little-endian) to match firmware expectation
   */
  async sendPraxiomAge(age) {
    if (!this.device) {
      throw new Error('Device not connected');
    }

    try {
      console.log(`📤 Sending Praxiom Age: ${age}`);
      console.log(`🔧 Service UUID: ${INFINTIME_SERVICES.PRAXIOM}`);
      console.log(`🔧 Characteristic UUID: ${INFINTIME_CHARACTERISTICS.PRAXIOM_AGE}`);

      // ✅ FIXED: Send age as uint32 (4 bytes, little-endian) to match firmware
      const ageData = new Uint32Array([Math.round(age)]);
      const buffer = new Uint8Array(ageData.buffer);

      await this.writeCharacteristic(
        INFINTIME_SERVICES.PRAXIOM,
        INFINTIME_CHARACTERISTICS.PRAXIOM_AGE,
        Array.from(buffer)
      );

      console.log(`✅ Praxiom Age ${age} sent successfully to watch`);

      try {
        await this.sendNotification(9, 'Praxiom Health', `Bio-Age updated: ${Math.round(age)} years`);
      } catch (notifError) {
        console.log('Notification not sent (non-critical)');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to send Praxiom Age:', error);
      throw error;
    }
  }

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

  async writeCharacteristic(serviceUUID, characteristicUUID, data) {
    if (!this.device) throw new Error('Device not connected');
    const base64Data = Buffer.from(data).toString('base64');
    await this.device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Data
    );
  }

  async readCharacteristic(serviceUUID, characteristicUUID) {
    if (!this.device) throw new Error('Device not connected');
    return await this.device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
  }

  async subscribeToCharacteristic(serviceUUID, characteristicUUID, callback) {
    if (!this.device) throw new Error('Device not connected');
    this.device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      callback
    );
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  notifyListeners(event) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  isConnected() {
    return this.connected && this.device !== null;
  }

  getDevice() {
    return this.device;
  }
}

export default new BLEService();
