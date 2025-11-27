// AuthScreen-emergency-fix.js
// EMERGENCY FIX - Simplified version that works

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    console.log('AuthScreen mounted - Emergency version');
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('Initializing auth...');
    try {
      setIsLoading(true);
      
      // Simple check using AsyncStorage only (avoiding SecureStore issues)
      const storedPin = await AsyncStorage.getItem('@praxiom_pin');
      const hasPin = !!storedPin;
      console.log('Has existing PIN:', hasPin);
      
      setIsSettingUp(!hasPin);
    } catch (error) {
      console.error('Auth initialization error:', error);
      setIsSettingUp(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      '⚠️ Reset PIN',
      'Are you sure you want to reset? This will clear all data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Clear everything from AsyncStorage
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(keys);
              console.log('Reset complete');
              
              // Reset state
              setPin('');
              setConfirmPin('');
              setIsSettingUp(true);
              setAttempts(0);
              
              Alert.alert('✅ Success', 'PIN has been reset. Please set a new one.');
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Reset failed. Please reinstall the app.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const setupPin = async () => {
    console.log('Setting up PIN...');
    
    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be 4 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match');
      setPin('');
      setConfirmPin('');
      return;
    }

    try {
      // Save to AsyncStorage (avoiding SecureStore)
      await AsyncStorage.setItem('@praxiom_pin', pin);
      await AsyncStorage.setItem('@praxiom_auth', 'true');
      console.log('PIN saved successfully');
      
      // Navigate to main app
      handleSuccessfulAuth();
    } catch (error) {
      console.error('PIN setup error:', error);
      Alert.alert('Error', 'Failed to save PIN. Please try again.');
    }
  };

  const authenticateWithPin = async () => {
    console.log('Authenticating...');
    
    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter your 4-digit PIN');
      return;
    }

    try {
      const storedPin = await AsyncStorage.getItem('@praxiom_pin');
      
      if (pin === storedPin) {
        console.log('PIN correct');
        handleSuccessfulAuth();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          Alert.alert(
            'Too Many Attempts',
            'Please reset the PIN.',
            [{ text: 'Reset', onPress: handleReset }]
          );
        } else {
          Alert.alert(
            'Incorrect PIN',
            `${5 - newAttempts} attempts remaining`,
            [{ text: 'OK' }]
          );
          setPin('');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Authentication failed');
    }
  };

  const handleSuccessfulAuth = async () => {
    console.log('Auth successful, navigating...');
    
    try {
      // Set auth flag
      await AsyncStorage.setItem('@praxiom_authenticated', 'true');
      
      // Try to navigate - with multiple fallbacks
      if (navigation && navigation.navigate) {
        // Try different possible route names
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } catch (e1) {
          console.log('Main navigation failed, trying MainApp');
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainApp' }],
            });
          } catch (e2) {
            console.log('MainApp failed, trying Dashboard');
            try {
              navigation.navigate('Dashboard');
            } catch (e3) {
              console.error('All navigation attempts failed');
              Alert.alert(
                'Navigation Error',
                'App is authenticated but cannot navigate. Please restart the app.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      } else {
        console.error('Navigation prop not available');
        Alert.alert('Error', 'Navigation not available. Please restart the app.');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', `Could not navigate: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#FF6B6B', '#4ECDC4']} style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#FF6B6B', '#4ECDC4']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🔬</Text>
            <Text style={styles.title}>Praxiom Health</Text>
            <Text style={styles.version}>v1.0.0 - Emergency</Text>
          </View>

          <View style={styles.authContainer}>
            <Text style={styles.subtitle}>
              {isSettingUp ? 'Create Your PIN' : 'Enter Your PIN'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="4-digit PIN"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />

            {isSettingUp && (
              <TextInput
                style={styles.input}
                placeholder="Confirm PIN"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={confirmPin}
                onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            )}

            <TouchableOpacity
              style={[styles.button, {
                opacity: isSettingUp
                  ? (pin.length === 4 && confirmPin.length === 4 ? 1 : 0.5)
                  : (pin.length === 4 ? 1 : 0.5)
              }]}
              onPress={isSettingUp ? setupPin : authenticateWithPin}
              disabled={isSettingUp
                ? (pin.length !== 4 || confirmPin.length !== 4)
                : pin.length !== 4}
            >
              <Text style={styles.buttonText}>
                {isSettingUp ? 'Set PIN' : 'Unlock'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetText}>Reset PIN</Text>
            </TouchableOpacity>

            {/* Debug info */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Emergency Mode | PIN: {pin.length}/4 | Setup: {isSettingUp ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  authContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  resetText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
  },
  debugText: {
    color: '#FFD700',
    fontSize: 12,
    textAlign: 'center',
  },
});

