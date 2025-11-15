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
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../AppContext';

const Tier2BiomarkerInputScreen = ({ navigation }) => {
  const { updateState } = useContext(AppContext);
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Inflammatory Cytokines
  const [il6, setIL6] = useState('');
  const [il1b, setIL1B] = useState('');
  const [tnfa, setTNFa] = useState('');

  // Oxidative Stress Markers
  const [ohgd8, set8OHdG] = useState('');
  const [proteinCarbonyls, setProteinCarbonyls] = useState('');

  // Advanced Markers (optional)
  const [nadPlus, setNADPlus] = useState('');
  
  const [loading, setLoading] = useState(false);

  const onDateChange = (event, date) => {
    // Android fires 'set' when user confirms, 'dismissed' when cancelled
    // iOS fires onChange repeatedly while scrolling
    
    if (Platform.OS === 'android') {
      // On Android, only act on set or dismissed events
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        setShowDatePicker(false);
      } else if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    } else {
      // On iOS, update in real-time while scrolling
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const validateInputs = () => {
    const requiredFields = [
      { value: il6, name: 'IL-6' },
      { value: il1b, name: 'IL-1β' },
      { value: tnfa, name: 'TNF-α' },
      { value: ohgd8, name: '8-OHdG' },
      { value: proteinCarbonyls, name: 'Protein Carbonyls' },
    ];

    for (const field of requiredFields) {
      if (!field.value || field.value.trim() === '') {
        Alert.alert('Missing Data', `Please enter ${field.name}`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      const tier2Data = {
        il6: parseFloat(il6),
        il1b: parseFloat(il1b),
        tnfa: parseFloat(tnfa),
        ohgd8: parseFloat(ohgd8),
        proteinCarbonyls: parseFloat(proteinCarbonyls),
        nadPlus: nadPlus ? parseFloat(nadPlus) : null,
        timestamp: selectedDate.toISOString(),
        dateEntered: selectedDate.toLocaleDateString(),
        tier: 2,
      };

      // Save to storage
      const existingData = await AsyncStorage.getItem('tier2Biomarkers');
      const tier2Array = existingData ? JSON.parse(existingData) : [];
      tier2Array.push(tier2Data);
      await AsyncStorage.setItem('tier2Biomarkers', JSON.stringify(tier2Array));

      Alert.alert(
        'Success!',
        'Tier 2 biomarker data saved successfully!\n\nThis advanced assessment will be used for personalized health optimization.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving Tier 2 data:', error);
      Alert.alert('Error', 'Failed to save Tier 2 biomarkers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tier 2 Advanced Assessment</Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#4ade80" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.doneDateButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.doneDateButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Inflammatory Cytokines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Inflammatory Cytokines</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interleukin-6 (IL-6) pg/mL *</Text>
            <Text style={styles.hint}>Optimal: &lt;3 pg/mL | High Risk: &gt;10 pg/mL</Text>
            <TextInput
              style={styles.input}
              value={il6}
              onChangeText={setIL6}
              keyboardType="decimal-pad"
              placeholder="e.g., 2.5"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interleukin-1β (IL-1β) pg/mL *</Text>
            <Text style={styles.hint}>Optimal: &lt;2 pg/mL</Text>
            <TextInput
              style={styles.input}
              value={il1b}
              onChangeText={setIL1B}
              keyboardType="decimal-pad"
              placeholder="e.g., 1.5"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>TNF-α pg/mL *</Text>
            <Text style={styles.hint}>Optimal: &lt;5 pg/mL | High Risk: &gt;8 pg/mL</Text>
            <TextInput
              style={styles.input}
              value={tnfa}
              onChangeText={setTNFa}
              keyboardType="decimal-pad"
              placeholder="e.g., 4.2"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Oxidative Stress Markers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Oxidative Stress Markers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>8-OHdG ng/mL *</Text>
            <Text style={styles.hint}>DNA damage marker | Optimal: &lt;4 ng/mL | High Risk: &gt;8 ng/mL</Text>
            <TextInput
              style={styles.input}
              value={ohgd8}
              onChangeText={set8OHdG}
              keyboardType="decimal-pad"
              placeholder="e.g., 3.5"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Protein Carbonyls nmol/mg *</Text>
            <Text style={styles.hint}>Protein oxidation | Explains 22.65% of age variance</Text>
            <TextInput
              style={styles.input}
              value={proteinCarbonyls}
              onChangeText={setProteinCarbonyls}
              keyboardType="decimal-pad"
              placeholder="e.g., 1.2"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Advanced Markers (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧬 Advanced Markers (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NAD+ μM (Optional)</Text>
            <Text style={styles.hint}>Cellular energy marker | Declines with age</Text>
            <TextInput
              style={styles.input}
              value={nadPlus}
              onChangeText={setNADPlus}
              keyboardType="decimal-pad"
              placeholder="Leave blank if not measured"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#4ade80" />
          <Text style={styles.infoText}>
            Tier 2 assessment provides advanced inflammatory and oxidative stress profiling for personalized intervention strategies.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#000" />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Tier 2 Data'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 22,
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
    color: '#4ade80',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  dateText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 10,
  },
  doneDateButton: {
    backgroundColor: '#4ade80',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  doneDateButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1e1e2e',
    color: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  infoCard: {
    backgroundColor: '#1e1e2e',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 15,
    flex: 1,
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#4ade80',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8e8e93',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e8e93',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default Tier2BiomarkerInputScreen;
