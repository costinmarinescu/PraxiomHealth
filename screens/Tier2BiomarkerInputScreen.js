import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';

const Tier2BiomarkerInputScreen = () => {
  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="rocket-outline" size={80} color="#4ade80" />
          <Text style={styles.title}>Tier 2 Assessment</Text>
          <Text style={styles.subtitle}>Advanced Biomarker Analysis</Text>
          
          <View style={styles.comingSoonCard}>
            <Text style={styles.cardTitle}>Coming Soon</Text>
            <Text style={styles.cardText}>
              Tier 2 includes advanced biomarkers:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Advanced inflammatory panel</Text>
              <Text style={styles.featureItem}>• NAD+ metabolome assessment</Text>
              <Text style={styles.featureItem}>• DNA methylation analysis</Text>
              <Text style={styles.featureItem}>• Microbiome evaluation</Text>
              <Text style={styles.featureItem}>• Advanced wearable integration</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </PraxiomBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 8,
  },
  comingSoonCard: {
    backgroundColor: '#1e1e2e',
    padding: 30,
    borderRadius: 20,
    marginTop: 40,
    width: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: 15,
  },
  cardText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 15,
  },
  featureList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 10,
  },
});

export default Tier2BiomarkerInputScreen;
