import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

class WearableService {
  constructor() {
    this.manager = null;
    this.device = null;
    this.heartRate = 0;
    this.steps = 0;
    this.hrv = 0;
    this.battery = 0;
    this.isConnected = false;
    this.lastTransmission = null;
    this.transmissionLog = [];
    
    // BLE UUIDs
    this.HEART_RATE_SERVICE = '0000180D-0000-1000-8000-00805F9B34FB';
    this.HEART_RATE_CHAR = '00002A37-0000-1000-8000-00805F9B34FB';
    
    this.BATTERY_SERVICE = '0000180F-0000-1000-8000-00805F9B34FB';
    this.BATTERY_CHAR = '00002A19-0000-1000-8000-00805F9B34FB';
    
    this.MOTION_SERVICE = '00030000-78fc-48fe-8e23-433b3a1942d0';
    this.STEP_COUNT_CHAR = '00030001-78fc-48fe-8e23-433b3a1942d0';
    
    // Custom Praxiom Service
    this.PRAXIOM_SERVICE = '00001900-78fc-48fe-8e23-433b3a1942d0';
    this.BIO_AGE_CHAR = '00001901-78fc-48fe-8e23-433b3a1942d0';
  }

  async init() {
    try {
      if (!this.manager) {
        this.manager = new BleManager();
        this.log('✅ BLE Manager initialized');
      }
      return true;
    } catch (error) {
      this.log(`❌ BLE init error: ${error.message}`);
      return false;
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    
    // Keep last 50 log entries
    this.transmissionLog.push(logEntry);
    if (this.transmissionLog.length > 50) {
      this.transmissionLog.shift();
    }
  }

  getTransmissionLog() {
    return this.transmissionLog.slice().reverse(); // Most recent first
  }

  async scanForDevices() {
    return new Promise((resolve, reject) => {
      const devices = [];
      this.log('🔍 Starting device scan...');
      
      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          this.log(`❌ Scan error: ${error.message}`);
          reject(error);
          return;
        }

        if (device && device.name) {
          const deviceInfo = {
            id: device.id,
            name: device.name,
            rssi: device.rssi
          };
          
          // Check if already in list
          if (!devices.find(d => d.id === device.id)) {
            devices.push(deviceInfo);
            this.log(`📱 Found: ${device.name} (${device.rssi} dBm)`);
          }
        }
      });

      // Stop scan after 15 seconds
      setTimeout(() => {
        this.manager.stopDeviceScan();
        this.log(`✅ Scan complete. Found ${devices.length} devices`);
        resolve(devices);
      }, 15000);
    });
  }

  async connectToDevice(deviceId) {
    try {
      this.log(`🔗 Connecting to ${deviceId}...`);
      
      this.device = await this.manager.connectToDevice(deviceId);
      this.isConnected = true;
      this.log(`✅ Connected to ${this.device.name}`);
      
      await this.device.discoverAllServicesAndCharacteristics();
      this.log('✅ Services discovered');
      
      // Log available services
      const services = await this.device.services();
      this.log(`📋 Available services: ${services.length}`);
      services.forEach(service => {
        this.log(`  - Service: ${service.uuid}`);
      });
      
      // Subscribe to notifications
      await this.subscribeToNotifications();
      
      // Start keep-alive
      this.startKeepAlive();
      
      return true;
    } catch (error) {
      this.log(`❌ Connection error: ${error.message}`);
      this.isConnected = false;
      return false;
    }
  }

  async subscribeToNotifications() {
    try {
      // Heart Rate
      try {
        await this.device.monitorCharacteristicForService(
          this.HEART_RATE_SERVICE,
          this.HEART_RATE_CHAR,
          (error, characteristic) => {
            if (error) {
              this.log(`⚠️ HR error: ${error.message}`);
              return;
            }
            if (characteristic?.value) {
              const data = Buffer.from(characteristic.value, 'base64');
              const hr = data[1];
              this.heartRate = hr;
              this.log(`❤️ Heart Rate: ${hr} bpm`);
              
              // Parse HRV if available (RR intervals)
              if (data.length > 2) {
                const rrIntervals = [];
                for (let i = 2; i < data.length; i += 2) {
                  if (i + 1 < data.length) {
                    const rr = data.readUInt16LE(i);
                    const rrMs = (rr / 1024) * 1000;
                    rrIntervals.append(rrMs);
                  }
                }
                if (rrIntervals.length > 1) {
                  this.hrv = this.calculateRMSSD(rrIntervals);
                  this.log(`📊 HRV (RMSSD): ${this.hrv.toFixed(1)} ms`);
                }
              }
            }
          }
        );
        this.log('✅ Heart rate subscription active');
      } catch (error) {
        this.log(`⚠️ Heart rate not available: ${error.message}`);
      }

      // Steps
      try {
        await this.device.monitorCharacteristicForService(
          this.MOTION_SERVICE,
          this.STEP_COUNT_CHAR,
          (error, characteristic) => {
            if (error) {
              this.log(`⚠️ Steps error: ${error.message}`);
              return;
            }
            if (characteristic?.value) {
              const data = Buffer.from(characteristic.value, 'base64');
              const steps = data.readUInt32LE(0);
              this.steps = steps;
              this.log(`👟 Steps: ${steps}`);
            }
          }
        );
        this.log('✅ Step count subscription active');
      } catch (error) {
        this.log(`⚠️ Step count not available: ${error.message}`);
      }

      // Battery
      try {
        await this.device.monitorCharacteristicForService(
          this.BATTERY_SERVICE,
          this.BATTERY_CHAR,
          (error, characteristic) => {
            if (error) {
              this.log(`⚠️ Battery error: ${error.message}`);
              return;
            }
            if (characteristic?.value) {
              const data = Buffer.from(characteristic.value, 'base64');
              const battery = data[0];
              this.battery = battery;
              this.log(`🔋 Battery: ${battery}%`);
            }
          }
        );
        this.log('✅ Battery subscription active');
      } catch (error) {
        this.log(`⚠️ Battery not available: ${error.message}`);
      }
    } catch (error) {
      this.log(`❌ Subscription error: ${error.message}`);
    }
  }

  calculateRMSSD(rrIntervals) {
    if (rrIntervals.length < 2) return 0;
    
    let sumSquaredDiffs = 0;
    for (let i = 0; i < rrIntervals.length - 1; i++) {
      const diff = rrIntervals[i + 1] - rrIntervals[i];
      sumSquaredDiffs += diff * diff;
    }
    
    const meanSquaredDiff = sumSquaredDiffs / (rrIntervals.length - 1);
    return Math.sqrt(meanSquaredDiff);
  }

  async sendPraxiomAgeToWatch(bioAge, chronAge = null) {
    try {
      if (!this.device || !this.isConnected) {
        throw new Error('Watch not connected');
      }

      this.log(`📤 Attempting to send Bio-Age: ${bioAge} years`);

      // Verify Praxiom service exists
      const services = await this.device.services();
      const praxiomService = services.find(s => 
        s.uuid.toUpperCase() === this.PRAXIOM_SERVICE.toUpperCase()
      );

      if (!praxiomService) {
        this.log('⚠️ Praxiom service not found on watch. Available services:');
        services.forEach(s => this.log(`  - ${s.uuid}`));
        throw new Error('Praxiom service not available. Watch may need firmware update.');
      }

      this.log('✅ Praxiom service found');

      // Format data: 4 bytes for bio age (uint32, age * 10 for decimal precision)
      const buffer = Buffer.alloc(4);
      const ageValue = Math.round(bioAge * 10); // 59.3 → 593
      buffer.writeUInt32LE(ageValue, 0);
      
      const base64Data = buffer.toString('base64');
      
      this.log(`📝 Formatted data: ${ageValue} (${bioAge} years) → ${base64Data}`);

      // Write to characteristic
      await this.device.writeCharacteristicWithResponseForService(
        this.PRAXIOM_SERVICE,
        this.BIO_AGE_CHAR,
        base64Data
      );

      this.lastTransmission = {
        bioAge,
        timestamp: new Date(),
        success: true
      };

      this.log(`✅ Bio-Age transmitted successfully: ${bioAge} years`);
      return { success: true, bioAge };

    } catch (error) {
      this.log(`❌ Transmission failed: ${error.message}`);
      this.lastTransmission = {
        bioAge,
        timestamp: new Date(),
        success: false,
        error: error.message
      };
      throw error;
    }
  }

  // Test function to send specific age value
  async sendTestAge(testAge) {
    this.log(`🧪 TEST MODE: Sending age ${testAge}`);
    return this.sendPraxiomAgeToWatch(testAge);
  }

  startKeepAlive() {
    // Poll battery every 30 seconds to keep connection alive
    this.keepAliveInterval = setInterval(async () => {
      if (this.device && this.isConnected) {
        try {
          await this.device.readCharacteristicForService(
            this.BATTERY_SERVICE,
            this.BATTERY_CHAR
          );
        } catch (error) {
          this.log(`⚠️ Keep-alive failed: ${error.message}`);
        }
      }
    }, 30000);
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  async disconnect() {
    try {
      this.stopKeepAlive();
      
      if (this.device) {
        await this.device.cancelConnection();
        this.log('✅ Disconnected from watch');
      }
      
      this.device = null;
      this.isConnected = false;
      this.heartRate = 0;
      this.steps = 0;
      this.hrv = 0;
      this.battery = 0;
      
      return true;
    } catch (error) {
      this.log(`❌ Disconnect error: ${error.message}`);
      return false;
    }
  }

  getLatestData() {
    return {
      heartRate: this.heartRate,
      steps: this.steps,
      hrv: this.hrv,
      battery: this.battery,
      isConnected: this.isConnected,
      lastTransmission: this.lastTransmission
    };
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      deviceName: this.device?.name || null,
      deviceId: this.device?.id || null
    };
  }
}

// Export singleton instance
export default new WearableService();
