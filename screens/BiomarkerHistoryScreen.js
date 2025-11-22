import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStorage from '../services/SecureStorageService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system'; // ✅ ADDED: For export functionality
import { AppContext } from '../AppContext';
import PraxiomBackground from '../components/PraxiomBackground';

const BiomarkerHistoryScreen = ({ navigation }) => {
  const { state } = useContext(AppContext);
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // ✅ Load from encrypted storage for medical data
      const tier1Data = await SecureStorage.getItem('tier1Biomarkers');
      const tier2Data = await SecureStorage.getItem('tier2Biomarkers');
      const fitnessData = await SecureStorage.getItem('fitnessAssessments'); // ✅ NEW: Load fitness assessments
      const legacyData = await AsyncStorage.getItem('@praxiom_biomarker_history');
      
      let allHistory = [];
      
      if (tier1Data) {
        const tier1Array = Array.isArray(tier1Data) ? tier1Data : [tier1Data];
        allHistory = [...allHistory, ...tier1Array];
        console.log('📋 Loaded Tier 1 history:', tier1Array.length, 'entries');
      }
      
      if (tier2Data) {
        const tier2Array = Array.isArray(tier2Data) ? tier2Data : [tier2Data];
        allHistory = [...allHistory, ...tier2Array];
        console.log('📋 Loaded Tier 2 history:', tier2Array.length, 'entries');
      }
      
      // ✅ NEW: Load fitness assessments
      if (fitnessData) {
        const fitnessArray = Array.isArray(fitnessData) ? fitnessData : [fitnessData];
        allHistory = [...allHistory, ...fitnessArray];
        console.log('📋 Loaded Fitness history:', fitnessArray.length, 'entries');
      }
      
      if (legacyData) {
        const legacyArray = JSON.parse(legacyData);
        allHistory = [...allHistory, ...legacyArray];
        console.log('📋 Loaded legacy history:', legacyArray.length, 'entries');
      }
      
      // Sort by timestamp, newest first
      allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log('📋 Total history entries:', allHistory.length);
      setHistory(allHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const exportData = async () => {
    try {
      // ✅ FIXED: Create temporary file first, then share file URI
      const dataToExport = JSON.stringify(history, null, 2);
      
      // Create file in app's document directory
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `praxiom_history_${timestamp}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write data to file
      await FileSystem.writeAsStringAsync(fileUri, dataToExport);
      console.log('✅ Export file created:', fileUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Biomarker History',
          UTI: 'public.json'
        });
        console.log('✅ File shared successfully');
      } else {
        Alert.alert(
          'Export Successful', 
          `Data saved to:\n${fileUri}\n\nYou can access this file through your file manager.`
        );
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      Alert.alert('Error', 'Failed to export data: ' + error.message);
    }
  };

  const deleteEntry = async (timestamp) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const entryToDelete = history.find(h => h.timestamp === timestamp);
              
              if (entryToDelete) {
                // ✅ Determine which storage key to delete from
                if (entryToDelete.tier === 'Fitness Assessment') {
                  // Delete from fitness assessments
                  const fitnessData = await SecureStorage.getItem('fitnessAssessments');
                  if (fitnessData) {
                    const fitnessArray = Array.isArray(fitnessData) ? fitnessData : [fitnessData];
                    const updated = fitnessArray.filter(h => h.timestamp !== timestamp);
                    await SecureStorage.setItem('fitnessAssessments', updated);
                  }
                } else if (entryToDelete.tier === 1) {
                  const tier1Data = await SecureStorage.getItem('tier1Biomarkers');
                  if (tier1Data) {
                    const tier1Array = Array.isArray(tier1Data) ? tier1Data : [tier1Data];
                    const updated = tier1Array.filter(h => h.timestamp !== timestamp);
                    await SecureStorage.setItem('tier1Biomarkers', updated);
                  }
                } else if (entryToDelete.tier === 2) {
                  const tier2Data = await SecureStorage.getItem('tier2Biomarkers');
                  if (tier2Data) {
                    const tier2Array = Array.isArray(tier2Data) ? tier2Data : [tier2Data];
                    const updated = tier2Array.filter(h => h.timestamp !== timestamp);
                    await SecureStorage.setItem('tier2Biomarkers', updated);
                  }
                }
              }
              
              // Update local state
              const updatedHistory = history.filter(h => h.timestamp !== timestamp);
              setHistory(updatedHistory);
              
              console.log('🗑️ Entry deleted');
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const toggleExpand = (timestamp) => {
    setExpandedId(expandedId === timestamp ? null : timestamp);
  };

  const renderHistoryItem = ({ item }) => {
    const isExpanded = expandedId === item.timestamp;
    const date = new Date(item.timestamp);
    const isFitnessAssessment = item.tier === 'Fitness Assessment';
    
    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            {/* ✅ Show tier badge */}
            <Text style={[
              styles.tierBadge, 
              isFitnessAssessment ? styles.fitnessBadge : 
              item.tier === 1 ? styles.tier1Badge : styles.tier2Badge
            ]}>
              {item.tier === 'Fitness Assessment' ? '💪 Fitness' : 
               item.tier === 1 ? '📝 Tier 1' : 
               item.tier === 2 ? '🔥 Tier 2' : '📊 Assessment'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => deleteEntry(item.timestamp)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>

        {/* Summary View */}
        <View style={styles.cardContent}>
          <View style={styles.row}>
            <Text style={styles.label}>Bio-Age:</Text>
            <Text style={[styles.value, styles.bioAgeValue]}>
              {item.bioAge?.toFixed(1) || 'N/A'} years
            </Text>
          </View>
          
          {/* ✅ Show appropriate scores based on entry type */}
          {isFitnessAssessment ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Fitness Score:</Text>
                <Text style={styles.value}>{item.fitnessScore || 'N/A'}%</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aerobic:</Text>
                <Text style={styles.value}>{item.aerobicScore || 'N/A'}/10</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Balance:</Text>
                <Text style={styles.value}>{item.balanceScore || 'N/A'}/10</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Oral Health:</Text>
                <Text style={styles.value}>{item.oralScore || 'N/A'}%</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Systemic Health:</Text>
                <Text style={styles.value}>{item.systemicScore || 'N/A'}%</Text>
              </View>
              {item.fitnessScore && (
                <View style={styles.row}>
                  <Text style={styles.label}>Fitness:</Text>
                  <Text style={styles.value}>{item.fitnessScore}%</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* View Details Button */}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => toggleExpand(item.timestamp)}
        >
          <Text style={styles.detailsButtonText}>
            {isExpanded ? 'Hide Details' : 'View Details'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#00d4ff"
          />
        </TouchableOpacity>

        {/* ✅ Expandable Details Section */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            {isFitnessAssessment ? (
              // Fitness Assessment Details
              <>
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>💪 Fitness Scores</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Aerobic Fitness:</Text>
                    <Text style={styles.detailValue}>{item.aerobicScore}/10</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Flexibility & Posture:</Text>
                    <Text style={styles.detailValue}>{item.flexibilityScore}/10</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Balance & Coordination:</Text>
                    <Text style={styles.detailValue}>{item.balanceScore}/10</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mind-Body Alignment:</Text>
                    <Text style={styles.detailValue}>{item.mindBodyScore}/10</Text>
                  </View>
                </View>
                
                {item.testDetails && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>📊 Test Results</Text>
                    {item.testDetails.aerobicTestType === 'stepTest' && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Step Test HR:</Text>
                        <Text style={styles.detailValue}>{item.testDetails.recoveryHeartRate} bpm</Text>
                      </View>
                    )}
                    {item.testDetails.aerobicTestType === '6mwt' && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>6MWT Distance:</Text>
                        <Text style={styles.detailValue}>{item.testDetails.walkDistance} m</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Sit-Reach:</Text>
                      <Text style={styles.detailValue}>{item.testDetails.sitReachCm} cm</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>One-Leg Stand:</Text>
                      <Text style={styles.detailValue}>{item.testDetails.oneLegStand} sec</Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              // Biomarker Assessment Details
              <>
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>🦷 Oral Health Biomarkers</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Salivary pH:</Text>
                    <Text style={styles.detailValue}>{item.salivaryPH || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Active MMP-8 (ng/mL):</Text>
                    <Text style={styles.detailValue}>{item.activeMMP8 || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Salivary Flow (mL/min):</Text>
                    <Text style={styles.detailValue}>{item.salivaryFlowRate || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>🩸 Systemic Health Biomarkers</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>hs-CRP (mg/L):</Text>
                    <Text style={styles.detailValue}>{item.hsCRP || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Omega-3 Index (%):</Text>
                    <Text style={styles.detailValue}>{item.omega3Index || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>HbA1c (%):</Text>
                    <Text style={styles.detailValue}>{item.hbA1c || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>GDF-15 (pg/mL):</Text>
                    <Text style={styles.detailValue}>{item.gdf15 || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vitamin D (ng/mL):</Text>
                    <Text style={styles.detailValue}>{item.vitaminD || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>⌚ Wearable Data</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Heart Rate (bpm):</Text>
                    <Text style={styles.detailValue}>{item.heartRate || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Daily Steps:</Text>
                    <Text style={styles.detailValue}>{item.steps?.toLocaleString() || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>SpO2 (%):</Text>
                    <Text style={styles.detailValue}>{item.spO2 || 'N/A'}</Text>
                  </View>
                  {item.hrv && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>HRV (ms):</Text>
                      <Text style={styles.detailValue}>{item.hrv}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}
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
          <Text style={styles.title}>Biomarker History</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Comparison')}
              style={styles.compareButton}
            >
              <Ionicons name="analytics-outline" size={24} color="#00d4ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={exportData}
              style={styles.exportButton}
            >
              <Ionicons name="share-social-outline" size={24} color="#00d4ff" />
            </TouchableOpacity>
          </View>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>
              Complete biomarker assessments to see history
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => item.timestamp || `history-${index}`}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  compareButton: {
    padding: 8,
  },
  exportButton: {
    padding: 8,
  },
  listContent: {
    padding: 15,
  },
  historyCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  tierBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tier1Badge: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  tier2Badge: {
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
  fitnessBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  deleteButton: {
    padding: 8,
  },
  cardContent: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  bioAgeValue: {
    color: '#FFB800',
    fontSize: 16,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
  },
  detailsButtonText: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  expandedDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  detailsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default BiomarkerHistoryScreen;
