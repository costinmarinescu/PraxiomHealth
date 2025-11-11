import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContextProvider } from './AppContext';

// Import all screens
import DashboardScreen from './screens/DashboardScreen';
import WatchScreen from './screens/WatchScreen';
import SettingsScreen from './screens/SettingsScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import Tier1BiomarkerInputScreen from './screens/Tier1BiomarkerInputScreen';
import Tier2BiomarkerInputScreen from './screens/Tier2BiomarkerInputScreen';
import ReportScreen from './screens/ReportScreen';
import DNATestScreen from './screens/DNATestScreen';
import HistoricalDataScreen from './screens/HistoricalDataScreen';
import BiomarkerHistoryScreen from './screens/BiomarkerHistoryScreen';
import ComparisonScreen from './screens/ComparisonScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#1a1a2e',
  },
};

// Dashboard Stack with all sub-screens
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="BiomarkerInput" component={BiomarkerInputScreen} />
      <Stack.Screen name="Tier1BiomarkerInput" component={Tier1BiomarkerInputScreen} />
      <Stack.Screen name="Tier2BiomarkerInput" component={Tier2BiomarkerInputScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="DNATest" component={DNATestScreen} />
      <Stack.Screen name="HistoricalData" component={HistoricalDataScreen} />
      <Stack.Screen name="BiomarkerHistory" component={BiomarkerHistoryScreen} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <View style={styles.container}>
        <NavigationContainer theme={MyTheme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Watch') {
                  iconName = focused ? 'watch' : 'watch-outline';
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              headerShown: false,
              tabBarActiveTintColor: '#00CFC1',
              tabBarInactiveTintColor: 'white',
              tabBarStyle: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderTopWidth: 0,
                elevation: 0,
                paddingBottom: 8,
                paddingTop: 8,
                height: 60,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
            })}>
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Watch" component={WatchScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </AppContextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
