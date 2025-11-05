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

export default function BiomarkerInputScreen({ navigation }) {
  const [tier, setTier] = useState(1);
  
  // Tier 1 Biomarkers
  const [salivaryPH, setSalivaryPH] = useState('');
  const [mmp8, setMmp8] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [hsCRP, setHsCRP] = useState('');
  const [omega3, setOmega3] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');
  
  // Tier 2 Biomarkers
  const [il6, setIl6] = useState('');
  const [tnfAlpha, setTnfAlpha] = useState('');
  const [proteinCarbonyls, setProteinCarbonyls] = useState('');
  const [ldlParticles, setLdlParticles] = useState('');
  const [apoB, setApoB] = useState('');
  const [homocysteine, setHomocysteine] = useState('');
  const [ferritin, setFerritin] = useState('');
  
  const calculatePraxiomAge = async () => {
    try {
      const chronAge = await AsyncStorage.getItem('chronologicalAge');
      const age = chronAge ? parseFloat(chronAge) : 40;
      
      // Oral Health Score Calculation
      const phScore = calculatePHScore(parseFloat(salivaryPH) || 7.0);
      const mmp8Score = calculateMMP8Score(parseFloat(mmp8) || 0);
      const flowScore = calculateFlowScore(parseFloat(flowRate) || 1.5);
      
      const oralHealthScore = ((phScore + mmp8Score + flowScore) / 3) * 100;
      
      // Systemic Health Score Calculation
      const crpScore = calculateCRPScore(parseFloat(hsCRP) || 1.0);
      const omega3Score = calculateOmega3Score(parseFloat(omega3) || 8.0);
      const hba1cScore = calculateHbA1cScore(parseFloat(hba1c) || 5.5);
      const gdf15Score = calculateGDF15Score(parseFloat(gdf15) || 1000);
      const vitDScore = calculateVitaminDScore(parseFloat(vitaminD) || 30);
      
      const systemicHealthScore = ((crpScore + omega3Score + hba1cScore + gdf15Score + vitDScore) / 5) * 100;
      
      // Age-Stratified Bio-Age Calculation
      let alpha;
      if (age < 50) alpha = 0.08;
      else if (age <= 70) alpha = 0.12;
      else alpha = 0.15;
      
      const avgHealth = (oralHealthScore + systemicHealthScore) / 2;
      const healthDeviation = (100 - avgHealth) * alpha;
      
      const praxiomAge = age + healthDeviation;
      
      // Save results
      await AsyncStorage.setItem('praxiomAge', praxiomAge.toFixed(1));
      await AsyncStorage.setItem('oralHealthScore', oralHealthScore.toFixed(0));
      await AsyncStorage.setItem('systemicHealthScore', systemicHealthScore.toFixed(0));
      await AsyncStorage.setItem('biomarkerDate', new Date().toISOString());
      
      Alert.alert(
        'Success!',
        `Praxiom Age: ${praxiomAge.toFixed(1)} years\nOral Health: ${oralHealthScore.toFixed(0)}%\nSystemic Health: ${systemicHealthScore.toFixed(0)}%`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate Bio-Age');
    }
  };
  
  // Scoring functions
  const calculatePHScore = (ph) => {
    if (ph >= 6.5 && ph <= 7.2) return 1.0;
    if ((ph >= 6.0 && ph < 6.5) || (ph > 7.2 && ph <= 7.5)) return 0.7;
    return 0.3;
  };
  
  const calculateMMP8Score = (mmp8) => {
    if (mmp8 < 60) return 1.0;
    if (mmp8 <= 100) return 0.5;
    return 0.2;
  };
  
  const calculateFlowScore = (flow) => {
    if (flow >= 1.5) return 1.0;
    if (flow >= 1.0) return 0.7;
    return 0.3;
  };
  
  const calculateCRPScore = (crp) => {
    if (crp < 1.0) return 1.0;
    if (crp <= 3.0) return 0.6;
    return 0.2;
  };
  
  const calculateOmega3Score = (omega3) => {
    if (omega3 > 8.0) return 1.0;
    if (omega3 >= 6.0) return 0.7;
    return 0.3;
  };
  
  const calculateHbA1cScore = (hba1c) => {
    if (hba1c < 5.7) return 1.0;
    if (hba1c <= 6.4) return 0.6;
    return 0.2;
  };
  
  const calculateGDF15Score = (gdf15) => {
    if (gdf15 < 1200) return 1.0;
    if (gdf15 <= 1800) return 0.6;
    return 0.2;
  };
  
  const calculateVitaminDScore = (vitD) => {
    if (vitD > 30) return 1.0;
    if (vitD >= 20) return 0.7;
    return 0.3;
  };
  
  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tier Selector */}
        <View style={styles.tierSelector}>
          <TouchableOpacity
            style={[styles.tierButton, tier === 1 && styles.tierButtonActive]}
            onPress={() => setTier(1)}
          >
            <Text style={[styles.tierButtonText, tier === 1 && styles.tierButtonTextActive]}>
              Tier 1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tierButton, tier === 2 && styles.tierButtonActive]}
            onPress={() => setTier(2)}
          >
            <Text style={[styles.tierButtonText, tier === 2 && styles.tierButtonTextActive]}>
              Tier 2
            </Text>
          </TouchableOpacity>
        </View>
        
        {tier === 1 && (
          <>
            {/* Oral Health Biomarkers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="medical" size={20} color="#FF8C00" /> Oral Health
              </Text>
              
              <Text style={styles.label}>Salivary pH (Optimal: 6.5-7.2)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={salivaryPH}
                onChangeText={setSalivaryPH}
                placeholder="7.0"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>MMP-8 ng/mL (Optimal: {'<'}60)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={mmp8}
                onChangeText={setMmp8}
                placeholder="50"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Flow Rate mL/min (Optimal: {'>'}1.5)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={flowRate}
                onChangeText={setFlowRate}
                placeholder="1.5"
                placeholderTextColor="#666"
              />
            </View>
            
            {/* Systemic Health Biomarkers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="heart" size={20} color="#00CFC1" /> Systemic Health
              </Text>
              
              <Text style={styles.label}>hs-CRP mg/L (Optimal: {'<'}1.0)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={hsCRP}
                onChangeText={setHsCRP}
                placeholder="0.8"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Omega-3 Index % (Optimal: {'>'}8.0)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={omega3}
                onChangeText={setOmega3}
                placeholder="8.5"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>HbA1c % (Optimal: {'<'}5.7)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={hba1c}
                onChangeText={setHba1c}
                placeholder="5.5"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>GDF-15 pg/mL (Optimal: {'<'}1200)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={gdf15}
                onChangeText={setGdf15}
                placeholder="1000"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Vitamin D ng/mL (Optimal: {'>'}30)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={vitaminD}
                onChangeText={setVitaminD}
                placeholder="35"
                placeholderTextColor="#666"
              />
            </View>
          </>
        )}
        
        {tier === 2 && (
          <>
            {/* Advanced Inflammatory Panel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="flame" size={20} color="#FF6B6B" /> Advanced Inflammatory
              </Text>
              
              <Text style={styles.label}>IL-6 pg/mL (Optimal: {'<'}2.0)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={il6}
                onChangeText={setIl6}
                placeholder="1.5"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>TNF-α pg/mL (Optimal: {'<'}3.0)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={tnfAlpha}
                onChangeText={setTnfAlpha}
                placeholder="2.5"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Protein Carbonyls nmol/mg (Optimal: {'<'}2.0)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={proteinCarbonyls}
                onChangeText={setProteinCarbonyls}
                placeholder="1.5"
                placeholderTextColor="#666"
              />
            </View>
            
            {/* Metabolic Markers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="trending-up" size={20} color="#9D4EDD" /> Metabolic
              </Text>
              
              <Text style={styles.label}>LDL Particles nmol/L (Optimal: {'<'}1000)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={ldlParticles}
                onChangeText={setLdlParticles}
                placeholder="900"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>ApoB mg/dL (Optimal: {'<'}80)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={apoB}
                onChangeText={setApoB}
                placeholder="70"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Homocysteine μmol/L (Optimal: {'<'}10)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={homocysteine}
                onChangeText={setHomocysteine}
                placeholder="8"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Ferritin ng/mL (Optimal: 50-150)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={ferritin}
                onChangeText={setFerritin}
                placeholder="100"
                placeholderTextColor="#666"
              />
            </View>
          </>
        )}
        
        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculatePraxiomAge}
        >
          <Ionicons name="calculator" size={24} color="#FFFFFF" />
          <Text style={styles.calculateButtonText}>Calculate Praxiom Age</Text>
        </TouchableOpacity>
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
  tierSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tierButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tierButtonActive: {
    backgroundColor: '#00CFC1',
  },
  tierButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  tierButtonTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#00CFC1',
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
});
