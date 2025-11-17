import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * ABSOLUTE MINIMAL APP - ZERO EXTERNAL DEPENDENCIES
 * 
 * This uses ONLY React Native core components.
 * No navigation, no context, no BLE, no images, nothing.
 * 
 * If this crashes, your build system has fundamental issues.
 * If this works, add features back one by one.
 */

export default function App() {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('🚀 MINIMAL APP STARTED SUCCESSFULLY!');
    console.log('✅ React is working');
    console.log('✅ React Native is working');
    console.log('✅ Your build system is working');
    console.log('');
    console.log('⚠️ If you see this in the console, the problem is NOT');
    console.log('   in your build system or core dependencies.');
    console.log('   The problem is in one of your app components.');
  }, []);
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>✅ SUCCESS!</Text>
        <Text style={styles.message}>
          Your app started successfully!
        </Text>
        <Text style={styles.details}>
          This means your build system works.
          The crash was in a component or library.
        </Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Test Counter:</Text>
        <Text style={styles.counter}>{count}</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setCount(count + 1)}
        >
          <Text style={styles.buttonText}>Tap to Increment</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <Text style={styles.instructions}>
          Next Steps:{'\n'}
          {'\n'}
          1. Your build works! ✅{'\n'}
          2. Check Metro console logs{'\n'}
          3. Add components back one by one{'\n'}
          4. Find which component crashes
        </Text>
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Praxiom Health</Text>
          <Text style={styles.badgeSubtext}>Diagnostic Mode</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    padding: 30,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#47C83E',
    textAlign: 'center',
    marginBottom: 15,
  },
  message: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  details: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#00d4ff',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  counter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#00d4ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructions: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 22,
  },
  badge: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    textAlign: 'center',
  },
  badgeSubtext: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 5,
  },
});
