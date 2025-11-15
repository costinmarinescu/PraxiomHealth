import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WearableService from '../services/WearableService';

const TestScreen = () => {
  const [testAge, setTestAge] = useState('59.3');
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [transmissionLog, setTransmissionLog] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    const status = WearableService.getConnectionStatus();
    setIsConnected(status.isConnected);
    setDeviceInfo(status);
    setTransmissionLog(WearableService.getTransmissionLog());
  };

  const handleSendTestAge = async () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect to your watch first');
      return;
    }

    const age = parseFloat(testAge);
    if (isNaN(age) || age < 0 || age > 150) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 0 and 150');
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const result = await WearableService.sendTestAge(age);
      setLastResult({ success: true, ...result });
      Alert.alert(
        'Success!',
        `Bio-Age ${age} years sent to watch.\n\nCheck your watch display to verify it updated.`
      );
    } catch (error) {
      setLastResult({ success: false, error: error.message });
      Alert.alert('Transmission Failed', error.message);
    } finally {
      setIsSending(false);
      updateStatus();
    }
  };

  const handleSendCurrentAge = async (age) => {
    setTestAge(age.toString());
    setIsSending(true);
    
    try {
      const result = await WearableService.sendTestAge(age);
      setLastResult({ success: true, ...result });
      Alert.alert('Sent', `Age ${age} sent to watch`);
    } catch (error) {
      setLastResult({ success: false, error: error.message });
      Alert.alert('Failed', error.message);
    } finally {
      setIsSending(false);
      updateStatus();
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FDC830', '#37B7C3', '#088395']}
      style={styles.gradient}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Watch Test Mode</Text>

        {/* Connection Status */}
        <View style={[
          styles.card,
          { backgroundColor: isConnected ? '#C8E6C9' : '#FFCDD2' }
        ]}>
          <Text style={styles.cardTitle}>
            {isConnected ? '✅ Connected' : '❌ Not Connected'}
          </Text>
          {deviceInfo?.deviceName && (
            <>
              <Text style={styles.cardText}>Device: {deviceInfo.deviceName}</Text>
              <Text style={styles.cardText}>ID: {deviceInfo.deviceId}</Text>
            </>
          )}
        </View>

        {/* Manual Age Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send Test Age</Text>
          <Text style={styles.label}>Enter test age value:</Text>
          <TextInput
            style={styles.input}
            value={testAge}
            onChangeText={setTestAge}
            keyboardType="decimal-pad"
            placeholder="e.g., 59.3"
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.button,
              !isConnected && styles.buttonDisabled
            ]}
            onPress={handleSendTestAge}
            disabled={!isConnected || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                📤 Send to Watch
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Test Values */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Test Values</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.quickButton, !isConnected && styles.buttonDisabled]}
              onPress={() => handleSendCurrentAge(30)}
              disabled={!isConnected || isSending}
            >
              <Text style={styles.quickButtonText}>30</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, !isConnected && styles.buttonDisabled]}
              onPress={() => handleSendCurrentAge(50)}
              disabled={!isConnected || isSending}
            >
              <Text style={styles.quickButtonText}>50</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, !isConnected && styles.buttonDisabled]}
              onPress={() => handleSendCurrentAge(70)}
              disabled={!isConnected || isSending}
            >
              <Text style={styles.quickButtonText}>70</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            Tap a number to quickly send that age to your watch
          </Text>
        </View>

        {/* Last Result */}
        {lastResult && (
          <View style={[
            styles.card,
            { backgroundColor: lastResult.success ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <Text style={styles.cardTitle}>Last Transmission</Text>
            {lastResult.success ? (
              <>
                <Text style={styles.resultText}>✅ Success!</Text>
                <Text style={styles.cardText}>
                  Age Sent: {lastResult.bioAge} years
                </Text>
                <Text style={styles.helpText}>
                  Check your watch to verify the display updated
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.resultText}>❌ Failed</Text>
                <Text style={styles.errorText}>{lastResult.error}</Text>
              </>
            )}
          </View>
        )}

        {/* Transmission Log */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transmission Log</Text>
          <ScrollView style={styles.logContainer}>
            {transmissionLog.map((entry, index) => (
              <Text key={index} style={styles.logText}>
                {entry}
              </Text>
            ))}
            {transmissionLog.length === 0 && (
              <Text style={styles.helpText}>No transmissions yet</Text>
            )}
          </ScrollView>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 How to Test</Text>
          <Text style={styles.instructionText}>
            1. Make sure your watch is connected{'\n'}
            2. Enter a test age value (or use quick buttons){'\n'}
            3. Tap "Send to Watch"{'\n'}
            4. Look at your watch - the Praxiom Age should update{'\n'}
            5. Check the transmission log for details
          </Text>
          <Text style={styles.helpText}>
            {'\n'}If the age doesn't update on your watch, there may be a firmware issue.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#34495E',
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#088395',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  quickButton: {
    backgroundColor: '#37B7C3',
    borderRadius: 10,
    padding: 15,
    width: 80,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginTop: 5,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2C3E50',
  },
  errorText: {
    fontSize: 13,
    color: '#E74C3C',
    fontFamily: 'monospace',
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    fontSize: 10,
    color: '#2C3E50',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 14,
    color: '#34495E',
    lineHeight: 22,
  },
});

export default TestScreen;
