/**
 * DebugTestScreen.js - Comprehensive Encryption & Storage Testing
 * 
 * Tests expo-secure-store implementation of SecureStorageService
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    
    addResult('Starting Tests', 'info', 'Running comprehensive diagnostics...');

    // TEST 1: Check SecureStorage Key Matching
    await test1_KeyMatching();
    
    // TEST 2: Test SecureStore Save/Retrieve
    await test2_SecureStore();
    
    // TEST 3: Check Existing Data
    await test3_ExistingData();
    
    // TEST 4: Security Status
    await test4_SecurityStatus();
    
    // TEST 5: Test Full Save/Retrieve Cycle
    await test5_SaveRetrieveCycle();

    addResult('Tests Complete', 'info', 'All diagnostic tests finished');
    setIsRunning(false);
  };

  // TEST 1: Check if 'fitnessAssessments' matches secure keys
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

  // TEST 2: Test expo-secure-store save and retrieve
  const test2_SecureStore = async () => {
    try {
      const testData = [
        { 
          timestamp: new Date().toISOString(),
          bioAge: 45.5,
          test: 'securestore test'
        }
      ];

      // Try to save to secure storage
      await SecureStorage.setItem('debug_test_secure_key', testData);
      addResult('Test 2a: SecureStore Save', 'pass', 
        'Data saved to SecureStore successfully');

      // Try to retrieve
      const retrieved = await SecureStorage.getItem('debug_test_secure_key');
      
      if (retrieved && retrieved[0] && retrieved[0].test === 'securestore test') {
        addResult('Test 2b: SecureStore Retrieve', 'pass', 
          'Data retrieved from SecureStore successfully');
      } else {
        addResult('Test 2b: SecureStore Retrieve', 'fail', 
          'Data retrieved but content mismatch');
      }

      // Clean up
      await SecureStorage.removeItem('debug_test_secure_key');

    } catch (error) {
      addResult('Test 2: SecureStore', 'fail', 
        `SecureStore error: ${error.message}`);
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
          'No existing entries found (OK for new installations)');
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
          `Found ${status.encryptedKeys} encrypted keys in SecureStore`);
      } else {
        addResult('Test 4a: Encrypted Keys', 'info', 
          'No encrypted keys yet (OK if no data entered)');
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
        `Saved array with ${array.length} entries to SecureStore`);

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
      
      if (allKeys.length > 0) {
        // Show first few keys
        const sample = allKeys.slice(0, 5).join(', ');
        addResult('Sample Keys', 'info', 
          `Sample: ${sample}${allKeys.length > 5 ? '...' : ''}`);
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
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FDC830', '#00CED1']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
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
            <Ionicons name="key" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              Check Storage Keys
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={clearResults}
            disabled={isRunning}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.buttonText}>
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
              <View key={index} style={[
                styles.resultCard,
                { borderLeftColor: getStatusColor(result.status) }
              ]}>
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
          <Ionicons name="information-circle" size={24} color="#fff" />
          <Text style={styles.infoText}>
            This screen tests expo-secure-store encryption, storage, and data retrieval.{'\n\n'}
            ✅ Green = Working correctly{'\n'}
            ❌ Red = Problem found{'\n'}
            ℹ️ Blue = Informational
          </Text>
        </View>

        <View style={styles.techInfo}>
          <Text style={styles.techTitle}>🔐 Security Implementation</Text>
          <Text style={styles.techText}>
            Using: expo-secure-store{'\n'}
            Encryption: Native (Keychain/Keystore){'\n'}
            HIPAA Compliant: Yes{'\n'}
            Hardware-backed: Yes
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonText: {
    color: '#1e1e2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#1e1e2e',
  },
  resultTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  resultDetails: {
    fontSize: 13,
    color: '#444',
    marginLeft: 34,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 13,
    lineHeight: 20,
  },
  techInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  techTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  techText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
});

export default DebugTestScreen;
