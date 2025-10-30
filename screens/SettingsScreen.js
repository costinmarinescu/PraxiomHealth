import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const handleAbout = () => {
    Alert.alert(
      'Praxiom Health',
      'Version 1.0.0\n\nComplete mobile app for biological age assessment through integrated oral-systemic biomarker analysis.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Policy', 'Your health data is stored locally and encrypted.');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Contact: support@praxiomhealth.com');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>
        <Text style={styles.headerSubtitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive health reminders
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#CCC', true: '#00CFC1' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color="#333" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Enable dark theme
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#CCC', true: '#00CFC1' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="sync-outline" size={24} color="#333" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto Sync</Text>
                <Text style={styles.settingDescription}>
                  Sync with watch automatically
                </Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#CCC', true: '#00CFC1' }}
              thumbColor="white"
            />
          </View>

        </View>

        {/* Data & Privacy Section */}
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <View style={styles.card}>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacy}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#333" />
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={24} color="#333" />
              <Text style={styles.settingTitle}>Export Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color="#E74C3C" />
              <Text style={[styles.settingTitle, { color: '#E74C3C' }]}>
                Clear Data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#333" />
              <Text style={styles.settingTitle}>About Praxiom</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.settingItem} onPress={handleSupport}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#333" />
              <Text style={styles.settingTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="code-slash-outline" size={24} color="#333" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingDescription}>1.0.0</Text>
              </View>
            </View>
          </View>

        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 18,
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginTop: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 15,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 55,
  },
});

export default SettingsScreen;
