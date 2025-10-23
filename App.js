import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Button, ScrollView, Alert, 
  PermissionsAndroid, Platform, TextInput, TouchableOpacity 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BleManager } from 'react-native-ble-plx';

export default function App() {
  const [bleManager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('connection'); // 'connection', 'input', 'dashboard'
  
  // Biomarker data
  const [biomarkers, setBiomarkers] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    bloodGlucose: '',
    oxygenSaturation: '',
    temperature: '',
    weight: '',
    steps: '',
  });

  const [healthReport, setHealthReport] = useState(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      bleManager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
    }
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    const state = await bleManager.state();
    
    if (state !== 'PoweredOn') {
      Alert.alert('Bluetooth Off', 'Please enable Bluetooth');
      setIsScanning(false);
      return;
    }

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        const pineTimeNames = ['InfiniTime', 'Pinetime', 'PineTime', 'DFU'];
        if (pineTimeNames.some(name => device.name.includes(name))) {
          bleManager.stopDeviceScan();
          setIsScanning(false);
          connectToDevice(device);
        }
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  };

  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      Alert.alert('Connected!', `Connected to ${device.name}. You can now track your health data.`);
      setCurrentScreen('input');
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
    }
  };

  const disconnect = () => {
    if (connectedDevice) {
      connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setCurrentScreen('connection');
      Alert.alert('Disconnected', 'Device disconnected');
    }
  };

  const updateBiomarker = (key, value) => {
    setBiomarkers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const calculateHealthReport = () => {
    const systolic = parseFloat(biomarkers.bloodPressureSystolic) || 0;
    const diastolic = parseFloat(biomarkers.bloodPressureDiastolic) || 0;
    const heartRate = parseFloat(biomarkers.heartRate) || 0;
    const glucose = parseFloat(biomarkers.bloodGlucose) || 0;
    const oxygen = parseFloat(biomarkers.oxygenSaturation) || 0;
    const temp = parseFloat(biomarkers.temperature) || 0;
    const weight = parseFloat(biomarkers.weight) || 0;
    const steps = parseFloat(biomarkers.steps) || 0;

    // Health Score Algorithm (0-100)
    let healthScore = 100;
    let warnings = [];
    let recommendations = [];

    // Blood Pressure Analysis
    if (systolic > 0 && diastolic > 0) {
      if (systolic >= 140 || diastolic >= 90) {
        healthScore -= 20;
        warnings.push('High Blood Pressure Detected');
        recommendations.push('Consult your doctor about blood pressure management');
      } else if (systolic < 90 || diastolic < 60) {
        healthScore -= 15;
        warnings.push('Low Blood Pressure Detected');
      } else if (systolic >= 120 && systolic < 140) {
        healthScore -= 5;
        recommendations.push('Monitor blood pressure regularly');
      }
    }

    // Heart Rate Analysis
    if (heartRate > 0) {
      if (heartRate > 100) {
        healthScore -= 15;
        warnings.push('Elevated Heart Rate');
        recommendations.push('Consider stress management techniques');
      } else if (heartRate < 60) {
        healthScore -= 10;
        warnings.push('Low Heart Rate');
      }
    }

    // Blood Glucose Analysis
    if (glucose > 0) {
      if (glucose > 140) {
        healthScore -= 20;
        warnings.push('High Blood Sugar');
        recommendations.push('Monitor glucose levels and consider dietary changes');
      } else if (glucose < 70) {
        healthScore -= 15;
        warnings.push('Low Blood Sugar');
        recommendations.push('Consume complex carbohydrates');
      }
    }

    // Oxygen Saturation Analysis
    if (oxygen > 0) {
      if (oxygen < 95) {
        healthScore -= 25;
        warnings.push('Low Oxygen Saturation');
        recommendations.push('Seek immediate medical attention if persistent');
      }
    }

    // Temperature Analysis
    if (temp > 0) {
      if (temp > 38) {
        healthScore -= 15;
        warnings.push('Fever Detected');
        recommendations.push('Rest and hydrate, consult doctor if persistent');
      } else if (temp < 36) {
        healthScore -= 10;
        warnings.push('Low Body Temperature');
      }
    }

    // Activity Analysis
    if (steps > 0 && steps < 5000) {
      healthScore -= 10;
      recommendations.push('Increase daily physical activity (aim for 10,000 steps)');
    }

    // Ensure score stays within bounds
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Generate status
    let status = 'Excellent';
    let statusColor = '#4CAF50';
    if (healthScore < 50) {
      status = 'Needs Attention';
      statusColor = '#f44336';
    } else if (healthScore < 70) {
      status = 'Fair';
      statusColor = '#FF9800';
    } else if (healthScore < 85) {
      status = 'Good';
      statusColor = '#2196F3';
    }

    if (warnings.length === 0) {
      warnings.push('No immediate concerns detected');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain your current healthy lifestyle');
      recommendations.push('Continue regular monitoring');
    }

    const report = {
      healthScore,
      status,
      statusColor,
      warnings,
      recommendations,
      timestamp: new Date().toLocaleString(),
      metrics: {
        bloodPressure: systolic && diastolic ? `${systolic}/${diastolic}` : 'Not recorded',
        heartRate: heartRate ? `${heartRate} bpm` : 'Not recorded',
        bloodGlucose: glucose ? `${glucose} mg/dL` : 'Not recorded',
        oxygenSaturation: oxygen ? `${oxygen}%` : 'Not recorded',
        temperature: temp ? `${temp}°C` : 'Not recorded',
        weight: weight ? `${weight} kg` : 'Not recorded',
        steps: steps ? `${steps} steps` : 'Not recorded',
      }
    };

    setHealthReport(report);
    setCurrentScreen('dashboard');
  };

  // Connection Screen
  if (currentScreen === 'connection') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Praxiom Health</Text>
        <Text style={styles.subtitle}>Connect Your PineTime Watch</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Status: {connectedDevice ? '✓ Connected' : '○ Not Connected'}
          </Text>
          {connectedDevice && (
            <Text style={styles.deviceName}>Device: {connectedDevice.name}</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!connectedDevice ? (
            <Button
              title={isScanning ? "Scanning..." : "Scan for PineTime"}
              onPress={scanForDevices}
              disabled={isScanning}
              color="#FFA500"
            />
          ) : (
            <>
              <Button
                title="Continue to Health Tracking"
                onPress={() => setCurrentScreen('input')}
                color="#4CAF50"
              />
              <View style={{height: 10}} />
              <Button
                title="Disconnect"
                onPress={disconnect}
                color="#f44336"
              />
            </>
          )}
        </View>

        <Text style={styles.infoText}>
          Connect your PineTime smartwatch to track your health metrics and receive personalized health insights.
        </Text>

        <StatusBar style="auto" />
      </View>
    );
  }

  // Biomarker Input Screen
  if (currentScreen === 'input') {
    return (
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Health Data Input</Text>
          <Text style={styles.subtitle}>Enter Your Biomarkers</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Pressure (Systolic)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 120"
                keyboardType="numeric"
                value={biomarkers.bloodPressureSystolic}
                onChangeText={(value) => updateBiomarker('bloodPressureSystolic', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Pressure (Diastolic)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 80"
                keyboardType="numeric"
                value={biomarkers.bloodPressureDiastolic}
                onChangeText={(value) => updateBiomarker('bloodPressureDiastolic', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 72"
                keyboardType="numeric"
                value={biomarkers.heartRate}
                onChangeText={(value) => updateBiomarker('heartRate', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Glucose (mg/dL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 95"
                keyboardType="numeric"
                value={biomarkers.bloodGlucose}
                onChangeText={(value) => updateBiomarker('bloodGlucose', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Oxygen Saturation (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 98"
                keyboardType="numeric"
                value={biomarkers.oxygenSaturation}
                onChangeText={(value) => updateBiomarker('oxygenSaturation', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Body Temperature (°C)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 37.0"
                keyboardType="numeric"
                value={biomarkers.temperature}
                onChangeText={(value) => updateBiomarker('temperature', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 70"
                keyboardType="numeric"
                value={biomarkers.weight}
                onChangeText={(value) => updateBiomarker('weight', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Steps Today</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 8500"
                keyboardType="numeric"
                value={biomarkers.steps}
                onChangeText={(value) => updateBiomarker('steps', value)}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.generateButton}
            onPress={calculateHealthReport}
          >
            <Text style={styles.generateButtonText}>Generate Health Report</Text>
          </TouchableOpacity>

          <Button
            title="Back to Connection"
            onPress={() => setCurrentScreen('connection')}
            color="#666"
          />

          <StatusBar style="auto" />
        </View>
      </ScrollView>
    );
  }

  // Dashboard/Report Screen
  if (currentScreen === 'dashboard' && healthReport) {
    return (
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Health Report</Text>
          <Text style={styles.subtitle}>{healthReport.timestamp}</Text>

          <View style={[styles.scoreContainer, {backgroundColor: healthReport.statusColor}]}>
            <Text style={styles.scoreLabel}>Health Score</Text>
            <Text style={styles.scoreValue}>{healthReport.healthScore}/100</Text>
            <Text style={styles.scoreStatus}>{healthReport.status}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Your Metrics</Text>
            {Object.entries(healthReport.metrics).map(([key, value]) => (
              <View key={key} style={styles.metricRow}>
                <Text style={styles.metricLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </Text>
                <Text style={styles.metricValue}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Warnings</Text>
            {healthReport.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Recommendations</Text>
            {healthReport.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>• {rec}</Text>
            ))}
          </View>

          <View style={styles.buttonGroup}>
            <Button
              title="Update Data"
              onPress={() => setCurrentScreen('input')}
              color="#FFA500"
            />
            <View style={{height: 10}} />
            <Button
              title="Back to Connection"
              onPress={() => setCurrentScreen('connection')}
              color="#666"
            />
          </View>

          <StatusBar style="auto" />
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  deviceName: {
    fontSize: 14,
    color: '#FFA500',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  generateButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreContainer: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  scoreStatus: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  warningText: {
    fontSize: 14,
    color: '#f44336',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationText: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonGroup: {
    marginTop: 10,
    marginBottom: 30,
  },
});
