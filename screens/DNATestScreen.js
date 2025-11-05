import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DNATestScreen({ navigation }) {
  const [dunedinPACE, setDunedinPACE] = useState('');
  const [elovl2Age, setElovl2Age] = useState('');
  const [intrinsicCapacity, setIntrinsicCapacity] = useState('');
  
  const calculateEpigeneticAdjustment = async () => {
    try {
      const chronAge = await AsyncStorage.getItem('chronologicalAge');
      const age = chronAge ? parseFloat(chronAge) : 40;
      
      const pace = parseFloat(dunedinPACE) || 1.0;
      const elovl2 = parseFloat(elovl2Age) || age;
      const ic = parseFloat(intrinsicCapacity) || 85;
      
      // DunedinPACE Adjustment
      // Pace of 1.0 = normal aging
      // Pace > 1.0 = faster aging
      // Pace < 1.0 = slower aging
      const paceAdjustment = (pace - 1.0) * 10;
      
      // ELOVL2 Age Deviation
      const elovl2Deviation = elovl2 - age;
      
      // Intrinsic Capacity Score
      // Higher IC = younger biological age
      const icAdjustment = (85 - ic) * 0.1;
      
      // Combined Epigenetic Age
      const epigeneticAge = age + (paceAdjustment * 0.4) + (elovl2Deviation * 0.4) + (icAdjustment * 0.2);
      
      // Update Praxiom Age with epigenetic data
      const currentPraxiomAge = await AsyncStorage.getItem('praxiomAge');
      let finalAge = epigeneticAge;
      
      if (currentPraxiomAge) {
        // Average with existing biomarker-based age
        const biomarkerAge = parseFloat(currentPraxiomAge);
        finalAge = (biomarkerAge * 0.6) + (epigeneticAge * 0.4);
      }
      
      await AsyncStorage.setItem('praxiomAge', finalAge.toFixed(1));
      await AsyncStorage.setItem('epigeneticAge', epigeneticAge.toFixed(1));
      await AsyncStorage.setItem('dunedinPACE', pace.toFixed(2));
      await AsyncStorage.setItem('dnaTestDate', new Date().toISOString());
      
      let paceStatus = 'Normal';
      if (pace > 1.2) paceStatus = 'Accelerated';
      else if (pace < 0.9) paceStatus = 'Decelerated';
      
      Alert.alert(
        'DNA Methylation Results',
        `Epigenetic Age: ${epigeneticAge.toFixed(1)} years\n` +
        `Pace Status: ${paceStatus}\n` +
        `Updated Praxiom Age: ${finalAge.toFixed(1)} years`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate epigenetic age');
    }
  };
  
  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={32} color="#00CFC1" />
          <Text style={styles.infoText}>
            DNA Methylation tests measure epigenetic changes that predict biological aging more accurately than chronological age alone.
          </Text>
        </View>
        
        {/* DunedinPACE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="speedometer" size={20} color="#9D4EDD" /> DunedinPACE
          </Text>
          <Text style={styles.helpText}>
            Measures the pace of aging. Values: {'<'}0.9 = slow aging, 1.0 = normal, {'>'}1.2 = accelerated aging
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={dunedinPACE}
            onChangeText={setDunedinPACE}
            placeholder="1.0"
            placeholderTextColor="#666"
          />
          <View style={styles.rangeCard}>
            <Text style={styles.rangeTitle}>Reference Ranges:</Text>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>✅ Optimal</Text>
              <Text style={styles.rangeValue}>{'<'} 0.9 (Slow aging)</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>⚠️ Normal</Text>
              <Text style={styles.rangeValue}>0.9 - 1.1</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>🔴 Risk</Text>
              <Text style={styles.rangeValue}>{'>'}  1.2 (Accelerated aging)</Text>
            </View>
          </View>
        </View>
        
        {/* ELOVL2 Clock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time" size={20} color="#FF8C00" /> ELOVL2 Epigenetic Age
          </Text>
          <Text style={styles.helpText}>
            Your methylation age based on ELOVL2 gene. Should be close to your chronological age (±2 years is optimal).
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={elovl2Age}
            onChangeText={setElovl2Age}
            placeholder="Enter your ELOVL2 age"
            placeholderTextColor="#666"
          />
          <View style={styles.rangeCard}>
            <Text style={styles.rangeTitle}>Interpretation:</Text>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>✅ Excellent</Text>
              <Text style={styles.rangeValue}>Within ±2 years of chronological age</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>⚠️ Moderate</Text>
              <Text style={styles.rangeValue}>±2-5 years deviation</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>🔴 Significant</Text>
              <Text style={styles.rangeValue}>{'>'}±5 years deviation</Text>
            </View>
          </View>
        </View>
        
        {/* Intrinsic Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="fitness" size={20} color="#00CFC1" /> Intrinsic Capacity Score
          </Text>
          <Text style={styles.helpText}>
            WHO's functional aging measure (0-100%). Combines cognition, locomotion, vitality, and sensory function.
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={intrinsicCapacity}
            onChangeText={setIntrinsicCapacity}
            placeholder="85"
            placeholderTextColor="#666"
          />
          <View style={styles.rangeCard}>
            <Text style={styles.rangeTitle}>Reference Ranges:</Text>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>✅ High IC</Text>
              <Text style={styles.rangeValue}>{'>'}85% - Optimal functional capacity</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>⚠️ Moderate IC</Text>
              <Text style={styles.rangeValue}>70-85% - Some functional decline</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeName}>🔴 Low IC</Text>
              <Text style={styles.rangeValue}>{'<'}70% - Significant functional impairment</Text>
            </View>
          </View>
        </View>
        
        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateEpigeneticAdjustment}
        >
          <Ionicons name="analytics" size={24} color="#FFFFFF" />
          <Text style={styles.calculateButtonText}>Calculate Epigenetic Age</Text>
        </TouchableOpacity>
        
        <Text style={styles.footer}>
          * DNA methylation tests should be performed by certified laboratories. Consult with your healthcare provider for test ordering and interpretation.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 13,
    color: '#AAAAAA',
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  rangeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  rangeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  rangeItem: {
    marginBottom: 10,
  },
  rangeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 18,
  },
  calculateButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footer: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 20,
  },
});
