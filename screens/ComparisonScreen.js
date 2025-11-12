import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import StorageService from '../services/StorageService';

const { width } = Dimensions.get('window');

const ComparisonScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await StorageService.getBiomarkerHistory();
      setHistory(data);
      
      // Auto-select last two entries for comparison
      if (data.length >= 2) {
        setSelectedEntries([data[0], data[1]]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDifference = (value1, value2) => {
    const diff = value1 - value2;
    return {
      value: Math.abs(diff).toFixed(1),
      positive: diff < 0, // Lower bio-age is positive
      arrow: diff < 0 ? 'arrow-down' : diff > 0 ? 'arrow-up' : 'remove',
    };
  };

  const renderComparison = () => {
    if (selectedEntries.length < 2) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color="#8e8e93" />
          <Text style={styles.emptyText}>
            Need at least 2 entries to compare
          </Text>
          <Text style={styles.emptySubtext}>
            Complete more biomarker assessments to track your progress
          </Text>
        </View>
      );
    }

    const [entry1, entry2] = selectedEntries;
    const bioAgeDiff = calculateDifference(entry1.bioAge, entry2.bioAge);
    const oralDiff = calculateDifference(entry1.oralScore, entry2.oralScore);
    const systemicDiff = calculateDifference(entry1.systemicScore, entry2.systemicScore);
    const fitnessDiff = calculateDifference(entry1.fitnessScore, entry2.fitnessScore);

    return (
      <View style={styles.comparisonContainer}>
        {/* Date Headers */}
        <View style={styles.dateRow}>
          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>Latest</Text>
            <Text style={styles.dateValue}>{formatDate(entry1.timestamp)}</Text>
          </View>
          <Ionicons name="swap-horizontal" size={24} color="#00d4ff" />
          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>Previous</Text>
            <Text style={styles.dateValue}>{formatDate(entry2.timestamp)}</Text>
          </View>
        </View>

        {/* Bio-Age Comparison */}
        <View style={styles.comparisonCard}>
          <Text style={styles.cardTitle}>Bio-Age</Text>
          <View style={styles.comparisonRow}>
            <Text style={styles.valueText}>{entry1.bioAge}</Text>
            <View style={[
              styles.diffBadge,
              { backgroundColor: bioAgeDiff.positive ? '#4ade80' : '#ef4444' }
            ]}>
              <Ionicons name={bioAgeDiff.arrow} size={16} color="#fff" />
              <Text style={styles.diffText}>{bioAgeDiff.value}</Text>
            </View>
            <Text style={styles.valueText}>{entry2.bioAge}</Text>
          </View>
        </View>

        {/* Score Comparisons */}
        <View style={styles.comparisonCard}>
          <Text style={styles.cardTitle}>Health Scores</Text>
          
          <View style={styles.scoreComparison}>
            <Text style={styles.scoreLabel}>Oral Health</Text>
            <View style={styles.comparisonRow}>
              <Text style={styles.valueText}>{entry1.oralScore}</Text>
              <View style={[
                styles.diffBadge,
                { backgroundColor: oralDiff.positive ? '#4ade80' : '#ef4444' }
              ]}>
                <Ionicons name={oralDiff.arrow} size={16} color="#fff" />
                <Text style={styles.diffText}>{oralDiff.value}</Text>
              </View>
              <Text style={styles.valueText}>{entry2.oralScore}</Text>
            </View>
          </View>

          <View style={styles.scoreComparison}>
            <Text style={styles.scoreLabel}>Systemic Health</Text>
            <View style={styles.comparisonRow}>
              <Text style={styles.valueText}>{entry1.systemicScore}</Text>
              <View style={[
                styles.diffBadge,
                { backgroundColor: systemicDiff.positive ? '#4ade80' : '#ef4444' }
              ]}>
                <Ionicons name={systemicDiff.arrow} size={16} color="#fff" />
                <Text style={styles.diffText}>{systemicDiff.value}</Text>
              </View>
              <Text style={styles.valueText}>{entry2.systemicScore}</Text>
            </View>
          </View>

          <View style={styles.scoreComparison}>
            <Text style={styles.scoreLabel}>Fitness</Text>
            <View style={styles.comparisonRow}>
              <Text style={styles.valueText}>{entry1.fitnessScore}</Text>
              <View style={[
                styles.diffBadge,
                { backgroundColor: fitnessDiff.positive ? '#4ade80' : '#ef4444' }
              ]}>
                <Ionicons name={fitnessDiff.arrow} size={16} color="#fff" />
                <Text style={styles.diffText}>{fitnessDiff.value}</Text>
              </View>
              <Text style={styles.valueText}>{entry2.fitnessScore}</Text>
            </View>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Progress</Text>
          <Text style={styles.summaryText}>
            {bioAgeDiff.positive
              ? `Your bio-age decreased by ${bioAgeDiff.value} years! Keep up the great work.`
              : `Your bio-age increased by ${bioAgeDiff.value} years. Consider reviewing your health metrics.`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#00d4ff" />
          </TouchableOpacity>
          <Text style={styles.title}>Compare Progress</Text>
          <View style={{ width: 40 }} />
        </View>

        {renderComparison()}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 10,
    textAlign: 'center',
  },
  comparisonContainer: {
    padding: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 5,
  },
  dateValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  comparisonCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 15,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  diffText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 4,
  },
  scoreComparison: {
    marginBottom: 15,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
});

export default ComparisonScreen;
