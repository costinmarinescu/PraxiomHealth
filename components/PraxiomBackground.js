import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PraxiomBackground = ({ children, style }) => {
  return (
    <LinearGradient
      colors={['#0a0a1e', '#1a1a2e', '#16213e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default PraxiomBackground;
