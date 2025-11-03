import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';

const Tier2BiomarkerInputScreen = ({ navigation, route }) => {
  // Get Tier 1 scores from previous screen
  const tier1Data = route.params || {};
  
  // ADVANCED INFLAMMATORY PANEL
  const [il6, setIl6] = useState('');
  const [il1b, setIl1b] = useState('');
  const [oh8dg, setOh8dg] = useState('');
  const [proteinCarbonyls, setProteinCarbonyls] = useState('');

  // NAD+ METABOLOME ASSESSMENT
  const [nadPlus, setNadPlus] = useState('');
  const [nadRatio, setNadRatio] = useState('');
  const [nMethylNic, setNMethylNic] = useState('');

  // WEARABLE DATA INTEGRATION
  const [hrvRMSSD, setHrvRMSSD] = useState('');
  const [sleepEfficiency, setSleepEfficiency] = useState('');
  const [dailySteps, setDailySteps] = useState('');

  // MICROBIOME ANALYSIS
  const [pGingivalis, setPGingivalis] = useState('');
  const [fNucleatum, setFNucleatum] = useState('');
  const [dysbiosisIndex, setDysbiosisIndex] = useState('');

  const calculateTier2BioAge = () => {
    // Validate required fields
    if (!il6 || !il1b || !oh8dg || !proteinCarbonyls ||
        !nadPlus || !nadRatio || !nMethylNic ||
        !hrvRMSSD || !sleepEfficiency || !dailySteps) {
      Alert.alert('Missing Data', 'Please fill in all required Tier 2 biomarker fields');
      return;
    }

    // Convert strings to numbers
    const IL6 = parseFloat(il6);
    const IL1B = parseFloat(il1b);
    const OH8DG = parseFloat(oh8dg);
    const protCarbonyls = parseFloat(proteinCarbonyls);
    const NAD = parseFloat(nadPlus);
    const NADratio = parseFloat(nadRatio);
    const NMN = parseFloat(nMethylNic);
    const HRV = parseFloat(hrvRMSSD);
    const sleepEff = parseFloat(sleepEfficiency);
    const steps = parseFloat(dailySteps);
    const pging = parseFloat(pGingivalis);
    const fnuc = parseFloat(fNucleatum);
    const dysbiosis = parseFloat(dysbiosisIndex);

    // ============================================
    // TIER 2 PRAXIOM ALGORITHM (EXACT FROM PROTOCOL)
    // ============================================

    // 1. INFLAMMATORY PANEL SCORE
    const normalizedIL6 = IL6 <= 3.0 ? 10 : (IL6 <= 10.0 ? 5 : 0);
    const normalizedIL1B = IL1B <= 100 ? 10 : (IL1B <= 300 ? 5 : 0);
    const normalizedOH8DG = OH8DG <= 4.0 ? 10 : (OH8DG <= 8.0 ? 5 : 0);
    const normalizedProtCarb = protCarbonyls <= 2.0 ? 10 : (protCarbonyls <= 4.0 ? 5 : 0);

    const inflammatoryScore = ((normalizedIL6 * 2.0) + (normalizedIL1B * 1.5) + 
                              (normalizedOH8DG * 1.5) + (normalizedProtCarb * 1.5)) / 6.5 * 10;

    // 2. NAD+ METABOLOME SCORE
    // Age-adjusted percentile scoring
    const nadPercentile = NAD; // Assume user inputs percentile (0-100)
    const nadScore = (nadPercentile >= 50 ? 10 : nadPercentile / 5);
    
    const ratioScore = NADratio >= 1.0 ? 10 : (NADratio * 10);
    
    const nmnPercentile = NMN; // Assume percentile input
    const nmnScore = (nmnPercentile <= 75 ? 10 : 10 - (nmnPercentile - 75) / 2.5);

    const NADScore = ((nadScore * 0.4) + (ratioScore * 0.3) + (nmnScore * 0.3)) * 10;

    // 3. WEARABLE SCORE (with error correction)
    const correctedHRV = HRV; // ±20% confidence interval
    const correctedSleep = sleepEff * 1.10; // -10% systematic bias correction
    const correctedSteps = steps / 1.09; // +9% underestimation correction

    const hrvScore = correctedHRV >= 70 ? 10 : (correctedHRV / 7);
    const sleepScore = correctedSleep >= 85 ? 10 : (correctedSleep / 8.5);
    const stepsScore = correctedSteps >= 8000 ? 10 : (correctedSteps / 800);

    const wearableScore = ((hrvScore * 0.5) + (sleepScore * 0.3) + (stepsScore * 0.2)) * 10;

    // 4. MICROBIOME RISK ADJUSTMENTS
    let microbiomeRisk = 0;
    if (pging > 5.0) microbiomeRisk += 2; // CVD correlation
    if (fnuc > 3.0) microbiomeRisk += 2; // CRC risk
    microbiomeRisk += dysbiosis * 0.5; // Dysbiosis index contribution

    // 5. ENHANCED SYSTEMIC HEALTH SCORE (Tier 2)
    // SHS_T2 = [(T1_SHS × 0.6) + (Inflammatory Panel × 0.25) + (NAD+ Score × 0.10) + (Wearable Score × 0.05)] × 100
    const tier1SHS = tier1Data.systemicHealth || 70; // Use passed value or default
    const SHS_T2 = ((tier1SHS * 0.6) + (inflammatoryScore * 0.25) + 
                   (NADScore * 0.10) + (wearableScore * 0.05));

    // 6. TIER 2 BIO-AGE CALCULATION
    // Final_Bio_Age = Tier1_Bio_Age + Inflammatory_Adjustment + NAD_Adjustment - Wearable_Bonus + Microbiome_Risk
    const tier1BioAge = tier1Data.bioAge || parseFloat(tier1Data.age) || 50;
    
    const inflammatoryAdj = (100 - inflammatoryScore) * 0.08;
    const nadAdj = (100 - NADScore) * 0.10;
    const wearableBonus = (wearableScore - 70) * 0.05;
    
    const tier2BioAge = tier1BioAge + inflammatoryAdj + nadAdj - wearableBonus + microbiomeRisk;

    // 7. CHECK TIER 3 UPGRADE TRIGGERS
    const needsTier3 = SHS_T2 < 60 || NADScore < 25 || inflammatoryScore < 50 || microbiomeRisk > 3;

    // Show results
    Alert.alert(
      'Tier 2 Bio-Age Analysis Complete',
      `Enhanced Praxiom Bio-Age: ${Math.round(tier2BioAge * 10) / 10} years\n\n` +
      `Enhanced SHS (Tier 2): ${Math.round(SHS_T2)}%\n` +
      `Inflammatory Panel: ${Math.round(inflammatoryScore)}%\n` +
      `NAD+ Metabolome: ${Math.round(NADScore)}%\n` +
      `Wearable Score: ${Math.round(wearableScore)}%\n` +
      `Microbiome Risk: ${microbiomeRisk.toFixed(1)} points\n\n` +
      (needsTier3 ? '⚠️ TIER 3 UPGRADE RECOMMENDED\nPrecision medicine assessment needed' : 
                   '✓ Continue Tier 2 monitoring & interventions'),
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Dashboard', {
            bioAge: Math.round(tier2BioAge * 10) / 10,
            systemicHealth: Math.round(SHS_T2),
            inflammatoryScore: Math.round(inflammatoryScore),
            nadScore: Math.round(NADScore),
            wearableScore: Math.round(wearableScore),
            microbiomeRisk: microbiomeRisk,
            needsTier3: needsTier3,
            tier: 2
          })
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tier 2 Biomarker Input</Text>
        <Text style={styles.subtitle}>Advanced Profiling & Personalization</Text>

        {/* ADVANCED INFLAMMATORY PANEL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Inflammatory Panel</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>IL-6 (pg/mL) * (Optimal: &lt;3.0)</Text>
          <TextInput
            style={styles.input}
            value={il6}
            onChangeText={setIl6}
            placeholder="2.5"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 2.0× - Pro-inflammatory cytokine</Text>

          <Text style={styles.label}>IL-1β (pg/mL) * (Optimal: &lt;100)</Text>
          <TextInput
            style={styles.input}
            value={il1b}
            onChangeText={setIl1b}
            placeholder="85"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.5× - Oral-systemic inflammation</Text>

          <Text style={styles.label}>8-OHdG (ng/mL) * (Optimal: &lt;4.0)</Text>
          <TextInput
            style={styles.input}
            value={oh8dg}
            onChangeText={setOh8dg}
            placeholder="3.2"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.5× - Oxidative stress/DNA damage</Text>

          <Text style={styles.label}>Protein Carbonyls (nmol/mg) * (Optimal: &lt;2.0)</Text>
          <TextInput
            style={styles.input}
            value={proteinCarbonyls}
            onChangeText={setProteinCarbonyls}
            placeholder="1.8"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.5× - Direct oxidative damage</Text>
        </View>

        {/* NAD+ METABOLOME ASSESSMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NAD+ Metabolome Assessment</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>NAD+ Level (percentile) * (Optimal: &gt;50th)</Text>
          <TextInput
            style={styles.input}
            value={nadPlus}
            onChangeText={setNadPlus}
            placeholder="65"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Age-adjusted percentile - Cellular energy metabolism</Text>

          <Text style={styles.label}>NAD+/NADH Ratio * (Optimal: ≥1.0)</Text>
          <TextInput
            style={styles.input}
            value={nadRatio}
            onChangeText={setNadRatio}
            placeholder="1.2"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Cellular redox status indicator</Text>

          <Text style={styles.label}>N-methyl-nicotinamide (percentile) * (Optimal: &lt;75th)</Text>
          <TextInput
            style={styles.input}
            value={nMethylNic}
            onChangeText={setNMethylNic}
            placeholder="60"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>NAD+ metabolism marker</Text>
        </View>

        {/* WEARABLE DATA INTEGRATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wearable Data Integration (PineTime)</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>HRV - RMSSD (ms) * (Optimal: &gt;70)</Text>
          <TextInput
            style={styles.input}
            value={hrvRMSSD}
            onChangeText={setHrvRMSSD}
            placeholder="75"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.0× - ±20% confidence interval correction</Text>

          <Text style={styles.label}>Sleep Efficiency (%) * (Optimal: &gt;85)</Text>
          <TextInput
            style={styles.input}
            value={sleepEfficiency}
            onChangeText={setSleepEfficiency}
            placeholder="88"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.0× - -10% systematic bias correction</Text>

          <Text style={styles.label}>Daily Steps * (Optimal: &gt;8,000)</Text>
          <TextInput
            style={styles.input}
            value={dailySteps}
            onChangeText={setDailySteps}
            placeholder="10000"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 0.8× - +9% underestimation correction</Text>
        </View>

        {/* MICROBIOME ANALYSIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Microbiome Analysis</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>P. gingivalis (%) (Risk: &gt;5%)</Text>
          <TextInput
            style={styles.input}
            value={pGingivalis}
            onChangeText={setPGingivalis}
            placeholder="3.2"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>CVD correlation - +2 risk points if &gt;5%</Text>

          <Text style={styles.label}>F. nucleatum (%) (Risk: &gt;3%)</Text>
          <TextInput
            style={styles.input}
            value={fNucleatum}
            onChangeText={setFNucleatum}
            placeholder="2.1"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>CRC risk - +2 risk points if &gt;3%</Text>

          <Text style={styles.label}>Dysbiosis Index (0-10)</Text>
          <TextInput
            style={styles.input}
            value={dysbiosisIndex}
            onChangeText={setDysbiosisIndex}
            placeholder="2.5"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Pathogen/beneficial ratio calculation</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={calculateTier2BioAge}
        >
          <Text style={styles.calculateButtonText}>Calculate Tier 2 Bio-Age</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 25,
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  divider: {
    height: 3,
    backgroundColor: '#3498DB',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
  },
  weightNote: {
    fontSize: 13,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginTop: 5,
  },
  calculateButton: {
    backgroundColor: '#3498DB',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#757575',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Tier2BiomarkerInputScreen;