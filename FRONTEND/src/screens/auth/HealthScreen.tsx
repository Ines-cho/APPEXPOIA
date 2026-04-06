// screens/auth/HealthScreen.tsx
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

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Health'>;
  route: RouteProp<AuthStackParamList, 'Health'>;
};

type HealthCondition = {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
};

type DietTag = {
  id: string;
  label: string;
  selected: boolean;
};

type FoodPref = {
  id: string;
  label: string;
  selected: boolean;
};

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

const INITIAL_CONDITIONS: HealthCondition[] = [
  { id: 'diabetes',     name: 'diabete',         icon: '🩸', selected: false },
  { id: 'hypertension', name: 'hypertension',      icon: '❤️', selected: false },
  { id: 'cholesterol',  name: 'cholesterol',      icon: '🫀', selected: false },
  { id: 'celiac',       name: 'maladie_celiaque', icon: '🌾', selected: false },
  { id: 'allergies',    name: 'allergies',        icon: '⚠️', selected: false },
  { id: 'kidney',       name: 'insuffisance_renale', icon: '🫘', selected: false },
  { id: 'thyroid',      name: 'thyroid',          icon: '🦋', selected: false },
  { id: 'heart',        name: 'cardiovasculaire', icon: '💗', selected: false },
  { id: 'ibs',          name: 'troubles_intestinaux', icon: '🫁', selected: false },
  { id: 'anemia',       name: 'anemie',           icon: '🔴', selected: false },
];

const DIET_TAGS: DietTag[] = [
  { id: 'halal',       label: 'Halal',       selected: false },
  { id: 'vegetarian',  label: 'Vegetarian',  selected: false },
  { id: 'vegan',       label: 'Vegan',       selected: false },
  { id: 'gluten_free', label: 'Gluten-free', selected: false },
  { id: 'dairy_free',  label: 'Dairy-free',  selected: false },
  { id: 'no_pork',     label: 'No Pork',     selected: false },
  { id: 'keto',        label: 'Keto',        selected: false },
  { id: 'low_carb',    label: 'Low-carb',    selected: false },
];

const FOOD_PREFS: FoodPref[] = [
  { id: 'spicy',      label: '🌶 Spicy',      selected: false },
  { id: 'sweet',      label: '🍯 Sweet',      selected: false },
  { id: 'salty',      label: '🧂 Salty',      selected: false },
  { id: 'savory',     label: '🍖 Savory',     selected: false },
  { id: 'light',      label: '🥗 Light',      selected: false },
  { id: 'hearty',     label: '🍲 Hearty',     selected: false },
  { id: 'seafood',    label: '🐟 Seafood',    selected: false },
  { id: 'no_seafood', label: '🚫 No Seafood', selected: false },
];

