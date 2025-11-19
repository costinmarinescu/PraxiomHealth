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
import { useAppContext } from '../AppContext';
import PraxiomAlgorithm from '../services/PraxiomAlgorithm';
import PraxiomBackground from '../components/PraxiomBackground';

const FitnessAssessmentScreen = ({ navigation }) => {
  const { healthData, setHealthData } = useContext(AppContext);
  const [assessmentType, setAssessmentType] = useState(null);

  // Aerobic Fitness
  const [aerobicTestType, setAerobicTestType] = useState('stepTest');
  const [recoveryHeartRate, setRecoveryHeartRate] = useState('');
  const [walkDistance, setWalkDistance] = useState('');

  // Flexibility & Posture
  const [sitReachCm, setSitReachCm] = useState('');
  const [postureRating, setPostureRating] = useState('5');

  // Balance & Coordination
  const [oneLegStand, setOneLegStand] = useState('');
  const [yBalanceScore, setYBalanceScore] = useState('');

  // Mind-Body Alignment
  const [confidenceRating, setConfidenceRating] = useState('5');
  const [awarenessRating, setAwarenessRating] = useState('5');

  const calculateFitnessAssessment = () => {
    try {
      // Validate inputs
      if (!aerobicTestType || (!recoveryHeartRate && !walkDistance)) {
        Alert.alert('Missing Data', 'Please complete the aerobic fitness test');
        return;
      }
      if (!sitReachCm || !postureRating) {
        Alert.alert('Missing Data', 'Please complete the flexibility assessment');
        return;
      }
      if (!oneLegStand) {
        Alert.alert('Missing Data', 'Please complete the balance assessment');
        return;
      }
      if (!confidenceRating || !awarenessRating) {
        Alert.alert('Missing Data', 'Please complete the mind-body assessment');
        return;
      }

      const age = healthData.age || 45;

      // Calculate Aerobic Score
      let aerobicScore;
      if (aerobicTestType === 'stepTest') {
        aerobicScore = PraxiomAlgorithm.calculateAerobicScore(
          'stepTest',
          parseFloat(recoveryHeartRate),
          age,
          'unknown'
        );
      } else {
        aerobicScore = PraxiomAlgorithm.calculateAerobicScore(
          '6mwt',
          parseFloat(walkDistance),
          age,
          'unknown'
        );
      }

      // Calculate Flexibility Score
      const flexibilityScore = PraxiomAlgorithm.calculateFlexibilityScore(
        parseFloat(sitReachCm),
        parseFloat(postureRating)
      );

      // Calculate Balance Score
      const balanceScore = PraxiomAlgorithm.calculateBalanceScore(
        parseFloat(oneLegStand),
        yBalanceScore ? parseFloat(yBalanceScore) : null
      );

      // Calculate Mind-Body Score
      const mindBodyScore = PraxiomAlgorithm.calculateMindBodyScore(
        parseFloat(confidenceRating),
        parseFloat(awarenessRating)
      );

      // Calculate composite fitness score
      const compositeScore = PraxiomAlgorithm.calculateFitnessScore(
        aerobicScore,
        flexibilityScore,
        balanceScore,
        mindBodyScore
      );

      // Save to health data
      const updatedHealthData = {
        ...healthData,
        aerobicScore,
        flexibilityScore,
        balanceScore,
        mindBodyScore,
        fitnessScore: compositeScore,
        fitnessAssessmentDate: new Date().toISOString(),
      };

      setHealthData(updatedHealthData);

      // Show results
      Alert.alert(
        'Fitness Assessment Complete',
        `Your Fitness Score: ${compositeScore}%\n\n` +
        `Aerobic: ${aerobicScore}/10\n` +
        `Flexibility: ${flexibilityScore}/10\n` +
        `Balance: ${balanceScore}/10\n` +
        `Mind-Body: ${mindBodyScore}/10\n\n` +
        `${getScoreInterpretation(compositeScore)}`,
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate fitness assessment: ' + error.message);
    }
  };

  const getScoreInterpretation = (score) => {
    if (score >= 90) return '🟢 Excellent fitness! Top percentile for your age.';
    if (score >= 80) return '🟢 Very Good fitness. Well above average.';
    if (score >= 70) return '🟡 Good fitness. Meeting healthy standards.';
    if (score >= 60) return '🟠 Fair fitness. Room for improvement recommended.';
    return '🔴 Below target. Focus on structured exercise program.';
  };

  return (
    <PraxiomBackground style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Fitness Assessment</Text>
          <Text style={styles.subtitle}>Tier 1 Optional Module - 4 Fitness Domains</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Assessment Overview</Text>
          <Text style={styles.infoText}>
            This comprehensive fitness evaluation measures four key domains linked to longevity:
          </Text>
          <Text style={styles.bulletText}>• Aerobic Fitness (VO₂max proxy)</Text>
          <Text style={styles.bulletText}>• Flexibility & Postural Alignment</Text>
          <Text style={styles.bulletText}>• Coordination & Balance</Text>
          <Text style={styles.bulletText}>• Mental Preparedness & Mind-Body Alignment</Text>
          <Text style={styles.warningText}>
            ⚠️ This assessment should be performed by a certified personal trainer in a safe environment.
          </Text>
        </View>

        {/* 1. Aerobic Fitness */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1️⃣ Aerobic Fitness</Text>
          <Text style={styles.infoText}>
            Choose test type and enter results:
          </Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.testButton, aerobicTestType === 'stepTest' && styles.testButtonActive]}
              onPress={() => setAerobicTestType('stepTest')}
            >
              <Text style={[styles.testButtonText, aerobicTestType === 'stepTest' && styles.testButtonTextActive]}>
                3-Min Step Test
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testButton, aerobicTestType === '6mwt' && styles.testButtonActive]}
              onPress={() => setAerobicTestType('6mwt')}
            >
              <Text style={[styles.testButtonText, aerobicTestType === '6mwt' && styles.testButtonTextActive]}>
                6-Min Walk Test
              </Text>
            </TouchableOpacity>
          </View>

          {aerobicTestType === 'stepTest' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Recovery Heart Rate (1 min after)</Text>
              <TextInput
                style={styles.input}
                value={recoveryHeartRate}
                onChangeText={setRecoveryHeartRate}
                keyboardType="numeric"
                placeholder="e.g., 95"
                placeholderTextColor="#666"
              />
              <Text style={styles.unit}>bpm</Text>
            </View>
          )}

          {aerobicTestType === '6mwt' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Distance Walked</Text>
              <TextInput
                style={styles.input}
                value={walkDistance}
                onChangeText={setWalkDistance}
                keyboardType="numeric"
                placeholder="e.g., 550"
                placeholderTextColor="#666"
              />
              <Text style={styles.unit}>meters</Text>
            </View>
          )}
        </View>

        {/* 2. Flexibility & Posture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2️⃣ Flexibility & Posture</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sit-and-Reach Test</Text>
            <Text style={styles.helpText}>
              Distance reached beyond (positive) or before (negative) toes
            </Text>
            <TextInput
              style={styles.input}
              value={sitReachCm}
              onChangeText={setSitReachCm}
              keyboardType="numeric"
              placeholder="e.g., -5 or +8"
              placeholderTextColor="#666"
            />
            <Text style={styles.unit}>cm</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Posture Assessment (0-10)</Text>
            <Text style={styles.helpText}>
              0 = Poor alignment, 5 = Moderate, 10 = Excellent neutral posture
            </Text>
            <TextInput
              style={styles.input}
              value={postureRating}
              onChangeText={setPostureRating}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor="#666"
            />
            <Text style={styles.unit}>/ 10</Text>
          </View>
        </View>

        {/* 3. Balance & Coordination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3️⃣ Balance & Coordination</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>One-Leg Stance Test</Text>
            <Text style={styles.helpText}>
              Maximum time balanced on one leg (best of 3 attempts)
            </Text>
            <TextInput
              style={styles.input}
              value={oneLegStand}
              onChangeText={setOneLegStand}
              keyboardType="numeric"
              placeholder="e.g., 15"
              placeholderTextColor="#666"
            />
            <Text style={styles.unit}>seconds</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Y-Balance Score (Optional)</Text>
            <Text style={styles.helpText}>
              Composite reach score (0-10) if Y-Balance test performed
            </Text>
            <TextInput
              style={styles.input}
              value={yBalanceScore}
              onChangeText={setYBalanceScore}
              keyboardType="numeric"
              placeholder="Leave empty if not tested"
              placeholderTextColor="#666"
            />
            <Text style={styles.unit}>/ 10</Text>
          </View>
        </View>

        {/* 4. Mind-Body Alignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4️⃣ Mind-Body Alignment</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Movement Confidence (0-10)</Text>
            <Text style={styles.helpText}>
              0 = Anxious/fearful, 5 = Moderate confidence, 10 = Highly confident
            </Text>
            <TextInput
              style={styles.input}
              value={confidenceRating}
              onChangeText={setConfidenceRating}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor="#666"
            />
            <Text style={styles.unit}>/ 10</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Body Awareness (0-10)</Text>
            <Text style={styles.helpText}>
              0 = Poor awareness, 5 = Moderate, 10 = Excellent proprioception
            </Text>
            <TextInput
              style={styles.input}
              value={awarenessRating}
              onChangeText={setAwarenessRating}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor="#666"
            />
            <Text style={styles.unit}>/ 10</Text>
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={calculateFitnessAssessment}
        >
          <Text style={styles.calculateButtonText}>Calculate Fitness Score</Text>
        </TouchableOpacity>

        {/* Protocol Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Scoring Information</Text>
          <Text style={styles.infoText}>
            Each domain is scored 0-10, then combined into a Fitness Score (0-100%). This score is integrated into your biological age calculation using age-stratified γ coefficients.
          </Text>
          <Text style={styles.infoText} style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Fitness Score Impact on Bio-Age:</Text>
            {'\n'}• Age &lt;50: Each 10-point deficit adds ~1.0-1.5 years
            {'\n'}• Age 50-70: Each 10-point deficit adds ~1.2-1.5 years
            {'\n'}• Age &gt;70: Each 10-point deficit adds ~1.5 years
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </PraxiomBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginLeft: 10,
  },
  warningText: {
    fontSize: 13,
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonActive: {
    backgroundColor: '#3b82f6',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  testButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginTop: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  unit: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
    marginLeft: 5,
  },
  calculateButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FitnessAssessmentScreen;
