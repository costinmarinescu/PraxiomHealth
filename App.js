import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContextProvider } from './AppContext';

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
    background: 'transparent',
  },
};

function DashboardStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="BiomarkerInput" component={BiomarkerInputScreen} options={{ title: 'Enter Biomarkers' }} />
      <Stack.Screen name="Tier1BiomarkerInput" component={Tier1BiomarkerInputScreen} options={{ title: 'Tier 1 Biomarkers' }} />
      <Stack.Screen name="Tier2BiomarkerInput" component={Tier2BiomarkerInputScreen} options={{ title: 'Tier 2 Biomarkers' }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Health Report' }} />
      <Stack.Screen name="DNATest" component={DNATestScreen} options={{ title: 'DNA Test Results' }} />
      <Stack.Screen name="HistoricalData" component={HistoricalDataScreen} options={{ title: 'Historical Data' }} />
      <Stack.Screen name="BiomarkerHistory" component={BiomarkerHistoryScreen} options={{ title: 'Biomarker History' }} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} options={{ title: 'Compare Data' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <ImageBackground
        source={require('./assets/praxiom_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => console.log('Background image not found, using fallback color')}
      >
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
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderTopWidth: 0,
                elevation: 0,
              },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardStack} options={{ title: 'Dashboard' }} />
            <Tab.Screen name="Watch" component={WatchScreen} options={{ title: 'Watch' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </ImageBackground>
    </AppContextProvider>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
  },
});
