// services/WearableService.js
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform-specific imports (will be conditionally loaded)
let AppleHealthKit = null;
let HealthConnect = null;

// Note: react-native-health removed to fix build issues
// Will be added back when iOS HealthKit integration is needed
if (Platform.OS === 'ios') {
  // HealthKit integration placeholder
  console.log('iOS HealthKit integration not yet implemented');
}

if (Platform.OS === 'android') {
  // Health Connect integration placeholder
  console.log('Android Health Connect integration not yet implemented');
}

class WearableService {
  constructor() {
    this.bleManager = new BleManager();
    this.connectedDevice = null;
    this.activeProvider = null;
    this.syncCallbacks = [];
    
    // PineTime/Praxiom Watch BLE UUIDs
    this.PINETIME_SERVICE_UUID = 'ABCD0000-1234-5678-9ABC-DEF012345678';
    this.BIOAGE_CHAR_UUID = 'ABCD0001-1234-5678-9ABC-DEF012345678';
    this.HEALTH_DATA_CHAR_UUID = 'ABCD0002-1234-5678-9ABC-DEF012345678';
    this.STEPS_CHAR_UUID = 'ABCD0003-1234-5678-9ABC-DEF012345678';
    this.HRV_CHAR_UUID = 'ABCD0004-1234-5678-9ABC-DEF012345678';
    
    // Heart Rate Service (standard BLE)
    this.HR_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
    this.HR_CHAR_UUID = '00002a37-0000-1000-8000-00805f9b34fb';
  }

  // ==================== PINETIME/PRAXIOM WATCH ====================
  
