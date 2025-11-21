// ===================================
// TIME SYNC FIX FOR WEARABLESERVICE.JS
// ===================================
// Add this to your WearableService.js file

// At the top with other constants, add:
const CTS_SERVICE_UUID = '00001805-0000-1000-8000-00805F9B34FB';
const CURRENT_TIME_CHAR_UUID = '00002A2B-0000-1000-8000-00805F9B34FB';

// Add this method to the WearableService class:

/**
 * Synchronize time to the PineTime watch
 * Call this after successful connection to the watch
 */
async syncTimeToWatch() {
  try {
    if (!this.device) {
      this.log('⚠️ No device connected');
      return false;
    }

    const now = new Date();
    
    // Create 10-byte time data buffer
    const timeData = new Uint8Array(10);
    
    // Year (little-endian uint16)
    const year = now.getFullYear();
    timeData[0] = year & 0xFF;
    timeData[1] = (year >> 8) & 0xFF;
    
    // Month (1-12)
    timeData[2] = now.getMonth() + 1;
    
    // Day of month
    timeData[3] = now.getDate();
    
    // Hour (24-hour format)
    timeData[4] = now.getHours();
    
    // Minute
    timeData[5] = now.getMinutes();
    
    // Second
    timeData[6] = now.getSeconds();
    
    // Day of week (1=Monday, 7=Sunday)
    // JavaScript: 0=Sunday, 6=Saturday
    // PineTime: 1=Monday, 7=Sunday
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    timeData[7] = dayOfWeek;
    
    // Fractions256 (subsecond precision, not used)
    timeData[8] = 0;
    
    // Adjust reason (0 = manual time update)
    timeData[9] = 0;

    // Convert to base64 for BLE transmission
    const base64Data = this.bufferToBase64(timeData);
    
    // Write to Current Time characteristic
    await this.device.writeCharacteristicWithResponseForService(
      CTS_SERVICE_UUID,
      CURRENT_TIME_CHAR_UUID,
      base64Data
    );
    
    this.log(`✅ Time synchronized: ${now.toLocaleString()}`);
    return true;
    
  } catch (error) {
    this.log(`⚠️ Time sync failed: ${error.message}`);
    return false;
  }
}

/**
 * Helper function to convert Uint8Array to base64
 */
bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ===================================
// UPDATE YOUR connectToDevice METHOD
// ===================================
// After successfully connecting, call syncTimeToWatch():

/*
async connectToDevice(deviceId) {
  try {
    this.log(`Connecting to device: ${deviceId}`);
    
    // Connect to device
    this.device = await this.manager.connectToDevice(deviceId);
    this.log(`✅ Connected to ${this.device.name}`);
    
    // Discover services and characteristics
    await this.device.discoverAllServicesAndCharacteristics();
    this.log('✅ Services discovered');
    
    // ✅ SYNC TIME IMMEDIATELY AFTER CONNECTION
    await this.syncTimeToWatch();
    
    // Monitor connection state
    this.device.onDisconnected((error, device) => {
      this.log(`Disconnected from ${device.name}`);
      this.device = null;
      this.isConnected = false;
    });
    
    this.isConnected = true;
    
    // Start monitoring for Bio-Age updates
    await this.startMonitoring();
    
    return true;
  } catch (error) {
    this.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}
*/

// ===================================
// OPTIONAL: PERIODIC TIME SYNC
// ===================================
// You can also sync time periodically (e.g., every hour)

/*
// Add to your class:
startPeriodicTimeSync() {
  // Sync time every hour
  this.timeSyncInterval = setInterval(async () => {
    if (this.isConnected) {
      await this.syncTimeToWatch();
    }
  }, 60 * 60 * 1000); // 1 hour
}

// Stop periodic sync when disconnecting:
stopPeriodicTimeSync() {
  if (this.timeSyncInterval) {
    clearInterval(this.timeSyncInterval);
    this.timeSyncInterval = null;
  }
}
*/
