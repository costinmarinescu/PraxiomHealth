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

const DashboardScreen = ({ navigation }) => {
  const [healthData, setHealthData] = useState({
    oralHealth: 0,
    systemicHealth: 0,
    fitnessScore: 0,
    bioAge: 0
  });

  const getHealthStatus = (score) => {
    if (score === 0) return { text: 'No Data', color: '#95A5A6' };
    if (score < 40) return { text: 'Poor', color: '#E74C3C' };
    if (score < 60) return { text: 'Fair', color: '#F39C12' };
    if (score < 80) return { text: 'Good', color: '#3498DB' };
    return { text: 'Excellent', color: '#2ECC71' };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background matching watch - more transparent */}
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('BiomarkerHistory')}
          >
            <Ionicons name="time" size={24} color="#333" />
          </TouchableOpacity>
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
            <Ionicons name="settings" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Health Score</Text>

        {/* Top Row: Oral Health and Systemic Health */}
        <View style={styles.cardsContainer}>
          {/* Oral Health Score */}
          <View style={styles.cardWrapper}>
            <View style={[styles.card, styles.roundCard]}>
              <Ionicons name="fitness" size={40} color="#FF8C00" />
              <Text style={styles.cardTitle}>Oral Health</Text>
              <Text style={[styles.scoreValue, { color: getHealthStatus(healthData.oralHealth).color }]}>
                {healthData.oralHealth}
              </Text>
              <Text style={[styles.statusText, { color: getHealthStatus(healthData.oralHealth).color }]}>
                {getHealthStatus(healthData.oralHealth).text}
              </Text>
            </View>
          </View>

          {/* Systemic Health */}
          <View style={styles.cardWrapper}>
            <View style={[styles.card, styles.roundCard]}>
              <Ionicons name="heart" size={40} color="#FF6B6B" />
              <Text style={styles.cardTitle}>Systemic Health</Text>
              <Text style={[styles.scoreValue, { color: getHealthStatus(healthData.systemicHealth).color }]}>
                {healthData.systemicHealth}
              </Text>
              <Text style={[styles.statusText, { color: getHealthStatus(healthData.systemicHealth).color }]}>
                {getHealthStatus(healthData.systemicHealth).text}
              </Text>
            </View>
          </View>
        </View>

        {/* Centered Fitness Score */}
        <View style={styles.centeredCardWrapper}>
          <View style={[styles.card, styles.roundCard, styles.fitnessCard]}>
            <Ionicons name="pulse" size={48} color="#00CFC1" />
            <Text style={styles.cardTitle}>Fitness Score</Text>
            <Text style={[styles.scoreValue, styles.largeScore, { color: getHealthStatus(healthData.fitnessScore).color }]}>
              {healthData.fitnessScore}
            </Text>
            <Text style={[styles.statusText, { color: getHealthStatus(healthData.fitnessScore).color }]}>
              {getHealthStatus(healthData.fitnessScore).text}
            </Text>
          </View>
        </View>

        {/* Bio Age Section */}
        <View style={[styles.card, styles.roundCard, styles.bioAgeCard]}>
          <View style={styles.bioAgeHeader}>
            <Ionicons name="body" size={32} color="#9B59B6" />
            <Text style={styles.bioAgeTitle}>Biological Age</Text>
          </View>
          <View style={styles.bioAgeContent}>
            <View style={styles.ageGroup}>
              <Text style={styles.ageLabel}>Chronological</Text>
              <Text style={styles.ageValue}>--</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#95A5A6" />
            <View style={styles.ageGroup}>
              <Text style={styles.ageLabel}>Biological</Text>
              <Text style={[styles.ageValue, styles.bioAgeValue]}>
                {healthData.bioAge > 0 ? healthData.bioAge : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Wearable Integration Section */}
        <Text style={styles.sectionTitle}>Wearable Integration</Text>
        <View style={styles.wearableContainer}>
          <TouchableOpacity style={styles.wearableItem}>
            <Ionicons name="footsteps" size={32} color="#00CFC1" />
            <Text style={styles.wearableLabel}>Steps</Text>
            <Text style={styles.wearableValue}>10000</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.wearableItem}>
            <Ionicons name="heart" size={32} color="#FF6B6B" />
            <Text style={styles.wearableLabel}>Heart Rate</Text>
            <Text style={styles.wearableValue}>100 bpm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.wearableItem}>
            <Ionicons name="water" size={32} color="#4ECDC4" />
            <Text style={styles.wearableLabel}>SpO₂</Text>
            <Text style={styles.wearableValue}>96%</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.actionButton, styles.connectButton]}
          onPress={() => navigation.navigate('Watch')}
        >
          <Ionicons name="watch" size={24} color="white" />
          <Text style={styles.actionButtonText}>Connect Watch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.biomarkerButton]}
          onPress={() => navigation.navigate('BiomarkerInput')}
        >
          <Text style={styles.actionButtonText}>Update Tier 1 Biomarker Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dnaButton]}
        >
          <Ionicons name="bar-chart" size={24} color="white" />
          <Text style={styles.actionButtonText}>Input DNA Methylation Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.upgradeButton]}
        >
          <Ionicons name="arrow-up-circle" size={24} color="white" />
          <Text style={styles.actionButtonText}>Upgrade to Tier 2 Assessment</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardWrapper: {
    width: (width - 60) / 2,
  },
  centeredCardWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundCard: {
    borderRadius: 30,
  },
  fitnessCard: {
    width: (width - 60) / 1.5,
    paddingVertical: 30,
  },
  cardTitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 10,
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  largeScore: {
    fontSize: 48,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bioAgeCard: {
    padding: 20,
    marginBottom: 30,
  },
  bioAgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bioAgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  bioAgeContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ageGroup: {
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  ageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  bioAgeValue: {
    color: '#9B59B6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  wearableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wearableItem: {
    alignItems: 'center',
  },
  wearableLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 8,
  },
  wearableValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 15,
    marginTop: 15,
  },
  connectButton: {
    backgroundColor: '#2196F3',
  },
  biomarkerButton: {
    backgroundColor: '#FF9800',
  },
  dnaButton: {
    backgroundColor: '#2196F3',
  },
  upgradeButton: {
    backgroundColor: '#2ECC71',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default DashboardScreen;
