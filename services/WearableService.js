// Replace the writeBioAge function in WearableService.js (around line 700) with:

async writeBioAge(age) {
  console.log('📝 Attempting to write Bio-Age:', age);
  
  if (!this.device) {
    throw new Error('No device connected');
  }

  try {
    // Ensure device is connected
    const isConnected = await this.device.isConnected();
    if (!isConnected) {
      console.log('Device not connected, reconnecting...');
      await this.connect();
    }
    
    // CRITICAL FOR iOS: Always discover services before writing
    console.log('Discovering all services and characteristics...');
    await this.device.discoverAllServicesAndCharacteristics();
    
    // Wait for discovery to complete on iOS
    if (Platform.OS === 'ios') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Convert age to buffer (single byte)
    const ageBuffer = Buffer.from([Math.round(age)]);
    const base64Data = ageBuffer.toString('base64');
    
    console.log(`Writing age ${age} (base64: ${base64Data}) to characteristic ${BIO_AGE_CHAR}`);
    
    // Write directly using device.writeCharacteristicWithResponseForService
    // This is more reliable on iOS than getting the characteristic object first
    try {
      await this.device.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );
      
      console.log(`✅ Bio-age ${age} written successfully`);
      this.cachedData.bioAge = age;
      this.cachedData.lastUpdate = new Date();
      
      // Emit success event
      if (this.listeners.onBioAgeWritten) {
        this.listeners.onBioAgeWritten(age);
      }
      
      return true;
      
    } catch (writeError) {
      // If writeWithResponse fails, try writeWithoutResponse
      console.log('WriteWithResponse failed, trying without response...');
      
      await this.device.writeCharacteristicWithoutResponseForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Data
      );
      
      console.log(`✅ Bio-age ${age} written successfully (without response)`);
      this.cachedData.bioAge = age;
      this.cachedData.lastUpdate = new Date();
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Failed to write bio-age:', error);
    
    // More detailed error for debugging
    if (error.message) {
      if (error.message.includes('characteristic')) {
        console.error('Characteristic not found - ensure PineTime firmware has Praxiom service');
      } else if (error.message.includes('service')) {
        console.error('Service not found - may need to restart Bluetooth');
      }
    }
    
    throw error;
  }
}

// Also add this helper function to test the connection:

async testBioAgeWrite() {
  try {
    console.log('🧪 Testing bio-age write functionality...');
    
    // Test with age 42
    await this.writeBioAge(42);
    console.log('✅ Test write successful!');
    
    // Try reading it back if the characteristic supports read
    try {
      const characteristic = await this.device.readCharacteristicForService(
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR
      );
      
      const base64Value = characteristic.value;
      const buffer = Buffer.from(base64Value, 'base64');
      const readAge = buffer[0];
      
      console.log(`📖 Read back age: ${readAge}`);
      
      if (readAge === 42) {
        console.log('✅ Write and read verification successful!');
      }
    } catch (readError) {
      console.log('ℹ️ Could not read back value (normal if write-only)');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Bio-age test failed:', error);
    return false;
  }
}
