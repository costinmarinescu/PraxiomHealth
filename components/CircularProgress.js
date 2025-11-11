import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const CircularProgress = ({ score, label, size = 120 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (score) => {
    if (score >= 80) return ['#00d4ff', '#0ea5e9'];
    if (score >= 65) return ['#4ade80', '#22c55e'];
    if (score >= 50) return ['#fbbf24', '#f59e0b'];
    if (score >= 35) return ['#fb923c', '#f97316'];
    return ['#ef4444', '#dc2626'];
  };

  const colors = getColor(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient colors={['#1e1e2e', '#2a2a3e']} style={styles.card}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2a2a3e"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.content}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  svg: { position: 'absolute' },
  content: { alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },
  label: { fontSize: 12, color: '#8e8e93', marginTop: 4 },
});

export default CircularProgress;
