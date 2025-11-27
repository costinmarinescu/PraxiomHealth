/**
 * App.js - Production Version with Debug Toggle
 * PraxiomHealth Main Application Entry Point
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  LogBox,
  TouchableOpacity
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';

// Import AppContext
import { AppContextProvider } from './AppContext';

// Import all screens
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import BiomarkerHistoryScreen from './screens/BiomarkerHistoryScreen';
import WatchScreen from './screens/WatchScreen';
import ReportScreen from './screens/ReportScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import FitnessAssessmentScreen from './screens/FitnessAssessmentScreen';
import HistoricalDataScreen from './screens/HistoricalDataScreen';

// Import services for testing
import TestScreen from './screens/TestScreen';
import DebugTestScreen from './screens/DebugTestScreen';

// Suppress non-critical warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs(true);
} else {
  // In development, only ignore specific warnings
  LogBox.ignoreLogs([
    'Non-serializable values were found',
    'VirtualizedLists should never be nested',
    'Warning: componentWillReceiveProps',
    'Warning: componentWillMount',
  ]);
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Debug configuration - set to false for production
const DEBUG_CONFIG = {
  skipAuth: false, // Set to true to skip authentication
  showDebugInfo: __DEV__, // Show debug info in development
  logNavigation: __DEV__, // Log navigation events
};

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorScreen}>
          <Text style={styles.errorTitle}>❌ Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error && this.state.error.toString()}
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Main tab navigator (after authentication)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Biomarkers':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Watch':
              iconName = focused ? 'watch' : 'watch-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00A6B8',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Biomarkers" component={BiomarkerInputScreen} />
      <Tab.Screen name="Watch" component={WatchScreen} />
      <Tab.Screen name="Reports" component={ReportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth stack navigator
function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName={DEBUG_CONFIG.skipAuth ? "Main" : "Auth"}
      screenOptions={{
        headerShown: false,
        gestureEnabled: Platform.OS === 'ios',
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        }),
      }}
    >
      {!DEBUG_CONFIG.skipAuth && (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ headerShown: false }}
        />
      )}
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      
      {/* Additional screens that aren't in tabs */}
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: '#00A6B8' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="BiomarkerHistory" 
        component={BiomarkerHistoryScreen}
        options={{ 
          headerShown: true,
          title: 'Biomarker History',
          headerStyle: { backgroundColor: '#00A6B8' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Comparison" 
        component={ComparisonScreen}
        options={{ 
          headerShown: true,
          title: 'Compare Results',
          headerStyle: { backgroundColor: '#00A6B8' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="FitnessAssessment" 
        component={FitnessAssessmentScreen}
        options={{ 
          headerShown: true,
          title: 'Fitness Assessment',
          headerStyle: { backgroundColor: '#00A6B8' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="HistoricalData" 
        component={HistoricalDataScreen}
        options={{ 
          headerShown: true,
          title: 'Historical Data',
          headerStyle: { backgroundColor: '#00A6B8' },
          headerTintColor: '#fff',
        }}
      />
      
      {/* Debug screens - only in development */}
      {__DEV__ && (
        <>
          <Stack.Screen 
            name="Test" 
            component={TestScreen}
            options={{ headerShown: true, title: 'Test Screen' }}
          />
          <Stack.Screen 
            name="DebugTest" 
            component={DebugTestScreen}
            options={{ headerShown: true, title: 'Debug Test' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function loadResources() {
      try {
        console.log('🚀 Starting PraxiomHealth initialization...');
        
        // Add delay for iOS initialization
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Load fonts
        try {
          await Font.loadAsync({
            ...Ionicons.font,
          });
          console.log('✅ Fonts loaded');
        } catch (fontError) {
          console.warn('⚠️ Font loading issue:', fontError.message);
          // Continue - fonts are not critical
        }

        // Pre-load critical images
        const imageAssets = [
          require('./assets/icon.png'),
          require('./assets/splash.png'),
          require('./assets/praxiom-logo.png'),
          require('./assets/logo.png'),
          require('./assets/adaptive-icon.png'),
        ];

        try {
          await Asset.loadAsync(imageAssets);
          console.log('✅ Images loaded');
        } catch (imageError) {
          console.warn('⚠️ Some images failed to load:', imageError.message);
          // Continue - can work without all images
        }

        console.log('✅ App initialization complete');
        setIsReady(true);
      } catch (error) {
        console.error('❌ Critical initialization error:', error);
        setLoadError(error);
        setIsReady(true); // Still show error screen
      }
    }

    loadResources();
  }, []);

  // Navigation state change handler for debugging
  const onNavigationStateChange = (state) => {
    if (DEBUG_CONFIG.logNavigation) {
      console.log('📍 Navigation State:', state);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A6B8" />
        <Text style={styles.loadingText}>Loading PraxiomHealth...</Text>
        <Text style={styles.versionText}>
          v1.0.0 • {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
        </Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <Text style={styles.errorTitle}>❌ Initialization Error</Text>
        <Text style={styles.errorText}>
          {loadError.message || loadError.toString()}
        </Text>
        <Text style={styles.errorDetail}>
          Please restart the app or contact support
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <AppContextProvider>
        <NavigationContainer 
          onStateChange={onNavigationStateChange}
        >
          <AuthStack />
        </NavigationContainer>
        <StatusBar style="auto" />
        
        {/* Debug info overlay */}
        {DEBUG_CONFIG.showDebugInfo && (
          <View style={styles.debugOverlay}>
            <Text style={styles.debugText}>
              DEV • {DEBUG_CONFIG.skipAuth ? 'NoAuth' : 'Auth'}
            </Text>
          </View>
        )}
      </AppContextProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  versionText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  errorButton: {
    marginTop: 20,
    backgroundColor: '#00A6B8',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugOverlay: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
