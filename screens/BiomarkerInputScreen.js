import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';
import PraxiomAlgorithm from '../services/PraxiomAlgorithm';
import StorageService from '../services/StorageService';
import WearableService from '../services/WearableService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BiomarkerInputScreen({ navigation }) {
  const { updateState } = useContext(AppContext);
  
  // ✅ FIXED: Date picker with proper state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Patient Information
  const [age, setAge] = useState('');

  // Tier 1 Biomarkers - Oral Health
  const [salivaryPH, setSalivaryPH] = useState('');
  const [mmp8, setMmp8] = useState('');
  const [flowRate, setFlowRate] = useState('');

  // Tier 1 Biomarkers - Systemic Health
  const [hsCRP, setHsCRP] = useState('');
  const [omega3, setOmega3] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');

  // Wearable Data
  const [heartRate, setHeartRate] = useState('');
  const [steps, setSteps] = useState('');
  const [spO2, setSpO2] = useState('');
  const [hrv, setHRV] = useState(''); // ✅ ADDED: HRV input (OPTIONAL)

  const [loading, setLoading] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState(null); // ✅ Store result for push
  const [watchConnected, setWatchConnected] = useState(false);

  // ✅ Check watch connection on mount
  React.useEffect(() => {
    checkWatchConnection();
    loadAgeFromProfile(); // ✅ NEW: Auto-load age
  }, []);

  const checkWatchConnection = async () => {
    try {
      const connected = WearableService.isConnected();
      setWatchConnected(connected);
    } catch (error) {
      console.error('Error checking watch connection:', error);
    }
  };

  // ✅ NEW: Load age from profile automatically
  const loadAgeFromProfile = async () => {
    try {
      const savedAge = await AsyncStorage.getItem('chronologicalAge');
      if (savedAge) {
        setAge(savedAge);
        console.log('✅ Age auto-loaded from profile:', savedAge);
      }
    } catch (error) {
      console.error('Error loading age from profile:', error);
    }
  };

  // ✅ FIXED: Proper date change handler
  const onDateChange = (event, date) => {
    // Close picker on Android immediately
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Only update date if user actually selected one (not cancelled)
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      console.log('✅ Assessment date selected:', date.toLocaleDateString());
    } else if (event.type === 'dismissed') {
      console.log('Date picker cancelled');
    }
    
    // On iOS, keep picker open
    if (Platform.OS === 'ios' && date) {
      setSelectedDate(date);
    }
  };

  const validateInputs = () => {
    // Load age from profile if not entered
    if (!age || parseFloat(age) < 18 || parseFloat(age) > 120) {
      Alert.alert('Invalid Input', 'Please enter a valid age (18-120) or set it in your Profile');
      return false;
    }

    // HRV is NOT required - all other fields are
    const requiredFields = [
      { value: salivaryPH, name: 'Salivary pH' },
      { value: mmp8, name: 'Active MMP-8' },
      { value: flowRate, name: 'Salivary Flow Rate' },
      { value: hsCRP, name: 'hs-CRP' },
      { value: omega3, name: 'Omega-3 Index' },
      { value: hba1c, name: 'HbA1c' },
      { value: gdf15, name: 'GDF-15' },
      { value: vitaminD, name: 'Vitamin D' },
      { value: heartRate, name: 'Heart Rate' },
      { value: steps, name: 'Daily Steps' },
      { value: spO2, name: 'Oxygen Saturation' },
    ];

    for (const field of requiredFields) {
      if (!field.value || field.value.trim() === '') {
        Alert.alert('Missing Data', `Please enter ${field.name}`);
        return false;
      }
    }

    return true;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      // Prepare biomarker data
      const biomarkerData = {
        age: parseFloat(age),
        salivaryPH: parseFloat(salivaryPH),
        activeMMP8: parseFloat(mmp8),
        salivaryFlowRate: parseFloat(flowRate),
        hsCRP: parseFloat(hsCRP),
        omega3Index: parseFloat(omega3),
        hbA1c: parseFloat(hba1c),
        gdf15: parseFloat(gdf15),
        vitaminD: parseFloat(vitaminD),
        heartRate: parseFloat(heartRate),
        steps: parseInt(steps),
        spO2: parseFloat(spO2),
        hrv: hrv && hrv.trim() !== '' ? parseFloat(hrv) : null, // ✅ Optional HRV
      };

      console.log('📊 Calculating with data:', biomarkerData);

      // ✅ Calculate Bio-Age using proper algorithm
      const results = PraxiomAlgorithm.calculateFromBiomarkers(biomarkerData);

      console.log('✅ Calculation results:', results);

      // ✅ Prepare entry for storage with proper format
      const entry = {
        ...biomarkerData,
        bioAge: results.bioAge,
        oralScore: results.oralScore,
        systemicScore: results.systemicScore,
        fitnessScore: results.fitnessScore,
        ageGroup: results.ageGroup,
        deviation: results.deviation,
        timestamp: selectedDate.toISOString(),
        dateEntered: selectedDate.toLocaleDateString(),
        tier: 1,
      };

      console.log('💾 Saving entry:', entry);

      // ✅ Save to storage
      await StorageService.saveBiomarkerEntry(entry);

      // ✅ Save individual values for dashboard
      await AsyncStorage.setItem('praxiomAge', results.bioAge.toString());
      await AsyncStorage.setItem('oralHealthScore', results.oralScore.toString());
      await AsyncStorage.setItem('systemicHealthScore', results.systemicScore.toString());
      if (results.fitnessScore) {
        await AsyncStorage.setItem('fitnessScore', results.fitnessScore.toString());
      }
      await AsyncStorage.setItem('biomarkerDate', new Date().toISOString());

      // ✅ Update app context
      updateState({
        biologicalAge: results.bioAge,
        oralHealthScore: results.oralScore,
        systemicHealthScore: results.systemicScore,
        fitnessScore: results.fitnessScore,
      });

      // ✅ Store result for push to watch
      setCalculatedResult(results);

      // Show success with result
      const message = `Praxiom Age: ${results.bioAge} years\n` +
        `Oral Health: ${results.oralScore}%\n` +
        `Systemic Health: ${results.systemicScore}%\n` +
        (results.fitnessScore ? `Fitness: ${results.fitnessScore}%\n` : '') +
        `\n✅ Data saved successfully!` +
        (watchConnected ? '\n\n📲 Tap "Push to Watch" to sync.' : '');

      Alert.alert('Success!', message, [{ text: 'OK' }]);

    } catch (error) {
      console.error('❌ Calculation error:', error);
      Alert.alert('Error', error.message || 'Failed to calculate Bio-Age. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Push to Watch function
  const handlePushToWatch = async () => {
    if (!calculatedResult) {
      Alert.alert('No Data', 'Please calculate Bio-Age first');
      return;
    }

    if (!watchConnected) {
      Alert.alert('Not Connected', 'Please connect your PineTime watch first in the Watch tab');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Pushing to watch:', calculatedResult);
      
      await WearableService.sendBioAge({
        praxiomAge: calculatedResult.bioAge,
        chronologicalAge: parseFloat(age),
        oralScore: calculatedResult.oralScore,
        systemicScore: calculatedResult.systemicScore,
        fitnessScore: calculatedResult.fitnessScore || 0,
      });

      Alert.alert(
        'Synced! ✅',
        `Bio-Age ${calculatedResult.bioAge} sent to watch successfully!`
      );
    } catch (error) {
      console.error('❌ Push to watch error:', error);
      Alert.alert('Sync Failed', 'Could not send data to watch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FF6B00', '#FFB800']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tier 1 Biomarkers</Text>
        </View>

        {/* ✅ Date Selection - FIXED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFB800" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Patient Age */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age (years) *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="e.g., 45"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* Oral Health Biomarkers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🦷 Oral Health Biomarkers</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Salivary pH (Optimal: 6.5-7.2) *</Text>
            <TextInput
              style={styles.input}
              value={salivaryPH}
              onChangeText={setSalivaryPH}
              keyboardType="decimal-pad"
              placeholder="e.g., 7.0"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Active MMP-8 (ng/mL, Optimal: &lt;60) *</Text>
            <TextInput
              style={styles.input}
              value={mmp8}
              onChangeText={setMmp8}
              keyboardType="numeric"
              placeholder="e.g., 45"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <Text style={styles.hint}>Weight: 2.5x - CVD correlation</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Salivary Flow Rate (mL/min, Optimal: &gt;1.5) *</Text>
            <TextInput
              style={styles.input}
              value={flowRate}
              onChangeText={setFlowRate}
              keyboardType="decimal-pad"
              placeholder="e.g., 1.8"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* Systemic Health Biomarkers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🩸 Systemic Health Biomarkers</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>hs-CRP (mg/L, Optimal: &lt;1.0) *</Text>
            <TextInput
              style={styles.input}
              value={hsCRP}
              onChangeText={setHsCRP}
              keyboardType="decimal-pad"
              placeholder="e.g., 0.8"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Omega-3 Index (%, Optimal: &gt;8) *</Text>
            <TextInput
              style={styles.input}
              value={omega3}
              onChangeText={setOmega3}
              keyboardType="decimal-pad"
              placeholder="e.g., 8.5"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>HbA1c (%, Optimal: &lt;5.7) *</Text>
            <TextInput
              style={styles.input}
              value={hba1c}
              onChangeText={setHba1c}
              keyboardType="decimal-pad"
              placeholder="e.g., 5.4"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>GDF-15 (pg/mL, Optimal: &lt;1200) *</Text>
            <TextInput
              style={styles.input}
              value={gdf15}
              onChangeText={setGdf15}
              keyboardType="numeric"
              placeholder="e.g., 1000"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vitamin D 25-OH (ng/mL, Optimal: &gt;30) *</Text>
            <TextInput
              style={styles.input}
              value={vitaminD}
              onChangeText={setVitaminD}
              keyboardType="decimal-pad"
              placeholder="e.g., 35"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* Wearable Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⌚ Wearable Data</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Heart Rate (bpm) *</Text>
            <TextInput
              style={styles.input}
              value={heartRate}
              onChangeText={setHeartRate}
              keyboardType="numeric"
              placeholder="e.g., 65"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Daily Steps *</Text>
            <TextInput
              style={styles.input}
              value={steps}
              onChangeText={setSteps}
              keyboardType="numeric"
              placeholder="e.g., 10000"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Oxygen Saturation (%) *</Text>
            <TextInput
              style={styles.input}
              value={spO2}
              onChangeText={setSpO2}
              keyboardType="numeric"
              placeholder="e.g., 98"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          {/* ✅ ADDED: HRV Input Field (OPTIONAL) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>HRV - Heart Rate Variability (ms) - Optional</Text>
            <TextInput
              style={styles.input}
              value={hrv}
              onChangeText={setHRV}
              keyboardType="numeric"
              placeholder="e.g., 55 (leave blank if not available)"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <Text style={styles.hint}>
              Optimal: ≥70ms. Measured with chest band. Leave blank if not measured.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.calculateButton, loading && styles.buttonDisabled]}
            onPress={handleCalculate}
            disabled={loading}
          >
            <Ionicons name="calculator" size={20} color="#000" />
            <Text style={styles.calculateButtonText}>
              {loading ? 'Calculating...' : 'Calculate Praxiom Bio-Age'}
            </Text>
          </TouchableOpacity>

          {/* ✅ NEW: Push to Watch Button */}
          {calculatedResult && (
            <TouchableOpacity
              style={[
                styles.pushButton,
                (!watchConnected || loading) && styles.buttonDisabled
              ]}
              onPress={handlePushToWatch}
              disabled={!watchConnected || loading}
            >
              <Ionicons name="watch" size={20} color="#fff" />
              <Text style={styles.pushButtonText}>
                {watchConnected ? 'Push to Watch' : 'Watch Not Connected'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  calculateButton: {
    backgroundColor: '#47C83E',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pushButton: {
    backgroundColor: '#00d4ff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  pushButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
