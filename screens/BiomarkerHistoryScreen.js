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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Print from 'expo-print';  // COMMENTED OUT - not in dependencies
import * as Sharing from 'expo-sharing';
import { AppContext } from '../AppContext';
import PraxiomBackground from '../components/PraxiomBackground';

const BiomarkerHistoryScreen = ({ navigation }) => {
  const { state } = useContext(AppContext);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await AsyncStorage.getItem('biomarkerHistory');
      if (historyData) {
        setHistory(JSON.parse(historyData));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const exportData = async () => {
    try {
      const dataToExport = JSON.stringify(history, null, 2);
      
      if (Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(
          dataToExport,
          {
            mimeType: 'application/json',
            dialogTitle: 'Export Biomarker History'
          }
        );
      } else {
        Alert.alert('Info', 'Data exported: ' + dataToExport);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data: ' + error.message);
    }
  };

  const deleteEntry = async (id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure?',
      [
        {
          text: 'Cancel',
          onPress: () => { },
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const updated = history.filter(h => h.id !== id);
            setHistory(updated);
            await AsyncStorage.setItem('biomarkerHistory', JSON.stringify(updated));
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          onPress={() => deleteEntry(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.row}>
          <Text style={styles.label}>Bio-Age:</Text>
          <Text style={styles.value}>{item.bioAge?.toFixed(1) || 'N/A'} years</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Oral Score:</Text>
          <Text style={styles.value}>{item.oralScore || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Systemic Score:</Text>
          <Text style={styles.value}>{item.systemicScore || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fitness Score:</Text>
          <Text style={styles.value}>{item.fitnessScore || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );

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
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
    paddingVertical: 15,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
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
    color: '#00d4ff',
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