  async requestBluetoothPermissions() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every(g => g === PermissionsAndroid.RESULTS.GRANTED);
    }
    return true;
  }

  async scanForPineTime(onDeviceFound) {
    const hasPermission = await this.requestBluetoothPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Bluetooth permissions are needed to scan for devices');
      return;
    }

    this.bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (device && (device.name === 'InfiniTime' || device.name === 'Pinetime-JF' || device.name?.includes('Praxiom'))) {
        onDeviceFound(device);
      }
    });
  }

  stopScan() {
    this.bleManager.stopDeviceScan();
  }

  async connectToPineTime(deviceId) {
    try {
      this.stopScan();
      
      const device = await this.bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      
      this.connectedDevice = device;
      this.activeProvider = 'pinetime';
      
      await AsyncStorage.setItem('lastConnectedDevice', deviceId);
      
      // Set up notifications for incoming data
      await this.setupPineTimeNotifications(device);
      
      return { success: true, device };
    } catch (error) {
      console.error('Connection error:', error);
      return { success: false, error: error.message };
    }
  }

  async setupPineTimeNotifications(device) {
    try {
      // Monitor steps
      device.monitorCharacteristicForService(
        this.PINETIME_SERVICE_UUID,
        this.STEPS_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Steps monitor error:', error);
            return;
          }
          if (characteristic?.value) {
            const steps = this.decodeSteps(characteristic.value);
            this.notifyCallbacks({ type: 'steps', value: steps });
          }
        }
      );

      // Monitor HRV
      device.monitorCharacteristicForService(
        this.PINETIME_SERVICE_UUID,
        this.HRV_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('HRV monitor error:', error);
            return;
          }
          if (characteristic?.value) {
            const hrv = this.decodeHRV(characteristic.value);
            this.notifyCallbacks({ type: 'hrv', value: hrv });
          }
        }
      );

      // Monitor heart rate (standard service)
      device.monitorCharacteristicForService(
        this.HR_SERVICE_UUID,
        this.HR_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('HR monitor error:', error);
            return;
          }
          if (characteristic?.value) {
            const hr = this.decodeHeartRate(characteristic.value);
            this.notifyCallbacks({ type: 'heartRate', value: hr });
          }
        }
      );
    } catch (error) {
      console.error('Setup notifications error:', error);
    }
  }

  async sendPraxiomAgeToPineTime(bioAge, oralHealthScore, systemicHealthScore, fitnessScore) {
    if (!this.connectedDevice) {
      return { success: false, error: 'No device connected' };
    }

    try {
      // Encode bio-age data package
      const dataPackage = this.encodeBioAgePackage(bioAge, oralHealthScore, systemicHealthScore, fitnessScore);
      
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        this.PINETIME_SERVICE_UUID,
        this.BIOAGE_CHAR_UUID,
        dataPackage
      );

      // Wait for confirmation (read back the characteristic)
      const confirmation = await this.connectedDevice.readCharacteristicForService(
        this.PINETIME_SERVICE_UUID,
        this.BIOAGE_CHAR_UUID
      );

      if (confirmation && confirmation.value) {
        const receivedAge = this.decodeBioAge(confirmation.value);
        const isMatching = Math.abs(receivedAge - bioAge) < 0.1;
        
        return { 
          success: isMatching, 
          receivedAge,
          confirmed: isMatching,
          message: isMatching ? 'Watch received and confirmed!' : 'Data mismatch'
        };
      }

      return { success: true, confirmed: false, message: 'Sent, awaiting confirmation' };
    } catch (error) {
      console.error('Send bio-age error:', error);
      return { success: false, error: error.message };
    }
  }

  async disconnectPineTime() {
    if (this.connectedDevice) {
      try {
        await this.bleManager.cancelDeviceConnection(this.connectedDevice.id);
        this.connectedDevice = null;
        this.activeProvider = null;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  }

  // Data encoding/decoding helpers
  encodeBioAgePackage(bioAge, oralHealth, systemicHealth, fitness) {
    const buffer = Buffer.alloc(16);
    buffer.writeFloatLE(bioAge, 0);
    buffer.writeFloatLE(oralHealth, 4);
    buffer.writeFloatLE(systemicHealth, 8);
    buffer.writeFloatLE(fitness, 12);
    return buffer.toString('base64');
  }

  decodeBioAge(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.readFloatLE(0);
  }

  decodeSteps(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.readUInt32LE(0);
  }

  decodeHRV(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.readFloatLE(0);
  }

  decodeHeartRate(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.readUInt8(1); // HR is typically at byte 1
  }

  // ==================== APPLE HEALTHKIT ====================
  
  async initializeAppleHealth() {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      return { success: false, error: 'Apple HealthKit not available' };
    }

    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.HeartRateVariability,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
        ],
        write: []
      }
    };

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          this.activeProvider = 'apple';
          resolve({ success: true });
        }
      });
    });
  }

  async getAppleHealthSteps(startDate, endDate) {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      return { success: false, error: 'Not available' };
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getStepCount(options, (error, results) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true, steps: results.value });
        }
      });
    });
  }

  async getAppleHealthHRV(startDate, endDate) {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      return { success: false, error: 'Not available' };
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getHeartRateVariabilitySamples(options, (error, results) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          const avgHRV = results.length > 0 
            ? results.reduce((sum, r) => sum + r.value, 0) / results.length 
            : 0;
          resolve({ success: true, hrv: avgHRV });
        }
      });
    });
  }

  // ==================== ANDROID HEALTH CONNECT ====================
  
  async initializeHealthConnect() {
    if (Platform.OS !== 'android' || !HealthConnect) {
      return { success: false, error: 'Health Connect not available' };
    }

    try {
      const isAvailable = await HealthConnect.getSdkStatus();
      if (isAvailable === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
        await HealthConnect.initialize();
        
        const grantedPermissions = await HealthConnect.requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'HeartRate' },
          { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
        ]);

        this.activeProvider = 'healthconnect';
        return { success: true, permissions: grantedPermissions };
      }
      return { success: false, error: 'Health Connect SDK not available' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getHealthConnectSteps(startDate, endDate) {
    if (Platform.OS !== 'android' || !HealthConnect) {
      return { success: false, error: 'Not available' };
    }

    try {
      const result = await HealthConnect.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const totalSteps = result.records.reduce((sum, record) => sum + record.count, 0);
      return { success: true, steps: totalSteps };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== GARMIN & FITBIT (OAuth-based) ====================
  
  // These require OAuth2 flow and backend API integration
  // Placeholder methods for future implementation
  
  async connectGarmin() {
    // Would open OAuth flow
    Alert.alert('Coming Soon', 'Garmin integration will be available soon!');
    return { success: false, error: 'Not implemented yet' };
  }

  async connectFitbit() {
    // Would open OAuth flow  
    Alert.alert('Coming Soon', 'Fitbit integration will be available soon!');
    return { success: false, error: 'Not implemented yet' };
  }

  // ==================== UNIFIED DATA RETRIEVAL ====================
  
  async getSteps(startDate = new Date(), endDate = new Date()) {
    switch (this.activeProvider) {
      case 'pinetime':
        return { success: false, error: 'Real-time data via notifications' };
      
      case 'apple':
        return await this.getAppleHealthSteps(startDate, endDate);
      
      case 'healthconnect':
        return await this.getHealthConnectSteps(startDate, endDate);
      
      default:
        return { success: false, error: 'No active provider' };
    }
  }

  async getHRV(startDate = new Date(), endDate = new Date()) {
    switch (this.activeProvider) {
      case 'pinetime':
        return { success: false, error: 'Real-time data via notifications' };
      
      case 'apple':
        return await this.getAppleHealthHRV(startDate, endDate);
      
      default:
        return { success: false, error: 'Not implemented for this provider' };
    }
  }

  // ==================== CALLBACK SYSTEM ====================
  
  onDataReceived(callback) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  notifyCallbacks(data) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });
  }

  // ==================== STATUS ====================
  
  getConnectionStatus() {
    return {
      connected: !!this.connectedDevice,
      provider: this.activeProvider,
      deviceId: this.connectedDevice?.id,
      deviceName: this.connectedDevice?.name,
    };
  }
}

export default new WearableService();
