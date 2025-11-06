import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function WatchScreen() {
  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="watch" size={48} color="#00CFC1" />
          <Text style={styles.title}>PineTime Watch</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connect Your Watch</Text>
          <Text style={styles.cardText}>
            Pair your PineTime watch to sync your Praxiom Age and receive real-time health updates.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={24} color="#FF8C00" />
            <Text style={styles.featureText}>Real-time Bio-Age display</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="fitness" size={24} color="#00CFC1" />
            <Text style={styles.featureText}>Continuous health tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="notifications" size={24} color="#9D4EDD" />
            <Text style={styles.featureText}>Health alerts & reminders</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#00CFC1" />
          <Text style={styles.infoText}>
            Watch connectivity feature coming soon! Calculate your Praxiom Age using the Biomarker Input screen.
          </Text>
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
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
});
