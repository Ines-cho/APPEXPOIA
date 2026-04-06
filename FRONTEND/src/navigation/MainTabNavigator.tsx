import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/main/DashboardScreen';
import MealPlanScreen from '../screens/main/MealPlanScreen';
import GroceryListScreen from '../screens/main/GroceryListScreen';
import ProgressScreen from '../screens/main/ProgressScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  MealPlan: undefined;
  GroceryList: undefined;
  Progress: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.secondary,
          height: Platform.OS === 'ios' ? 105 + (insets.bottom > 0 ? 0 : 10) : 95,
          paddingBottom: Platform.OS === 'ios' ? 35 : 15,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MealPlan') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'GroceryList') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="MealPlan" component={MealPlanScreen} options={{ title: 'Meal Plan' }} />
      <Tab.Screen name="GroceryList" component={GroceryListScreen} options={{ title: 'Grocery' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}