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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const [bioAge, setBioAge] = useState(null);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [oralHealth, setOralHealth] = useState(85);
  const [systemicHealth, setSystemicHealth] = useState(82);
  const [fitnessScore, setFitnessScore] = useState(78);
  
  // Modals
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [showBiomarkerModal, setShowBiomarkerModal] = useState(false);
  const [showTier2, setShowTier2] = useState(false);
  
  // DNA Methylation
  const [dunedinPACE, setDunedinPACE] = useState('');
  const [elovl2Age, setElovl2Age] = useState('');
  
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
  const [il6, setIL6] = useState('');
  const [tnf, setTNF] = useState('');
  const [homaIR, setHomaIR] = useState('');
  const [apob, setApoB] = useState('');
  const [nad, setNAD] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedBioAge = await AsyncStorage.getItem('bioAge');
      const savedChronAge = await AsyncStorage.getItem('chronologicalAge');
      
      if (savedBioAge) setBioAge(parseFloat(savedBioAge));
      if (savedChronAge) setChronologicalAge(parseFloat(savedChronAge));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculatePraxiomAge = () => {
    // Tier 1 Calculations
    let oralScore = 100;
    let systemicScore = 100;
    
    // Oral Health Score
    if (salivaryPH) {
      const ph = parseFloat(salivaryPH);
      if (ph < 6.5 || ph > 7.2) oralScore -= 15;
    }
    if (mmp8) {
      const mmpVal = parseFloat(mmp8);
      if (mmpVal > 60) oralScore -= 20;
    }
    if (flowRate) {
      const flow = parseFloat(flowRate);
      if (flow < 1.5) oralScore -= 10;
    }
    
    // Systemic Health Score
    if (hsCRP) {
      const crp = parseFloat(hsCRP);
      if (crp > 1.0) systemicScore -= 15;
      if (crp > 3.0) systemicScore -= 25;
    }
    if (omega3) {
      const o3 = parseFloat(omega3);
      if (o3 < 8.0) systemicScore -= 10;
    }
    if (hba1c) {
      const a1c = parseFloat(hba1c);
      if (a1c > 5.7) systemicScore -= 15;
    }
    if (gdf15) {
      const gdf = parseFloat(gdf15);
      if (gdf > 1200) systemicScore -= 20;
    }
    if (vitaminD) {
      const vitD = parseFloat(vitaminD);
      if (vitD < 30) systemicScore -= 10;
    }
    
    // Tier 2 adjustments
    if (showTier2) {
      if (il6 && parseFloat(il6) > 2.0) systemicScore -= 10;
      if (tnf && parseFloat(tnf) > 8.0) systemicScore -= 10;
      if (homaIR && parseFloat(homaIR) > 2.5) systemicScore -= 15;
      if (apob && parseFloat(apob) > 90) systemicScore -= 10;
      if (nad && parseFloat(nad) < 40) systemicScore -= 15;
    }
    
    // Calculate Bio-Age
    const baseAge = chronologicalAge || 40;
    const healthDeviation = ((100 - oralScore) + (100 - systemicScore)) / 10;
    const calculatedBioAge = baseAge + healthDeviation;
    
    // DNA Methylation adjustment
    if (dunedinPACE) {
      const pace = parseFloat(dunedinPACE);
      if (pace > 1.0) {
        calculatedBioAge += (pace - 1.0) * 5;
      }
    }
    
    setBioAge(calculatedBioAge);
    setOralHealth(Math.max(0, oralScore));
    setSystemicHealth(Math.max(0, systemicScore));
    
    // Save to storage
    AsyncStorage.setItem('bioAge', calculatedBioAge.toString());
    
    Alert.alert(
      'Praxiom Age Calculated',
      `Your biological age is ${calculatedBioAge.toFixed(1)} years`,
      [{ text: 'OK' }]
    );
    
    setShowBiomarkerModal(false);
  };

  const pushToWatch = () => {
    if (!bioAge) {
      Alert.alert('No Data', 'Calculate your Praxiom Age first!', [{ text: 'OK' }]);
      return;
    }
    
    Alert.alert(
      'Push to Watch',
      `Send Bio-Age ${bioAge.toFixed(1)} to your PineTime watch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // BLE send logic would go here
            Alert.alert('Success!', 'Bio-Age sent to watch', [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      {/* Background Logo */}
      <View style={styles.logoBackground}>
        <Image
          source={require('../assets/praxiom-logo.png')}
          style={styles.backgroundLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Centered Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>PRAXIOM HEALTH</Text>
        </View>

        {/* Bio-Age Card with Push Button */}
        <View style={styles.bioAgeCard}>
          <Text style={styles.cardLabel}>Biological Age</Text>
          <Text style={styles.bioAgeNumber}>
            {bioAge ? bioAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.cardSubtext}>years</Text>
          {chronologicalAge && bioAge && (
            <Text style={styles.comparisonText}>
              {bioAge < chronologicalAge
                ? `${(chronologicalAge - bioAge).toFixed(1)} years younger!`
                : bioAge > chronologicalAge
                ? `${(bioAge - chronologicalAge).toFixed(1)} years older`
                : 'On target!'}
            </Text>
          )}
          {bioAge && (
            <TouchableOpacity style={styles.pushButton} onPress={pushToWatch}>
              <Text style={styles.pushButtonText}>⌚ Push to Watch</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Health Score Cards */}
        <View style={styles.cardsRow}>
          <View style={[styles.healthCard, styles.cardOral]}>
            <Text style={styles.cardLabel}>Oral Health</Text>
            <Text style={styles.cardScore}>{oralHealth}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${oralHealth}%` }]} />
            </View>
          </View>

          <View style={[styles.healthCard, styles.cardSystemic]}>
            <Text style={styles.cardLabel}>Systemic Health</Text>
            <Text style={styles.cardScore}>{systemicHealth}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${systemicHealth}%` }]} />
            </View>
          </View>
        </View>

        {/* Fitness Score */}
        <View style={styles.fitnessCardContainer}>
          <View style={[styles.healthCard, styles.cardFitness]}>
            <Text style={styles.cardLabel}>Fitness Score</Text>
            <Text style={styles.cardScore}>{fitnessScore}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${fitnessScore}%` }]} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowDNAModal(true)}
          >
            <Text style={styles.buttonText}>🧬 DNA Methylation Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowBiomarkerModal(true)}
          >
            <Text style={styles.buttonText}>📊 Input Biomarkers</Text>
          </TouchableOpacity>
        </View>

        {/* Sync Status */}
        <View style={styles.syncCard}>
          <Text style={styles.syncText}>
            Last synced with watch: Just now
          </Text>
        </View>
      </ScrollView>

      {/* DNA Methylation Modal */}
      <Modal
        visible={showDNAModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDNAModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>DNA Methylation Test</Text>
            
            <Text style={styles.inputLabel}>DunedinPACE (Rate)</Text>
            <TextInput
              style={styles.input}
              value={dunedinPACE}
              onChangeText={setDunedinPACE}
              placeholder="1.0 = normal aging"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>ELOVL2 Predicted Age</Text>
            <TextInput
              style={styles.input}
              value={elovl2Age}
              onChangeText={setElovl2Age}
              placeholder="Years"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDNAModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  setShowDNAModal(false);
                  Alert.alert('Saved', 'DNA Methylation data saved', [{ text: 'OK' }]);
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Biomarker Input Modal */}
      <Modal
        visible={showBiomarkerModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBiomarkerModal(false)}
      >
        <LinearGradient
          colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
          style={styles.fullScreenModal}
        >
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.modalTitle}>Biomarker Input</Text>
            
            {/* Tier 1 */}
            <Text style={styles.sectionTitle}>Tier 1 - Foundation</Text>
            
            <Text style={styles.inputLabel}>Oral Health</Text>
            <TextInput
              style={styles.input}
              value={salivaryPH}
              onChangeText={setSalivaryPH}
              placeholder="Salivary pH (6.5-7.2)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              value={mmp8}
              onChangeText={setMmp8}
              placeholder="MMP-8 (ng/mL)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              value={flowRate}
              onChangeText={setFlowRate}
              placeholder="Flow Rate (mL/min)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Systemic Health</Text>
            <TextInput
              style={styles.input}
              value={hsCRP}
              onChangeText={setHsCRP}
              placeholder="hs-CRP (mg/L)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              value={omega3}
              onChangeText={setOmega3}
              placeholder="Omega-3 Index (%)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              value={hba1c}
              onChangeText={setHba1c}
              placeholder="HbA1c (%)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              value={gdf15}
              onChangeText={setGdf15}
              placeholder="GDF-15 (pg/mL)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              value={vitaminD}
              onChangeText={setVitaminD}
              placeholder="Vitamin D (ng/mL)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            {/* Tier 2 Toggle */}
            {!showTier2 && (
              <TouchableOpacity
                style={styles.tier2Button}
                onPress={() => setShowTier2(true)}
              >
                <Text style={styles.buttonText}>⬆️ Upgrade to Tier 2</Text>
              </TouchableOpacity>
            )}
            
            {/* Tier 2 */}
            {showTier2 && (
              <>
                <Text style={styles.sectionTitle}>Tier 2 - Advanced</Text>
                
                <TextInput
                  style={styles.input}
                  value={il6}
                  onChangeText={setIL6}
                  placeholder="IL-6 (pg/mL)"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                
                <TextInput
                  style={styles.input}
                  value={tnf}
                  onChangeText={setTNF}
                  placeholder="TNF-α (pg/mL)"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                
                <TextInput
                  style={styles.input}
                  value={homaIR}
                  onChangeText={setHomaIR}
                  placeholder="HOMA-IR"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                
                <TextInput
                  style={styles.input}
                  value={apob}
                  onChangeText={setApoB}
                  placeholder="ApoB (mg/dL)"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                
                <TextInput
                  style={styles.input}
                  value={nad}
                  onChangeText={setNAD}
                  placeholder="NAD+ (µM)"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </>
            )}
            
            {/* Calculate Button */}
            <TouchableOpacity
              style={styles.calculateButton}
              onPress={calculatePraxiomAge}
            >
              <Text style={styles.buttonText}>🧮 Calculate Praxiom Age</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBiomarkerModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoBackground: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  backgroundLogo: {
    width: '70%',
    height: '100%',
    opacity: 0.2,
  },
  scrollView: {
    flex: 1,
    padding: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    letterSpacing: 2,
  },
  bioAgeCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
    fontWeight: '600',
  },
  bioAgeNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  cardSubtext: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: -5,
  },
  comparisonText: {
    fontSize: 14,
    color: '#00CFC1',
    marginTop: 10,
    fontWeight: '600',
  },
  pushButton: {
    marginTop: 15,
    backgroundColor: '#FF8C00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pushButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  healthCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardOral: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  cardSystemic: {
    borderLeftWidth: 4,
    borderLeftColor: '#00CFC1',
  },
  cardFitness: {
    borderLeftWidth: 4,
    borderLeftColor: '#9B59B6',
  },
  fitnessCardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CFC1',
    borderRadius: 4,
  },
  buttonsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#00CFC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  syncText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  fullScreenModal: {
    flex: 1,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#00CFC1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 10,
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
    backgroundColor: '#95A5A6',
  },
  saveButton: {
    backgroundColor: '#00CFC1',
  },
  tier2Button: {
    backgroundColor: '#9B59B6',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  calculateButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: '#95A5A6',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
});
