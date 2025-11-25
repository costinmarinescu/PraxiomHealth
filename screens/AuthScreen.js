// Fix for PIN entry bug - Replace lines 210-238 in AuthScreen.js with:

/**
 * Set up new PIN
 */
const setupPin = async () => {
  // First check if we're still collecting the first PIN
  if (!confirmPin && pin.length < 6) {
    Alert.alert('Invalid PIN', 'PIN must be 6 digits');
    return;
  }
  
  // If we haven't started confirming yet
  if (!confirmPin && pin.length === 6) {
    Alert.alert('Confirm PIN', 'Please enter your PIN again to confirm');
    setConfirmPin(pin); // Store first PIN
    setPin(''); // Clear input for confirmation
    return;
  }
  
  // We're confirming - check if PINs match
  if (confirmPin && pin.length === 6) {
    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      return;
    }
    
    try {
      // Hash and store the PIN
      const pinHash = await EncryptionService.hashPin(pin);
      await SecureStore.setItemAsync('praxiom_pin_hash', pinHash);
      
      await AuditLogger.log('PIN_SETUP', { timestamp: Date.now() });
      
      setIsSettingPin(false);
      await handleSuccessfulAuth();
      
      Alert.alert('Success', 'PIN has been set successfully');
    } catch (error) {
      console.error('PIN setup error:', error);
      Alert.alert('Setup Error', 'Failed to set up PIN');
    }
  }
};

// Also update the PIN input UI (around lines 400-450) to show proper state:

{isSettingPin && (
  <View style={styles.pinSetupContainer}>
    <Text style={styles.setupTitle}>
      {!confirmPin ? 'Create 6-Digit PIN' : 'Confirm Your PIN'}
    </Text>
    <TextInput
      style={styles.pinInput}
      value={pin}
      onChangeText={setPin}
      placeholder={!confirmPin ? "Enter PIN" : "Confirm PIN"}
      keyboardType="numeric"
      maxLength={6}
      secureTextEntry
      autoFocus
    />
    <View style={styles.pinButtonContainer}>
      <TouchableOpacity 
        style={[styles.pinButton, pin.length < 6 && styles.disabledButton]}
        onPress={setupPin}
        disabled={pin.length < 6}
      >
        <Text style={styles.pinButtonText}>
          {!confirmPin ? 'Next' : 'Confirm'}
        </Text>
      </TouchableOpacity>
      {confirmPin && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            setPin('');
            setConfirmPin('');
          }}
        >
          <Text style={styles.cancelButtonText}>Start Over</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
)}
