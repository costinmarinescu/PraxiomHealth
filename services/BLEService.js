import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// Praxiom Service UUIDs
const PRAXIOM_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const BIO_AGE_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const HEALTH_DATA_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

class BLEService {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.connectionCallbacks = [];
  }

  // Request Bluetooth permissions (Android)
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
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions automatically
  }

  // Scan for PineTime watch
  async scanForWatch(onDeviceFound, timeout = 10000) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    return new Promise((resolve, reject) => {
      const devices = [];
      const timeoutId = setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve(devices);
      }, timeout);

      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          clearTimeout(timeoutId);
          this.manager.stopDeviceScan();
          reject(error);
          return;
        }

        // Look for PineTime or InfiniTime devices
        if (device && device.name && 
            (device.name.includes('InfiniTime') || 
             device.name.includes('PineTime') ||
             device.name.includes('Praxiom'))) {
          
          // Avoid duplicates
          if (!devices.find(d => d.id === device.id)) {
            devices.push(device);
            if (onDeviceFound) onDeviceFound(device);
          }
        }
      });
    });
  }

  // Connect to watch
  async connectToWatch(deviceId) {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;
      
      // Notify listeners
      this.connectionCallbacks.forEach(cb => cb(true));
      
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  // Disconnect from watch
  async disconnectFromWatch() {
    if (this.connectedDevice) {
      await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      this.connectedDevice = null;
      this.connectionCallbacks.forEach(cb => cb(false));
    }
  }

  // Check if watch is connected
  isConnected() {
    return this.connectedDevice !== null;
  }

  // Subscribe to connection changes
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  // Send Bio-Age to watch (2 bytes: integer age + decimal)
  async sendBioAge(bioAge) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const ageParts = bioAge.toString().split('.');
      const ageInteger = parseInt(ageParts[0]);
      const ageDecimal = ageParts[1] ? parseInt(ageParts[1].substring(0, 1)) : 0;
      
      // Create 2-byte array
      const data = new Uint8Array([ageInteger, ageDecimal]);
      const base64Data = this.arrayBufferToBase64(data.buffer);

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        BIO_AGE_CHAR_UUID,
        base64Data
      );

      console.log(`Sent Bio-Age to watch: ${bioAge} years`);
      return true;
    } catch (error) {
      console.error('Error sending Bio-Age:', error);
      throw error;
    }
  }

  // Send Health Data Package to watch (5 bytes: bio-age + 3 health scores)
  async sendHealthData(bioAge, oralScore, systemicScore, fitnessScore) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const ageParts = bioAge.toString().split('.');
      const ageInteger = parseInt(ageParts[0]);
      const ageDecimal = ageParts[1] ? parseInt(ageParts[1].substring(0, 1)) : 0;
      
      // Create 5-byte array: [age_int, age_dec, oral, systemic, fitness]
      const data = new Uint8Array([
        ageInteger,
        ageDecimal,
        Math.round(oralScore),
        Math.round(systemicScore),
        Math.round(fitnessScore)
      ]);
      const base64Data = this.arrayBufferToBase64(data.buffer);

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        HEALTH_DATA_CHAR_UUID,
        base64Data
      );

      console.log(`Sent Health Data: Age=${bioAge}, Oral=${oralScore}, Systemic=${systemicScore}, Fitness=${fitnessScore}`);
      return true;
    } catch (error) {
      console.error('Error sending health data:', error);
      throw error;
    }
  }

  // Read Bio-Age from watch
  async readBioAge() {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const characteristic = await this.connectedDevice.readCharacteristicForService(
        PRAXIOM_SERVICE_UUID,
        BIO_AGE_CHAR_UUID
      );

      const data = this.base64ToArrayBuffer(characteristic.value);
      const view = new Uint8Array(data);
      const bioAge = view[0] + (view[1] / 10);

      return bioAge;
    } catch (error) {
      console.error('Error reading Bio-Age:', error);
      throw error;
    }
  }

  // Helper: Convert ArrayBuffer to Base64
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  // Helper: Convert Base64 to ArrayBuffer
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Cleanup
  destroy() {
    this.disconnectFromWatch();
    this.manager.destroy();
  }
}

// Export singleton instance
export default new BLEService();
