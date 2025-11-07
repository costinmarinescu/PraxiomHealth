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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DashboardScreen() {
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [praxiomAge, setPraxiomAge] = useState(null);
  
  // Biomarker states
  const [biomarkerModalVisible, setBiomarkerModalVisible] = useState(false);
  const [biomarkers, setBiomarkers] = useState({
    salivaryPH: '',
    mmp8: '',
    flowRate: '',
    hsCRP: '',
    omega3: '',
    hba1c: '',
    gdf15: '',
    vitaminD: '',
  });

  // Wearable data states
  const [wearableData, setWearableData] = useState({
    hrv: 65,
    sleepEfficiency: 85,
    dailySteps: 8500,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedDOB = await AsyncStorage.getItem('dateOfBirth');
      const savedBiomarkers = await AsyncStorage.getItem('biomarkers');
      const savedPraxiomAge = await AsyncStorage.getItem('praxiomAge');
      const savedWearableData = await AsyncStorage.getItem('wearableData');

      if (savedDOB) {
        const dob = new Date(savedDOB);
        setDateOfBirth(dob);
        calculateChronologicalAge(dob);
      }
      if (savedBiomarkers) {
        setBiomarkers(JSON.parse(savedBiomarkers));
      }
      if (savedPraxiomAge) {
        setPraxiomAge(parseFloat(savedPraxiomAge));
      }
      if (savedWearableData) {
        setWearableData(JSON.parse(savedWearableData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculateChronologicalAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setChronologicalAge(age);
  };

  const onDateChange = async (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      calculateChronologicalAge(selectedDate);
      await AsyncStorage.setItem('dateOfBirth', selectedDate.toISOString());
    }
  };

  const calculatePraxiomAge = async () => {
    // Validate all biomarkers are entered
    const requiredFields = Object.values(biomarkers);
    const allFilled = requiredFields.every(field => field !== '');
    
    if (!allFilled) {
      Alert.alert('Missing Data', 'Please fill in all biomarker values');
      return;
    }

    if (!chronologicalAge) {
      Alert.alert('Missing Date of Birth', 'Please set your date of birth first');
      return;
    }

    // Calculate Oral Health Score (0-100)
    const salivaryPH = parseFloat(biomarkers.salivaryPH);
    const mmp8 = parseFloat(biomarkers.mmp8);
    const flowRate = parseFloat(biomarkers.flowRate);

    // pH score (ideal: 6.5-7.2)
    let phScore = 100;
    if (salivaryPH < 6.5) phScore = 100 * (salivaryPH / 6.5);
    else if (salivaryPH > 7.2) phScore = 100 * (1 - (salivaryPH - 7.2) / 2);

    // MMP-8 score (ideal: <60 ng/mL)
    const mmp8Score = mmp8 < 60 ? 100 : Math.max(0, 100 - (mmp8 - 60));

    // Flow rate score (ideal: >1.5 mL/min)
    const flowScore = flowRate >= 1.5 ? 100 : (flowRate / 1.5) * 100;

    const oralHealthScore = (phScore * 0.3 + mmp8Score * 0.4 + flowScore * 0.3);

    // Calculate Systemic Health Score (0-100)
    const hsCRP = parseFloat(biomarkers.hsCRP);
    const omega3 = parseFloat(biomarkers.omega3);
    const hba1c = parseFloat(biomarkers.hba1c);
    const gdf15 = parseFloat(biomarkers.gdf15);
    const vitaminD = parseFloat(biomarkers.vitaminD);

    // hs-CRP score (ideal: <1.0 mg/L)
    const crpScore = hsCRP < 1.0 ? 100 : Math.max(0, 100 - (hsCRP - 1.0) * 20);

    // Omega-3 score (ideal: >8.0%)
    const omega3Score = omega3 >= 8.0 ? 100 : (omega3 / 8.0) * 100;

    // HbA1c score (ideal: <5.7%)
    const hba1cScore = hba1c < 5.7 ? 100 : Math.max(0, 100 - (hba1c - 5.7) * 50);

    // GDF-15 score (ideal: <1200 pg/mL)
    const gdf15Score = gdf15 < 1200 ? 100 : Math.max(0, 100 - (gdf15 - 1200) / 20);

    // Vitamin D score (ideal: 40-60 ng/mL)
    let vitDScore = 100;
    if (vitaminD < 40) vitDScore = (vitaminD / 40) * 100;
    else if (vitaminD > 60) vitDScore = Math.max(0, 100 - (vitaminD - 60) * 2);

    const systemicHealthScore = (
      crpScore * 0.25 +
      omega3Score * 0.2 +
      hba1cScore * 0.25 +
      gdf15Score * 0.15 +
      vitDScore * 0.15
    );

    // Calculate Bio-Age based on age-stratified coefficients
    const avgScore = (oralHealthScore + systemicHealthScore) / 2;
    let bioAgeDeviation;

    if (chronologicalAge < 40) {
      bioAgeDeviation = (100 - avgScore) * 0.15;
    } else if (chronologicalAge < 60) {
      bioAgeDeviation = (100 - avgScore) * 0.20;
    } else {
      bioAgeDeviation = (100 - avgScore) * 0.25;
    }

    const calculatedBioAge = chronologicalAge + bioAgeDeviation;
    setPraxiomAge(calculatedBioAge);

    // Save all data
    await AsyncStorage.setItem('biomarkers', JSON.stringify(biomarkers));
    await AsyncStorage.setItem('praxiomAge', calculatedBioAge.toString());

    setBiomarkerModalVisible(false);
    Alert.alert('Success', `Your Praxiom Age is ${calculatedBioAge.toFixed(1)} years`);
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>PRAXIOM{'\n'}HEALTH</Text>

        {/* Date of Birth Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Date of Birth</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Set Date of Birth'}
            </Text>
          </TouchableOpacity>
          {chronologicalAge !== null && (
            <Text style={styles.ageText}>Chronological Age: {chronologicalAge} years</Text>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth || new Date()}
            mode="date"
            display="calendar"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Bio-Age Display */}
        <View style={styles.bioAgeCard}>
          <Text style={styles.bioAgeLabel}>Praxiom Age</Text>
          <Text style={styles.bioAgeValue}>
            {praxiomAge ? praxiomAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.bioAgeUnit}>years</Text>
        </View>

        {/* Wearable Data Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wearable Data</Text>
          
          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>HRV:</Text>
            <Text style={styles.wearableValue}>{wearableData.hrv} ms</Text>
            <Text style={styles.wearableRange}>(Optimal: 50-100 ms)</Text>
          </View>

          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>Sleep Efficiency:</Text>
            <Text style={styles.wearableValue}>{wearableData.sleepEfficiency}%</Text>
            <Text style={styles.wearableRange}>(Optimal: {'>'} 85%)</Text>
          </View>

          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>Daily Steps:</Text>
            <Text style={styles.wearableValue}>{wearableData.dailySteps.toLocaleString()}</Text>
            <Text style={styles.wearableRange}>(Optimal: {'>'} 7,000)</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setBiomarkerModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Input Biomarkers</Text>
        </TouchableOpacity>

        {/* Biomarker Input Modal */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={biomarkerModalVisible}
          onRequestClose={() => setBiomarkerModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Tier 1 Biomarkers</Text>

              <Text style={styles.sectionTitle}>Oral Health</Text>
              
              <Text style={styles.inputLabel}>Salivary pH</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: 6.5-7.2"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.salivaryPH}
                onChangeText={(text) => setBiomarkers({...biomarkers, salivaryPH: text})}
              />

              <Text style={styles.inputLabel}>MMP-8 (ng/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 60"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.mmp8}
                onChangeText={(text) => setBiomarkers({...biomarkers, mmp8: text})}
              />

              <Text style={styles.inputLabel}>Flow Rate (mL/min)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: > 1.5"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.flowRate}
                onChangeText={(text) => setBiomarkers({...biomarkers, flowRate: text})}
              />

              <Text style={styles.sectionTitle}>Systemic Health</Text>

              <Text style={styles.inputLabel}>hs-CRP (mg/L)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 1.0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.hsCRP}
                onChangeText={(text) => setBiomarkers({...biomarkers, hsCRP: text})}
              />

              <Text style={styles.inputLabel}>Omega-3 Index (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: > 8.0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.omega3}
                onChangeText={(text) => setBiomarkers({...biomarkers, omega3: text})}
              />

              <Text style={styles.inputLabel}>HbA1c (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 5.7"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.hba1c}
                onChangeText={(text) => setBiomarkers({...biomarkers, hba1c: text})}
              />

              <Text style={styles.inputLabel}>GDF-15 (pg/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 1200"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.gdf15}
                onChangeText={(text) => setBiomarkers({...biomarkers, gdf15: text})}
              />

              <Text style={styles.inputLabel}>Vitamin D (ng/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: 40-60"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.vitaminD}
                onChangeText={(text) => setBiomarkers({...biomarkers, vitaminD: text})}
              />

              <TouchableOpacity style={styles.calculateButton} onPress={calculatePraxiomAge}>
                <Text style={styles.calculateButtonText}>Calculate Praxiom Age</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setBiomarkerModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  dateButton: {
    backgroundColor: '#00CFC1',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ageText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  bioAgeCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  bioAgeLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  bioAgeValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  bioAgeUnit: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  wearableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  wearableLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  wearableValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00CFC1',
    flex: 1,
    textAlign: 'center',
  },
  wearableRange: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00CFC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#00CFC1',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
