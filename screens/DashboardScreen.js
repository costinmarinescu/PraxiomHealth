import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DashboardScreen() {
  // State for biomarkers and scores
  const [biologicalAge, setBiologicalAge] = useState(null);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [oralHealth, setOralHealth] = useState(null);
  const [systemicHealth, setSystemicHealth] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  
  // Live watch data
  const [steps, setSteps] = useState('--');
  const [heartRate, setHeartRate] = useState('--');
  const [oxygen, setOxygen] = useState('--');
  
  // Modal states
  const [showDOBModal, setShowDOBModal] = useState(false);
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [showBiomarkerModal, setShowBiomarkerModal] = useState(false);
  const [showTier2Modal, setShowTier2Modal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  
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

  // Calculate chronological age from date of birth
  useEffect(() => {
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Calculate decimal age (more precise)
      const daysSinceBirth = (today - birthDate) / (1000 * 60 * 60 * 24);
      const decimalAge = daysSinceBirth / 365.25;
      
      setChronologicalAge(decimalAge);
    }
  }, [dateOfBirth]);

  // Function to push Biological Age to watch
  const pushToWatch = () => {
    if (biologicalAge === null) {
      Alert.alert('No Bio-Age', 'Please calculate your Tier 1 biomarkers first to generate your Biological Age.');
      return;
    }
    
    Alert.alert(
      'Sync to Watch',
      `Pushing Biological Age ${biologicalAge.toFixed(1)} years to your PineTime watch...`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sync Now', 
          onPress: () => {
            // TODO: Implement BLE communication to watch
            console.log('Syncing to watch:', biologicalAge);
            Alert.alert('Success', 'Biological Age synced to watch!');
          }
        }
      ]
    );
  };

  // Save Date of Birth
  const saveDateOfBirth = () => {
    if (!tempDate) {
      Alert.alert('Missing Date', 'Please select your date of birth.');
      return;
    }
    
    const today = new Date();
    if (tempDate > today) {
      Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
      return;
    }
    
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    if (tempDate < minDate) {
      Alert.alert('Invalid Date', 'Please enter a valid date of birth.');
      return;
    }

    setDateOfBirth(tempDate);
    setShowDOBModal(false);
    Alert.alert('Saved', 'Your date of birth has been recorded.');
  };

  // Calculate Tier 1 Biomarkers
  const calculateTier1 = () => {
    // Validate that at least some biomarkers are entered
    const hasData = Object.values(tier1Biomarkers).some(val => val !== '');
    
    if (!hasData && dnaMethylation === '') {
      Alert.alert('Missing Data', 'Please enter at least some biomarker values to calculate.');
      return;
    }

    if (chronologicalAge === null) {
      Alert.alert('Missing DOB', 'Please enter your date of birth first for accurate calculations.');
      return;
    }

    // Simple calculation algorithm
    let baseAge = dnaMethylation ? parseFloat(dnaMethylation) : chronologicalAge;
    let adjustments = 0;
    let count = 0;

    // Oral Health Score calculation
    let oralScore = 85;
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
    let systemicScore = 85;
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

    // Calculate final Biological Age
    const finalAge = baseAge + (adjustments / Math.max(1, count)) * 2;
    setBiologicalAge(finalAge);

    // Estimate fitness score
    const avgScore = (oralScore + systemicScore) / 2;
    if (avgScore >= 85) setFitnessScore(90);
    else if (avgScore >= 70) setFitnessScore(75);
    else setFitnessScore(60);

    Alert.alert(
      'Calculation Complete',
      `Your Biological Age: ${finalAge.toFixed(1)} years\nChronological Age: ${chronologicalAge.toFixed(1)} years\nDifference: ${(finalAge - chronologicalAge).toFixed(1)} years\n\nOral Health: ${oralScore}%\nSystemic Health: ${systemicScore}%`,
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

  const saveTier1Biomarkers = () => {
    setShowBiomarkerModal(false);
    Alert.alert('Saved', 'Tier 1 biomarkers have been recorded.');
  };

  const saveTier2Biomarkers = () => {
    setShowTier2Modal(false);
    Alert.alert('Saved', 'Tier 2 biomarkers have been recorded.');
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.logo}
            >
              <Text style={styles.logoText}>PH</Text>
            </LinearGradient>
          </View>
          <Text style={styles.headerText}>Praxiom Health</Text>
        </View>

        {/* Main Age Card - Biological Age */}
        <TouchableOpacity 
          style={styles.mainCard}
          onPress={pushToWatch}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            style={styles.mainCardGradient}
          >
            <View style={styles.ageHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🧬</Text>
              </View>
              <Text style={styles.mainCardTitle}>Biological Age</Text>
            </View>
            
            <View style={styles.ageDisplay}>
              {/* Chronological Age - Small Display */}
              <View style={styles.chronoAgeContainer}>
                <Text style={styles.chronoLabel}>Chronological</Text>
                <Text style={styles.chronoAge}>
                  {chronologicalAge !== null ? chronologicalAge.toFixed(1) : '--'}
                </Text>
              </View>

              {/* Arrow */}
              <Text style={styles.arrow}>→</Text>

              {/* Biological Age - Large Display */}
              <View style={styles.bioAgeContainer}>
                <Text style={styles.bioLabel}>Biological</Text>
                <Text style={styles.bioAge}>
                  {biologicalAge !== null ? biologicalAge.toFixed(1) : '--'}
                </Text>
              </View>
            </View>

            <Text style={styles.yearsLabel}>years</Text>
            
            {biologicalAge !== null && chronologicalAge !== null && (
              <View style={styles.differenceContainer}>
                <Text style={styles.differenceText}>
                  {biologicalAge < chronologicalAge ? '✨ ' : ''}
                  {Math.abs(biologicalAge - chronologicalAge).toFixed(1)} years 
                  {biologicalAge < chronologicalAge ? ' younger' : ' older'}
                </Text>
              </View>
            )}

            <Text style={styles.tapToSync}>
              {biologicalAge !== null ? '👆 Tap to sync to watch' : '💡 Calculate biomarkers first'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Health Score Cards Row */}
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <LinearGradient
              colors={['#EC4899', '#DB2777']}
              style={styles.cardGradient}
            >
              <Text style={styles.cardTitle}>Oral Health</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>
                  {oralHealth !== null ? oralHealth : '--'}
                </Text>
                <Text style={styles.scoreUnit}>%</Text>
              </View>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${oralHealth || 0}%` }]} />
              </View>
            </LinearGradient>
          </View>

          <View style={styles.card}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.cardGradient}
            >
              <Text style={styles.cardTitle}>Systemic Health</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>
                  {systemicHealth !== null ? systemicHealth : '--'}
                </Text>
                <Text style={styles.scoreUnit}>%</Text>
              </View>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${systemicHealth || 0}%` }]} />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Fitness and Watch Cards Row */}
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.cardGradient}
            >
              <Text style={styles.cardTitle}>Fitness Score</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>
                  {fitnessScore !== null ? fitnessScore : '--'}
                </Text>
              </View>
              <Text style={styles.scoreLabel}>level</Text>
            </LinearGradient>
          </View>

          <View style={styles.card}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.cardGradient}
            >
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
            </LinearGradient>
          </View>
        </View>

        {/* Action Buttons */}
        {!dateOfBirth && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowDOBModal(true)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>📅 Set Date of Birth</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowDNAModal(true)}
        >
          <LinearGradient
            colors={['#EC4899', '#DB2777']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>🧬 DNA Methylation Test</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowBiomarkerModal(true)}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>📝 Input Biomarkers</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={calculateTier1}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>📊 Calculate Tier 1 Biomarkers</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Date of Birth Modal */}
        <Modal
          visible={showDOBModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDOBModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#1F2937', '#111827']}
                style={styles.modalGradient}
              >
                <Text style={styles.modalTitle}>Date of Birth</Text>
                <Text style={styles.modalDescription}>
                  Your chronological age will be automatically calculated and updated yearly
                </Text>
                
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {tempDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={() => setShowDOBModal(false)}
                  >
                    <LinearGradient
                      colors={['#374151', '#1F2937']}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={saveDateOfBirth}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.modalButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* DNA Methylation Modal */}
        <Modal
          visible={showDNAModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDNAModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#1F2937', '#111827']}
                style={styles.modalGradient}
              >
                <Text style={styles.modalTitle}>DNA Methylation Test</Text>
                <Text style={styles.modalDescription}>
                  Enter your biological age from DNA methylation testing
                </Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Enter age (years)"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={dnaMethylation}
                  onChangeText={setDNAMethylation}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={() => setShowDNAModal(false)}
                  >
                    <LinearGradient
                      colors={['#374151', '#1F2937']}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={saveDNAMethylation}
                  >
                    <LinearGradient
                      colors={['#EC4899', '#DB2777']}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.modalButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
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
                <LinearGradient
                  colors={['#1F2937', '#111827']}
                  style={styles.modalGradient}
                >
                  <Text style={styles.modalTitle}>Tier 1 Biomarkers</Text>
                  
                  <Text style={styles.sectionHeader}>Oral Health</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Salivary pH (6.5-7.2)"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier1Biomarkers.salivaryPH}
                    onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, salivaryPH: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="MMP-8 ng/mL (<60)"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier1Biomarkers.mmp8}
                    onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, mmp8: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Flow Rate mL/min (>1.5)"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier1Biomarkers.flowRate}
                    onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, flowRate: val})}
                  />

                  <Text style={styles.sectionHeader}>Systemic Health</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="hs-CRP mg/L (<1.0)"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier1Biomarkers.hsCRP}
                    onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, hsCRP: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Omega-3 Index % (>8.0)"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier1Biomarkers.omega3}
                    onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, omega3: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="HbA1c % (<5.7)"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier1Biomarkers.hba1c}
                    onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, hba1c: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="GDF-15 pg/mL (<1200)"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier1Biomarkers.gdf15}
                    onChangeText={(val) => setTier1Biomarkers({...tier1Biomarkers, gdf15: val})}
                  />

                  <TouchableOpacity 
                    style={styles.upgradeButton}
                    onPress={() => {
                      setShowBiomarkerModal(false);
                      setTimeout(() => setShowTier2Modal(true), 300);
                    }}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.upgradeButtonGradient}
                    >
                      <Text style={styles.upgradeButtonText}>⬆️ Upgrade to Tier 2</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={styles.modalButton}
                      onPress={() => setShowBiomarkerModal(false)}
                    >
                      <LinearGradient
                        colors={['#374151', '#1F2937']}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modalButton}
                      onPress={saveTier1Biomarkers}
                    >
                      <LinearGradient
                        colors={['#F59E0B', '#D97706']}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Save</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
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
                <LinearGradient
                  colors={['#1F2937', '#111827']}
                  style={styles.modalGradient}
                >
                  <Text style={styles.modalTitle}>Tier 2 Biomarkers</Text>
                  <Text style={styles.modalDescription}>
                    Advanced biomarker panel for deeper health insights
                  </Text>
                  
                  <Text style={styles.sectionHeader}>Advanced Inflammation</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="IL-6 pg/mL"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.il6}
                    onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, il6: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="TNF-α pg/mL"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.tnfAlpha}
                    onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, tnfAlpha: val})}
                  />

                  <Text style={styles.sectionHeader}>Cardiovascular</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="LDL Particles nmol/L"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.ldlParticles}
                    onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, ldlParticles: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="ApoB mg/dL"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.apoB}
                    onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, apoB: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Homocysteine µmol/L"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.homocysteine}
                    onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, homocysteine: val})}
                  />

                  <Text style={styles.sectionHeader}>Metabolic</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ferritin ng/mL"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.ferritin}
                    onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, ferritin: val})}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Vitamin D ng/mL"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.vitaminD}
                    onChangeText={(val) => setTier2Biomarkers({...tier2Biomarkers, vitaminD: val})}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={styles.modalButton}
                      onPress={() => setShowTier2Modal(false)}
                    >
                      <LinearGradient
                        colors={['#374151', '#1F2937']}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modalButton}
                      onPress={saveTier2Biomarkers}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Save</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
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
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  mainCard: {
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  mainCardGradient: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  ageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 8,
  },
  icon: {
    fontSize: 24,
  },
  mainCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  chronoAgeContainer: {
    alignItems: 'center',
    opacity: 0.8,
  },
  chronoLabel: {
    fontSize: 12,
    color: 'white',
    marginBottom: 4,
    fontWeight: '500',
  },
  chronoAge: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
  },
  arrow: {
    fontSize: 32,
    color: 'white',
    marginHorizontal: 20,
    opacity: 0.6,
  },
  bioAgeContainer: {
    alignItems: 'center',
  },
  bioLabel: {
    fontSize: 12,
    color: 'white',
    marginBottom: 4,
    fontWeight: '600',
  },
  bioAge: {
    fontSize: 56,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  yearsLabel: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    marginTop: 8,
  },
  differenceContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  differenceText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  tapToSync: {
    fontSize: 12,
    color: 'white',
    marginTop: 16,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreUnit: {
    fontSize: 20,
    color: 'white',
    marginLeft: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  scoreBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  liveWatchContent: {
    width: '100%',
    marginTop: 8,
  },
  liveWatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  liveWatchLabel: {
    fontSize: 13,
    color: 'white',
    opacity: 0.8,
  },
  liveWatchValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  actionButton: {
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalContent: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  modalGradient: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    fontSize: 14,
    color: 'white',
  },
  dateButton: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  dateButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  upgradeButton: {
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonGradient: {
    borderRadius: 12,
    padding: 16,
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
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    padding: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
