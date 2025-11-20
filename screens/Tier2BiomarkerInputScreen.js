import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';

const Tier2BiomarkerInputScreen = ({ navigation }) => {
  // ✅ FIX: Use correct function name from AppContext
  const { state, updateState, calculateTier2BioAge } = useAppContext();
  
  // ✅ FIX: Manual date inputs instead of DateTimePicker
  const [entryYear, setEntryYear] = useState('');
  const [entryMonth, setEntryMonth] = useState('');
  const [entryDay, setEntryDay] = useState('');
  const [loading, setLoading] = useState(false);

  // Inflammatory Cytokines
  const [il6, setIL6] = useState('');
  const [il1b, setIL1B] = useState('');
  const [tnfa, setTNFa] = useState('');

  // Oxidative Stress Markers
  const [ohgd8, set8OHdG] = useState('');
  const [proteinCarbonyls, setProteinCarbonyls] = useState('');

  // Advanced Markers (optional)
  const [nadPlus, setNADPlus] = useState('');

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

    // Check if Tier 1 was completed first
    if (!state.salivaryPH || !state.hsCRP) {
      Alert.alert(
        'Tier 1 Required',
        'Please complete Tier 1 biomarker assessment before proceeding to Tier 2.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Tier 1', onPress: () => navigation.navigate('Tier1BiomarkerInput') }
        ]
      );
      return false;
    }

    return true;
  };

  // ✅ FIX: Add Tier 2 calculation logic based on protocol
  const calculateTier2Adjustments = () => {
    const il6Val = parseFloat(il6);
    const il1bVal = parseFloat(il1b);
    const tnfVal = parseFloat(tnfa);
    const ohgd8Val = parseFloat(ohgd8);
    const proteinCarbonylsVal = parseFloat(proteinCarbonyls);
    const nadVal = nadPlus ? parseFloat(nadPlus) : null;

    let systemicAdjustment = 0;
    const adjustmentDetails = [];

    // IL-6 adjustment (pro-inflammatory cytokine)
    if (il6Val > 2.0) {
      const adjustment = (il6Val - 2.0) * 5;
      systemicAdjustment += adjustment;
      adjustmentDetails.push(`IL-6: -${adjustment.toFixed(1)} points`);
    }

    // IL-1β adjustment
    if (il1bVal > 0.5) {
      const adjustment = (il1bVal - 0.5) * 8;
      systemicAdjustment += adjustment;
      adjustmentDetails.push(`IL-1β: -${adjustment.toFixed(1)} points`);
    }

    // TNF-α adjustment
    if (tnfVal > 8.0) {
      const adjustment = (tnfVal - 8.0) * 3;
      systemicAdjustment += adjustment;
      adjustmentDetails.push(`TNF-α: -${adjustment.toFixed(1)} points`);
    }

    // 8-OHdG adjustment (oxidative DNA damage)
    if (ohgd8Val > 2.0) {
      const adjustment = (ohgd8Val - 2.0) * 4;
      systemicAdjustment += adjustment;
      adjustmentDetails.push(`8-OHdG: -${adjustment.toFixed(1)} points`);
    }

    // Protein Carbonyls adjustment (oxidative protein damage)
    if (proteinCarbonylsVal > 1.5) {
      const adjustment = (proteinCarbonylsVal - 1.5) * 6;
      systemicAdjustment += adjustment;
      adjustmentDetails.push(`Protein Carbonyls: -${adjustment.toFixed(1)} points`);
    }

    // NAD+ adjustment (if provided)
    if (nadVal !== null && nadVal < 40) {
      const adjustment = (40 - nadVal) * 2;
      systemicAdjustment += adjustment;
      adjustmentDetails.push(`NAD+: -${adjustment.toFixed(1)} points`);
    }

    console.log('Tier 2 Adjustments:', adjustmentDetails.join(', '));
    
    return {
      totalAdjustment: systemicAdjustment,
      details: adjustmentDetails
    };
  };

  // ✅ FIX: Proper calculation and state update
  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      console.log('✅ Starting Tier 2 calculation...');

      // Calculate Tier 2 adjustments
      const { totalAdjustment, details } = calculateTier2Adjustments();

      // Get current systemic health score
      const currentSystemicScore = state.systemicHealthScore || 50;
      const currentOralScore = state.oralHealthScore || 50;
      
      // Apply Tier 2 adjustments to systemic score
      const adjustedSystemicScore = Math.max(0, currentSystemicScore - totalAdjustment);

      console.log(`Current Systemic Score: ${currentSystemicScore}%`);
      console.log(`Tier 2 Adjustment: -${totalAdjustment.toFixed(1)} points`);
      console.log(`Adjusted Systemic Score: ${adjustedSystemicScore.toFixed(1)}%`);

      // ✅ FIX: Create date from manual inputs
      let assessmentDate;
      if (entryYear && entryMonth && entryDay) {
        assessmentDate = new Date(
          parseInt(entryYear),
          parseInt(entryMonth) - 1,
          parseInt(entryDay)
        );
      } else {
        assessmentDate = new Date(); // Use today if no date entered
      }

      // Update state with adjusted scores
      await updateState({
        systemicHealthScore: Math.round(adjustedSystemicScore),
        vitalityIndex: Math.round((currentOralScore + adjustedSystemicScore) / 2),
        tier2Data: {
          il6: parseFloat(il6),
          il1b: parseFloat(il1b),
          tnfa: parseFloat(tnfa),
          ohgd8: parseFloat(ohgd8),
          proteinCarbonyls: parseFloat(proteinCarbonyls),
          nadPlus: nadPlus ? parseFloat(nadPlus) : null,
          timestamp: assessmentDate.toISOString(),
          dateEntered: assessmentDate.toLocaleDateString(),
          adjustment: totalAdjustment,
          tier: 2,
        }
      });

      // Small delay to ensure state update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Recalculate biological age with Tier 2 data using correct function
      const result = await calculateTier2BioAge();
      const enhancedBioAge = result.bioAge;
      
      console.log(`Enhanced Biological Age: ${enhancedBioAge.toFixed(1)} years`);
      console.log('Tier 2 Calculation Result:', result);

      // Calculate improvement vs Tier 1
      const tier1BioAge = state.userProfile?.biologicalAge || state.userProfile?.chronologicalAge;
      const improvement = tier1BioAge - enhancedBioAge;

      const message = improvement > 0
        ? `Tier 2 analysis shows your biological age is ${improvement.toFixed(1)} years younger than the Tier 1 estimate.`
        : 'Tier 2 analysis provides a more detailed assessment of your biological age.';

      Alert.alert(
        'Tier 2 Analysis Complete! 🔬',
        `Enhanced Biological Age: ${enhancedBioAge.toFixed(1)} years\n` +
        `Chronological Age: ${state.userProfile?.chronologicalAge || '--'} years\n\n` +
        `Adjusted Systemic Score: ${adjustedSystemicScore.toFixed(1)}%\n` +
        `Tier 2 Impact: -${totalAdjustment.toFixed(1)} points\n\n` +
        message +
        `\n\n${getTier2Recommendations(totalAdjustment, adjustedSystemicScore)}`,
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('DashboardHome')
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );

      console.log('✅ Tier 2 calculation complete!');

    } catch (error) {
      console.error('❌ Tier 2 calculation error:', error);
      Alert.alert('Error', 'Failed to complete Tier 2 calculation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTier2Recommendations = (adjustment, adjustedScore) => {
    if (adjustment > 15) {
      return '⚠️ Significant inflammatory burden detected:\n' +
             '• Consider anti-inflammatory interventions\n' +
             '• NAD+ restoration therapy recommended\n' +
             '• Metabolic optimization needed\n' +
             '• Tier 3 senolytic therapy may be beneficial';
    } else if (adjustment > 8) {
      return '📊 Moderate optimization potential:\n' +
             '• Targeted supplementation recommended\n' +
             '• Lifestyle modifications beneficial\n' +
             '• Regular monitoring advised';
    } else if (adjustedScore >= 75) {
      return '✅ Excellent metabolic and inflammatory profile!\n' +
             '• Maintain current interventions\n' +
             '• Continue regular assessments';
    } else {
      return '📈 Focus on foundational health:\n' +
             '• Review Tier 1 biomarkers\n' +
             '• Address underlying factors';
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FDC830', '#00CED1']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tier 2 Advanced Assessment</Text>
          <Text style={styles.subtitle}>Personalized Profiling</Text>
        </View>

        {/* ✅ FIXED: Manual Date Input (like Settings) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Date of Assessment</Text>
          <View style={styles.dateInputRow}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.dateInput}
                value={entryYear}
                onChangeText={setEntryYear}
                placeholder="YYYY"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={styles.dateInputGroup}>
              <Text style={styles.label}>Month</Text>
              <TextInput
                style={styles.dateInput}
                value={entryMonth}
                onChangeText={setEntryMonth}
                placeholder="MM"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.dateInputGroup}>
              <Text style={styles.label}>Day</Text>
              <TextInput
                style={styles.dateInput}
                value={entryDay}
                onChangeText={setEntryDay}
                placeholder="DD"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          <Text style={styles.helperText}>Date when biomarkers were measured</Text>
        </View>

        {/* Inflammatory Cytokines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Inflammatory Cytokines</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>IL-6 (pg/mL, {'<'}2.0 optimal)</Text>
            <TextInput
              style={styles.input}
              value={il6}
              onChangeText={setIL6}
              keyboardType="decimal-pad"
              placeholder="1.5"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IL-1β (pg/mL, {'<'}0.5 optimal)</Text>
            <TextInput
              style={styles.input}
              value={il1b}
              onChangeText={setIL1B}
              keyboardType="decimal-pad"
              placeholder="0.3"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>TNF-α (pg/mL, {'<'}8.0 optimal)</Text>
            <TextInput
              style={styles.input}
              value={tnfa}
              onChangeText={setTNFa}
              keyboardType="decimal-pad"
              placeholder="6.5"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* Oxidative Stress Markers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Oxidative Stress Markers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>8-OHdG (ng/mL, {'<'}2.0 optimal)</Text>
            <TextInput
              style={styles.input}
              value={ohgd8}
              onChangeText={set8OHdG}
              keyboardType="decimal-pad"
              placeholder="1.5"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Protein Carbonyls (nmol/mg, {'<'}1.5 optimal)</Text>
            <TextInput
              style={styles.input}
              value={proteinCarbonyls}
              onChangeText={setProteinCarbonyls}
              keyboardType="decimal-pad"
              placeholder="1.2"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* Advanced Markers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧬 Advanced Markers (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NAD+ (μM, {'>'}40 optimal)</Text>
            <TextInput
              style={styles.input}
              value={nadPlus}
              onChangeText={setNADPlus}
              keyboardType="decimal-pad"
              placeholder="45"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity 
          style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
          onPress={handleCalculate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FF6B35" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Enhanced Bio-Age</Text>
          )}
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backToTier1Button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToTier1ButtonText}>← Back to Tier 1</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateInputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginTop: 10,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  backToTier1Button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  backToTier1ButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default Tier2BiomarkerInputScreen;
