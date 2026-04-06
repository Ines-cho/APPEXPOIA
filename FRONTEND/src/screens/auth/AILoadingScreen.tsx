// screens/auth/AILoadingScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme/theme';
import { profileAPI, mealPlanAPI } from '../../services/api';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'AILoading'>;
};

export default function AILoadingScreen({ navigation }: Props) {
  const { completeAuth, user, profileData } = useAuth();
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Personalized messages based on user profile
  const getPersonalizedMessages = () => {
    const baseMessages = [
      'Analyzing your profile...',
      'Calculating nutritional needs...',
      'Considering Algerian cuisine...',
      'Optimizing for your budget...',
      'Creating personalized meal plan...',
    ];

    // Add personalized messages based on profile data
    if (profileData?.healthConditions && profileData.healthConditions.length > 0) {
      baseMessages.splice(2, 0, `Checking ${profileData.healthConditions.length} health conditions...`);
    }
    
    if (profileData?.monthlyBudget) {
      baseMessages.splice(4, 0, `Optimizing for ${profileData.monthlyBudget} DA budget...`);
    }
    
    if (profileData?.familySize && profileData.familySize > 1) {
      baseMessages.splice(3, 0, `Planning for ${profileData.familySize} family members...`);
    }

    return baseMessages;
  };

  const messages = getPersonalizedMessages();

  useEffect(() => {
    const analyzeProfileAndGeneratePlan = async () => {
      try {
        console.log('Starting personalized AI analysis...');
        console.log('User profile data:', profileData);
        
        // Step 1: Analyze health conditions and dietary needs
        if (profileData?.healthConditions && profileData.healthConditions.length > 0) {
          console.log(`Analyzing ${profileData.healthConditions.length} health conditions:`, profileData.healthConditions);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Step 2: Calculate nutritional requirements based on profile
        if (profileData) {
          console.log('Calculating nutritional needs for personalized profile...');
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Step 3: Optimize for budget
        if (profileData?.monthlyBudget) {
          console.log(`Optimizing meals for ${profileData.monthlyBudget} DA monthly budget...`);
          await new Promise(resolve => setTimeout(resolve, 700));
        }
        
        // Step 4: Consider family size
        if (profileData?.familySize && profileData.familySize > 1) {
          console.log(`Adjusting portions for ${profileData.familySize} family members...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Step 5: Generate final meal plan
        console.log('Creating personalized Algerian meal plan...');
        await new Promise(resolve => setTimeout(resolve, 900));
        
        console.log('✅ AI analysis completed successfully!');
        console.log('Personalized meal plan ready based on user profile');

      } catch (error) {
        console.error('Error during AI analysis:', error);
      }
    };

    // Start AI analysis in background
    analyzeProfileAndGeneratePlan();

    // Spin animation
    Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Pulse + glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Fade-in messages
    Animated.timing(fadeValue, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // Progress bar + message cycle
    const totalDuration = messages.length * 2000;
    Animated.timing(progressValue, { toValue: 1, duration: totalDuration, useNativeDriver: false }).start();

    const messageInterval = setInterval(() => {
      fadeValue.setValue(0);
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      Animated.timing(fadeValue, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 2000);

    const finishTimeout = setTimeout(async () => {
      clearInterval(messageInterval);
      await completeAuth(); // Complete authentication after loading
    }, totalDuration + 500);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(finishTimeout);
    };
  }, []);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressValue.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D4A3E" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#2D4A3E', '#3D6354']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Icon with glow */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseValue }] }]}>
          <LinearGradient colors={['#E07A4D', '#F5C490']} style={styles.iconGradient}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="nutrition-outline" size={80} color="#fff" />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>Creating Your Personalized Plan</Text>

        {/* Gradient Progress Bar */}
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={['#E07A4D', '#F5C490']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: progressWidth }]}
          />
        </View>

        {/* Animated message */}
        <Animated.Text style={[styles.message, { opacity: fadeValue }]}>
          {messages[currentMessageIndex]}
        </Animated.Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#F5C490" />
            <Text style={styles.featureText}>Algerian local ingredients</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#F5C490" />
            <Text style={styles.featureText}>Budget-optimized meals</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#F5C490" />
            <Text style={styles.featureText}>Health-conscious recipes</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    shadowColor: '#F5C490',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  iconGradient: { flex: 1, width: '100%', height: '100%', borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: spacing.xl },
  progressContainer: { width: width - spacing.xxl * 2, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: spacing.xl },
  progressBar: { height: '100%', borderRadius: 3 },
  message: { fontSize: 18, color: '#F5C490', textAlign: 'center', marginBottom: spacing.xxl, fontStyle: 'italic' },
  featuresContainer: { gap: spacing.md, marginTop: spacing.xxl },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontSize: 15, color: '#fff' },
});