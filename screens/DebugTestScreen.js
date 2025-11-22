/**
 * IMPROVED DEBUG TEST - Shows actual CryptoJS errors
 * 
 * Add this test to DebugTestScreen.js
 */

// Add this new test function:
const testCryptoJSDirectly = async () => {
  addResult('🔍 Testing CryptoJS Directly', 'info', 'Checking if CryptoJS is loaded...');
  
  try {
    // Test 1: Check if CryptoJS is defined
    const CryptoJS = require('crypto-js');
    
    if (!CryptoJS) {
      addResult('CryptoJS Module', 'fail', 'CryptoJS is undefined - not loaded!');
      return;
    }
    
    addResult('CryptoJS Module', 'pass', 'CryptoJS is defined ✅');
    
    // Test 2: Check if AES is available
    if (!CryptoJS.AES) {
      addResult('CryptoJS.AES', 'fail', 'CryptoJS.AES is undefined!');
      return;
    }
    
    addResult('CryptoJS.AES', 'pass', 'CryptoJS.AES is available ✅');
    
    // Test 3: Try to encrypt something simple
    try {
      const testString = "Hello World";
      const encrypted = CryptoJS.AES.encrypt(testString, 'test-key');
      
      if (encrypted && encrypted.toString()) {
        addResult('Direct Encryption', 'pass', 
          `Successfully encrypted test string: ${encrypted.toString().substring(0, 20)}...`);
      } else {
        addResult('Direct Encryption', 'fail', 'Encryption returned empty result');
      }
      
      // Test 4: Try to decrypt
      const decrypted = CryptoJS.AES.decrypt(encrypted, 'test-key');
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (decryptedString === testString) {
        addResult('Direct Decryption', 'pass', 
          `Successfully decrypted: "${decryptedString}"`);
      } else {
        addResult('Direct Decryption', 'fail', 
          `Decryption mismatch: got "${decryptedString}" expected "${testString}"`);
      }
      
    } catch (encryptError) {
      addResult('Direct Encryption', 'fail', 
        `Encryption threw error: ${encryptError.message}\n${encryptError.stack}`);
    }
    
    // Test 5: Try encrypting complex object
    try {
      const testObj = {
        name: "Test",
        values: [1, 2, 3],
        nested: { a: "b" }
      };
      
      const jsonString = JSON.stringify(testObj);
      const encrypted = CryptoJS.AES.encrypt(jsonString, 'test-key').toString();
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, 'test-key');
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      const decryptedObj = JSON.parse(decryptedString);
      
      if (decryptedObj.name === "Test") {
        addResult('Object Encryption', 'pass', 
          'Successfully encrypted/decrypted complex object');
      } else {
        addResult('Object Encryption', 'fail', 
          'Object decryption mismatch');
      }
      
    } catch (objError) {
      addResult('Object Encryption', 'fail', 
        `Object encryption failed: ${objError.message}`);
    }
    
  } catch (error) {
    addResult('CryptoJS Test', 'fail', 
      `Fatal error: ${error.message}\nStack: ${error.stack}`);
  }
};

// Add this button to the UI:
<TouchableOpacity
  style={[styles.button, styles.secondaryButton]}
  onPress={testCryptoJSDirectly}
  disabled={isRunning}
>
  <Ionicons name="flask" size={20} color="#00d4ff" />
  <Text style={[styles.buttonText, { color: '#00d4ff' }]}>
    Test CryptoJS Directly
  </Text>
</TouchableOpacity>
