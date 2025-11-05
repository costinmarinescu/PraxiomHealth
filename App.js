import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Import screens
import DashboardScreen from './screens/DashboardScreen';
import BiomarkerInputScreen from './screens/BiomarkerInputScreen';
import ReportScreen from './screens/ReportScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#1a1a1e',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#00CFC1',
          tabBarInactiveTintColor: '#888888',
          headerStyle: {
            backgroundColor: '#1a1a1e',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>🏠</Text>
            ),
            headerShown: false,
          }}
        />
        
        <Tab.Screen 
          name="Input" 
          component={BiomarkerInputScreen}
          options={{
            tabBarLabel: 'Input',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>📝</Text>
            ),
            title: 'Input Biomarkers',
          }}
        />
        
        <Tab.Screen 
          name="Report" 
          component={ReportScreen}
          options={{
            tabBarLabel: 'Report',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>📊</Text>
            ),
            title: 'Your Report',
          }}
        />
        
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
