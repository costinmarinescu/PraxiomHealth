import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();

export default function DashboardScreen() {
  // State management
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01'); // Should be set from settings
  const [praxiomAge, setPraxiomAge] = useState(40.2);
  const [oralHealthScore, setOralHealthScore] = useState(96);
  const [systemicHealthScore, setSystemicHealthScore] = useState(100);
  const [fitnessScore, setFitnessScore] = useState(99);
  const [liveWatchData, setLiveWatchData] = useState({
    steps: '--',
    hr: '--',
    o2: '--',
  });
  
  const [lastUpdated, setLastUpdated] = useState({
    oral: null,
    systemic: null,
  });
  
  const [isReceivingData, setIsReceivingData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);

  // Calculate chronological age
  const calculateChronologicalAge = () => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const chronologicalAge = calculateChronologicalAge();

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
    setupBLEConnection();
    
    return () => {
      bleManager.destroy();
    };
  }, []);

  const loadSavedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('biomarkers_history');
      if (savedData) {
        const data = JSON.parse(savedData);
        const latest = data[data.length - 1];
        
        if (latest) {
          setOralHealthScore(latest.oralHealth || 96);
          setSystemicHealthScore(latest.systemicHealth || 100);
          setFitnessScore(latest.fitnessScore || 99);
          setPraxiomAge(latest.praxiomAge || 40.2);
          setLastUpdated({
            oral: latest.oralUpdated || null,
            systemic: latest.systemicUpdated || null,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveBiomarkerData = async (newData) => {
    try {
      const savedData = await AsyncStorage.getItem('biomarkers_history');
      const history = savedData ? JSON.parse(savedData) : [];
      
      const dataWithTimestamp = {
        ...newData,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
      };
      
      history.push(dataWithTimestamp);
      await AsyncStorage.setItem('biomarkers_history', JSON.stringify(history));
      
      setLastUpdated({
        oral: newData.oralUpdated || new Date().toISOString(),
        systemic: newData.systemicUpdated || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const setupBLEConnection = async () => {
    try {
      const state = await bleManager.state();
      if (state !== 'PoweredOn') {
        Alert.alert('Bluetooth', 'Please enable Bluetooth to connect to your watch');
        return;
      }

      // Scan for PineTime watch
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        // Look for PineTime or InfiniTime device
        if (device && (device.name === 'InfiniTime' || device.name === 'PineTime')) {
          bleManager.stopDeviceScan();
          connectToDevice(device);
        }
      });
    } catch (error) {
      console.error('BLE setup error:', error);
    }
  };

  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      setConnectedDevice(connected);
      
      // Discover services and characteristics
      await connected.discoverAllServicesAndCharacteristics();
      
      // Monitor for incoming data
      monitorWatchData(connected);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const monitorWatchData = (device) => {
    // This is a placeholder - you'll need to implement based on your watch's BLE services
    // Example service UUID for health data
    const HEALTH_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
    const HEART_RATE_CHAR_UUID = '00002a37-0000-1000-8000-00805f9b34fb';
    
    setIsReceivingData(true);
    
    // Simulate receiving data (replace with actual BLE monitoring)
    const interval = setInterval(() => {
      setLiveWatchData({
        steps: Math.floor(Math.random() * 10000),
        hr: Math.floor(60 + Math.random() * 40),
        o2: Math.floor(95 + Math.random() * 5),
      });
    }, 5000);

    return () => clearInterval(interval);
  };

  const pushPraxiomAgeToWatch = async () => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to your PineTime watch first');
      return;
    }

    setIsSyncing(true);

    try {
      // Service UUID for Praxiom custom service
      const PRAXIOM_SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';
      const BIO_AGE_CHAR_UUID = '00001235-0000-1000-8000-00805f9b34fb';

      // Convert praxiom age to bytes
      const ageBytes = new Uint8Array([
        Math.floor(praxiomAge),
        Math.floor((praxiomAge % 1) * 10)
      ]);
      
      const base64Age = btoa(String.fromCharCode(...ageBytes));

      await connectedDevice.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        BIO_AGE_CHAR_UUID,
        base64Age
      );

      setIsSyncing(false);
      Alert.alert(
        'Success',
        `Praxiom Age ${praxiomAge} pushed to watch successfully!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setIsSyncing(false);
      Alert.alert('Sync Failed', 'Could not sync to watch. Please try again.');
      console.error('Push error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <LinearGradient
      colors={['rgba(50, 50, 60, 1)', 'rgba(20, 20, 30, 1)']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo and Title */}
        <View style={styles.header}>
          <Image
            source={require('../assets/Logo-BW.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Praxiom Health</Text>
          {isReceivingData && (
            <View style={styles.dataIndicator}>
              <View style={styles.pulsingDot} />
              <Text style={styles.dataIndicatorText}>Live</Text>
            </View>
          )}
        </View>

        {/* Praxiom Age Card - Top Priority */}
        <View style={styles.praxiomAgeCard}>
          <Text style={styles.cardTitle}>Praxiom Age</Text>
          <View style={styles.ageContainer}>
            <Text style={styles.mainAge}>{praxiomAge}</Text>
            <Text style={styles.ageLabel}>years</Text>
          </View>
          <View style={styles.chronologicalAgeRow}>
            <Text style={styles.chronoLabel}>Chronological Age:</Text>
            <Text style={styles.chronoValue}>{chronologicalAge} years</Text>
          </View>
        </View>

        {/* Sync Button */}
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={pushPraxiomAgeToWatch}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.syncButtonText}>⌚ Push to Watch</Text>
              {connectedDevice && (
                <Text style={styles.connectedText}>Connected ✓</Text>
              )}
            </>
          )}
        </TouchableOpacity>

        {/* Health Score Cards - Equal Size Grid */}
        <View style={styles.gridContainer}>
          {/* Oral Health */}
          <View style={styles.equalCard}>
            <Text style={styles.cardIcon}>🦷</Text>
            <Text style={styles.cardLabel}>Oral Health</Text>
            <Text style={styles.cardScore}>{oralHealthScore}</Text>
            <Text style={styles.cardPercent}>{oralHealthScore}%</Text>
            <Text style={styles.lastUpdated}>
              {lastUpdated.oral ? `Updated ${formatDate(lastUpdated.oral)}` : 'No data'}
            </Text>
          </View>

          {/* Systemic Health */}
          <View style={styles.equalCard}>
            <Text style={styles.cardIcon}>❤️</Text>
            <Text style={styles.cardLabel}>Systemic Health</Text>
            <Text style={styles.cardScore}>{systemicHealthScore}</Text>
            <Text style={styles.cardPercent}>{systemicHealthScore}%</Text>
            <Text style={styles.lastUpdated}>
              {lastUpdated.systemic ? `Updated ${formatDate(lastUpdated.systemic)}` : 'No data'}
            </Text>
          </View>

          {/* Fitness Score */}
          <View style={styles.equalCard}>
            <Text style={styles.cardIcon}>💪</Text>
            <Text style={styles.cardLabel}>Fitness Score</Text>
            <Text style={styles.cardScore}>{fitnessScore}</Text>
            <Text style={styles.cardPercent}>{fitnessScore}%</Text>
            <Text style={styles.lastUpdated}>Daily tracking</Text>
          </View>

          {/* Live Watch Data */}
          <View style={styles.equalCard}>
            <Text style={styles.cardIcon}>⌚</Text>
            <Text style={styles.cardLabel}>Live Watch</Text>
            <View style={styles.liveDataContainer}>
              <View style={styles.liveDataRow}>
                <Text style={styles.liveDataLabel}>Steps</Text>
                <Text style={styles.liveDataValue}>{liveWatchData.steps}</Text>
              </View>
              <View style={styles.liveDataRow}>
                <Text style={styles.liveDataLabel}>HR</Text>
                <Text style={styles.liveDataValue}>{liveWatchData.hr}</Text>
              </View>
              <View style={styles.liveDataRow}>
                <Text style={styles.liveDataLabel}>O₂</Text>
                <Text style={styles.liveDataValue}>{liveWatchData.o2}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>🧬</Text>
            <Text style={styles.actionButtonText}>DNA Test</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonSecondary}>
            <Text style={styles.actionButtonIcon}>📝</Text>
            <Text style={styles.actionButtonTextSecondary}>Input Biomarkers</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={() => {
            // Calculate and save
            const newData = {
              oralHealth: oralHealthScore,
              systemicHealth: systemicHealthScore,
              fitnessScore: fitnessScore,
              praxiomAge: praxiomAge,
              oralUpdated: new Date().toISOString(),
              systemicUpdated: new Date().toISOString(),
            };
            saveBiomarkerData(newData);
            Alert.alert('Saved', 'Biomarker data saved successfully!');
          }}
        >
          <Text style={styles.calculateButtonText}>📊 Calculate Tier 1 Biomarkers</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 52, // Offset to center with logo on left
  },
  dataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 10,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00CFC1',
    marginRight: 6,
  },
  dataIndicatorText: {
    color: '#00CFC1',
    fontSize: 12,
    fontWeight: '600',
  },
  praxiomAgeCard: {
    backgroundColor: 'rgba(0, 207, 193, 0.15)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 207, 193, 0.3)',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  mainAge: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00CFC1',
    marginRight: 8,
  },
  ageLabel: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  chronologicalAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    justifyContent: 'center',
  },
  chronoLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginRight: 8,
  },
  chronoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  syncButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  connectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  equalCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 180,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    color: '#CCCCCC',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 2,
  },
  cardPercent: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 10,
    color: '#888888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  liveDataContainer: {
    width: '100%',
    marginTop: 8,
  },
  liveDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  liveDataLabel: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  liveDataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00CFC1',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#9B59B6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtonTextSecondary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
