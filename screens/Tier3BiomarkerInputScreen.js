import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';
import SecureStorageService from '../services/SecureStorageService';
import PraxiomBackground from '../components/PraxiomBackground';

export default function Tier3BiomarkerInputScreen({ navigation }) {
  const { state, updateState } = useContext(AppContext);
  
  // Required scores (used in algorithm)
  const [mriScore, setMriScore] = useState(state.tier3MriScore || null);
  const [geneticScore, setGeneticScore] = useState(state.tier3GeneticScore || null);
  
  // Optional informative metrics (NOT used in algorithm calculation)
  const [showOptionalMetrics, setShowOptionalMetrics] = useState(false);
  const [dunedinPACE, setDunedinPACE] = useState(state.dunedinPACE || '');
  const [elovl2Age, setElovl2Age] = useState(state.elovl2Age || '');
  const [intrinsicCapacity, setIntrinsicCapacity] = useState(state.intrinsicCapacity || '');

  const handleSave = async () => {
    try {
      // Validate that at least one REQUIRED score is entered
      if (mriScore === null && geneticScore === null) {
        Alert.alert(
          'Input Required', 
          'Please enter at least one required score (MRI or Genetic) to calculate your Tier 3 bio-age.'
        );
        return;
      }

      // Save required Tier 3 data (used in algorithm)
      await SecureStorageService.saveTier3Data(mriScore, geneticScore);

      // Save optional informative data (if provided)
      if (dunedinPACE || elovl2Age || intrinsicCapacity) {
        await SecureStorageService.saveTier3OptionalData({
          dunedinPACE: dunedinPACE ? parseFloat(dunedinPACE) : null,
          elovl2Age: elovl2Age ? parseFloat(elovl2Age) : null,
          intrinsicCapacity: intrinsicCapacity ? parseFloat(intrinsicCapacity) : null,
        });
      }

      // Update AppContext state
      updateState({
        tier3MriScore: mriScore,
        tier3GeneticScore: geneticScore,
        dunedinPACE: dunedinPACE ? parseFloat(dunedinPACE) : null,
        elovl2Age: elovl2Age ? parseFloat(elovl2Age) : null,
        intrinsicCapacity: intrinsicCapacity ? parseFloat(intrinsicCapacity) : null,
      });

      Alert.alert(
        'Tier 3 Data Saved',
        'Your MRI and genetic scores have been saved. Your bio-age will be recalculated.\n\n' +
        (dunedinPACE || elovl2Age || intrinsicCapacity 
          ? 'Optional metrics saved for comparative analysis.' 
          : ''),
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('Dashboard'),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error saving Tier 3 data:', error);
      Alert.alert('Error', 'Failed to save Tier 3 data: ' + error.message);
    }
  };

  const renderScoreButton = (score, currentValue, setValue) => {
    const isSelected = currentValue === score;
    const isCritical = score >= 7;
    const isModerate = score >= 4 && score < 7;

    return (
      <TouchableOpacity
        key={score}
        style={[
          styles.scoreButton,
          isSelected && styles.scoreButtonSelected,
          isCritical && styles.scoreCritical,
          isModerate && styles.scoreModerate,
        ]}
        onPress={() => setValue(score)}
      >
        <Text
          style={[
            styles.scoreButtonText,
            isSelected && styles.scoreButtonTextSelected,
          ]}
        >
          {score}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <PraxiomBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="medical" size={40} color="#9D4EDD" />
          <Text style={styles.headerTitle}>Tier 3: Precision Mastery</Text>
          <Text style={styles.headerSubtitle}>
            Advanced diagnostic modules for comprehensive longevity optimization
          </Text>
        </View>

        {/* Required Metrics Banner */}
        <View style={styles.requiredBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#00CFC1" />
          <View style={styles.requiredBannerText}>
            <Text style={styles.requiredBannerTitle}>Required for Bio-Age Calculation</Text>
            <Text style={styles.requiredBannerSubtitle}>
              These scores directly affect your biological age
            </Text>
          </View>
        </View>

        {/* MRI Score Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="body" size={20} color="#FF6B35" /> Prenuvo Full-Body MRI Score
          </Text>
          <Text style={styles.sectionDescription}>
            Based on your full-body MRI results, select the score that reflects your findings.
          </Text>

          <View style={styles.scoreGrid}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) =>
              renderScoreButton(score, mriScore, setMriScore)
            )}
          </View>

          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>MRI Score Guide:</Text>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>✅ 0:</Text>
              <Text style={styles.legendText}>No clinically significant findings</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>ℹ️ 1-3:</Text>
              <Text style={styles.legendText}>Minor anomalies (minimal clinical impact)</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>⚠️ 4-6:</Text>
              <Text style={styles.legendText}>
                Moderate abnormalities (lifestyle interventions or specialist referral)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>🔴 7-10:</Text>
              <Text style={styles.legendText}>
                Significant abnormalities (immediate clinical intervention recommended)
              </Text>
            </View>
          </View>
        </View>

        {/* Genetic Score Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="git-network" size={20} color="#00CFC1" /> Whole-Genome Genetic Risk Score
          </Text>
          <Text style={styles.sectionDescription}>
            Based on your comprehensive genetic testing, select the score that reflects your hereditary risk profile.
          </Text>

          <View style={styles.scoreGrid}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) =>
              renderScoreButton(score, geneticScore, setGeneticScore)
            )}
          </View>

          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Genetic Score Guide:</Text>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>✅ 0:</Text>
              <Text style={styles.legendText}>Optimal genetic profile (low predisposition)</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>ℹ️ 1-3:</Text>
              <Text style={styles.legendText}>
                Minor genetic risks (lifestyle adjustment recommended)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>⚠️ 4-6:</Text>
              <Text style={styles.legendText}>
                Moderate genetic risks (targeted surveillance or preventive strategies)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendLabel}>🔴 7-10:</Text>
              <Text style={styles.legendText}>
                High genetic predisposition (intensive preventive measures required)
              </Text>
            </View>
          </View>
        </View>

        {/* Optional Metrics Section */}
        <View style={styles.optionalSection}>
          <TouchableOpacity
            style={styles.optionalHeader}
            onPress={() => setShowOptionalMetrics(!showOptionalMetrics)}
          >
            <View style={styles.optionalHeaderLeft}>
              <Ionicons 
                name="information-circle-outline" 
                size={24} 
                color="rgba(255,255,255,0.7)" 
              />
              <View style={styles.optionalHeaderText}>
                <Text style={styles.optionalHeaderTitle}>
                  Optional: DNA Methylation Metrics
                </Text>
                <Text style={styles.optionalHeaderSubtitle}>
                  For comparative analysis only (not used in bio-age calculation)
                </Text>
              </View>
            </View>
            <Ionicons
              name={showOptionalMetrics ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="rgba(255,255,255,0.7)"
            />
          </TouchableOpacity>

          {showOptionalMetrics && (
            <View style={styles.optionalContent}>
              <View style={styles.optionalNotice}>
                <Ionicons name="alert-circle" size={20} color="#FF9500" />
                <Text style={styles.optionalNoticeText}>
                  These metrics are informative only and will NOT affect your bio-age calculation
                </Text>
              </View>

              {/* DunedinPACE */}
              <View style={styles.optionalInputSection}>
                <Text style={styles.optionalInputTitle}>
                  <Ionicons name="speedometer" size={18} color="#9D4EDD" /> DunedinPACE
                </Text>
                <Text style={styles.optionalInputDescription}>
                  Measures the pace of aging. {'<'}0.9 = slow, 1.0 = normal, {'>'}1.2 = accelerated
                </Text>
                <TextInput
                  style={styles.optionalInput}
                  keyboardType="numeric"
                  value={dunedinPACE}
                  onChangeText={setDunedinPACE}
                  placeholder="1.0"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
                <View style={styles.miniLegend}>
                  <Text style={styles.miniLegendText}>✅ {'<'}0.9 | ⚠️ 0.9-1.1 | 🔴 {'>'}1.2</Text>
                </View>
              </View>

              {/* ELOVL2 Age */}
              <View style={styles.optionalInputSection}>
                <Text style={styles.optionalInputTitle}>
                  <Ionicons name="time" size={18} color="#FF8C00" /> ELOVL2 Epigenetic Age
                </Text>
                <Text style={styles.optionalInputDescription}>
                  Your methylation age. Should be close to chronological age (±2 years optimal)
                </Text>
                <TextInput
                  style={styles.optionalInput}
                  keyboardType="numeric"
                  value={elovl2Age}
                  onChangeText={setElovl2Age}
                  placeholder={state?.chronologicalAge ? state.chronologicalAge.toString() : "Your age"}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
                <View style={styles.miniLegend}>
                  <Text style={styles.miniLegendText}>✅ ±2 years | ⚠️ ±2-5 years | 🔴 {'>'}±5 years</Text>
                </View>
              </View>

              {/* Intrinsic Capacity */}
              <View style={styles.optionalInputSection}>
                <Text style={styles.optionalInputTitle}>
                  <Ionicons name="fitness" size={18} color="#00CFC1" /> Intrinsic Capacity Score
                </Text>
                <Text style={styles.optionalInputDescription}>
                  WHO functional aging measure (0-100%). Combines cognition, locomotion, vitality
                </Text>
                <TextInput
                  style={styles.optionalInput}
                  keyboardType="numeric"
                  value={intrinsicCapacity}
                  onChangeText={setIntrinsicCapacity}
                  placeholder="85"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
                <View style={styles.miniLegend}>
                  <Text style={styles.miniLegendText}>✅ {'>'}85% | ⚠️ 70-85% | 🔴 {'<'}70%</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Current Selection Summary */}
        {(mriScore !== null || geneticScore !== null) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Tier 3 Assessment:</Text>
            {mriScore !== null && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>MRI Score:</Text>
                <Text style={styles.summaryValue}>{mriScore}/10</Text>
              </View>
            )}
            {geneticScore !== null && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Genetic Score:</Text>
                <Text style={styles.summaryValue}>{geneticScore}/10</Text>
              </View>
            )}
            {(dunedinPACE || elovl2Age || intrinsicCapacity) && (
              <View style={styles.summaryDivider} />
            )}
            {dunedinPACE && (
              <View style={styles.summaryItemOptional}>
                <Text style={styles.summaryLabelOptional}>DunedinPACE:</Text>
                <Text style={styles.summaryValueOptional}>{dunedinPACE}</Text>
              </View>
            )}
            {elovl2Age && (
              <View style={styles.summaryItemOptional}>
                <Text style={styles.summaryLabelOptional}>ELOVL2 Age:</Text>
                <Text style={styles.summaryValueOptional}>{elovl2Age}</Text>
              </View>
            )}
            {intrinsicCapacity && (
              <View style={styles.summaryItemOptional}>
                <Text style={styles.summaryLabelOptional}>Intrinsic Capacity:</Text>
                <Text style={styles.summaryValueOptional}>{intrinsicCapacity}%</Text>
              </View>
            )}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (mriScore === null && geneticScore === null) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={mriScore === null && geneticScore === null}
        >
          <Ionicons name="save" size={24} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Tier 3 Assessment</Text>
        </TouchableOpacity>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Ionicons name="information-circle" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.footerText}>
            Tier 3 assessments should be performed by certified laboratories and medical professionals.
            Consult with your healthcare provider for test ordering and interpretation.
          </Text>
        </View>
      </ScrollView>
    </PraxiomBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  requiredBanner: {
    backgroundColor: 'rgba(0, 207, 193, 0.15)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
  },
  requiredBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  requiredBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  requiredBannerSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
    lineHeight: 20,
    opacity: 0.9,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreButton: {
    width: '17%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoreButtonSelected: {
    backgroundColor: 'rgba(157, 78, 221, 0.8)',
    borderColor: '#9D4EDD',
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  scoreModerate: {
    borderColor: 'rgba(255, 152, 0, 0.5)',
  },
  scoreCritical: {
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  scoreButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreButtonTextSelected: {
    color: '#fff',
  },
  legendCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    width: 50,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    opacity: 0.9,
  },
  optionalSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  optionalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionalHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  optionalHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionalHeaderSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  optionalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  optionalNoticeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 16,
  },
  optionalInputSection: {
    marginBottom: 20,
  },
  optionalInputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  optionalInputDescription: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 18,
  },
  optionalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  miniLegend: {
    paddingHorizontal: 8,
  },
  miniLegendText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  summaryCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.5)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  summaryItemOptional: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabelOptional: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
  summaryValueOptional: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.7,
  },
  saveButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 25,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    fontStyle: 'italic',
    marginLeft: 10,
    lineHeight: 18,
  },
});
