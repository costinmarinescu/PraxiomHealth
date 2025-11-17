import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContextProvider, AppContext } from './AppContext';
import ErrorBoundary from './components/ErrorBoundary';

const Stack = createNativeStackNavigator();

function TestScreen({ navigation }) {
  const { state } = React.useContext(AppContext);
  const [count, setCount] = React.useState(0);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Step 2: Navigation Test</Text>
      
      <View style={styles.card}>
        <Text style={styles.subtitle}>Counter Test:</Text>
        <Text style={styles.counter}>{count}</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setCount(count + 1)}
        >
          <Text style={styles.buttonText}>Increment</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.subtitle}>AppContext Data:</Text>
        <Text style={styles.data}>Bio-Age: {state.biologicalAge}</Text>
        <Text style={styles.data}>Oral Score: {state.oralHealthScore}%</Text>
        <Text style={styles.data}>Systemic Score: {state.systemicHealthScore}%</Text>
        <Text style={styles.data}>Watch: {state.watchConnected ? '✅ Connected' : '❌ Disconnected'}</Text>
      </View>
      
      <View style={styles.successBox}>
        <Text style={styles.successText}>
          ✅ Navigation is working!{'\n'}
          ✅ AppContext is working!{'\n'}
          ✅ Ready for Step 3
        </Text>
      </View>
    </View>
  );
}

export default function App() {
  console.log('🚀 Step 2: Testing with Navigation...');
  
  return (
    <ErrorBoundary>
      <AppContextProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Test" component={TestScreen} />
          </Stack.Navigator>
        </NavigationContainer>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#47C83E',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  subtitle: {
    fontSize: 18,
    color: '#00d4ff',
    marginBottom: 15,
    fontWeight: '600',
  },
  counter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#00d4ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  data: {
    fontSize: 16,
    color: '#FFFFFF',
    marginVertical: 5,
  },
  successBox: {
    backgroundColor: 'rgba(71, 200, 62, 0.2)',
    borderColor: '#47C83E',
    borderWidth: 2,
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
  },
  successText: {
    fontSize: 16,
    color: '#47C83E',
    textAlign: 'center',
    lineHeight: 24,
  },
});
