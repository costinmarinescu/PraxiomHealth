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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BiomarkerInputScreen({ navigation }) {
  // Tier 1 Oral Health Biomarkers
  const [salivaryPH, setSalivaryPH] = useState('');
  const [mmp8, setMmp8] = useState('');
  const [flowRate, setFlowRate] = useState('');

  // Tier 1 Systemic Health Biomarkers
  const [hsCRP, setHsCRP] = useState('');
  const [omega3, setOmega3] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // Optimal ranges for validation
  const ranges = {
    salivaryPH: { min: 6.5, max: 7.2, optimal: '6.5-7.2' },
    mmp8: { max: 60, optimal: '<60 ng/mL' },
    flowRate: { min: 1.5, optimal: '>1.5 mL/min' },
    hsCRP: { max: 1.0, optimal: '<1.0 mg/L' },
    omega3: { min: 8.0, optimal: '>8.0%' },
    hba1c: { max: 5.7, optimal: '<5.7%' },
    gdf15: { max: 1200, optimal: '<1200 pg/mL' },
    vitaminD: { min: 30, optimal: '>30 ng/mL' },
  };

  const calculateOralHealthScore = () => {
    const pH = parseFloat(salivaryPH) || 0;
    const mmp = parseFloat(mmp8) || 0;
    const flow = parseFloat(flowRate) || 0;

    // Normalize to 0-100 scale
    const pHScore = pH >= 6.5 && pH <= 7.2 ? 100 : pH < 6.5 ? (pH / 6.5) * 100 : (14.4 - pH) / 7.2 * 100;
    const mmpScore = mmp <= 60 ? 100 : mmp <= 100 ? 100 - ((mmp - 60) / 40) * 50 : 50;
    const flowScore = flow >= 1.5 ? 100 : (flow / 1.5) * 100;

    // Weighted formula: [(MMP-8 × 2.5) + (pH × 1.0) + (Flow Rate × 1.0)] / 4.5 × 100
    const ohs = ((mmpScore * 2.5) + (pHScore * 1.0) + (flowScore * 1.0)) / 4.5;
    
    return Math.round(Math.min(100, Math.max(0, ohs)));
  };

  const calculateSystemicHealthScore = () => {
    const crp = parseFloat(hsCRP) || 0;
    const o3 = parseFloat(omega3) || 0;
    const gdf = parseFloat(gdf15) || 0;
    const a1c = parseFloat(hba1c) || 0;
    const vitD = parseFloat(vitaminD) || 0;

    // Normalize to 0-100 scale
    const crpScore = crp <= 1.0 ? 100 : crp <= 3.0 ? 100 - ((crp - 1.0) / 2.0) * 50 : 50;
    const o3Score = o3 >= 8.0 ? 100 : o3 >= 6.0 ? 50 + ((o3 - 6.0) / 2.0) * 50 : (o3 / 6.0) * 50;
    const gdfScore = gdf <= 1200 ? 100 : gdf <= 1800 ? 100 - ((gdf - 1200) / 600) * 50 : 50;
    const a1cScore = a1c <= 5.7 ? 100 : a1c <= 6.5 ? 100 - ((a1c - 5.7) / 0.8) * 50 : 50;
    const vitDScore = vitD >= 30 ? 100 : vitD >= 20 ? 50 + ((vitD - 20) / 10) * 50 : (vitD / 20) * 50;

    // Weighted formula: [(hs-CRP × 2.0) + (Omega-3 × 2.0) + (GDF-15 × 2.0) + (HbA1c × 1.5) + (Vitamin D × 1.0)] / 9.5
    const shs = ((crpScore * 2.0) + (o3Score * 2.0) + (gdfScore * 2.0) + (a1cScore * 1.5) + (vitDScore * 1.0)) / 9.5;
    
    return Math.round(Math.min(100, Math.max(0, shs)));
  };

  const calculateBioAge = async (ohs, shs) => {
    try {
      // Get date of birth from storage (should be set in settings)
      const dob = await AsyncStorage.getItem('dateOfBirth') || '1990-01-01';
      const birthDate = new Date(dob);
      const today = new Date();
      let chronologicalAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        chronologicalAge--;
      }

      // Age-stratified coefficients
      let alpha, beta;
      if (chronologicalAge < 50) {
        alpha = 0.08;
        beta = 0.15;
      } else if (chronologicalAge <= 70) {
        alpha = 0.12;
        beta = 0.20;
      } else {
        alpha = 0.15;
        beta = 0.25;
      }

      // Bio-Age = Chronological Age + [(100 - OHS) × α + (100 - SHS) × β]
      const bioAge = chronologicalAge + ((100 - ohs) * alpha + (100 - shs) * beta);
      
      return {
        chronologicalAge,
        bioAge: parseFloat(bioAge.toFixed(1)),
        deviation: parseFloat((bioAge - chronologicalAge).toFixed(1)),
      };
    } catch (error) {
      console.error('Error calculating bio-age:', error);
      return { chronologicalAge: 35, bioAge: 40.2, deviation: 5.2 };
    }
  };

  const checkTierUpgradeTriggers = (ohs, shs) => {
    const triggers = [];
    const gdf = parseFloat(gdf15) || 0;
    const mmp = parseFloat(mmp8) || 0;
    const crp = parseFloat(hsCRP) || 0;

    // Tier 2 triggers
    if (ohs < 75 || shs < 75) {
      triggers.push({
        tier: 2,
        reason: 'OHS or SHS < 75%',
        action: 'Upgrade to Tier 2 - Advanced profiling recommended',
      });
    }

    if (gdf > 1800 || (mmp > 100 && crp > 3)) {
      triggers.push({
        tier: 2,
        reason: 'High inflammatory markers',
        action: 'Tier 2 + Intensive intervention required',
      });
    }

    return triggers;
  };

  const validateInputs = () => {
    const inputs = [
      { value: salivaryPH, name: 'Salivary pH' },
      { value: mmp8, name: 'MMP-8' },
      { value: flowRate, name: 'Flow Rate' },
      { value: hsCRP, name: 'hs-CRP' },
      { value: omega3, name: 'Omega-3 Index' },
      { value: hba1c, name: 'HbA1c' },
      { value: gdf15, name: 'GDF-15' },
      { value: vitaminD, name: 'Vitamin D' },
    ];

    const empty = inputs.filter(input => !input.value || input.value.trim() === '');
    
    if (empty.length > 0) {
      Alert.alert(
        'Missing Values',
        `Please enter values for: ${empty.map(i => i.name).join(', ')}`,
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setIsSaving(true);

    try {
      // Calculate scores
      const ohs = calculateOralHealthScore();
      const shs = calculateSystemicHealthScore();
      const ageData = await calculateBioAge(ohs, shs);
      const triggers = checkTierUpgradeTriggers(ohs, shs);

      // Prepare data to save
      const biomarkerData = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        tier: 1,
        
        // Raw values
        oral: {
          salivaryPH: parseFloat(salivaryPH),
          mmp8: parseFloat(mmp8),
          flowRate: parseFloat(flowRate),
        },
        systemic: {
          hsCRP: parseFloat(hsCRP),
          omega3: parseFloat(omega3),
          hba1c: parseFloat(hba1c),
          gdf15: parseFloat(gdf15),
          vitaminD: parseFloat(vitaminD),
        },
        
        // Calculated scores
        oralHealthScore: ohs,
        systemicHealthScore: shs,
        fitnessScore: 99, // From wearable data - placeholder
        
        // Bio-Age
        chronologicalAge: ageData.chronologicalAge,
        praxiomAge: ageData.bioAge,
        deviation: ageData.deviation,
        
        // Tier triggers
        tierUpgrades: triggers,
        
        // Timestamps
        oralUpdated: new Date().toISOString(),
        systemicUpdated: new Date().toISOString(),
      };

      // Save to history
      const historyStr = await AsyncStorage.getItem('biomarkers_history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.push(biomarkerData);
      await AsyncStorage.setItem('biomarkers_history', JSON.stringify(history));

      // Save latest
      await AsyncStorage.setItem('latest_biomarkers', JSON.stringify(biomarkerData));

      setIsSaving(false);

      // Show results
      const message = `
Results Calculated:

Oral Health Score: ${ohs}%
Systemic Health Score: ${shs}%

Praxiom Age: ${ageData.bioAge} years
Chronological Age: ${ageData.chronologicalAge} years
Deviation: ${ageData.deviation > 0 ? '+' : ''}${ageData.deviation} years

${triggers.length > 0 ? '\n⚠️ Tier Upgrade Recommended:\n' + triggers.map(t => t.action).join('\n') : '✅ Optimal range - Continue maintenance protocol'}
      `;

      Alert.alert('Bio-Age Calculated', message, [
        { text: 'View Dashboard', onPress: () => navigation.navigate('Dashboard') },
        { text: 'View Report', onPress: () => navigation.navigate('Report') },
      ]);

    } catch (error) {
      console.error('Error calculating:', error);
      Alert.alert('Error', 'Failed to calculate Bio-Age. Please try again.');
      setIsSaving(false);
    }
  };

  const renderInput = (label, value, setValue, unit, optimal) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={styles.optimalRange}>Optimal: {optimal}</Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor="#666"
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['rgba(50, 50, 60, 1)', 'rgba(20, 20, 30, 1)']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tier 1 Biomarkers</Text>
        <Text style={styles.subtitle}>Foundation Assessment</Text>

        {/* Oral Health Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🦷</Text>
            <Text style={styles.sectionTitle}>Oral Health</Text>
          </View>

          {renderInput('Salivary pH', salivaryPH, setSalivaryPH, '', ranges.salivaryPH.optimal)}
          {renderInput('MMP-8', mmp8, setMmp8, 'ng/mL', ranges.mmp8.optimal)}
          {renderInput('Flow Rate', flowRate, setFlowRate, 'mL/min', ranges.flowRate.optimal)}
        </View>

        {/* Systemic Health Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>❤️</Text>
            <Text style={styles.sectionTitle}>Systemic Health</Text>
          </View>

          {renderInput('hs-CRP', hsCRP, setHsCRP, 'mg/L', ranges.hsCRP.optimal)}
          {renderInput('Omega-3 Index', omega3, setOmega3, '%', ranges.omega3.optimal)}
          {renderInput('HbA1c', hba1c, setHba1c, '%', ranges.hba1c.optimal)}
          {renderInput('GDF-15', gdf15, setGdf15, 'pg/mL', ranges.gdf15.optimal)}
          {renderInput('Vitamin D', vitaminD, setVitaminD, 'ng/mL', ranges.vitaminD.optimal)}
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calculateButton, isSaving && styles.calculateButtonDisabled]}
          onPress={handleCalculate}
          disabled={isSaving}
        >
          <Text style={styles.calculateButtonText}>
            {isSaving ? 'Calculating...' : '📊 Calculate Bio-Age'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          All values will be saved to your history
        </Text>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optimalRange: {
    fontSize: 12,
    color: '#00CFC1',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#FFFFFF',
  },
  unit: {
    marginLeft: 12,
    fontSize: 14,
    color: '#AAAAAA',
    minWidth: 60,
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
