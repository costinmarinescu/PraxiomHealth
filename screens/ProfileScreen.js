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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../AppContext';
import PraxiomBackground from '../components/PraxiomBackground';

export default function ProfileScreen({ navigation }) {
  const { state, updateState } = useContext(AppContext);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date(1980, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      const savedEmail = await AsyncStorage.getItem('userEmail');
      const savedDOB = await AsyncStorage.getItem('userDOB');
      const savedHeight = await AsyncStorage.getItem('userHeight');
      const savedWeight = await AsyncStorage.getItem('userWeight');

      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      if (savedDOB) {
        setDateOfBirth(new Date(savedDOB));
      }
      if (savedHeight) setHeight(savedHeight);
      if (savedWeight) setWeight(savedWeight);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // ✅ FIXED: Proper date change handler that doesn't reset
  const onDateChange = (event, selectedDate) => {
    // Close picker on Android immediately
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Only update date if user actually selected one (not cancelled)
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate);
      console.log('Date selected:', selectedDate.toISOString());
    } else if (event.type === 'dismissed') {
      // User cancelled - keep current date
      console.log('Date picker cancelled');
    }
    
    // On iOS, keep picker open until user closes it
    if (Platform.OS === 'ios') {
      if (selectedDate) {
        setDateOfBirth(selectedDate);
      }
    }
  };

  const handleSave = async () => {
    try {
      // Validate age
      const age = calculateAge(dateOfBirth);
      if (age < 18 || age > 120) {
        Alert.alert('Invalid Age', 'Please enter a valid date of birth (age 18-120)');
        return;
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userDOB', dateOfBirth.toISOString());
      await AsyncStorage.setItem('userHeight', height);
      await AsyncStorage.setItem('userWeight', weight);
      await AsyncStorage.setItem('chronologicalAge', age.toString());

      // Update AppContext
      updateState({ 
        chronologicalAge: age,
        userName: name,
      });

      console.log('✅ Profile saved - Age:', age, 'DOB:', dateOfBirth.toISOString());

      Alert.alert(
        'Success!',
        `Profile saved!\nYour age: ${age} years\n\nThis will be used for all Bio-Age calculations.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const currentAge = calculateAge(dateOfBirth);

  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Date of Birth - MOST IMPORTANT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Date of Birth (Required)</Text>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}>
            <View style={styles.dateButtonContent}>
              <Ionicons name="calendar" size={24} color="#00d4ff" />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateText}>
                  {dateOfBirth.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.ageText}>
                  Age: {currentAge} years
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}

          <Text style={styles.hint}>
            ⚠️ Your age is used to calculate your Praxiom Bio-Age. Make sure it's accurate!
          </Text>
        </View>

        {/* Physical Measurements (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Measurements (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="e.g., 175"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g., 70"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={24} color="#000" />
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PraxiomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e1e2e',
    color: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  dateButton: {
    backgroundColor: '#1e1e2e',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  ageText: {
    fontSize: 14,
    color: '#4ade80',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#4ade80',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8e8e93',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e8e93',
  },
});
