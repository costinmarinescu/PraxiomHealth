import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppContextProvider, AppContext } from './AppContext';
import ErrorBoundary from './components/ErrorBoundary';

function TestContent() {
  const { state } = React.useContext(AppContext);
  const [count, setCount] = React.useState(0);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Step 1: AppContext Test</Text>
      <Text style={styles.text}>Counter: {count}</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setCount(count + 1)}
      >
        <Text style={styles.buttonText}>Increment</Text>
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <Text style={styles.subtitle}>AppContext Data:</Text>
      <Text style={styles.data}>Bio-Age: {state.biologicalAge}</Text>
      <Text style={styles.data}>Oral Score: {state.oralHealthScore}%</Text>
      <Text style={styles.data}>Watch: {state.watchConnected ? '✅' : '❌'}</Text>
    </View>
  );
}

export default function App() {
  console.log('🚀 Testing with AppContext...');
  
  return (
    <ErrorBoundary>
      <AppContextProvider>
        <TestContent />
      </AppContextProvider>
    </ErrorBoundary>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#47C83E',
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#00d4ff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    width: '100%',
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#00d4ff',
    marginBottom: 10,
  },
  data: {
    fontSize: 16,
    color: '#FFFFFF',
    marginVertical: 3,
  },
});
