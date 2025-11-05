import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const [healthData, setHealthData] = useState({
    chronologicalAge: null,
    dnaMethylationAge: null,
    praxiomAge: null,
    oralHealth: null,
    systemicHealth: null,
    fitnessScore: null,
  });

  // Biomarker input states
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [showBiomarkerModal, setShowBiomarkerModal] = useState(false);
  const [showTier2, setShowTier2] = useState(false);
  
  // DNA Methylation
  const [dnaMethAge, setDnaMethAge] = useState('');
  
  // Tier 1 Biomarkers
  const [tier1Data, setTier1Data] = useState({
    salivaryPH: '',
    mmp8: '',
    flowRate: '',
    hsCRP: '',
    omega3: '',
    hbA1c: '',
    gdf15: '',
  });

  // Tier 2 Biomarkers
  const [tier2Data, setTier2Data] = useState({
    il6: '',
    tnfAlpha: '',
    ldlParticles: '',
    apoB: '',
    homocysteine: '',
    ferritin: '',
    vitaminD: '',
  });

  // Date of Birth for chronological age
  const [dob, setDob] = useState({ year: '', month: '', day: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem('healthData');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHealthData(parsed);
        
        // Load DOB if available
        if (parsed.dob) {
          setDob(parsed.dob);
        }
        
        // Load DNA methylation age
        if (parsed.dnaMethylationAge) {
          setDnaMethAge(parsed.dnaMethylationAge.toString());
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const saveData = async (newData) => {
    try {
      await AsyncStorage.setItem('healthData', JSON.stringify(newData));
      setHealthData(newData);
    } catch (error) {
      console.error('Save data error:', error);
    }
  };

  const calculateChronologicalAge = () => {
    if (!dob.year || !dob.month || !dob.day) return null;
    
    const birthDate = new Date(dob.year, dob.month - 1, dob.day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDNAMethylationSubmit = () => {
    const age = parseFloat(dnaMethAge);
    
    if (!age || age < 20 || age > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 20 and 120 years.');
      return;
    }

    const chronoAge = calculateChronologicalAge();
    
    const updated = {
      ...healthData,
      dnaMethylationAge: age,
      chronologicalAge: chronoAge,
      dob: dob,
    };
    
    saveData(updated);
    setShowDNAModal(false);
    Alert.alert('Success', `DNA Methylation Age recorded: ${age} years`);
  };

  const calculateBiomarkers = () => {
    // Validate required fields
    const required = ['salivaryPH', 'mmp8', 'flowRate', 'hsCRP', 'omega3', 'hbA1c', 'gdf15'];
    const missing = required.filter(field => !tier1Data[field] || tier1Data[field].trim() === '');
    
    if (missing.length > 0) {
      Alert.alert('Missing Data', 'Please fill in all Tier 1 biomarker fields.');
      return;
    }

    // Parse values
    const salivaryPH = parseFloat(tier1Data.salivaryPH);
    const mmp8 = parseFloat(tier1Data.mmp8);
    const flowRate = parseFloat(tier1Data.flowRate);
    const hsCRP = parseFloat(tier1Data.hsCRP);
    const omega3 = parseFloat(tier1Data.omega3);
    const hbA1c = parseFloat(tier1Data.hbA1c);
    const gdf15 = parseFloat(tier1Data.gdf15);

    // Calculate Oral Health Score
    let oralScore = 100;
    
    // Salivary pH (optimal: 6.5-7.2)
    if (salivaryPH < 6.5) oralScore -= (6.5 - salivaryPH) * 8;
    else if (salivaryPH > 7.2) oralScore -= (salivaryPH - 7.2) * 10;
    
    // MMP-8 (optimal: <60 ng/mL)
    if (mmp8 > 60) oralScore -= ((mmp8 - 60) / 40) * 20;
    
    // Flow Rate (optimal: >1.5 mL/min)
    if (flowRate < 1.5) oralScore -= ((1.5 - flowRate) / 1.5) * 25;
    
    oralScore = Math.max(0, Math.min(100, oralScore));

    // Calculate Systemic Health Score
    let systemicScore = 100;
    
    // hs-CRP (optimal: <1.0 mg/L)
    if (hsCRP > 1.0) systemicScore -= ((hsCRP - 1.0) / 2.0) * 25;
    
    // Omega-3 Index (optimal: >8.0%)
    if (omega3 < 8.0) systemicScore -= ((8.0 - omega3) / 8.0) * 20;
    
    // HbA1c (optimal: <5.7%)
    if (hbA1c > 5.7) systemicScore -= ((hbA1c - 5.7) / 1.3) * 30;
    
    // GDF-15 (optimal: <1200 pg/mL)
    if (gdf15 > 1200) systemicScore -= ((gdf15 - 1200) / 800) * 25;
    
    systemicScore = Math.max(0, Math.min(100, systemicScore));

    // Calculate Fitness Score (derived from oral and systemic)
    const fitnessScore = (oralScore * 0.3 + systemicScore * 0.7);

    // Calculate Praxiom Age
    const chronoAge = healthData.chronologicalAge || calculateChronologicalAge() || 40;
    const dnaMethAge = healthData.dnaMethylationAge || chronoAge;
    
    // Combine scores with DNA methylation age
    const healthImpact = ((100 - oralScore) * 0.15) + ((100 - systemicScore) * 0.35);
    const praxiomAge = dnaMethAge + (healthImpact * 0.3);

    // Update health data
    const updated = {
      ...healthData,
      oralHealth: Math.round(oralScore),
      systemicHealth: Math.round(systemicScore),
      fitnessScore: Math.round(fitnessScore),
      praxiomAge: Math.round(praxiomAge * 10) / 10,
      tier1Data: tier1Data,
      tier2Data: showTier2 ? tier2Data : null,
    };

    saveData(updated);
    setShowBiomarkerModal(false);
    setShowTier2(false);
    
    Alert.alert(
      'Calculation Complete!',
      `Your Praxiom Age: ${Math.round(praxiomAge * 10) / 10} years\n\n` +
      `Oral Health: ${Math.round(oralScore)}%\n` +
      `Systemic Health: ${Math.round(systemicScore)}%\n` +
      `Fitness Score: ${Math.round(fitnessScore)}%`
    );
  };

  const renderDNAModal = () => (
    <Modal
      visible={showDNAModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDNAModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🧬 DNA Methylation Test</Text>
          <Text style={styles.modalSubtitle}>Enter your DNA methylation age result</Text>
          
          {!healthData.chronologicalAge && (
            <>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.dobRow}>
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="YYYY"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={dob.year}
                  onChangeText={(text) => setDob({...dob, year: text})}
                />
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dob.month}
                  onChangeText={(text) => setDob({...dob, month: text})}
                />
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="DD"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dob.day}
                  onChangeText={(text) => setDob({...dob, day: text})}
                />
              </View>
            </>
          )}
          
          <Text style={styles.inputLabel}>DNA Methylation Age (years)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 35.5"
            keyboardType="decimal-pad"
            value={dnaMethAge}
            onChangeText={setDnaMethAge}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDNAModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleDNAMethylationSubmit}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBiomarkerModal = () => (
    <Modal
      visible={showBiomarkerModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        setShowBiomarkerModal(false);
        setShowTier2(false);
      }}
    >
      <ScrollView style={styles.biomarkerModal}>
        <View style={styles.biomarkerHeader}>
          <Text style={styles.biomarkerTitle}>
            {showTier2 ? '📊 Tier 1 & 2 Biomarkers' : '📊 Tier 1 Biomarkers'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowBiomarkerModal(false);
              setShowTier2(false);
            }}
          >
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tier 1 Section */}
        <View style={styles.tierSection}>
          <Text style={styles.sectionTitle}>🦷 Oral Health</Text>
          
          <Text style={styles.inputLabel}>Salivary pH (6.5-7.2)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 6.8"
            keyboardType="decimal-pad"
            value={tier1Data.salivaryPH}
            onChangeText={(text) => setTier1Data({...tier1Data, salivaryPH: text})}
          />
          
          <Text style={styles.inputLabel}>MMP-8 (ng/mL, &lt;60)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 45"
            keyboardType="decimal-pad"
            value={tier1Data.mmp8}
            onChangeText={(text) => setTier1Data({...tier1Data, mmp8: text})}
          />
          
          <Text style={styles.inputLabel}>Salivary Flow Rate (mL/min, &gt;1.5)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2.0"
            keyboardType="decimal-pad"
            value={tier1Data.flowRate}
            onChangeText={(text) => setTier1Data({...tier1Data, flowRate: text})}
          />
        </View>

        <View style={styles.tierSection}>
          <Text style={styles.sectionTitle}>❤️ Systemic Health</Text>
          
          <Text style={styles.inputLabel}>hs-CRP (mg/L, &lt;1.0)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 0.8"
            keyboardType="decimal-pad"
            value={tier1Data.hsCRP}
            onChangeText={(text) => setTier1Data({...tier1Data, hsCRP: text})}
          />
          
          <Text style={styles.inputLabel}>Omega-3 Index (%, &gt;8.0)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 8.5"
            keyboardType="decimal-pad"
            value={tier1Data.omega3}
            onChangeText={(text) => setTier1Data({...tier1Data, omega3: text})}
          />
          
          <Text style={styles.inputLabel}>HbA1c (%, &lt;5.7)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5.4"
            keyboardType="decimal-pad"
            value={tier1Data.hbA1c}
            onChangeText={(text) => setTier1Data({...tier1Data, hbA1c: text})}
          />
          
          <Text style={styles.inputLabel}>GDF-15 (pg/mL, &lt;1200)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1000"
            keyboardType="decimal-pad"
            value={tier1Data.gdf15}
            onChangeText={(text) => setTier1Data({...tier1Data, gdf15: text})}
          />
        </View>

        {/* Tier 2 Section (conditional) */}
        {showTier2 && (
          <>
            <View style={styles.tierSection}>
              <Text style={styles.sectionTitle}>🔬 Advanced Inflammation</Text>
              
              <Text style={styles.inputLabel}>IL-6 (pg/mL, &lt;3.0)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2.5"
                keyboardType="decimal-pad"
                value={tier2Data.il6}
                onChangeText={(text) => setTier2Data({...tier2Data, il6: text})}
              />
              
              <Text style={styles.inputLabel}>TNF-α (pg/mL, &lt;8.0)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 6.5"
                keyboardType="decimal-pad"
                value={tier2Data.tnfAlpha}
                onChangeText={(text) => setTier2Data({...tier2Data, tnfAlpha: text})}
              />
            </View>

            <View style={styles.tierSection}>
              <Text style={styles.sectionTitle}>💓 Cardiovascular</Text>
              
              <Text style={styles.inputLabel}>LDL Particles (nmol/L, &lt;1000)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 900"
                keyboardType="decimal-pad"
                value={tier2Data.ldlParticles}
                onChangeText={(text) => setTier2Data({...tier2Data, ldlParticles: text})}
              />
              
              <Text style={styles.inputLabel}>ApoB (mg/dL, &lt;90)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 85"
                keyboardType="decimal-pad"
                value={tier2Data.apoB}
                onChangeText={(text) => setTier2Data({...tier2Data, apoB: text})}
              />
              
              <Text style={styles.inputLabel}>Homocysteine (μmol/L, &lt;10)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 8.5"
                keyboardType="decimal-pad"
                value={tier2Data.homocysteine}
                onChangeText={(text) => setTier2Data({...tier2Data, homocysteine: text})}
              />
            </View>

            <View style={styles.tierSection}>
              <Text style={styles.sectionTitle}>⚡ Metabolic</Text>
              
              <Text style={styles.inputLabel}>Ferritin (ng/mL, 30-200)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 100"
                keyboardType="decimal-pad"
                value={tier2Data.ferritin}
                onChangeText={(text) => setTier2Data({...tier2Data, ferritin: text})}
              />
              
              <Text style={styles.inputLabel}>Vitamin D (ng/mL, &gt;30)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 45"
                keyboardType="decimal-pad"
                value={tier2Data.vitaminD}
                onChangeText={(text) => setTier2Data({...tier2Data, vitaminD: text})}
              />
            </View>
          </>
        )}

        {/* Upgrade to Tier 2 Button */}
        {!showTier2 && (
          <TouchableOpacity
            style={styles.tier2Button}
            onPress={() => setShowTier2(true)}
          >
            <Text style={styles.tier2ButtonText}>⬆️ Upgrade to Tier 2</Text>
          </TouchableOpacity>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateBiomarkers}
        >
          <Text style={styles.calculateButtonText}>
            Calculate Praxiom Age
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Modal>
  );

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>
        </View>

        {/* Health Score Title */}
        <Text style={styles.pageTitle}>Your Health Score</Text>

        {/* Top Row - Oral & Systemic Health */}
        <View style={styles.row}>
          <View style={[styles.card, styles.smallCard]}>
            <Text style={styles.cardEmoji}>🧡</Text>
            <Text style={styles.cardLabel}>Oral Health</Text>
            <Text style={styles.cardValue}>
              {healthData.oralHealth || '82'}
            </Text>
            <Text style={styles.cardPercent}>
              {healthData.oralHealth ? healthData.oralHealth + '%' : '82%'}
            </Text>
          </View>

          <View style={[styles.card, styles.smallCard]}>
            <Text style={styles.cardEmoji}>❤️</Text>
            <Text style={styles.cardLabel}>Systemic Health</Text>
            <Text style={styles.cardValue}>
              {healthData.systemicHealth || '78'}
            </Text>
            <Text style={styles.cardPercent}>
              {healthData.systemicHealth ? healthData.systemicHealth + '%' : '78%'}
            </Text>
          </View>
        </View>

        {/* Bottom - Fitness Score */}
        <View style={[styles.card, styles.largeCard]}>
          <Text style={styles.cardEmoji}>💪</Text>
          <Text style={styles.cardLabel}>Fitness Score</Text>
          <Text style={styles.cardValue}>
            {healthData.fitnessScore || '85'}
          </Text>
          <Text style={styles.cardPercent}>
            {healthData.fitnessScore ? healthData.fitnessScore + '%' : '85%'}
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dnaButton]}
            onPress={() => setShowDNAModal(true)}
          >
            <Text style={styles.actionButtonText}>🧬 DNA Methylation Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.biomarkerButton]}
            onPress={() => setShowBiomarkerModal(true)}
          >
            <Text style={styles.actionButtonText}>📝 Input Biomarkers</Text>
          </TouchableOpacity>
        </View>

        {/* Praxiom Age Display (if calculated) */}
        {healthData.praxiomAge && (
          <View style={[styles.card, styles.praxiomCard]}>
            <Text style={styles.praxiomLabel}>Your Praxiom Age</Text>
            <Text style={styles.praxiomValue}>{healthData.praxiomAge}</Text>
            <Text style={styles.praxiomYears}>years</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderDNAModal()}
      {renderBiomarkerModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  smallCard: {
    width: (SCREEN_WIDTH - 55) / 2,
  },
  largeCard: {
    width: '100%',
    marginBottom: 20,
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#95a5a6',
  },
  cardPercent: {
    fontSize: 16,
    color: '#95a5a6',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    width: (SCREEN_WIDTH - 55) / 2,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  dnaButton: {
    backgroundColor: '#FF8C00',
  },
  biomarkerButton: {
    backgroundColor: '#9C27B0',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  praxiomCard: {
    backgroundColor: '#00CFC1',
  },
  praxiomLabel: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  praxiomValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
  },
  praxiomYears: {
    fontSize: 20,
    color: 'white',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: SCREEN_WIDTH - 60,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  dobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dobInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  submitButton: {
    backgroundColor: '#00CFC1',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Biomarker Modal Styles
  biomarkerModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  biomarkerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  biomarkerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 32,
    color: '#95a5a6',
    fontWeight: '300',
  },
  tierSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  tier2Button: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  tier2ButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    margin: 20,
  },
  calculateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
