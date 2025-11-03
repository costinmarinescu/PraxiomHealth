import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation, route }) => {
  const [healthData, setHealthData] = useState({
    oralHealth: 0,
    systemicHealth: 0,
    fitnessScore: 0,
    bioAge: 0,
    needsTier2: false,
    needsTier3: false,
    tier: 1
  });

  // Update health data when returning from biomarker input
  useEffect(() => {
    if (route.params?.bioAge) {
      setHealthData({
        bioAge: route.params.bioAge,
        oralHealth: route.params.oralHealth || 0,
        systemicHealth: route.params.systemicHealth || 0,
        fitnessScore: route.params.fitness || 0,
        needsTier2: route.params.needsTier2 || false,
        needsTier3: route.params.needsTier3 || false,
        inflammatoryScore: route.params.inflammatoryScore || 0,
        nadScore: route.params.nadScore || 0,
        wearableScore: route.params.wearableScore || 0,
        microbiomeRisk: route.params.microbiomeRisk || 0,
        tier: route.params.tier || 1
      });
    }
  }, [route.params]);

  const getHealthStatus = (score) => {
    if (score === 0) return { text: 'No Data', color: '#95A5A6' };
    if (score >= 90) return { text: 'Excellent', color: '#2ECC71' };
    if (score >= 75) return { text: 'Good', color: '#3498DB' };
    if (score >= 60) return { text: 'Fair', color: '#F39C12' };
    return { text: 'Poor', color: '#E74C3C' };
  };

  const CircularProgress = ({ score, title }) => {
    const status = getHealthStatus(score);

    return (
      <View style={styles.circularCard}>
        <View style={styles.circularProgressContainer}>
          <View style={styles.circularProgressOuter}>
            <View 
              style={[
                styles.circularProgressInner,
                { borderColor: status.color, borderWidth: 8 }
              ]}
            >
              <Text style={styles.scoreText}>{score}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PRAXIOM</Text>
          <Text style={styles.headerTitle}>HEALTH</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Watch')}
          >
            <Ionicons name="watch" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bio-Age Display */}
        <View style={styles.bioAgeContainer}>
          <Text style={styles.bioAgeLabel}>
            {healthData.tier === 2 ? 'Enhanced' : 'Your'} Praxiom Bio-Age
          </Text>
          <Text style={styles.bioAgeValue}>
            {healthData.bioAge > 0 ? `${healthData.bioAge}` : '--'}
          </Text>
          <Text style={styles.bioAgeUnit}>years</Text>
          {healthData.tier === 2 && (
            <Text style={styles.tierBadge}>TIER 2 ANALYSIS</Text>
          )}
        </View>

        {/* Health Scores */}
        <View style={styles.scoresRow}>
          <CircularProgress score={healthData.oralHealth} title="Oral Health Score" />
          <CircularProgress score={healthData.systemicHealth} title="Systemic Health Score" />
        </View>

        {healthData.fitnessScore > 0 && (
          <View style={styles.fitnessRow}>
            <CircularProgress score={healthData.fitnessScore} title="Fitness Score" />
          </View>
        )}

        {/* Tier 2 Scores (if available) */}
        {healthData.tier === 2 && (
          <>
            <View style={styles.scoresRow}>
              <CircularProgress score={healthData.inflammatoryScore} title="Inflammatory Panel" />
              <CircularProgress score={healthData.nadScore} title="NAD+ Metabolome" />
            </View>
            <View style={styles.fitnessRow}>
              <CircularProgress score={healthData.wearableScore} title="Wearable Score" />
            </View>
          </>
        )}

        {/* Wearable Integration */}
        <View style={styles.wearableSection}>
          <Text style={styles.sectionTitle}>Wearable Integration</Text>
          <View style={styles.wearableCard}>
            <View style={styles.wearableRow}>
              <View style={styles.wearableItem}>
                <Text style={styles.wearableIcon}>👣</Text>
                <Text style={styles.wearableLabel}>Steps</Text>
                <Text style={styles.wearableValue}>10000</Text>
              </View>
              <View style={styles.wearableItem}>
                <Text style={styles.wearableIcon}>❤️</Text>
                <Text style={styles.wearableLabel}>Heart Rate</Text>
                <Text style={styles.wearableValue}>100 bpm</Text>
              </View>
              <View style={styles.wearableItem}>
                <Text style={styles.wearableIcon}>💧</Text>
                <Text style={styles.wearableLabel}>SpO₂</Text>
                <Text style={styles.wearableValue}>96%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={() => {/* Connect watch logic */}}
        >
          <Ionicons name="watch" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.connectButtonText}>Connect Watch</Text>
        </TouchableOpacity>

        {/* TIER 1 BIOMARKER INPUT BUTTON */}
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={() => navigation.navigate('Tier1BiomarkerInput', { age: healthData.bioAge })}
        >
          <Text style={styles.updateButtonText}>Update Tier 1 Biomarker Data</Text>
        </TouchableOpacity>

        {/* TIER 2 BIOMARKER INPUT BUTTON (shows if Tier 2 recommended or already in Tier 2) */}
        {(healthData.needsTier2 || healthData.tier === 2) && (
          <TouchableOpacity 
            style={styles.tier2Button}
            onPress={() => navigation.navigate('Tier2BiomarkerInput', {
              age: healthData.bioAge,
              systemicHealth: healthData.systemicHealth
            })}
          >
            <Text style={styles.tier2ButtonText}>
              {healthData.tier === 2 ? 'Update Tier 2 Biomarker Data' : 'Upgrade to Tier 2 Assessment'}
            </Text>
          </TouchableOpacity>
        )}

        {/* TIER 3 RECOMMENDATION (if applicable) */}
        {healthData.needsTier3 && (
          <TouchableOpacity 
            style={styles.tier3Button}
            onPress={() => {/* Tier 3 logic */}}
          >
            <Text style={styles.tier3ButtonIcon}>⚕️</Text>
            <Text style={styles.tier3ButtonText}>Tier 3 Precision Medicine Recommended</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.dnaButton}
          onPress={() => {/* DNA test logic */}}
        >
          <Text style={styles.dnaButtonIcon}>🧬</Text>
          <Text style={styles.dnaButtonText}>Input DNA Methylation Test</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    lineHeight: 22,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bioAgeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  bioAgeLabel: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  bioAgeValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  bioAgeUnit: {
    fontSize: 18,
    color: '#7F8C8D',
  },
  tierBadge: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498DB',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  fitnessRow: {
    alignItems: 'center',
    marginBottom: 30,
  },
  circularCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    width: (width - 60) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  circularProgressContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  circularProgressOuter: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wearableSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  wearableCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wearableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  wearableItem: {
    alignItems: 'center',
  },
  wearableIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  wearableLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  wearableValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  connectButton: {
    backgroundColor: '#3498DB',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tier2Button: {
    backgroundColor: '#3498DB',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  tier2ButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tier3Button: {
    backgroundColor: '#9B59B6',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  tier3ButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  tier3ButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dnaButton: {
    backgroundColor: '#27AE60',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  dnaButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dnaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;