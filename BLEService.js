import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

// Praxiom Custom BLE Service UUIDs (from specs)
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const BIOAGE_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const HEALTH_DATA_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

class PraxiomBLEService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
  }

  // Initialize BLE manager
  async init() {
    const subscription = this.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        subscription.remove();
        console.log('BLE is ready');
      }
    }, true);
  }

  // Scan for Praxiom watch
  async scanForWatch() {
    return new Promise((resolve, reject) => {
      this.manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            reject(error);
            return;
          }

          if (device && device.name && device.name.includes('Praxiom')) {
            this.manager.stopDeviceScan();
            resolve(device);
          }
        }
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        this.manager.stopDeviceScan();
        reject(new Error('Scan timeout - watch not found'));
      }, 30000);
    });
  }

  // Connect to watch
  async connect() {
    try {
      console.log('Scanning for Praxiom watch...');
      this.device = await this.scanForWatch();
      
      console.log('Watch found, connecting...');
      await this.device.connect();
      
      console.log('Discovering services...');
      await this.device.discoverAllServicesAndCharacteristics();
      
      this.isConnected = true;
      console.log('Connected to Praxiom watch!');
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Send Bio-Age to watch
  // Format: 2 bytes, UInt16LE (bio-age * 10)
  // Example: 38.5 years → 385
  async sendBioAge(bioAge) {
    if (!this.isConnected || !this.device) {
      throw new Error('Not connected to watch');
    }

    try {
      const ageValue = Math.round(bioAge * 10);
      const buffer = Buffer.alloc(2);
      buffer.writeUInt16LE(ageValue, 0);
      const base64Data = buffer.toString('base64');

      await this.device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        BIOAGE_CHAR_UUID,
        base64Data
      );

      console.log(`Sent Bio-Age: ${bioAge} years (${ageValue})`);
      return true;
    } catch (error) {
      console.error('Error sending Bio-Age:', error);
      return false;
    }
  }

  // Send complete health data package
  // Format: 5 bytes
  // Byte 0-1: Bio-Age (UInt16LE, age * 10)
  // Byte 2: Oral Health Score (0-100)
  // Byte 3: Systemic Health Score (0-100)
  // Byte 4: Fitness Score (0-100)
  async sendHealthData(bioAge, oralHealth, systemicHealth, fitnessScore) {
    if (!this.isConnected || !this.device) {
      throw new Error('Not connected to watch');
    }

    try {
      const ageValue = Math.round(bioAge * 10);
      const buffer = Buffer.alloc(5);
      
      // Bio-Age (2 bytes, little-endian)
      buffer.writeUInt16LE(ageValue, 0);
      
      // Health scores (1 byte each, 0-100)
      buffer.writeUInt8(Math.min(100, Math.max(0, oralHealth)), 2);
      buffer.writeUInt8(Math.min(100, Math.max(0, systemicHealth)), 3);
      buffer.writeUInt8(Math.min(100, Math.max(0, fitnessScore)), 4);
      
      const base64Data = buffer.toString('base64');

      await this.device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        HEALTH_DATA_CHAR_UUID,
        base64Data
      );

      console.log('Sent complete health package:', {
        bioAge,
        oralHealth,
        systemicHealth,
        fitnessScore
      });
      return true;
    } catch (error) {
      console.error('Error sending health data:', error);
      return false;
    }
  }

  // Disconnect from watch
  async disconnect() {
    if (this.device) {
      try {
        await this.device.cancelConnection();
        this.isConnected = false;
        console.log('Disconnected from watch');
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Cleanup
  destroy() {
    this.manager.destroy();
  }
}

export default new PraxiomBLEService();
