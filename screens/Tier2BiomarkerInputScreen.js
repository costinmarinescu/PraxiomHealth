import React, { useState, useContext, useEffect } from 'react';
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
import { AppContext } from '../AppContext';
import * as SecureStorage from '../services/SecureStorageService';

const Tier2BiomarkerInputScreen = ({ navigation }) => {
  // ✅ FIX: Get correct functions from AppContext
  const { state, updateState, calculateScores, calculateBiologicalAge } = useContext(AppContext);
  
  // ✅ FIX: Simple date inputs (matching Tier 1)
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
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
  const [nadRatio, setNADRatio] = useState(''); // NEW: NAD+/NADH ratio
  const [cd38Activity, setCD38Activity] = useState(''); // NEW: CD38 enzyme activity

  // InflammAge & Wearable Integration (NEW: Nov 2025)
  const [inflammAge, setInflammAge] = useState('');
  const [continuousHRVScore, setContinuousHRVScore] = useState('');
  const [microbiomeRiskScore, setMicrobiomeRiskScore] = useState('');

  // ✅ FIX: Set today's date as default
  useEffect(() => {
    const today = new Date();
    setYear(today.getFullYear().toString());
    setMonth((today.getMonth() + 1).toString());
    setDay(today.getDate().toString());
  }, []);

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

    // ✅ FIX: Validate and construct date from inputs
    if (!year || !month || !day) {
      Alert.alert('Missing Date', 'Please enter a valid assessment date');
      return;
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      Alert.alert('Invalid Date', 'Please enter numeric values for date');
      return;
    }

    if (yearNum < 2020 || yearNum > 2030 || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      Alert.alert('Invalid Date', 'Please check your date values (Year: 2020-2030, Month: 1-12, Day: 1-31)');
      return;
    }

    const assessmentDate = new Date(yearNum, monthNum - 1, dayNum);

    if (isNaN(assessmentDate.getTime())) {
      Alert.alert('Invalid Date', 'The date you entered is not valid');
      return;
    }

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

      // Recalculate biological age with adjusted scores
      let enhancedBioAge;
      try {
        enhancedBioAge = await calculateBiologicalAge();
        console.log(`✅ Enhanced Biological Age: ${enhancedBioAge.toFixed(1)} years`);
      } catch (calcError) {
        console.error('❌ Bio-age calculation error:', calcError);
        throw new Error(`Calculation failed: ${calcError.message}`);
      }

      // ✅ FIX #2: Save Tier 2 entry to encrypted history
      try {
        const tier2Entry = {
          // Biomarker values
          il6: parseFloat(il6),
          il1b: parseFloat(il1b),
          tnfa: parseFloat(tnfa),
          ohgd8: parseFloat(ohgd8),
          proteinCarbonyls: parseFloat(proteinCarbonyls),
          nadPlus: nadPlus ? parseFloat(nadPlus) : null,
          
          // Calculated values
          bioAge: parseFloat(enhancedBioAge.toFixed(1)),
          oralScore: Math.round(currentOralScore),
          systemicScore: Math.round(adjustedSystemicScore),
          vitalityIndex: Math.round((currentOralScore + adjustedSystemicScore) / 2),
          chronologicalAge: state.chronologicalAge,
          deviation: parseFloat((enhancedBioAge - state.chronologicalAge).toFixed(1)),
          tier2Adjustment: totalAdjustment,
          
          // Metadata
          timestamp: assessmentDate.toISOString(),
          dateEntered: assessmentDate.toLocaleDateString(),
          tier: 2,
        };

        // Load existing Tier 2 history
        const existingData = await SecureStorage.getItem('tier2Biomarkers');
        const tier2Array = Array.isArray(existingData) ? existingData : (existingData ? [existingData] : []);
        tier2Array.push(tier2Entry);
        
        // Sort by timestamp (newest first)
        tier2Array.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        await SecureStorage.setItem('tier2Biomarkers', tier2Array);
        console.log('✅ Tier 2 COMPLETE entry saved to encrypted history:', {
          bioAge: tier2Entry.bioAge,
          oralScore: tier2Entry.oralScore,
          systemicScore: tier2Entry.systemicScore,
          timestamp: tier2Entry.timestamp
        });
      } catch (error) {
        console.error('⚠️ Failed to save Tier 2 to history:', error);
        // Don't block user - calculation was successful
      }

      // Calculate improvement vs Tier 1
      const tier1BioAge = state.biologicalAge || state.chronologicalAge;
      const improvement = tier1BioAge - enhancedBioAge;

      const message = improvement > 0
        ? `Tier 2 analysis shows your biological age is ${improvement.toFixed(1)} years younger than the Tier 1 estimate.`
        : 'Tier 2 analysis provides a more detailed assessment of your biological age.';

      Alert.alert(
        'Tier 2 Analysis Complete! 🔬',
        `Enhanced Biological Age: ${enhancedBioAge.toFixed(1)} years\n` +
        `Chronological Age: ${state.chronologicalAge} years\n\n` +
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
             '• Address inflammatory markers\n' +
             '• Consider lifestyle modifications';
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#00D4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tier 2 Assessment</Text>
          <Text style={styles.subtitle}>Advanced Biomarker Profiling</Text>
        </View>

        {/* Date Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Assessment Date</Text>
          <View style={styles.dateInputContainer}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Year</Text>
              <TextInput
                style={styles.dateInput}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                placeholder="2025"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={4}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Month</Text>
              <TextInput
                style={styles.dateInput}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                placeholder="11"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={2}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Day</Text>
              <TextInput
                style={styles.dateInput}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                placeholder="22"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={2}
              />
            </View>
          </View>
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
            <Text style={styles.label}>NAD+ (μM, {'>'}500 optimal)</Text>
            <TextInput
              style={styles.input}
              value={nadPlus}
              onChangeText={setNADPlus}
              keyboardType="decimal-pad"
              placeholder="450"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NAD+/NADH Ratio ({'>'}1.0 optimal) NEW</Text>
            <TextInput
              style={styles.input}
              value={nadRatio}
              onChangeText={setNADRatio}
              keyboardType="decimal-pad"
              placeholder="0.85"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CD38 Activity (nmol/min/μg, {'<'}80 optimal) NEW</Text>
            <TextInput
              style={styles.input}
              value={cd38Activity}
              onChangeText={setCD38Activity}
              keyboardType="decimal-pad"
              placeholder="95"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* InflammAge & Wearable Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ InflammAge & Monitoring (NEW)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>InflammAge (years, biological inflammation age)</Text>
            <TextInput
              style={styles.input}
              value={inflammAge}
              onChangeText={setInflammAge}
              keyboardType="decimal-pad"
              placeholder="58"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Continuous HRV Score (30-day avg, 0-100)</Text>
            <TextInput
              style={styles.input}
              value={continuousHRVScore}
              onChangeText={setContinuousHRVScore}
              keyboardType="decimal-pad"
              placeholder="75"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Microbiome Risk Score (0-100, lower is better)</Text>
            <TextInput
              style={styles.input}
              value={microbiomeRiskScore}
              onChangeText={setMicrobiomeRiskScore}
              keyboardType="decimal-pad"
              placeholder="70"
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
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
