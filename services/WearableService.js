import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Buffer } from 'buffer';

class WearableService {
  constructor() {
    this.bleManager = new BleManager();
    this.connectedDevice = null;
    this.scanSubscription = null;
    
    // PineTime/Praxiom Watch BLE UUIDs
    this.PINETIME_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    this.BIOAGE_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    this.HEALTH_DATA_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    
    // Standard Heart Rate Service
    this.HR_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
    this.HR_CHAR_UUID = '00002a37-0000-1000-8000-00805f9b34fb';
    
    // Callbacks
    this.onConnectionChange = null;
    this.onLiveDataUpdate = null;
  }

  // ==================== PERMISSIONS ====================
  
  async requestBluetoothPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return Object.values(granted).every(
          g => g === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true; // iOS doesn't need these permissions
  }

  // ==================== SCANNING ====================
  
  async scanForPineTime(onDeviceFound, timeoutMs = 10000) {
    const hasPermission = await this.requestBluetoothPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are needed to scan for your watch'
      );
      return;
    }

    console.log('Starting PineTime scan...');
    
    this.scanSubscription = this.bleManager.startDeviceScan(
      null, // Scan for all devices
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        // Look for PineTime, InfiniTime, or Praxiom in device name
        const name = device.name || '';
        if (
          name.toLowerCase().includes('pinetime') ||
          name.toLowerCase().includes('infintime') ||
          name.toLowerCase().includes('praxiom')
        ) {
          console.log('Found PineTime:', device.name, device.id);
          onDeviceFound(device);
        }
      }
    );

    // Auto-stop scan after timeout
    setTimeout(() => {
      this.stopScan();
    }, timeoutMs);
  }

  stopScan() {
    if (this.scanSubscription) {
      this.bleManager.stopDeviceScan();
      this.scanSubscription = null;
      console.log('Scan stopped');
    }
  }

  // ==================== CONNECTION ====================
  
  async connectToDevice(device) {
    try {
      console.log('Connecting to device:', device.id);
      
      const connected = await device.connect();
      console.log('Connected! Discovering services...');
      
      await connected.discoverAllServicesAndCharacteristics();
      console.log('Services discovered');
      
      this.connectedDevice = connected;
      
      // Set up disconnect handler
      this.connectedDevice.onDisconnected((error, device) => {
        console.log('Device disconnected:', device.id);
        this.connectedDevice = null;
        if (this.onConnectionChange) {
          this.onConnectionChange(false);
        }
      });

      // Start monitoring heart rate
      this.monitorHeartRate();
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', 'Could not connect to watch');
      return false;
    }
  }

  async disconnect() {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
        if (this.onConnectionChange) {
          this.onConnectionChange(false);
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  isConnected() {
    return this.connectedDevice !== null;
  }

  getDeviceName() {
    return this.connectedDevice?.name || 'Unknown';
  }

  // ==================== HEART RATE MONITORING ====================
  
  async monitorHeartRate() {
    if (!this.connectedDevice) return;

    try {
      this.connectedDevice.monitorCharacteristicForService(
        this.HR_SERVICE_UUID,
        this.HR_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('HR monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            const data = Buffer.from(characteristic.value, 'base64');
            const heartRate = data[1]; // Heart rate value is at byte 1
            
            if (this.onLiveDataUpdate) {
              this.onLiveDataUpdate({ heartRate });
            }
          }
        }
      );
    } catch (error) {
      console.error('Failed to start HR monitoring:', error);
    }
  }

  // ==================== BIO-AGE SYNC ====================
  
  async sendBioAgeToWatch(bioAge) {
    if (!this.connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to your watch first');
      return false;
    }

    try {
      console.log('Sending Bio-Age to watch:', bioAge);
      
      // Encode bio-age as 2 bytes (age * 10 to preserve decimal)
      const ageValue = Math.round(parseFloat(bioAge) * 10);
      const buffer = Buffer.alloc(2);
      buffer.writeUInt16LE(ageValue, 0);
      const base64Data = buffer.toString('base64');

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        this.PINETIME_SERVICE_UUID,
        this.BIOAGE_CHAR_UUID,
        base64Data
      );

      console.log('Bio-Age sent successfully');
      
      // Verify by reading back
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for watch to process
      
      const characteristic = await this.connectedDevice.readCharacteristicForService(
        this.PINETIME_SERVICE_UUID,
        this.BIOAGE_CHAR_UUID
      );

      if (characteristic?.value) {
        const receivedBuffer = Buffer.from(characteristic.value, 'base64');
        const receivedAge = receivedBuffer.readUInt16LE(0) / 10;
        
        console.log('Verified Bio-Age on watch:', receivedAge);
        
        // Check if it matches (within 0.1 year tolerance)
        if (Math.abs(receivedAge - parseFloat(bioAge)) < 0.2) {
          return true; // Success!
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error sending Bio-Age:', error);
      Alert.alert('Sync Failed', 'Could not send Bio-Age to watch');
      return false;
    }
  }

  async sendHealthDataToWatch(oralHealth, systemicHealth, fitnessScore) {
    if (!this.connectedDevice) {
      return false;
    }

    try {
      // Package health data: [oral, systemic, fitness]
      const buffer = Buffer.alloc(3);
      buffer.writeUInt8(Math.round(oralHealth), 0);
      buffer.writeUInt8(Math.round(systemicHealth), 1);
      buffer.writeUInt8(Math.round(fitnessScore), 2);
      const base64Data = buffer.toString('base64');

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        this.PINETIME_SERVICE_UUID,
        this.HEALTH_DATA_CHAR_UUID,
        base64Data
      );

      console.log('Health data sent to watch');
      return true;
    } catch (error) {
      console.error('Error sending health data:', error);
      return false;
    }
  }

  // ==================== LIVE DATA FROM WATCH ====================
  
  async getStepsFromWatch() {
    // This would require the watch firmware to expose a steps characteristic
    // For now, return placeholder
    return 0;
  }

  async getOxygenFromWatch() {
    // This would require SpO2 sensor support in firmware
    // For now, return placeholder
    return 0;
  }

  // ==================== CLEANUP ====================
  
  destroy() {
    this.stopScan();
    if (this.connectedDevice) {
      this.connectedDevice.cancelConnection();
    }
    this.bleManager.destroy();
  }
}

// Export singleton instance
export default new WearableService();
