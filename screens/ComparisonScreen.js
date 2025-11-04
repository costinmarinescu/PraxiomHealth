import React, { useState, useEffect } from 'react';
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

const ComparisonScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [selectedEntry1, setSelectedEntry1] = useState(null);
  const [selectedEntry2, setSelectedEntry2] = useState(null);
  const [showSelector1, setShowSelector1] = useState(false);
  const [showSelector2, setShowSelector2] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await StorageService.getBiomarkerHistory();
      setHistory(data);
      
      // Auto-select most recent two entries if available
      if (data.length >= 2 && !selectedEntry1 && !selectedEntry2) {
        setSelectedEntry1(data[0]);
        setSelectedEntry2(data[1]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const getChange = (value1, value2) => {
    const diff = value1 - value2;
    const percentage = ((diff / value2) * 100).toFixed(1);
    return {
      diff: diff.toFixed(1),
      percentage,
      isPositive: diff > 0,
    };
  };

  const exportReport = async () => {
    if (!selectedEntry1 || !selectedEntry2) {
      Alert.alert('Error', 'Please select two entries to compare');
      return;
    }

    try {
      const report = generateReportText();
      const filename = `praxiom_comparison_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, report);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Report saved to device storage');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const exportCSV = async () => {
    if (!selectedEntry1 || !selectedEntry2) {
      Alert.alert('Error', 'Please select two entries to compare');
      return;
    }

    try {
      const csv = generateCSV();
      const filename = `praxiom_comparison_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'CSV saved to device storage');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  const generateReportText = () => {
    const date1 = new Date(selectedEntry1.timestamp);
    const date2 = new Date(selectedEntry2.timestamp);
    
    const bioAgeChange = getChange(selectedEntry1.bioAge, selectedEntry2.bioAge);
    const oralChange = getChange(selectedEntry1.oralScore, selectedEntry2.oralScore);
    const systemicChange = getChange(selectedEntry1.systemicScore, selectedEntry2.systemicScore);
    const fitnessChange = getChange(selectedEntry1.fitnessScore, selectedEntry2.fitnessScore);

    return `PRAXIOM HEALTH COMPARISON REPORT
Generated: ${new Date().toLocaleString()}

========================================
ENTRY 1: ${date1.toLocaleDateString()}
========================================
Biological Age: ${selectedEntry1.bioAge} years
Oral Health Score: ${selectedEntry1.oralScore}/100
Systemic Health Score: ${selectedEntry1.systemicScore}/100
Fitness Score: ${selectedEntry1.fitnessScore}/100

========================================
ENTRY 2: ${date2.toLocaleDateString()}
========================================
Biological Age: ${selectedEntry2.bioAge} years
Oral Health Score: ${selectedEntry2.oralScore}/100
Systemic Health Score: ${selectedEntry2.systemicScore}/100
Fitness Score: ${selectedEntry2.fitnessScore}/100

========================================
CHANGES
========================================
Bio-Age: ${bioAgeChange.isPositive ? '+' : ''}${bioAgeChange.diff} years (${bioAgeChange.percentage}%)
Oral Health: ${oralChange.isPositive ? '+' : ''}${oralChange.diff} points (${oralChange.percentage}%)
Systemic Health: ${systemicChange.isPositive ? '+' : ''}${systemicChange.diff} points (${systemicChange.percentage}%)
Fitness: ${fitnessChange.isPositive ? '+' : ''}${fitnessChange.diff} points (${fitnessChange.percentage}%)

========================================
ANALYSIS
========================================
${generateAnalysis()}

========================================
Praxiom Health - Biological Age Assessment
www.praxiomhealth.com
========================================`;
  };

  const generateCSV = () => {
    const headers = 'Metric,Entry 1,Entry 2,Change,Percentage\n';
    const date1 = new Date(selectedEntry1.timestamp).toLocaleDateString();
    const date2 = new Date(selectedEntry2.timestamp).toLocaleDateString();
    
    const bioAgeChange = getChange(selectedEntry1.bioAge, selectedEntry2.bioAge);
    const oralChange = getChange(selectedEntry1.oralScore, selectedEntry2.oralScore);
    const systemicChange = getChange(selectedEntry1.systemicScore, selectedEntry2.systemicScore);
    const fitnessChange = getChange(selectedEntry1.fitnessScore, selectedEntry2.fitnessScore);

    const rows = [
      `Date,${date1},${date2},,`,
      `Bio-Age,${selectedEntry1.bioAge},${selectedEntry2.bioAge},${bioAgeChange.diff},${bioAgeChange.percentage}%`,
      `Oral Health,${selectedEntry1.oralScore},${selectedEntry2.oralScore},${oralChange.diff},${oralChange.percentage}%`,
      `Systemic Health,${selectedEntry1.systemicScore},${selectedEntry2.systemicScore},${systemicChange.diff},${systemicChange.percentage}%`,
      `Fitness,${selectedEntry1.fitnessScore},${selectedEntry2.fitnessScore},${fitnessChange.diff},${fitnessChange.percentage}%`,
    ].join('\n');

    return headers + rows;
  };

  const generateAnalysis = () => {
    const bioAgeChange = getChange(selectedEntry1.bioAge, selectedEntry2.bioAge);
    const oralChange = getChange(selectedEntry1.oralScore, selectedEntry2.oralScore);
    const systemicChange = getChange(selectedEntry1.systemicScore, selectedEntry2.systemicScore);
    const fitnessChange = getChange(selectedEntry1.fitnessScore, selectedEntry2.fitnessScore);

    let analysis = [];

    if (!bioAgeChange.isPositive) {
      analysis.push('✓ Biological age decreased - positive improvement');
    } else {
      analysis.push('⚠ Biological age increased - attention needed');
    }

    if (oralChange.isPositive) {
      analysis.push('✓ Oral health improved');
    } else if (Math.abs(oralChange.diff) > 5) {
      analysis.push('⚠ Oral health declined significantly');
    }

    if (systemicChange.isPositive) {
      analysis.push('✓ Systemic health improved');
    } else if (Math.abs(systemicChange.diff) > 5) {
      analysis.push('⚠ Systemic health declined significantly');
    }

    if (fitnessChange.isPositive) {
      analysis.push('✓ Fitness improved');
    } else if (Math.abs(fitnessChange.diff) > 5) {
      analysis.push('⚠ Fitness declined significantly');
    }

    return analysis.join('\n');
  };

  const renderComparison = () => {
    if (!selectedEntry1 || !selectedEntry2) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color="#8e8e93" />
          <Text style={styles.emptyText}>Select two entries to compare</Text>
        </View>
      );
    }

    const bioAgeChange = getChange(selectedEntry1.bioAge, selectedEntry2.bioAge);
    const oralChange = getChange(selectedEntry1.oralScore, selectedEntry2.oralScore);
    const systemicChange = getChange(selectedEntry1.systemicScore, selectedEntry2.systemicScore);
    const fitnessChange = getChange(selectedEntry1.fitnessScore, selectedEntry2.fitnessScore);

    return (
      <View style={styles.comparisonContainer}>
        {renderComparisonRow('Bio-Age', selectedEntry1.bioAge, selectedEntry2.bioAge, bioAgeChange, 'years', true)}
        {renderComparisonRow('Oral Health', selectedEntry1.oralScore, selectedEntry2.oralScore, oralChange)}
        {renderComparisonRow('Systemic Health', selectedEntry1.systemicScore, selectedEntry2.systemicScore, systemicChange)}
        {renderComparisonRow('Fitness', selectedEntry1.fitnessScore, selectedEntry2.fitnessScore, fitnessChange)}
      </View>
    );
  };

  const renderComparisonRow = (label, value1, value2, change, unit = '/100', invertColors = false) => {
    const isImprovement = invertColors ? !change.isPositive : change.isPositive;
    const color = isImprovement ? '#4ade80' : '#ef4444';

    return (
      <View style={styles.comparisonRow}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.valuesContainer}>
          <View style={styles.valueBox}>
            <Text style={styles.valueText}>{value1}{unit}</Text>
            <Text style={styles.valueDate}>
              {new Date(selectedEntry1.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          
          <View style={styles.changeBox}>
            <Ionicons
              name={isImprovement ? 'arrow-down' : 'arrow-up'}
              size={20}
              color={color}
            />
            <Text style={[styles.changeText, { color }]}>
              {change.isPositive ? '+' : ''}{change.diff}
            </Text>
            <Text style={[styles.changePercentage, { color }]}>
              ({change.percentage}%)
            </Text>
          </View>

          <View style={styles.valueBox}>
            <Text style={styles.valueText}>{value2}{unit}</Text>
            <Text style={styles.valueDate}>
              {new Date(selectedEntry2.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEntrySelector = (selectedEntry, onSelect, onClose) => {
    return (
      <View style={styles.selectorContainer}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>Select Entry</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {history.map((entry) => (
            <TouchableOpacity
              key={entry.timestamp}
              style={[
                styles.selectorItem,
                selectedEntry?.timestamp === entry.timestamp && styles.selectorItemSelected,
              ]}
              onPress={() => {
                onSelect(entry);
                onClose();
              }}
            >
              <Text style={styles.selectorDate}>
                {new Date(entry.timestamp).toLocaleDateString()}
              </Text>
              <Text style={styles.selectorBioAge}>
                Bio-Age: {entry.bioAge} years
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Compare Data</Text>
          <Text style={styles.subtitle}>Track your progress over time</Text>
        </View>

        {/* Entry Selection Buttons */}
        <View style={styles.selectionButtons}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSelector1(true)}
          >
            <Text style={styles.selectLabel}>Entry 1</Text>
            <Text style={styles.selectValue}>
              {selectedEntry1
                ? new Date(selectedEntry1.timestamp).toLocaleDateString()
                : 'Select...'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSelector2(true)}
          >
            <Text style={styles.selectLabel}>Entry 2</Text>
            <Text style={styles.selectValue}>
              {selectedEntry2
                ? new Date(selectedEntry2.timestamp).toLocaleDateString()
                : 'Select...'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comparison Display */}
        {renderComparison()}

        {/* Export Buttons */}
        {selectedEntry1 && selectedEntry2 && (
          <View style={styles.exportContainer}>
            <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
              <Ionicons name="document-text-outline" size={24} color="#00d4ff" />
              <Text style={styles.exportText}>Export Report (TXT)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportButton} onPress={exportCSV}>
              <Ionicons name="grid-outline" size={24} color="#4ade80" />
              <Text style={styles.exportText}>Export CSV</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Selectors (Modal-like overlays) */}
      {showSelector1 && renderEntrySelector(selectedEntry1, setSelectedEntry1, () => setShowSelector1(false))}
      {showSelector2 && renderEntrySelector(selectedEntry2, setSelectedEntry2, () => setShowSelector2(false))}
    </PraxiomBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
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
  selectionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  selectButton: {
    flex: 1,
    backgroundColor: '#1e1e2e',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  selectLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 5,
  },
  selectValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 20,
  },
  comparisonContainer: {
    padding: 20,
  },
  comparisonRow: {
    backgroundColor: '#1e1e2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  valuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueBox: {
    alignItems: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  valueDate: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 4,
  },
  changeBox: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  changeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  changePercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  exportContainer: {
    padding: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e2e',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  exportText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  selectorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a1e',
    zIndex: 1000,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  selectorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  selectorItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  selectorItemSelected: {
    backgroundColor: '#1e1e2e',
  },
  selectorDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  selectorBioAge: {
    fontSize: 14,
    color: '#00d4ff',
    marginTop: 4,
  },
});

export default ComparisonScreen;
