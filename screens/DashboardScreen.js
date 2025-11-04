import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import CircularProgress from '../components/CircularProgress';
import StorageService from '../services/StorageService';
import BLEService from '../services/BLEService';

const DashboardScreen = ({ navigation }) => {
  const [bioAge, setBioAge] = useState(null);
  const [oralScore, setOralScore] = useState(0);
  const [systemicScore, setSystemicScore] = useState(0);
  const [fitnessScore, setFitnessScore] = useState(0);
  const [chronologicalAge, setChronologicalAge] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [watchConnected, setWatchConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLatestData();
    
    // Subscribe to watch connection status
    const unsubscribe = BLEService.onConnectionChange((connected) => {
      setWatchConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  const loadLatestData = async () => {
    try {
      const latestEntry = await StorageService.getLatestBiomarkerEntry();
      
      if (latestEntry) {
        setBioAge(latestEntry.bioAge);
        setOralScore(latestEntry.oralScore || 0);
        setSystemicScore(latestEntry.systemicScore || 0);
        setFitnessScore(latestEntry.fitnessScore || 0);
        setChronologicalAge(latestEntry.age || 0);
        setLastUpdate(new Date(latestEntry.timestamp));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLatestData();
    setRefreshing(false);
  };

  const getAgeDifference = () => {
    if (!bioAge || !chronologicalAge) return null;
    
    const diff = bioAge - chronologicalAge;
    if (diff < 0) {
      return {
        text: `${Math.abs(diff).toFixed(1)} years younger`,
        color: '#4ade80',
        icon: 'trending-down',
      };
    } else if (diff > 0) {
      return {
        text: `${diff.toFixed(1)} years older`,
        color: '#ef4444',
        icon: 'trending-up',
      };
    }
    return {
      text: 'Matches actual age',
      color: '#fbbf24',
      icon: 'remove',
    };
  };

  const ageDiff = getAgeDifference();

  return (
    <PraxiomBackground>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>PRAXIOM HEALTH</Text>
            <Text style={styles.headerSubtitle}>Biological Age Assessment</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.watchStatus,
              watchConnected && styles.watchConnected,
            ]}
            onPress={() => navigation.navigate('Watch')}
          >
            <Ionicons
              name="watch"
              size={20}
              color={watchConnected ? '#4ade80' : '#8e8e93'}
            />
          </TouchableOpacity>
        </View>

        {/* Bio-Age Display */}
        {bioAge ? (
          <View style={styles.bioAgeCard}>
            <Text style={styles.bioAgeLabel}>Your Biological Age</Text>
            <View style={styles.bioAgeDisplay}>
              <Text style={styles.bioAgeValue}>{bioAge}</Text>
              <Text style={styles.bioAgeUnit}>years</Text>
            </View>
            
            {ageDiff && (
              <View style={styles.ageDiffContainer}>
                <Ionicons name={ageDiff.icon} size={20} color={ageDiff.color} />
                <Text style={[styles.ageDiffText, { color: ageDiff.color }]}>
                  {ageDiff.text}
                </Text>
              </View>
            )}

            {lastUpdate && (
              <Text style={styles.lastUpdate}>
                Last updated: {lastUpdate.toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="medical-outline" size={48} color="#8e8e93" />
            <Text style={styles.emptyText}>No biomarker data yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first biomarker assessment
            </Text>
          </View>
        )}

        {/* Health Scores */}
        {bioAge && (
          <View style={styles.scoresContainer}>
            <Text style={styles.sectionTitle}>Health Scores</Text>
            
            <View style={styles.scoresGrid}>
              <View style={styles.scoreItem}>
                <CircularProgress score={oralScore} label="Oral Health" size={110} />
              </View>
              
              <View style={styles.scoreItem}>
                <CircularProgress score={systemicScore} label="Systemic" size={110} />
              </View>
            </View>

            <View style={styles.scoresCenterRow}>
              <CircularProgress score={fitnessScore} label="Fitness" size={110} />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('Tier1Input')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Update Biomarkers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Historical')}
          >
            <Ionicons name="calendar-outline" size={24} color="#00d4ff" />
            <Text style={styles.secondaryButtonText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Comparison')}
          >
            <Ionicons name="analytics-outline" size={24} color="#00d4ff" />
            <Text style={styles.secondaryButtonText}>Compare Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.tertiaryButton]}
            onPress={() => navigation.navigate('Tier2Input')}
          >
            <Ionicons name="rocket-outline" size={24} color="#4ade80" />
            <Text style={styles.tertiaryButtonText}>Tier 2 Assessment</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
  },
  watchStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchConnected: {
    backgroundColor: '#1e3a28',
  },
  bioAgeCard: {
    margin: 20,
    padding: 30,
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bioAgeLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 10,
  },
  bioAgeDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bioAgeValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  bioAgeUnit: {
    fontSize: 24,
    color: '#8e8e93',
    marginLeft: 8,
  },
  ageDiffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  ageDiffText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 15,
  },
  emptyCard: {
    margin: 20,
    padding: 40,
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 8,
  },
  scoresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoresCenterRow: {
    alignItems: 'center',
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#00d4ff',
  },
  secondaryButton: {
    backgroundColor: '#1e1e2e',
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  tertiaryButton: {
    backgroundColor: '#1e3a28',
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginLeft: 10,
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80',
    marginLeft: 10,
  },
});

export default DashboardScreen;
