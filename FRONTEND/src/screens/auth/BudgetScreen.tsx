import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { profileAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Re-using the HEALIZA color palette from HealthScreen
const HEALIZA = {
  dark:    '#2D4A3E',
  mid:     '#3D6354',
  lightBg: '#F5F0E8',
  surface: '#FFFFFF',
  accent:  '#E07A4D',
  text:    '#1C2E26',
  muted:   '#7A9488',
  border:  '#D8E4DF',
  inputBg: '#F8F5EF',
};

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Budget'>;
  route: RouteProp<AuthStackParamList, 'Budget'>;
};

export default function BudgetScreen({ navigation, route }: Props) {
  const { setProfileData } = useAuth();
  const [budget, setBudget] = useState('');
  const [familySize, setFamilySize] = useState('1');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Debug: Log the route params
  console.log('BudgetScreen route params:', route.params);

  // State for input focus
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);
  const [isFamilySizeFocused, setIsFamilySizeFocused] = useState(false);
  const [isNotesFocused, setIsNotesFocused] = useState(false);

    const handleComplete = async () => {
    if (!budget) {
      Alert.alert('Error', 'Please enter your monthly food budget.');
      return;
    }

    const budgetNumber = parseInt(budget);
    if (isNaN(budgetNumber) || budgetNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount.');
      return;
    }

    const completeProfile = {
      nom: route.params?.name || 'User',
      email: route.params?.email || '',
      age: parseInt(route.params?.age || '28'),
      poids: parseFloat(route.params?.poids || '70'),
      taille: parseFloat(route.params?.taille || '170'),
      sexe: route.params?.sexe || 'homme',
      activite: 'sedentaire', // Default
      objectif: 'maintien', // Default
      maladies: route.params?.healthConditions || [],
      allergies: route.params?.dietaryRestrictions?.split(', ').filter(Boolean) || [],
      preferences: route.params?.foodPreferences?.split(', ').filter(Boolean) || [],
      budget_mensuel: budgetNumber,
      foyer_personnes: parseInt(familySize),
      otherConditions: route.params?.otherConditions || '',
      additionalNotes: additionalNotes,
    };

    try {
      // Debug: Log the complete profile data
      console.log('Sending to API:', completeProfile);
      
      // Temporarily skip API call to avoid 404 error
      // TODO: Re-enable when user authentication is properly implemented
      console.log('Skipping API call for now to avoid 404 error');
      
      // Save complete profile to backend
      // await profileAPI.saveProfile(completeProfile);
      console.log('Complete profile prepared:', completeProfile);
    } catch (error) {
      console.error('Error saving complete profile:', error);
      // Continue even if API fails
    }

    // Save profile data to AuthContext for use in main screens
    setProfileData({
      healthConditions: route.params?.healthConditions || [],
      otherConditions: route.params?.otherConditions || '',
      dietaryRestrictions: route.params?.dietaryRestrictions || '',
      foodPreferences: route.params?.foodPreferences || '',
      monthlyBudget: budgetNumber,
      familySize: parseInt(familySize),
      additionalNotes,
    });

    navigation.replace('AILoading');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* -- Header -- */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.stepPills}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.stepPill,
                  i < 2  && styles.stepPillDone, // Assuming Budget is the 4th step (index 3)
                  i === 2 && styles.stepPillActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.title}>Monthly Budget</Text>
          <Text style={styles.subtitle}>Tell us your budget to help us plan affordable meals</Text>
        </View>

        {/* -- Body -- */}
        <View style={styles.body}>

          {/* -- 1. Monthly Budget -- */}
          <Text style={styles.sectionLabel}>MONTHLY BUDGET (DZD)</Text>
          <View style={[styles.inputWrap, isBudgetFocused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 20000"
              placeholderTextColor={HEALIZA.muted}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              onFocus={() => setIsBudgetFocused(true)}
              onBlur={() => setIsBudgetFocused(false)}
            />
          </View>
          <Text style={styles.hintText}>
            This helps us suggest meals that fit your wallet.
          </Text>

          {/* -- 2. Family Size -- */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>FAMILY SIZE</Text>
          <View style={[styles.inputWrap, isFamilySizeFocused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.textInput}
              placeholder="Number of family members"
              placeholderTextColor={HEALIZA.muted}
              value={familySize}
              onChangeText={setFamilySize}
              keyboardType="numeric"
              onFocus={() => setIsFamilySizeFocused(true)}
                            onBlur={() => setIsFamilySizeFocused(false)}
            />
          </View>

          {/* -- 3. Additional Notes -- */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ADDITIONAL NOTES</Text>
          <View style={[styles.inputWrap, isNotesFocused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.textArea}
              placeholder="Any other information you'd like us to know?"
              placeholderTextColor={HEALIZA.muted}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
              numberOfLines={4}
              onFocus={() => setIsNotesFocused(true)}
              onBlur={() => setIsNotesFocused(false)}
            />
          </View>

          {/* -- Summary Card (styled like a notice) -- */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Profile Summary</Text>
            <Text style={styles.summaryText}>
              We will use this information to create a personalized Algerian meal
              plan that matches your health needs, lifestyle, and budget.
            </Text>
          </View>

          {/* -- CTA -- */}
          <TouchableOpacity style={styles.ctaBtn} onPress={handleComplete}>
            <Text style={styles.ctaText}>Create Account ✦</Text>
          </TouchableOpacity>

          <Text style={styles.stepHint}>
            <Text style={{ color: '#FF0000', fontWeight: '600' }}>Last step —</Text>{' '}
            <Text style={{ color: HEALIZA.accent, fontWeight: '600' }}>almost done!</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: HEALIZA.dark,
  },
  container: {
    flex: 1,
    backgroundColor: HEALIZA.lightBg,
  },

  // -- Header --
  header: {
    backgroundColor: HEALIZA.dark,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backArrow: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 28,
  },
  stepPills: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  stepPill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepPillDone: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  stepPillActive: {
    backgroundColor: HEALIZA.accent,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },

  // -- Body --
  body: {
    backgroundColor: HEALIZA.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    padding: 24,
    minHeight: 600, // Ensure enough height for scrolling
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: HEALIZA.dark,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: HEALIZA.muted,
    marginBottom: 12,
    marginTop: 4,
  },

  // Text input styles (re-used from HealthScreen's other conditions input)
  inputWrap: {
    marginTop: 10,
    backgroundColor: HEALIZA.inputBg,
    borderWidth: 1.5,
    borderColor: HEALIZA.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: 'transparent', // Default no shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  inputWrapFocused: {
    borderColor: HEALIZA.accent, // Accent color border on focus
    shadowColor: HEALIZA.accent, // Subtle shadow with accent color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: 14,
    color: HEALIZA.text,
    minHeight: 20, // Adjusted for single line input
  },
  textArea: {
    fontSize: 14,
    color: HEALIZA.text,
    minHeight: 52,
    textAlignVertical: 'top',
  },

  // Summary Card (new style, but using HEALIZA colors)
  summaryCard: {
    backgroundColor: 'rgba(45,74,62,0.08)', // Light version of HEALIZA.dark
    borderColor: HEALIZA.dark,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: HEALIZA.dark,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: HEALIZA.text,
    lineHeight: 18,
  },

  // CTA (re-used from HealthScreen)
  ctaBtn: {
    marginTop: 28,
    backgroundColor: HEALIZA.dark,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stepHint: {
    textAlign: 'center',
    fontSize: 12,
    color: HEALIZA.muted,
    marginTop: 14,
    marginBottom: 8,
  },
});