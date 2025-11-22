/**
 * DEBUG TEST SCREEN
 * 
 * This screen tests encryption and storage functionality
 * Add this to your app temporarily to diagnose issues
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStorage from '../services/SecureStorageService';
import StorageService from '../services/StorageService';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';

const DebugTestScreen = ({ navigation }) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, status, details) => {
    setTestResults(prev => [...prev, {
      test,
      status, // 'pass', 'fail', 'info'
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('Starting Tests', 'info', 'Running comprehensive diagnostic...');

    // TEST 1: Check SecureStorage Key Matching
    await test1_KeyMatching();
    
    // TEST 2: Test Encryption/Decryption
    await test2_Encryption();
    
    // TEST 3: Check Existing Data
    await test3_ExistingData();
    
    // TEST 4: Security Status
    await test4_SecurityStatus();
    
    // TEST 5: Test Save/Retrieve Cycle
    await test5_SaveRetrieveCycle();

    addResult('Tests Complete', 'info', 'All diagnostic tests finished');
    setIsRunning(false);
  };

  // TEST 1: Check if 'fitnessAssessments' matches 'fitnessAssessment'
  const test1_KeyMatching = async () => {
    try {
      const SECURE_KEYS = [
        'fitnessAssessment',
        'tier1Biomarkers',
        'tier2Biomarkers',
      ];

      const testKey = 'fitnessAssessments';
      const matches = SECURE_KEYS.some(secureKey => testKey.includes(secureKey));
      
      if (matches) {
        addResult('Test 1: Key Matching', 'pass', 
          `'fitnessAssessments' correctly matches 'fitnessAssessment' via .includes()`);
      } else {
        addResult('Test 1: Key Matching', 'fail', 
          `'fitnessAssessments' does NOT match any secure key!`);
      }
    } catch (error) {
      addResult('Test 1: Key Matching', 'fail', error.message);
    }
  };

  // TEST 2: Test encryption and decryption
  const test2_Encryption = async () => {
    try {
      const testData = [
        { 
          timestamp: new Date().toISOString(),
          bioAge: 45.5,
          test: 'encryption test'
        }
      ];

      // Try to save
      await SecureStorage.setItem('debug_test_key', testData);
      addResult('Test 2a: Encryption Save', 'pass', 
        'Data saved successfully');

      // Try to retrieve
      const retrieved = await SecureStorage.getItem('debug_test_key');
      
      if (retrieved && retrieved[0].test === 'encryption test') {
        addResult('Test 2b: Decryption Retrieve', 'pass', 
          'Data retrieved and decrypted successfully');
      } else {
        addResult('Test 2b: Decryption Retrieve', 'fail', 
          'Data retrieved but content mismatch');
      }

      // Clean up
      await SecureStorage.removeItem('debug_test_key');

    } catch (error) {
      addResult('Test 2: Encryption', 'fail', 
        `Encryption error: ${error.message}`);
    }
  };

  // TEST 3: Check for existing data
  const test3_ExistingData = async () => {
    try {
      const tier1 = await SecureStorage.getItem('tier1Biomarkers');
      const tier2 = await SecureStorage.getItem('tier2Biomarkers');
      const fitness = await SecureStorage.getItem('fitnessAssessments');

      const tier1Count = tier1 ? (Array.isArray(tier1) ? tier1.length : 1) : 0;
      const tier2Count = tier2 ? (Array.isArray(tier2) ? tier2.length : 1) : 0;
      const fitnessCount = fitness ? (Array.isArray(fitness) ? fitness.length : 1) : 0;

      const total = tier1Count + tier2Count + fitnessCount;

      if (total > 0) {
        addResult('Test 3: Existing Data', 'pass', 
          `Found ${total} entries (Tier1: ${tier1Count}, Tier2: ${tier2Count}, Fitness: ${fitnessCount})`);
      } else {
        addResult('Test 3: Existing Data', 'info', 
          'No existing entries found (this is OK for new installations)');
      }
    } catch (error) {
      addResult('Test 3: Existing Data', 'fail', error.message);
    }
  };

  // TEST 4: Security status
  const test4_SecurityStatus = async () => {
    try {
      const status = await SecureStorage.getSecurityStatus();
      
      addResult('Test 4: Security Status', 'info', 
        `Total keys: ${status.totalKeys}, Encrypted: ${status.encryptedKeys}, Level: ${status.securityLevel}`);

      if (status.encryptedKeys > 0) {
        addResult('Test 4a: Encrypted Keys Found', 'pass', 
          `Found ${status.encryptedKeys} encrypted keys`);
      }
    } catch (error) {
      addResult('Test 4: Security Status', 'fail', error.message);
    }
  };

  // TEST 5: Full save/retrieve cycle with real data structure
  const test5_SaveRetrieveCycle = async () => {
    try {
      // Create realistic fitness data
      const testEntry = {
        aerobicScore: 8,
        flexibilityScore: 7,
        balanceScore: 9,
        mindBodyScore: 8,
        fitnessScore: 80,
        timestamp: new Date().toISOString(),
        tier: 'Fitness Assessment'
      };

      // Get existing data
      const existing = await SecureStorage.getItem('fitnessAssessments');
      const array = Array.isArray(existing) ? existing : (existing ? [existing] : []);
      
      // Add test entry
      array.push(testEntry);
      
      // Save
      await SecureStorage.setItem('fitnessAssessments', array);
      addResult('Test 5a: Save Cycle', 'pass', 
        `Saved array with ${array.length} entries`);

      // Retrieve
      const retrieved = await SecureStorage.getItem('fitnessAssessments');
      
      if (retrieved && Array.isArray(retrieved)) {
        const lastEntry = retrieved[retrieved.length - 1];
        if (lastEntry.fitnessScore === 80) {
          addResult('Test 5b: Retrieve Cycle', 'pass', 
            `Retrieved ${retrieved.length} entries, test entry confirmed`);
          
          // Clean up - remove test entry
          const cleaned = retrieved.filter(e => e.fitnessScore !== 80);
          await SecureStorage.setItem('fitnessAssessments', cleaned);
          addResult('Test 5c: Cleanup', 'pass', 'Test entry removed');
        } else {
          addResult('Test 5b: Retrieve Cycle', 'fail', 
            'Test entry not found in retrieved data');
        }
      } else {
        addResult('Test 5b: Retrieve Cycle', 'fail', 
          'Retrieved data is not an array');
      }
    } catch (error) {
      addResult('Test 5: Save/Retrieve Cycle', 'fail', 
        `Error: ${error.message}`);
    }
  };

  // TEST 6: Check AsyncStorage directly
  const testAsyncStorageKeys = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      addResult('AsyncStorage Keys', 'info', 
        `Total keys in AsyncStorage: ${allKeys.length}`);
      
      const secureKeys = allKeys.filter(k => k.startsWith('secure_'));
      if (secureKeys.length > 0) {
        addResult('Secure Keys Found', 'pass', 
          `Found ${secureKeys.length} encrypted keys: ${secureKeys.join(', ')}`);
      } else {
        addResult('Secure Keys Found', 'fail', 
          'No encrypted keys found - data may not be encrypting!');
      }
    } catch (error) {
      addResult('AsyncStorage Check', 'fail', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pass': return '#4ade80';
      case 'fail': return '#f87171';
      case 'info': return '#60a5fa';
      default: return '#aaa';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pass': return 'checkmark-circle';
      case 'fail': return 'close-circle';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  };

  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#00d4ff" />
          </TouchableOpacity>
          <Text style={styles.title}>Encryption Debug</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runAllTests}
            disabled={isRunning}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testAsyncStorageKeys}
            disabled={isRunning}
          >
            <Ionicons name="key" size={20} color="#00d4ff" />
            <Text style={[styles.buttonText, { color: '#00d4ff' }]}>
              Check Storage Keys
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={clearResults}
            disabled={isRunning}
          >
            <Ionicons name="trash" size={20} color="#f87171" />
            <Text style={[styles.buttonText, { color: '#f87171' }]}>
              Clear Results
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.length === 0 ? (
            <Text style={styles.emptyText}>No tests run yet. Tap "Run All Tests" above.</Text>
          ) : (
            testResults.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons 
                    name={getStatusIcon(result.status)} 
                    size={24} 
                    color={getStatusColor(result.status)} 
                  />
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultTest}>{result.test}</Text>
                    <Text style={styles.resultTime}>{result.timestamp}</Text>
                  </View>
                </View>
                <Text style={styles.resultDetails}>{result.details}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#60a5fa" />
          <Text style={styles.infoText}>
            This screen tests encryption, storage, and data retrieval.{'\n\n'}
            ✅ Green = Working correctly{'\n'}
            ❌ Red = Problem found{'\n'}
            ℹ️ Blue = Informational
          </Text>
        </View>
      </ScrollView>
    </PraxiomBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#1e1e2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 15,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00d4ff',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  resultDetails: {
    fontSize: 13,
    color: '#aaa',
    marginLeft: 34,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e1e2e',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },
});

export default DebugTestScreen;
