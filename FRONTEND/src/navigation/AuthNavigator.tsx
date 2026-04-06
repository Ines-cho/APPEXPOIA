import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeOnboardingScreen from '../screens/auth/WelcomeOnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HealthScreen from '../screens/auth/HealthScreen';
import BudgetScreen from '../screens/auth/BudgetScreen';
import AILoadingScreen from '../screens/auth/AILoadingScreen';

import OnboardingWizardScreen from '../screens/auth/OnboardingWizardScreen';

export type AuthStackParamList = {
  WelcomeOnboarding: undefined;
  OnboardingWizard: undefined;
  Login: undefined;
  Signup: undefined;
  Health: {
    email?: string;
    name?: string;
  };
  Budget: {
    email?: string;
    name?: string;
    age?: string;
    poids?: string;
    taille?: string;
    sexe?: string;
    healthConditions?: string[];
    otherConditions?: string;
    dietaryRestrictions?: string;
    foodPreferences?: string;
  };
  AILoading: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="WelcomeOnboarding"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F9FAFB',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="WelcomeOnboarding" 
        component={WelcomeOnboardingScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Health" 
        component={HealthScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Budget" 
        component={BudgetScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OnboardingWizard" 
        component={OnboardingWizardScreen} 
        options={{ 
          title: 'Setup Your Profile',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen 
        name="AILoading" 
        component={AILoadingScreen} 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}