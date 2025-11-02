import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  return (
    <LinearGradient
      colors={['rgba(255, 107, 53, 0.3)', 'rgba(0, 0, 0, 0.9)', 'rgba(0, 188, 212, 0.3)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.metricsContainer}>
          {/* Oral Health */}
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Oral Health</Text>
            <Text style={styles.metricValue}>--</Text>
            <Text style={styles.metricUnit}>score</Text>
          </View>

          {/* Systemic Health */}
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Systemic Health</Text>
            <Text style={styles.metricValue}>--</Text>
            <Text style={styles.metricUnit}>score</Text>
          </View>

          {/* Fitness Score */}
          <View style={styles.metricCardCenter}>
            <Text style={styles.metricTitle}>Fitness Score</Text>
            <Text style={styles.metricValue}>--</Text>
            <Text style={styles.metricUnit}>level</Text>
          </View>
        </View>

        {/* Bio Age Display */}
        <View style={styles.bioAgeContainer}>
          <Text style={styles.bioAgeLabel}>Praxiom Age</Text>
          <Text style={styles.bioAgeValue}>--</Text>
          <Text style={styles.bioAgeUnit}>years</Text>
        </View>
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
    alignItems: 'center',
  },
  metricsContainer: {
    width: '100%',
    marginTop: 20,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  metricCardCenter: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 212, 0.3)',
    alignItems: 'center',
  },
  metricTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  metricValue: {
    color: '#FF6B35',
    fontSize: 48,
    fontWeight: 'bold',
  },
  metricUnit: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  bioAgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
    padding: 30,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.5)',
  },
  bioAgeLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  bioAgeValue: {
    color: '#00BCD4',
    fontSize: 64,
    fontWeight: 'bold',
  },
  bioAgeUnit: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 5,
  },
});
