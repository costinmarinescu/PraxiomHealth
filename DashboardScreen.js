import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
  const [healthData, setHealthData] = useState({
    bioAge: 38.5,
    oralHealth: 85,
    systemicHealth: 78,
    fitnessScore: 92
  });

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Data import feature will be added soon.\n\nSupported formats:\n• Garmin CSV\n• Fitbit CSV\n• Apple Health JSON',
      [{ text: 'OK' }]
    );
  };

  const handleSyncToWatch = () => {
    Alert.alert(
      'Sync to Watch',
      'Please connect to your Praxiom watch first from the Watch tab.',
      [
        { text: 'Cancel' },
        { text: 'Go to Watch', onPress: () => navigation.navigate('Watch') }
      ]
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#3BCEAC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PRAXIOM HEALTH</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => navigation.navigate('Watch')}
              >
                <Ionicons name="watch-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio-Age Card */}
          <View style={styles.bioAgeCard}>
            <Text style={styles.bioAgeLabel}>Your Bio-Age</Text>
            <Text style={styles.bioAgeValue}>{healthData.bioAge}</Text>
            <Text style={styles.bioAgeUnit}>years</Text>
          </View>

          {/* Health Scores */}
          <View style={styles.scoresContainer}>
            {/* Oral Health */}
            <View style={styles.scoreCard}>
              <Ionicons name="medkit" size={32} color="#FF6B35" />
              <Text style={styles.scoreLabel}>Oral Health</Text>
              <Text style={[
                styles.scoreValue,
                { color: getScoreColor(healthData.oralHealth) }
              ]}>
                {healthData.oralHealth}
              </Text>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreBarFill,
                    { 
                      width: `${healthData.oralHealth}%`,
                      backgroundColor: getScoreColor(healthData.oralHealth)
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Systemic Health */}
            <View style={styles.scoreCard}>
              <Ionicons name="heart" size={32} color="#F7931E" />
              <Text style={styles.scoreLabel}>Systemic Health</Text>
              <Text style={[
                styles.scoreValue,
                { color: getScoreColor(healthData.systemicHealth) }
              ]}>
                {healthData.systemicHealth}
              </Text>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreBarFill,
                    { 
                      width: `${healthData.systemicHealth}%`,
                      backgroundColor: getScoreColor(healthData.systemicHealth)
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Fitness Score - Centered */}
            <View style={[styles.scoreCard, styles.fitnessCard]}>
              <Ionicons name="fitness" size={32} color="#3BCEAC" />
              <Text style={styles.scoreLabel}>Fitness Score</Text>
              <Text style={[
                styles.scoreValue,
                { color: getScoreColor(healthData.fitnessScore) }
              ]}>
                {healthData.fitnessScore}
              </Text>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreBarFill,
                    { 
                      width: `${healthData.fitnessScore}%`,
                      backgroundColor: getScoreColor(healthData.fitnessScore)
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.importButton]}
              onPress={handleImportData}
            >
              <Ionicons name="download-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Import Data</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.syncButton]}
              onPress={handleSyncToWatch}
            >
              <Ionicons name="sync-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Sync to Watch</Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Connect to your Praxiom watch to sync health data
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    opacity: 0.95,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  bioAgeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bioAgeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bioAgeValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  bioAgeUnit: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  scoresContainer: {
    gap: 20,
    marginBottom: 30,
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fitnessCard: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  importButton: {
    backgroundColor: '#3BCEAC',
  },
  syncButton: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
});
