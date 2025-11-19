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
import { AppContext } from '../AppContext';
import PraxiomBackground from '../components/PraxiomBackground';
import SecureStorageService from '../services/SecureStorageService';

const BiomarkerHistoryScreen = ({ navigation }) => {
  const { state } = useContext(AppContext);
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      // ✅ NEW: Load from encrypted storage
      const historyData = await SecureStorageService.getBiomarkerHistory();
      console.log('📋 🔐 Loaded encrypted history entries:', historyData.length);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Error', 'Failed to load biomarker history');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const result = await SecureStorageService.exportToFile();
      
      if (result.success) {
        Alert.alert(
          'Export Successful',
          `Data exported to:\n${result.filename}\n\n🔐 Data is encrypted for security`
        );
      } else {
        Alert.alert('Export Failed', result.error || 'Unknown error');
      }
    } catch (error) {
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
              await SecureStorageService.deleteBiomarkerEntry(timestamp);
              await loadHistory(); // Reload list
              console.log('🗑️ Entry deleted securely');
              Alert.alert('Success', 'Entry deleted');
            } catch (error) {
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
    
    return (
      <View style={styles.historyCard}>
        {/* Security Indicator */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#47C83E" />
          <Text style={styles.securityText}>Encrypted</Text>
        </View>

        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.tierBadge}>Tier {item.tier || 1}</Text>
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
          <View style={styles.row}>
            <Text style={styles.label}>Deviation:</Text>
            <Text style={[
              styles.value,
              { color: item.deviation < 0 ? '#47C83E' : item.deviation > 5 ? '#ff4444' : '#FFB800' }
            ]}>
              {item.deviation > 0 ? '+' : ''}{item.deviation?.toFixed(1) || 'N/A'} years
            </Text>
          </View>
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
          {item.vitalityIndex && (
            <View style={styles.row}>
              <Text style={styles.label}>Vitality Index:</Text>
              <Text style={styles.value}>{item.vitalityIndex}%</Text>
            </View>
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

        {/* Expandable Details Section */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
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
                <Text style={styles.detailValue}>{item.salivaryFlowRate || item.salivaryFlow || 'N/A'}</Text>
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
                <Text style={styles.detailValue}>{item.hba1c || 'N/A'}</Text>
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

            {/* Security Info */}
            <View style={styles.securityInfo}>
              <Ionicons name="lock-closed" size={16} color="#47C83E" />
              <Text style={styles.securityInfoText}>
                Data encrypted with AES-256
              </Text>
            </View>
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
          <TouchableOpacity
            onPress={exportData}
            style={styles.exportButton}
          >
            <Ionicons name="share-social-outline" size={24} color="#00d4ff" />
          </TouchableOpacity>
        </View>

        {/* Security Status Banner */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#47C83E" />
          <Text style={styles.securityBannerText}>
            All data is encrypted and secure
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading encrypted data...</Text>
          </View>
        ) : history.length === 0 ? (
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
            keyExtractor={(item) => item.timestamp || Math.random().toString()}
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
  exportButton: {
    padding: 8,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(71, 200, 62, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(71, 200, 62, 0.3)',
  },
  securityBannerText: {
    color: '#47C83E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(71, 200, 62, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  securityText: {
    color: '#47C83E',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 4,
  },
  tierBadge: {
    fontSize: 12,
    color: '#aaa',
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
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  securityInfoText: {
    color: '#47C83E',
    fontSize: 12,
    marginLeft: 6,
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
