import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import StorageService from '../services/StorageService';

const HistoricalDataScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await StorageService.getBiomarkerHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Error', 'Failed to load historical data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDelete = async (timestamp) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this biomarker entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteBiomarkerEntry(timestamp);
              await loadHistory();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 65) return '#fbbf24';
    if (score >= 50) return '#fb923c';
    return '#ef4444';
  };

  const renderHistoryItem = (item, index) => {
    const date = new Date(item.timestamp);
    const ageDiff = item.bioAge - item.age;

    return (
      <View key={item.timestamp} style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardDate}>
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.cardTime}>
              {date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => handleDelete(item.timestamp)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.bioAgeRow}>
          <Text style={styles.bioAgeLabel}>Bio-Age:</Text>
          <Text style={styles.bioAgeValue}>{item.bioAge} yrs</Text>
          <Text
            style={[
              styles.ageDiff,
              { color: ageDiff < 0 ? '#4ade80' : '#ef4444' },
            ]}
          >
            ({ageDiff > 0 ? '+' : ''}{ageDiff.toFixed(1)})
          </Text>
        </View>

        <View style={styles.scoresRow}>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreLabel}>Oral</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(item.oralScore) }]}>
              {item.oralScore}
            </Text>
          </View>

          <View style={styles.scoreChip}>
            <Text style={styles.scoreLabel}>Systemic</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(item.systemicScore) }]}>
              {item.systemicScore}
            </Text>
          </View>

          <View style={styles.scoreChip}>
            <Text style={styles.scoreLabel}>Fitness</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(item.fitnessScore) }]}>
              {item.fitnessScore}
            </Text>
          </View>
        </View>

        {item.tier && (
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>Tier {item.tier}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <PraxiomBackground>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Historical Data</Text>
          <Text style={styles.subtitle}>{history.length} entries</Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#8e8e93" />
            <Text style={styles.emptyText}>No historical data yet</Text>
            <Text style={styles.emptySubtext}>
              Biomarker entries will appear here
            </Text>
          </View>
        ) : (
          <>
            {history.map((item, index) => renderHistoryItem(item, index))}
            
            <TouchableOpacity
              style={styles.compareButton}
              onPress={() => navigation.navigate('Comparison')}
            >
              <Ionicons name="analytics-outline" size={24} color="#00d4ff" />
              <Text style={styles.compareButtonText}>Compare Entries</Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: '#1e1e2e',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardTime: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
  },
  bioAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  bioAgeLabel: {
    fontSize: 14,
    color: '#8e8e93',
  },
  bioAgeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginLeft: 8,
  },
  ageDiff: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreChip: {
    flex: 1,
    backgroundColor: '#0a0a1e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tierBadge: {
    position: 'absolute',
    top: 15,
    right: 50,
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    color: '#00d4ff',
    fontWeight: 'bold',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e2e',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginLeft: 10,
  },
});

export default HistoricalDataScreen;
