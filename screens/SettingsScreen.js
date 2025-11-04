import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import PraxiomBackground from '../components/PraxiomBackground';
import StorageService from '../services/StorageService';

const SettingsScreen = () => {
  const handleExportAll = async () => {
    try {
      const data = await StorageService.exportData();
      const json = JSON.stringify(data, null, 2);
      const filename = `praxiom_export_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Data exported to device storage');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all biomarker entries and cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportAll}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={24} color="#00d4ff" />
              <Text style={styles.settingText}>Export All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8e8e93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <Text style={styles.settingText}>Clear All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>PRAXIOM HEALTH</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.description}>
              Biological Age Assessment through Oral-Systemic Biomarker Analysis
            </Text>
          </View>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 15,
  },
  aboutCard: {
    backgroundColor: '#1e1e2e',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4ff',
    letterSpacing: 2,
  },
  version: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default SettingsScreen;
