/**
 * ProfileScreen.js
 * 
 * FIXED VERSION - Working DOB Calendar Picker
 * 
 * This version handles the calendar properly without jumping.
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../AppContext';

export default function ProfileScreen({ navigation }) {
  const { dispatch } = useContext(AppContext);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // DOB state - THIS IS THE KEY PART
  const [dateOfBirth, setDateOfBirth] = useState(new Date(1990, 0, 1)); // Default: Jan 1, 1990
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(1990, 0, 1)); // Temporary date while picking
  
  // Load saved profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('userProfile');
      if (saved) {
        const profile = JSON.parse(saved);
        setName(profile.name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        if (profile.dateOfBirth) {
          setDateOfBirth(new Date(profile.dateOfBirth));
          setTempDate(new Date(profile.dateOfBirth));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format date for display
  const formatDate = (date) => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  /**
   * 🔧 THE FIX: Proper date picker handling
   * 
   * This handles both Android and iOS correctly:
   * - Android: Shows dialog, only updates on "OK"
   * - iOS: Shows inline picker, updates immediately
   */
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      // Android behavior
      setShowDatePicker(false);
      
      if (event.type === 'set' && selectedDate) {
        // User clicked "OK"
        setDateOfBirth(selectedDate);
        setTempDate(selectedDate);
        console.log('✅ DOB set to:', formatDate(selectedDate));
      } else {
        // User clicked "Cancel"
        console.log('❌ DOB selection cancelled');
      }
    } else {
      // iOS behavior
      if (selectedDate) {
        setTempDate(selectedDate);
        // For iOS, we update immediately
        setDateOfBirth(selectedDate);
      }
    }
  };

  const saveProfile = async () => {
    try {
      const age = calculateAge(dateOfBirth);
      
      const profile = {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth.toISOString(),
        age,
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      
      // Update AppContext with chronological age
      dispatch({
        type: 'UPDATE_HEALTH_DATA',
        payload: {
          chronologicalAge: age,
        },
      });

      console.log('✅ Profile saved');
      console.log('   Name:', name);
      console.log('   DOB:', formatDate(dateOfBirth));
      console.log('   Age:', age);

      Alert.alert(
        '✅ Profile Saved',
        `Your profile has been saved.\n\nAge: ${age} years`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Profile</Text>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Date of Birth - THE FIXED VERSION */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          
          {/* Display selected date */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(dateOfBirth)}
            </Text>
            <Text style={styles.ageText}>
              (Age: {calculateAge(dateOfBirth)} years)
            </Text>
          </TouchableOpacity>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()} // Can't be born in the future
              minimumDate={new Date(1920, 0, 1)} // Reasonable minimum
            />
          )}

          {/* iOS Done Button */}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  ageText: {
    fontSize: 14,
    color: '#00CFC1',
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#00CFC1',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
