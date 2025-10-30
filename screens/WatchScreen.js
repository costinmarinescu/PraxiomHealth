import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const WatchScreen = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [watchData, setWatchData] = useState({
    battery: 85,
    heartRate: 72,
    steps: 5234,
    lastSync: new Date()
  });

  const handleConnect = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsConnected(true);
      Alert.alert('Success', 'Connected to Praxiom Watch');
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    Alert.alert('Disconnected', 'Watch disconnected');
  };

  const handleSync = () => {
    Alert.alert('Syncing', 'Syncing health data with watch...');
    setWatchData({
      ...watchData,
      lastSync: new Date()
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>
        <Text style={styles.headerSubtitle}>Watch Connection</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Watch Connection Card */}
        <View style={styles.card}>
          <View style={styles.watchIconContainer}>
            <Ionicons 
              name="watch" 
              size={80} 
              color={isConnected ? '#00CFC1' : '#CCC'} 
            />
            {isConnected && (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
              </View>
            )}
          </View>
          
          <Text style={styles.watchTitle}>
            {isConnected ? 'PineTime Connected' : 'Not Connected'}
          </Text>
          
          {!isConnected ? (
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="bluetooth" size={20} color="white" />
                  <Text style={styles.buttonText}>Connect Watch</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.syncButton]}
                onPress={handleSync}
              >
                <Ionicons name="sync" size={20} color="white" />
                <Text style={styles.buttonText}>Sync Data</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.disconnectButton]}
                onPress={handleDisconnect}
              >
                <Ionicons name="close-circle" size={20} color="white" />
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Watch Data Cards */}
        {isConnected && (
          <>
            <Text style={styles.sectionTitle}>Watch Data</Text>
            
            <View style={styles.dataRow}>
              <View style={styles.dataCard}>
                <Ionicons name="battery-charging" size={32} color="#3498DB" />
                <Text style={styles.dataValue}>{watchData.battery}%</Text>
                <Text style={styles.dataLabel}>Battery</Text>
              </View>
              
              <View style={styles.dataCard}>
                <Ionicons name="heart" size={32} color="#E74C3C" />
                <Text style={styles.dataValue}>{watchData.heartRate}</Text>
                <Text style={styles.dataLabel}>BPM</Text>
              </View>
            </View>

            <View style={styles.dataRow}>
              <View style={styles.dataCard}>
                <Ionicons name="footsteps" size={32} color="#9B59B6" />
                <Text style={styles.dataValue}>{watchData.steps}</Text>
                <Text style={styles.dataLabel}>Steps</Text>
              </View>
              
              <View style={styles.dataCard}>
                <Ionicons name="time" size={32} color="#F39C12" />
                <Text style={styles.dataValue}>
                  {watchData.lastSync.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <Text style={styles.dataLabel}>Last Sync</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 18,
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  watchIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  connectedBadge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  watchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: '#00CFC1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
    minWidth: 200,
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  syncButton: {
    backgroundColor: '#3498DB',
  },
  disconnectButton: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dataCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default WatchScreen;