export default function HealthScreen({ navigation, route }: Props) {
  const [conditions, setConditions]             = useState<HealthCondition[]>(INITIAL_CONDITIONS);
  const [dietTags, setDietTags]                 = useState<DietTag[]>(DIET_TAGS);
  const [foodPrefs, setFoodPrefs]               = useState<FoodPref[]>(FOOD_PREFS);
  const [otherConditions, setOtherConditions]   = useState('');
  const [otherDiet, setOtherDiet]               = useState('');

  // Required fields for ProfilePayload
  const [age, setAge]                           = useState('28');
  const [poids, setPoids]                       = useState('70');
  const [taille, setTaille]                     = useState('170');
  const [sexe, setSexe]                         = useState('homme');

  const toggle = <T extends { id: string; selected: boolean }>(
    list: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
  ) => {
    setList(list.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleNext = async () => {
    const selectedConditions = conditions.filter((c) => c.selected).map((c) => c.name);
    const selectedDiet = dietTags.filter((d) => d.selected).map((d) => d.label);
    const selectedFoodPrefs = foodPrefs.filter((f) => f.selected).map((f) => f.label);

    try {
      // Save health profile to backend with required ProfilePayload fields
      const healthData = {
        fullName: route.params?.name || '',
        email: route.params?.email || '',
        nom: route.params?.name || 'User', // Required by backend
        age: parseInt(age), // Convert to number
        poids: parseFloat(poids), // Convert to number
        taille: parseFloat(taille), // Convert to number
        sexe: sexe, // Should be 'homme' or 'femme'
        activite: 'sedentaire', // Default value
        objectif: 'maintien', // Default value
        maladies: selectedConditions, // Health conditions
        allergies: selectedDiet, // Dietary restrictions
        preferences: selectedFoodPrefs, // Food preferences
        otherConditions: otherConditions, // Custom field
        otherDiet: otherDiet, // Custom field
      };

      await profileAPI.saveProfile(healthData);
      console.log('Health profile saved:', healthData);
    } catch (error) {
      console.error('Error saving health profile:', error);
      // Continue even if API fails
    }

    navigation.navigate('Budget', {
      email: route.params?.email || '',
      name: route.params?.name || '',
      age: age,
      poids: poids,
      taille: taille,
      sexe: sexe,
      healthConditions: selectedConditions,
      otherConditions,
      dietaryRestrictions: [...selectedDiet, otherDiet].filter(Boolean).join(', '),
      foodPreferences: selectedFoodPrefs.join(', '),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
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
                  i < 1  && styles.stepPillDone,
                  i === 1 && styles.stepPillActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.title}>Health Profile</Text>
          <Text style={styles.subtitle}>Helps us recommend meals that are safe for you</Text>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* ── Basic Info (Required) ── */}
          <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
          <Text style={styles.sectionSub}>Required fields for your profile</Text>
          
          <View style={styles.basicInfoGrid}>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="28"
                placeholderTextColor={HEALIZA.muted}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="70"
                placeholderTextColor={HEALIZA.muted}
                value={poids}
                onChangeText={setPoids}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="170"
                placeholderTextColor={HEALIZA.muted}
                value={taille}
                onChangeText={setTaille}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, sexe === 'homme' && styles.genderBtnActive]}
                  onPress={() => setSexe('homme')}
                >
                  <Text style={[styles.genderBtnText, sexe === 'homme' && styles.genderBtnTextActive]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, sexe === 'femme' && styles.genderBtnActive]}
                  onPress={() => setSexe('femme')}
                >
                  <Text style={[styles.genderBtnText, sexe === 'femme' && styles.genderBtnTextActive]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── 1. Health Conditions ── */}
          <Text style={styles.sectionLabel}>HEALTH CONDITIONS</Text>
          <Text style={styles.sectionSub}>Select any that apply — optional</Text>
          <View style={styles.conditionsGrid}>
            {conditions.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.condChip, c.selected && styles.condChipActive]}
                onPress={() => toggle(conditions, setConditions, c.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.condChipIcon}>{c.icon}</Text>
                <Text style={[styles.condChipText, c.selected && styles.condChipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Other conditions input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textArea}
              placeholder="Other conditions… (optional)"
              placeholderTextColor={HEALIZA.muted}
              value={otherConditions}
              onChangeText={setOtherConditions}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* ── 2. Dietary Restrictions ── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>DIETARY RESTRICTIONS</Text>
          <Text style={styles.sectionSub}>Tap all that apply</Text>
          <View style={styles.tagsRow}>
            {dietTags.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.tag, d.selected && styles.tagActive]}
                onPress={() => toggle(dietTags, setDietTags, d.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tagText, d.selected && styles.tagTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textArea}
              placeholder="Anything else? (e.g., no shellfish, nut-free…)"
              placeholderTextColor={HEALIZA.muted}
              value={otherDiet}
              onChangeText={setOtherDiet}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* ── 3. Food Preferences ── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>FOOD PREFERENCES</Text>
          <Text style={styles.sectionSub}>What flavors & styles do you enjoy?</Text>
          <View style={styles.prefGrid}>
            {foodPrefs.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.prefCard, f.selected && styles.prefCardActive]}
                onPress={() => toggle(foodPrefs, setFoodPrefs, f.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.prefText, f.selected && styles.prefTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity style={styles.ctaBtn} onPress={handleNext}>
            <Text style={styles.ctaText}>Continue  →</Text>
          </TouchableOpacity>

          <Text style={styles.stepHint}>
            Last step —{' '}
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

  // ── Header ──
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

  // ── Body ──
  body: {
    backgroundColor: HEALIZA.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    padding: 24,
    minHeight: 600,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: HEALIZA.dark,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: HEALIZA.muted,
    marginBottom: 12,
  },

  // Basic info grid
  basicInfoGrid: {
    gap: 16,
    marginBottom: 24,
  },

  // Input fields
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: HEALIZA.dark,
    marginBottom: 6,
  },
  textInput: {
    fontSize: 16,
    color: HEALIZA.text,
    backgroundColor: HEALIZA.inputBg,
    borderWidth: 1.5,
    borderColor: HEALIZA.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // Gender selection
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: HEALIZA.border,
    backgroundColor: HEALIZA.inputBg,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: HEALIZA.dark,
    borderColor: HEALIZA.dark,
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: HEALIZA.muted,
  },
  genderBtnTextActive: {
    color: '#fff',
  },

  // Condition chips
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  condChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: HEALIZA.border,
    backgroundColor: HEALIZA.inputBg,
  },
  condChipActive: {
    backgroundColor: 'rgba(45,74,62,0.08)',
    borderColor: HEALIZA.dark,
  },
  condChipIcon: {
    fontSize: 13,
  },
  condChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: HEALIZA.muted,
  },
  condChipTextActive: {
    color: HEALIZA.dark,
    fontWeight: '600',
  },

  // Text input
  inputWrap: {
    marginTop: 10,
    backgroundColor: HEALIZA.inputBg,
    borderWidth: 1.5,
    borderColor: HEALIZA.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: {
    fontSize: 14,
    color: HEALIZA.text,
    minHeight: 52,
    textAlignVertical: 'top',
  },

  // Diet tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: HEALIZA.border,
    backgroundColor: HEALIZA.inputBg,
  },
  tagActive: {
    backgroundColor: 'rgba(224,122,77,0.1)',
    borderColor: HEALIZA.accent,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: HEALIZA.muted,
  },
  tagTextActive: {
    color: HEALIZA.accent,
    fontWeight: '600',
  },

  // Food preference cards
  prefGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: HEALIZA.border,
    backgroundColor: HEALIZA.inputBg,
  },
  prefCardActive: {
    backgroundColor: 'rgba(45,74,62,0.08)',
    borderColor: HEALIZA.dark,
  },
  prefText: {
    fontSize: 13,
    fontWeight: '500',
    color: HEALIZA.muted,
  },
  prefTextActive: {
    color: HEALIZA.dark,
    fontWeight: '600',
  },

  // CTA
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