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
    if (score === 0) return { text: 'Poor', color: '#E74C3C' };
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
        <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>
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
        {/* Title */}
        <Text style={styles.title}>Personal Health Record</Text>

        {/* Health Score Cards Container */}
        <View style={styles.cardsContainer}>
          
          {/* Oral Health Score Card */}
          <View style={styles.cardWrapper}>
            <View style={[styles.card, styles.roundCard]}>
              <View style={styles.circularProgress}>
                <Text style={styles.scoreNumber}>{healthData.oralHealth}</Text>
              </View>
              <Text style={styles.cardTitle}>Oral Health{'\n'}Score</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getHealthStatus(healthData.oralHealth).color }
                ]}
              >
                <Text style={styles.statusText}>
                  {getHealthStatus(healthData.oralHealth).text}
                </Text>
              </View>
            </View>
          </View>

          {/* Systemic Health Score Card */}
          <View style={styles.cardWrapper}>
            <View style={[styles.card, styles.roundCard]}>
              <View style={styles.circularProgress}>
                <Text style={styles.scoreNumber}>{healthData.systemicHealth}</Text>
              </View>
              <Text style={styles.cardTitle}>Systemic Health</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getHealthStatus(healthData.systemicHealth).color }
                ]}
              >
                <Text style={styles.statusText}>
                  {getHealthStatus(healthData.systemicHealth).text}
                </Text>
              </View>
            </View>
          </View>

        </View>

        {/* Fitness Score Card - Centered */}
        <View style={styles.centeredCardWrapper}>
          <View style={[styles.card, styles.roundCard, styles.fitnessCard]}>
            <View style={styles.circularProgress}>
              <Text style={styles.scoreNumber}>{healthData.fitnessScore}</Text>
            </View>
            <Text style={styles.cardTitle}>Fitness Score</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getHealthStatus(healthData.fitnessScore).color }
              ]}
            >
              <Text style={styles.statusText}>
                {getHealthStatus(healthData.fitnessScore).text}
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
          </TouchableOpacity>
          <TouchableOpacity style={styles.wearableItem}>
            <Ionicons name="heart" size={32} color="#FF6B6B" />
            <Text style={styles.wearableLabel}>Heart Rate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.wearableItem}>
            <Ionicons name="water" size={32} color="#4ECDC4" />
            <Text style={styles.wearableLabel}>SpO₂</Text>
          </TouchableOpacity>
        </View>
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
    minHeight: 220,
  },
  roundCard: {
    borderRadius: 30,
  },
  fitnessCard: {
    width: (width - 60) / 2,
  },
  circularProgress: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default DashboardScreen;
