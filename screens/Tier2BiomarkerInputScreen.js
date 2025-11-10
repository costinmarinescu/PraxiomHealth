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
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import PraxiomAlgorithm from '../services/PraxiomAlgorithm';

const Tier2BiomarkerInputScreen = ({ navigation }) => {
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');

  const handleSubmit = () => {
    if (!gdf15 || !vitaminD) {
      Alert.alert('Missing Data', 'Please fill in all fields');
      return;
    }

    Alert.alert(
      'Success',
      `GDF-15: ${gdf15} pg/mL\nVitamin D: ${vitaminD} ng/mL\n\nTier 2 data recorded`
    );

    resetForm();
    navigation.goBack();
  };

  const resetForm = () => {
    setGdf15('');
    setVitaminD('');
  };

  return (
    <View style={styles.container}>
      <PraxiomBackground />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tier 2 Biomarkers</Text>
        <Text style={styles.subtitle}>Advanced Health Measurements</Text>

        {/* GDF-15 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔬 Growth Differentiation Factor 15</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GDF-15 pg/mL (Optimal: &lt;1000)</Text>
            <Text style={styles.hint}>Biomarker for aging and longevity</Text>
            <TextInput
              style={styles.input}
              placeholder="800"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={gdf15}
              onChangeText={setGdf15}
            />
          </View>
        </View>

        {/* Vitamin D */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>☀️ Vitamin D</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vitamin D ng/mL (Optimal: 30-100)</Text>
            <Text style={styles.hint}>Critical for immune and bone health</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={vitaminD}
              onChangeText={setVitaminD}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#00CFC1" />
          <Text style={styles.infoText}>
            Tier 2 biomarkers provide additional insights into your aging process and overall health status.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Save Biomarkers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 24,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginVertical: 24,
    flexDirection: 'row',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 18,
  },
  buttonGroup: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#00CFC1',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spacer: {
    height: 20,
  },
});

export default Tier2BiomarkerInputScreen;
