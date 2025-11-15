/**
 * PRAXIOM AGE BLE TEST DIAGNOSTIC
 * 
 * This file helps diagnose why Praxiom Age isn't displaying on the watch.
 * 
 * HOW TO USE:
 * 1. Add this as a screen in your mobile app
 * 2. Connect to your watch
 * 3. Click "Send Test Age" to send a hardcoded value
 * 4. Watch the logs to see what happens
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const PraxiomAgeBLETest = () => {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [deviceId, setDeviceId] = useState(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
    console.log(message);
  };

  // BLE Service and Characteristic UUIDs
  const PRAXIOM_SERVICE = '00001900-78fc-48fe-8e23-433b3a1942d0';
  const BIO_AGE_CHAR = '00001901-78fc-48fe-8e23-433b3a1942d0';

  const bleManager = new BleManager();

  const scanAndConnect = async () => {
    try {
      addLog('🔍 Starting scan for PineTime...');
      
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          addLog(`❌ Scan error: ${error.message}`);
          return;
        }

        if (device && device.name && 
            (device.name.includes('InfiniTime') || device.name.includes('Pinetime'))) {
          addLog(`✅ Found device: ${device.name} (${device.id})`);
          bleManager.stopDeviceScan();
          connectToDevice(device);
        }
      });
    } catch (error) {
      addLog(`❌ Error starting scan: ${error.message}`);
    }
  };

  const connectToDevice = async (device) => {
    try {
      addLog(`🔗 Connecting to ${device.name}...`);
      
      const connected = await device.connect();
      addLog(`✅ Connected!`);
      
      addLog(`🔍 Discovering services...`);
      const deviceWithServices = await connected.discoverAllServicesAndCharacteristics();
      
      addLog(`✅ Services discovered`);
      setConnected(true);
      setDeviceId(deviceWithServices.id);
      
      // List all services
      const services = await deviceWithServices.services();
      addLog(`📋 Found ${services.length} services:`);
      services.forEach(service => {
        addLog(`   - ${service.uuid}`);
      });
      
      // Check if Praxiom service exists
      const praxiomService = services.find(s => s.uuid.toLowerCase() === PRAXIOM_SERVICE.toLowerCase());
      if (praxiomService) {
        addLog(`✅ Found Praxiom Service!`);
        
        // List characteristics
        const chars = await praxiomService.characteristics();
        addLog(`📋 Praxiom service has ${chars.length} characteristics:`);
        chars.forEach(char => {
          addLog(`   - ${char.uuid} (${char.isWritableWithoutResponse ? 'W' : ''}${char.isWritableWithResponse ? 'w' : ''}${char.isReadable ? 'R' : ''}${char.isNotifiable ? 'N' : ''})`);
        });
      } else {
        addLog(`❌ Praxiom Service NOT found!`);
        addLog(`   Expected: ${PRAXIOM_SERVICE}`);
      }
      
    } catch (error) {
      addLog(`❌ Connection error: ${error.message}`);
    }
  };

  const sendTestAge = async () => {
    if (!deviceId) {
      addLog('❌ No device connected');
      return;
    }

    try {
      const testAge = 42; // Test value
      addLog(`📤 Sending test age: ${testAge}`);
      
      // Convert age to 4-byte uint32 (little-endian)
      const buffer = new Uint8Array(4);
      buffer[0] = testAge & 0xFF;
      buffer[1] = (testAge >> 8) & 0xFF;
      buffer[2] = (testAge >> 16) & 0xFF;
      buffer[3] = (testAge >> 24) & 0xFF;
      
      // Convert to base64 (required by react-native-ble-plx)
      const base64Value = btoa(String.fromCharCode.apply(null, buffer));
      
      addLog(`   Raw bytes: [${Array.from(buffer).join(', ')}]`);
      addLog(`   Base64: ${base64Value}`);
      
      // Write to characteristic
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR,
        base64Value
      );
      
      addLog(`✅ Age sent successfully!`);
      addLog(`👀 Check your watch - it should now display: ${testAge}`);
      
    } catch (error) {
      addLog(`❌ Error sending age: ${error.message}`);
      addLog(`   This could mean:`);
      addLog(`   1. Watch firmware doesn't have Praxiom service`);
      addLog(`   2. Characteristic UUID is wrong`);
      addLog(`   3. Watch is not connected`);
    }
  };

  const readCurrentAge = async () => {
    if (!deviceId) {
      addLog('❌ No device connected');
      return;
    }

    try {
      addLog(`📥 Reading current age from watch...`);
      
      const characteristic = await bleManager.readCharacteristicForDevice(
        deviceId,
        PRAXIOM_SERVICE,
        BIO_AGE_CHAR
      );
      
      // Decode base64 to bytes
      const base64 = characteristic.value;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert little-endian uint32 to number
      const age = bytes[0] + (bytes[1] << 8) + (bytes[2] << 16) + (bytes[3] << 24);
      
      addLog(`✅ Watch currently shows: ${age}`);
      addLog(`   Raw bytes: [${Array.from(bytes).join(', ')}]`);
      
    } catch (error) {
      addLog(`❌ Error reading age: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Praxiom Age BLE Diagnostic</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, connected && styles.buttonDisabled]} 
          onPress={scanAndConnect}
          disabled={connected}
        >
          <Text style={styles.buttonText}>
            {connected ? '✅ Connected' : '🔍 Scan & Connect'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !connected && styles.buttonDisabled]} 
          onPress={sendTestAge}
          disabled={!connected}
        >
          <Text style={styles.buttonText}>📤 Send Test Age (42)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !connected && styles.buttonDisabled]} 
          onPress={readCurrentAge}
          disabled={!connected}
        >
          <Text style={styles.buttonText}>📥 Read Current Age</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={() => setLogs([])}
        >
          <Text style={styles.buttonText}>🗑️ Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.logTitle}>📋 Diagnostic Logs:</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
  },
  logText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
});

export default PraxiomAgeBLETest;
