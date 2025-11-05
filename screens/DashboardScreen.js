import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  // State for biomarkers and scores
  const [praxiomAge, setPraxiomAge] = useState(null);
  const [oralHealth, setOralHealth] = useState(null);
  const [systemicHealth, setSystemicHealth] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  
  // Live watch data
  const [steps, setSteps] = useState('--');
  const [heartRate, setHeartRate] = useState('--');
  const [oxygen, setOxygen] = useState('--');
  
  // Modal states
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [showBiomarkerModal, setShowBiomarkerModal] = useState(false);
  const [showTier2Modal, setShowTier2Modal] = useState(false);
  
  // DNA Methylation input
  const [dnaMethylation, setDNAMethylation] = useState('');
  
  // Tier 1 biomarker inputs
  const [tier1Biomarkers, setTier1Biomarkers] = useState({
    salivaryPH: '',
    mmp8: '',
    flowRate: '',
    hsCRP: '',
    omega3: '',
    hba1c: '',
    gdf15: ''
  });
  
  // Tier 2 biomarker inputs
  const [tier2Biomarkers, setTier2Biomarkers] = useState({
    il6: '',
    tnfAlpha: '',
    ldlParticles: '',
    apoB: '',
    homocysteine: '',
    ferritin: '',
    vitaminD: ''
  });

  // Function to push Praxiom Age to watch
  const pushToWatch = () => {
    if (praxiomAge === null) {
      Alert.alert('No Bio-Age', 'Please calculate your Tier 1 biomarkers first to generate your Bio-Age.');
      return;
    }
    
    // TODO: Implement BLE communication to watch
    Alert.alert(
      'Sync to Watch',
      `Pushing Bio-Age ${praxiomAge.toFixed(1)} years to your PineTime watch...`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sync Now', 
          onPress: () => {
            // Here you would implement the BLE sync
            console.log('Syncing to watch:', praxiomAge);
            Alert.alert('Success', 'Bio-Age synced to watch!');
          }
        }
      ]
    );
  };

  // Calculate Tier 1 Biomarkers
  const calculateTier1 = () => {
    // Validate that at least some biomarkers are entered
    const hasData = Object.values(tier1Biomarkers).some(val => val !== '');
    
    if (!hasData && dnaMethylation === '') {
      Alert.alert('Missing Data', 'Please enter at least some biomarker values to calculate.');
      return;
    }

    // Simple calculation algorithm (you can make this more sophisticated)
    let baseAge = dnaMethylation ? parseFloat(dnaMethylation) : 40;
    let adjustments = 0;
    let count = 0;

    // Oral Health Score calculation
    let oralScore = 85; // Default
    if (tier1Biomarkers.salivaryPH) {
      const ph = parseFloat(tier1Biomarkers.salivaryPH);
      if (ph < 6.5 || ph > 7.2) oralScore -= 10;
      count++;
    }
    if (tier1Biomarkers.mmp8) {
      const mmp = parseFloat(tier1Biomarkers.mmp8);
      if (mmp > 60) oralScore -= 15;
      count++;
    }
    if (tier1Biomarkers.flowRate) {
      const flow = parseFloat(tier1Biomarkers.flowRate);
      if (flow < 1.5) oralScore -= 10;
      count++;
    }
    setOralHealth(Math.max(50, Math.min(100, oralScore)));

    // Systemic Health Score calculation
    let systemicScore = 85; // Default
    if (tier1Biomarkers.hsCRP) {
      const crp = parseFloat(tier1Biomarkers.hsCRP);
      if (crp > 1.0) {
        systemicScore -= 20;
        adjustments += 2;
      }
      count++;
    }
    if (tier1Biomarkers.omega3) {
      const omega = parseFloat(tier1Biomarkers.omega3);
      if (omega < 8.0) {
        systemicScore -= 10;
        adjustments += 1;
      }
      count++;
    }
    if (tier1Biomarkers.hba1c) {
      const hba = parseFloat(tier1Biomarkers.hba1c);
      if (hba > 5.7) {
        systemicScore -= 15;
        adjustments += 1.5;
      }
      count++;
    }
    if (tier1Biomarkers.gdf15) {
      const gdf = parseFloat(tier1Biomarkers.gdf15);
      if (gdf > 1200) {
        systemicScore -= 25;
        adjustments += 3;
      }
      count++;
    }
    setSystemicHealth(Math.max(50, Math.min(100, systemicScore)));

    // Calculate final Bio-Age
    const finalAge = baseAge + (adjustments / Math.max(1, count)) * 2;
    setPraxiomAge(finalAge);

    // Estimate fitness score based on overall health
    const avgScore = (oralScore + systemicScore) / 2;
    if (avgScore >= 85) setFitnessScore(90);
    else if (avgScore >= 70) setFitnessScore(75);
    else setFitnessScore(60);

    Alert.alert(
      'Calculation Complete',
      `Your Bio-Age: ${finalAge.toFixed(1)} years\nOral Health: ${oralScore}%\nSystemic Health: ${systemicScore}%`,
      [{ text: 'OK' }]
    );
  };

  // Save DNA Methylation
  const saveDNAMethylation = () => {
    if (dnaMethylation === '') {
      Alert.alert('Missing Value', 'Please enter your DNA Methylation age.');
      return;
    }
    
    const age = parseFloat(dnaMethylation);
    if (isNaN(age) || age < 20 || age > 120) {
      Alert.alert('Invalid Value', 'Please enter a valid age between 20 and 120.');
      return;
    }

    Alert.alert('Saved', `DNA Methylation age of ${age} years has been recorded.`);
    setShowDNAModal(false);
  };

  // Save Tier 1 Biomarkers
  const saveTier1Biomarkers = () => {
    setShowBiomarkerModal(false);
    Alert.alert('Saved', 'Tier 1 biomarkers have been recorded.');
  };

  // Save Tier 2 Biomarkers
  const saveTier2Biomarkers = () => {
    setShowTier2Modal(false);
    Alert.alert('Saved', 'Tier 2 biomarkers have been recorded.');
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>PH</Text>
          </View>
          <Text style={styles.headerText}>Praxiom Health</Text>
        </View>

        {/* Praxiom Age Card */}
        <TouchableOpacity 
          style={[styles.mainCard, styles.praxiomAgeCard]}
          onPress={pushToWatch}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>Praxiom Age</Text>
          <View style={styles.ageValueContainer}>
            <Text style={styles.ageValue}>
              {praxiomAge !== null ? praxiomAge.toFixed(1) : '--'}
            </Text>
          </View>
          <Text style={styles.ageLabel}>years</Text>
          <Text style={styles.tapToSync}>
            {praxiomAge !== null ? 'Tap to sync to watch' : 'Calculate biomarkers first'}
          </Text>
        </TouchableOpacity>

        {/* Health Score Cards Row */}
        <View style={styles.cardRow}>
          <View style={[styles.card, styles.orangeCard]}>
            <Text style={styles.cardTitle}>Oral Health</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>
                {oralHealth !== null ? oralHealth : '--'}
              </Text>
            </View>
            <Text style={styles.scoreLabel}>score</Text>
          </View>

          <View style={[styles.card, styles.orangeCard]}>
            <Text style={styles.cardTitle}>Systemic Health</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>
                {systemicHealth !== null ? systemicHealth : '--'}
              </Text>
            </View>
            <Text style={styles.scoreLabel}>score</Text>
          </View>
        </View>

        {/* Fitness and Watch Cards Row */}
        <View style={styles.cardRow}>
          <View style={[styles.card, styles.cyanCard]}>
            <Text style={styles.cardTitle}>Fitness Score</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>
                {fitnessScore !== null ? fitnessScore : '--'}
              </Text>
            </View>
            <Text style={styles.scoreLabel}>level</Text>
          </View>

          <View style={[styles.card, styles.cyanCard]}>
            <Text style={styles.cardTitle}>Live Watch</Text>
            <View style={styles.liveWatchContent}>
              <View style={styles.liveWatchRow}>
                <Text style={styles.liveWatchLabel}>Steps</Text>
                <Text style={styles.liveWatchValue}>{steps}</Text>
              </View>
              <View style={styles.liveWatchRow}>
                <Text style={styles.liveWatchLabel}>HR</Text>
                <Text style={styles.liveWatchValue}>{heartRate}</Text>
              </View>
              <View style={styles.liveWatchRow}>
                <Text style={styles.liveWatchLabel}>O₂</Text>
                <Text style={styles.liveWatchValue}>{oxygen}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.orangeButton]}
          onPress={() => setShowDNAModal(true)}
        >
          <Text style={styles.buttonText}>🧬 DNA Methylation Test</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.purpleButton]}
          onPress={() => setShowBiomarkerModal(true)}
        >
          <Text style={styles.buttonText}>📝 Input Biomarkers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.cyanButton]}
          onPress={calculateTier1}
        >
          <Text style={styles.buttonText}>📊 Calculate Tier 1 Biomarkers</Text>
        </TouchableOpacity>

        {/* DNA Methylation Modal */}
        <Modal
          visible={showDNAModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDNAModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>DNA Methylation Test</Text>
              <Text style={styles.modalDescription}>
                Enter your biological age from DNA methylation testing
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter age (years)"
                keyboardType="decimal-pad"
                value={dnaMethylation}
                onChangeText={setDNAMethylation}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDNAModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveDNAMethylation}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Tier 1 Biomarkers Modal */}
        <Modal
          visible={showBiomarkerModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBiomarkerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Tier 1 Biomarkers</Text>
                
                <Text style={styles.sectionHeader}>Oral Health</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Salivary pH (6.5-7.2)"
                  keyboardType="decimal-pad"
                  value={tier1Biomarkers.salivaryPH}
                  onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, salivaryPH: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="MMP-8 ng/mL (<60)"
                  keyboardType="decimal-pad"
                  value={tier1Biomarkers.mmp8}
                  onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, mmp8: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Flow Rate mL/min (>1.5)"
                  keyboardType="decimal-pad"
                  value={tier1Biomarkers.flowRate}
                  onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, flowRate: val})}
                />

                <Text style={styles.sectionHeader}>Systemic Health</Text>
                <TextInput
                  style={styles.input}
                  placeholder="hs-CRP mg/L (<1.0)"
                  keyboardType="decimal-pad"
                  value={tier1Biomarkers.hsCRP}
                  onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, hsCRP: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Omega-3 Index % (>8.0)"
                  keyboardType="decimal-pad"
                  value={tier1Biomarkers.omega3}
                  onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, omega3: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="HbA1c % (<5.7)"
                  keyboardType="decimal-pad"
                  value={tier1Biomarkers.hba1c}
                  onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, hba1c: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="GDF-15 pg/mL (<1200)"
                  keyboardType="decimal-pad"
                  value={tier1Biomarkers.gdf15}
                  onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, gdf15: val})}
                />

                {/* Upgrade to Tier 2 Button */}
                <TouchableOpacity 
                  style={[styles.upgradeButton]}
                  onPress={() => {
                    setShowBiomarkerModal(false);
                    setTimeout(() => setShowTier2Modal(true), 300);
                  }}
                >
                  <Text style={styles.upgradeButtonText}>⬆️ Upgrade to Tier 2</Text>
                </TouchableOpacity>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowBiomarkerModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveTier1Biomarkers}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Tier 2 Biomarkers Modal */}
        <Modal
          visible={showTier2Modal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTier2Modal(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Tier 2 Biomarkers</Text>
                <Text style={styles.modalDescription}>
                  Advanced biomarker panel for deeper health insights
                </Text>
                
                <Text style={styles.sectionHeader}>Advanced Inflammation</Text>
                <TextInput
                  style={styles.input}
                  placeholder="IL-6 pg/mL"
                  keyboardType="decimal-pad"
                  value={tier2Biomarkers.il6}
                  onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, il6: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="TNF-α pg/mL"
                  keyboardType="decimal-pad"
                  value={tier2Biomarkers.tnfAlpha}
                  onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, tnfAlpha: val})}
                />

                <Text style={styles.sectionHeader}>Cardiovascular</Text>
                <TextInput
                  style={styles.input}
                  placeholder="LDL Particles nmol/L"
                  keyboardType="decimal-pad"
                  value={tier2Biomarkers.ldlParticles}
                  onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, ldlParticles: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ApoB mg/dL"
                  keyboardType="decimal-pad"
                  value={tier2Biomarkers.apoB}
                  onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, apoB: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Homocysteine µmol/L"
                  keyboardType="decimal-pad"
                  value={tier2Biomarkers.homocysteine}
                  onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, homocysteine: val})}
                />

                <Text style={styles.sectionHeader}>Metabolic</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ferritin ng/mL"
                  keyboardType="decimal-pad"
                  value={tier2Biomarkers.ferritin}
                  onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, ferritin: val})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Vitamin D ng/mL"
                  keyboardType="decimal-pad"
                  value={tier2Biomarkers.vitaminD}
                  onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, vitaminD: val})}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowTier2Modal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveTier2Biomarkers}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    marginRight: 10,
    backgroundColor: '#333',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  praxiomAgeCard: {
    borderWidth: 3,
    borderColor: '#00CFC1',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 15,
  },
  ageValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageValue: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  ageLabel: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  tapToSync: {
    fontSize: 12,
    color: '#00CFC1',
    marginTop: 10,
    fontStyle: 'italic',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  orangeCard: {
    borderWidth: 3,
    borderColor: '#FF8C00',
  },
  cyanCard: {
    borderWidth: 3,
    borderColor: '#00CFC1',
  },
  scoreContainer: {
    marginVertical: 10,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#888',
  },
  liveWatchContent: {
    width: '100%',
    marginTop: 10,
  },
  liveWatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  liveWatchLabel: {
    fontSize: 14,
    color: '#666',
  },
  liveWatchValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00CFC1',
  },
  actionButton: {
    borderRadius: 30,
    padding: 18,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  orangeButton: {
    backgroundColor: '#FF8C00',
  },
  purpleButton: {
    backgroundColor: '#9C27B0',
  },
  cyanButton: {
    backgroundColor: '#00CFC1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C00',
    marginTop: 15,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    fontSize: 14,
  },
  upgradeButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#00CFC1',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
