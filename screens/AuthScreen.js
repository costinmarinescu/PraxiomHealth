/**
 * AuthScreen.js - HIPAA-Compliant Authentication Screen
 * 
 * Features:
 * - Biometric authentication (Face ID/Touch ID/Fingerprint)
 * - PIN backup authentication
 * - Session management with auto-logout
 * - Audit logging for access attempts
 * - HIPAA-compliant security measures
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../AppContext';
import EncryptionService from '../services/EncryptionService';
import AuditLogger from '../services/AuditLogger';

export default function AuthScreen({ navigation }) {
  const { updateState } = useContext(AppContext);
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  
  // PIN states
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  
  // Session management
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes lockout

  useEffect(() => {
    initializeAuth();
    setupSessionMonitoring();
  }, []);

  /**
   * Initialize authentication system
   */
  const initializeAuth = async () => {
    try {
      // Check if device supports biometric authentication
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        
        // Determine biometric type
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris Scanner');
        }
      }
      
      // Check if PIN is set up
      const hasPin = await SecureStore.getItemAsync('praxiom_pin_hash');
      if (!hasPin && !biometricAvailable) {
        setIsSettingPin(true);
        setShowPinEntry(true);
      }
      
      // Check for existing session
      const lastAuth = await SecureStore.getItemAsync('last_auth_time');
      if (lastAuth) {
        const timeSinceAuth = Date.now() - parseInt(lastAuth);
        if (timeSinceAuth < SESSION_TIMEOUT) {
          // Resume session
          await handleSuccessfulAuth();
        } else {
          // Session expired
          await AuditLogger.log('SESSION_EXPIRED', { timeSinceAuth });
        }
      }
      
      // Check for lockout
      const lockoutEnd = await AsyncStorage.getItem('auth_lockout_end');
      if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
        setLockoutTime(parseInt(lockoutEnd));
        startLockoutTimer();
      }
      
      setIsLoading(false);
      
      // Attempt biometric auth if available
      if (biometricAvailable && !isAuthenticated) {
        authenticateWithBiometric();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setIsLoading(false);
      Alert.alert('Security Error', 'Failed to initialize authentication system');
    }
  };

  /**
   * Biometric authentication
   */
  const authenticateWithBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your health data',
        disableDeviceFallback: false,
        cancelLabel: 'Use PIN',
        fallbackLabel: 'Use PIN'
      });
      
      if (result.success) {
        await handleSuccessfulAuth();
        await AuditLogger.log('AUTH_SUCCESS', { method: 'biometric', type: biometricType });
      } else {
        if (result.error === 'user_cancel' || result.error === 'system_cancel') {
          // User chose to use PIN
          setShowPinEntry(true);
        } else {
          await AuditLogger.log('AUTH_FAILED', { method: 'biometric', error: result.error });
          setShowPinEntry(true);
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setShowPinEntry(true);
    }
  };

  /**
   * PIN authentication
   */
  const authenticateWithPin = async () => {
    if (lockoutTime && Date.now() < lockoutTime) {
      Alert.alert('Account Locked', 'Too many failed attempts. Please try again later.');
      return;
    }
    
    try {
      const storedPinHash = await SecureStore.getItemAsync('praxiom_pin_hash');
      
      // Hash the entered PIN for comparison
      const enteredPinHash = await EncryptionService.hashPin(pin);
      
      if (storedPinHash === enteredPinHash) {
        await handleSuccessfulAuth();
        await AuditLogger.log('AUTH_SUCCESS', { method: 'pin' });
        setFailedAttempts(0);
      } else {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        await AuditLogger.log('AUTH_FAILED', { method: 'pin', attempts: newFailedAttempts });
        
        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          // Lock out the user
          const lockoutEnd = Date.now() + LOCKOUT_DURATION;
          await AsyncStorage.setItem('auth_lockout_end', lockoutEnd.toString());
          setLockoutTime(lockoutEnd);
          startLockoutTimer();
          
          Alert.alert(
            'Account Locked',
            `Too many failed attempts. Account locked for 15 minutes.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Incorrect PIN',
            `${MAX_FAILED_ATTEMPTS - newFailedAttempts} attempts remaining`,
            [{ text: 'Try Again' }]
          );
        }
        
        setPin('');
      }
    } catch (error) {
      console.error('PIN auth error:', error);
      Alert.alert('Authentication Error', 'Failed to verify PIN');
    }
  };

  /**
   * Set up new PIN
   */
  const setupPin = async () => {
    if (pin.length !== 6) {
      Alert.alert('Invalid PIN', 'PIN must be 6 digits');
      return;
    }
    
    if (confirmPin !== pin) {
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
  };

  /**
   * Handle successful authentication
   */
  const handleSuccessfulAuth = async () => {
    try {
      // Store authentication time
      await SecureStore.setItemAsync('last_auth_time', Date.now().toString());
      
      // Update app state
      updateState({ 
        isAuthenticated: true,
        authTime: Date.now(),
        authMethod: biometricType || 'PIN'
      });
      
      // Initialize encryption service
      await EncryptionService.initialize();
      
      setIsAuthenticated(true);
      setPin('');
      setConfirmPin('');
      
      // Navigate to main app
      navigation.replace('Main');
    } catch (error) {
      console.error('Post-auth error:', error);
      Alert.alert('Error', 'Authentication successful but failed to initialize app');
    }
  };

  /**
   * Set up session monitoring for auto-logout
   */
  const setupSessionMonitoring = () => {
    const interval = setInterval(async () => {
      if (isAuthenticated) {
        const timeSinceActivity = Date.now() - lastActivityTime;
        
        if (timeSinceActivity > SESSION_TIMEOUT) {
          // Auto logout due to inactivity
          await handleLogout('inactivity');
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  };

  /**
   * Handle logout
   */
  const handleLogout = async (reason = 'manual') => {
    try {
      await AuditLogger.log('LOGOUT', { reason, timestamp: Date.now() });
      
      // Clear session
      await SecureStore.deleteItemAsync('last_auth_time');
      
      // Reset state
      setIsAuthenticated(false);
      updateState({ isAuthenticated: false });
      
      if (reason === 'inactivity') {
        Alert.alert('Session Expired', 'You have been logged out due to inactivity');
      }
      
      // Return to auth screen
      navigation.replace('Auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Start lockout timer
   */
  const startLockoutTimer = () => {
    const timer = setInterval(() => {
      if (lockoutTime && Date.now() >= lockoutTime) {
        setLockoutTime(null);
        setFailedAttempts(0);
        clearInterval(timer);
      }
    }, 1000);
  };

  /**
   * Render PIN input
   */
  const renderPinInput = () => {
    const remainingTime = lockoutTime ? Math.ceil((lockoutTime - Date.now()) / 1000) : 0;
    
    return (
      <View style={styles.pinContainer}>
        <Text style={styles.pinTitle}>
          {isSettingPin ? 'Set Up Your PIN' : 'Enter PIN'}
        </Text>
        
        {lockoutTime && Date.now() < lockoutTime ? (
          <View style={styles.lockoutContainer}>
            <Ionicons name="lock-closed" size={50} color="#FF6B6B" />
            <Text style={styles.lockoutText}>Account Locked</Text>
            <Text style={styles.lockoutTimer}>
              Try again in {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter 6-digit PIN"
              keyboardType="numeric"
              secureTextEntry={true}
              maxLength={6}
              autoFocus
            />
            
            {isSettingPin && (
              <TextInput
                style={styles.pinInput}
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Confirm PIN"
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={6}
              />
            )}
            
            <TouchableOpacity
              style={styles.pinButton}
              onPress={isSettingPin ? setupPin : authenticateWithPin}
              disabled={pin.length !== 6 || (isSettingPin && confirmPin.length !== 6)}
            >
              <Text style={styles.pinButtonText}>
                {isSettingPin ? 'Set PIN' : 'Authenticate'}
              </Text>
            </TouchableOpacity>
            
            {biometricAvailable && !isSettingPin && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={authenticateWithBiometric}
              >
                <Ionicons 
                  name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} 
                  size={24} 
                  color="#00A6B8" 
                />
                <Text style={styles.biometricButtonText}>
                  Use {biometricType}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A6B8" />
        <Text style={styles.loadingText}>Initializing Security...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#00A6B8', '#005F6B']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/praxiom-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Praxiom Health</Text>
          <Text style={styles.subtitle}>Secure Health Data Access</Text>
        </View>
        
        {showPinEntry ? (
          renderPinInput()
        ) : (
          <View style={styles.authContainer}>
            {biometricAvailable && (
              <TouchableOpacity
                style={styles.authButton}
                onPress={authenticateWithBiometric}
              >
                <Ionicons 
                  name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} 
                  size={50} 
                  color="#FFF" 
                />
                <Text style={styles.authButtonText}>
                  Authenticate with {biometricType}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowPinEntry(true)}
            >
              <Text style={styles.secondaryButtonText}>Use PIN Instead</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={20} color="#FFF" />
          <Text style={styles.footerText}>HIPAA Compliant • AES-256 Encrypted</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  authContainer: {
    alignItems: 'center',
  },
  authButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 50,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 18,
    marginTop: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  secondaryButtonText: {
    color: '#E0E0E0',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  pinContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  pinInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#00A6B8',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 5,
  },
  pinButton: {
    backgroundColor: '#00A6B8',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 50,
    marginTop: 10,
  },
  pinButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  biometricButtonText: {
    color: '#00A6B8',
    fontSize: 16,
    marginLeft: 10,
  },
  lockoutContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  lockoutText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 15,
  },
  lockoutTimer: {
    fontSize: 24,
    color: '#666',
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    opacity: 0.8,
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 10,
  },
});
