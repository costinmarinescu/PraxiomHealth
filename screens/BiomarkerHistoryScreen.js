import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const BiomarkerHistoryScreen = ({ navigation }) => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await AsyncStorage.getItem('biomarker_entries');
      if (data) {
        const parsed = JSON.parse(data);
        // Sort by date, newest first
        parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEntries(parsed);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load biomarker history');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const exportPDF = async () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'No biomarker entries to export');
      return;
    }

    try {
      // Create HTML for PDF
      const html = generatePDFHTML(entries);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share PDF
      await Sharing.shareAsync(uri);
      
      Alert.alert('Success', 'PDF report exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF: ' + error.message);
    }
  };

  const generatePDFHTML = (entries) => {
    const tableRows = entries.map((entry, index) => {
      const data = entry.data;
      return `
        <tr ${index % 2 === 0 ? 'style="background-color: #f9f9f9;"' : ''}>
          <td>${formatDate(entry.date)}</td>
          <td>${entry.chronologicalAge}</td>
          <td style="font-weight: bold; color: ${entry.bioAge < entry.chronologicalAge ? '#2ECC71' : '#E74C3C'};">
            ${entry.bioAge}
          </td>
          <td>${data.salivaryPH || '-'}</td>
          <td>${data.activeMMP8 || '-'}</td>
          <td>${data.hsCRP || '-'}</td>
          <td>${data.hbA1c || '-'}</td>
          <td>${data.dailySteps || '-'}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Praxiom Health Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #FF8C00;
            border-bottom: 3px solid #00CFC1;
            padding-bottom: 10px;
          }
          h2 {
            color: #333;
            margin-top: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #FF8C00;
            color: white;
            font-weight: bold;
          }
          .summary {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .summary-item {
            margin: 8px 0;
            font-size: 16px;
          }
          .summary-label {
            font-weight: bold;
            color: #555;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>🧬 Praxiom Health Biomarker Report</h1>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="summary-item">
            <span class="summary-label">Total Entries:</span> ${entries.length}
          </div>
          <div class="summary-item">
            <span class="summary-label">Latest Bio-Age:</span> ${entries[0].bioAge} years
          </div>
          <div class="summary-item">
            <span class="summary-label">Chronological Age:</span> ${entries[0].chronologicalAge} years
          </div>
          <div class="summary-item">
            <span class="summary-label">Age Difference:</span> 
            ${(entries[0].bioAge - entries[0].chronologicalAge).toFixed(1)} years
            ${entries[0].bioAge < entries[0].chronologicalAge ? '(Younger)' : '(Older)'}
          </div>
          <div class="summary-item">
            <span class="summary-label">Report Generated:</span> ${new Date().toLocaleString()}
          </div>
        </div>

        <h2>Biomarker History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Chrono Age</th>
              <th>Bio-Age</th>
              <th>pH</th>
              <th>MMP-8</th>
              <th>hs-CRP</th>
              <th>HbA1c</th>
              <th>Steps</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Praxiom Health - Personalized Biological Age Assessment</p>
          <p>© ${new Date().getFullYear()} Praxiom Health. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  };

  const deleteEntry = async (index) => {
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
              const newEntries = [...entries];
              newEntries.splice(index, 1);
              await AsyncStorage.setItem('biomarker_entries', JSON.stringify(newEntries));
              setEntries(newEntries);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biomarker History</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportPDF}
        >
          <Ionicons name="download" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#95A5A6" />
            <Text style={styles.emptyText}>No biomarker entries yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first entry using the "Update Tier 1 Biomarker Data" button
            </Text>
          </View>
        ) : (
          entries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                <TouchableOpacity onPress={() => deleteEntry(index)}>
                  <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>

              <View style={styles.ageComparison}>
                <View style={styles.ageBox}>
                  <Text style={styles.ageLabel}>Chronological</Text>
                  <Text style={styles.ageValue}>{entry.chronologicalAge}</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#95A5A6" />
                <View style={[styles.ageBox, styles.bioAgeBox]}>
                  <Text style={styles.ageLabel}>Biological</Text>
                  <Text style={[styles.ageValue, styles.bioAgeValue]}>
                    {entry.bioAge}
                  </Text>
                </View>
              </View>

              <View style={styles.biomarkersGrid}>
                <View style={styles.biomarkerItem}>
                  <Text style={styles.biomarkerLabel}>pH</Text>
                  <Text style={styles.biomarkerValue}>
                    {entry.data.salivaryPH || '-'}
                  </Text>
                </View>
                <View style={styles.biomarkerItem}>
                  <Text style={styles.biomarkerLabel}>MMP-8</Text>
                  <Text style={styles.biomarkerValue}>
                    {entry.data.activeMMP8 || '-'}
                  </Text>
                </View>
                <View style={styles.biomarkerItem}>
                  <Text style={styles.biomarkerLabel}>hs-CRP</Text>
                  <Text style={styles.biomarkerValue}>
                    {entry.data.hsCRP || '-'}
                  </Text>
                </View>
                <View style={styles.biomarkerItem}>
                  <Text style={styles.biomarkerLabel}>HbA1c</Text>
                  <Text style={styles.biomarkerValue}>
                    {entry.data.hbA1c || '-'}
                  </Text>
                </View>
                <View style={styles.biomarkerItem}>
                  <Text style={styles.biomarkerLabel}>Vit D</Text>
                  <Text style={styles.biomarkerValue}>
                    {entry.data.vitaminD || '-'}
                  </Text>
                </View>
                <View style={styles.biomarkerItem}>
                  <Text style={styles.biomarkerLabel}>Steps</Text>
                  <Text style={styles.biomarkerValue}>
                    {entry.data.dailySteps || '-'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ageComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
  },
  ageBox: {
    alignItems: 'center',
  },
  bioAgeBox: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
  },
  ageLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  ageValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  bioAgeValue: {
    color: '#2ECC71',
  },
  biomarkersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  biomarkerItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  biomarkerLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  biomarkerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default BiomarkerHistoryScreen;
