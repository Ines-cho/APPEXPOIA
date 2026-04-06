// screens/auth/OnboardingWizardScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors, spacing } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OnboardingWizard'>;
};

type Step = {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  fields?: string[];
};

const steps: Step[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Tell us about yourself to personalize your meal plan',
    icon: 'person-outline',
    color: '#10B981',
    fields: ['Name', 'Age', 'Gender', 'Height', 'Weight'],
  },
  {
    id: 2,
    title: 'Lifestyle & Activity',
    description: 'Help us understand your daily routine',
    icon: 'fitness-outline',
    color: '#F59E0B',
    fields: ['Work Type', 'Exercise Frequency', 'Sleep Schedule'],
  },
  {
    id: 3,
    title: 'Health Profile',
    description: 'Share any health conditions or concerns',
    icon: 'medkit-outline',
    color: '#EF4444',
    fields: ['Medical Conditions', 'Allergies', 'Medications'],
  },
  {
    id: 4,
    title: 'Dietary Preferences',
    description: 'Tell us about your food likes and dislikes',
    icon: 'restaurant-outline',
    color: '#8B5CF6',
    fields: ['Favorite Foods', 'Dislikes', 'Dietary Restrictions'],
  },
  {
    id: 5,
    title: 'Budget Planning',
    description: 'Set your monthly food budget in Algerian Dinar',
    icon: 'wallet-outline',
    color: '#EC489A',
    fields: ['Monthly Budget', 'Family Size'],
  },
];

export default function OnboardingWizardScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: width * nextStep,
        animated: true,
      });
    } else {
      // All steps completed, navigate to AI loading
      navigation.navigate('AILoading');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: width * prevStep,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    navigation.navigate('AILoading');
  };

  const renderStep = (step: Step, index: number) => {
    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={[styles.iconContainer, { backgroundColor: step.color + '15' }]}>
          <View style={[styles.iconWrapper, { backgroundColor: step.color }]}>
            <Ionicons name={step.icon as any} size={48} color={colors.surface} />
          </View>
        </View>

        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>

        <View style={styles.fieldsContainer}>
          {step.fields?.map((field, idx) => (
            <View key={idx} style={styles.fieldItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color={step.color} />
              <Text style={styles.fieldText}>{field}</Text>
            </View>
          ))}
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>What we'll ask:</Text>
          <View style={styles.previewList}>
            {step.fields?.slice(0, 3).map((field, idx) => (
              <View key={idx} style={styles.previewItem}>
                <View style={[styles.previewDot, { backgroundColor: step.color }]} />
                <Text style={styles.previewText}>{field}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep ? steps[currentStep].color : '#E5E7EB',
                  width: index === currentStep ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        
        {currentStep < steps.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Steps Carousel */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentStep(newIndex);
        }}
      >
        {steps.map((step, index) => renderStep(step, index))}
      </Animated.ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.nextButton,
              { backgroundColor: steps[currentStep].color }
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Generate Plan' : 'Continue'}
            </Text>
            {currentStep < steps.length - 1 && (
              <Ionicons name="arrow-forward" size={20} color={colors.surface} />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.stepIndicator}>
          Step {currentStep + 1} of {steps.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  stepContainer: {
    width: width,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  fieldsContainer: {
    width: '100%',
    marginBottom: spacing.xxl,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: spacing.md,
  },
  fieldText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  previewList: {
    gap: spacing.md,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  backButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  stepIndicator: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
  },
});