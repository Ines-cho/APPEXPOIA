import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, SafeAreaView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { mealPlanAPI } from '../../services/api';

const COLORS = {
  greenDark: '#1B4332', greenMid: '#2D6A4F', greenSoft: '#74C69D',
  greenPale: '#D8F3DC', cream: '#F8F4EF', peach: '#F4A261',
  peachPale: '#FEF3E2', white: '#FFFFFF', textDark: '#1B2A22',
  textMuted: '#6B8C7A', border: 'rgba(27,67,50,0.07)',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Meal = { time: string; name: string; kcal: string; cost: string; tag: string };
type MealPlan = Record<string, Meal[]>;

const PLAN: MealPlan = {
  Monday: [
    { time: 'Breakfast', name: 'Bsisa with Olive Oil', kcal: '320 kcal', cost: '50 DA',  tag: 'Light' },
    { time: 'Lunch',     name: 'Rechta with Chicken',  kcal: '620 kcal', cost: '300 DA', tag: 'High Protein' },
    { time: 'Dinner',    name: 'Vegetable Shorba',      kcal: '280 kcal', cost: '120 DA', tag: 'Light' },
  ],
  Tuesday: [
    { time: 'Breakfast', name: 'Msemen & Honey',         kcal: '380 kcal', cost: '80 DA',  tag: 'Classic' },
    { time: 'Lunch',     name: 'Frik Soup & Salad',      kcal: '450 kcal', cost: '250 DA', tag: 'Balanced' },
    { time: 'Dinner',    name: 'Grilled Fish & Veggies', kcal: '520 kcal', cost: '350 DA', tag: 'High Protein' },
  ],
  Wednesday: [
    { time: 'Breakfast', name: 'Sfenj & Black Coffee',    kcal: '290 kcal', cost: '60 DA',  tag: 'Light' },
    { time: 'Lunch',     name: 'Couscous with Lamb',      kcal: '750 kcal', cost: '400 DA', tag: 'Traditional' },
    { time: 'Dinner',    name: 'Lentil Soup',             kcal: '310 kcal', cost: '100 DA', tag: 'Light' },
  ],
  Thursday: [
    { time: 'Breakfast', name: 'Oatmeal & Dates',         kcal: '350 kcal', cost: '70 DA',  tag: 'Balanced' },
    { time: 'Lunch',     name: 'Chicken Tajine',          kcal: '580 kcal', cost: '320 DA', tag: 'High Protein' },
    { time: 'Dinner',    name: 'Mixed Green Salad',        kcal: '180 kcal', cost: '80 DA',  tag: 'Light' },
  ],
  Friday: [
    { time: 'Breakfast', name: 'Baghrir & Amel',          kcal: '400 kcal', cost: '90 DA',  tag: 'Classic' },
    { time: 'Lunch',     name: 'Couscous (Friday Feast)', kcal: '800 kcal', cost: '450 DA', tag: 'Traditional' },
    { time: 'Dinner',    name: 'Tomato Shorba',            kcal: '220 kcal', cost: '90 DA',  tag: 'Light' },
  ],
  Saturday: [
    { time: 'Breakfast', name: 'Eggs & Merguez',          kcal: '460 kcal', cost: '150 DA', tag: 'High Protein' },
    { time: 'Lunch',     name: 'Grilled Chicken & Rice',  kcal: '600 kcal', cost: '300 DA', tag: 'Balanced' },
    { time: 'Dinner',    name: 'Harira',                   kcal: '340 kcal', cost: '130 DA', tag: 'Classic' },
  ],
  Sunday: [
    { time: 'Breakfast', name: 'Pancakes & Fruits',       kcal: '420 kcal', cost: '120 DA', tag: 'Light' },
    { time: 'Lunch',     name: 'Lamb Chops & Salad',      kcal: '700 kcal', cost: '500 DA', tag: 'High Protein' },
    { time: 'Dinner',    name: 'Vegetable Couscous',       kcal: '480 kcal', cost: '200 DA', tag: 'Balanced' },
  ],
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'Light':        { bg: COLORS.greenPale, text: COLORS.greenMid },
  'Balanced':     { bg: '#E8F4FD',        text: '#2176AE'       },
  'High Protein': { bg: COLORS.peachPale, text: '#C1550A'       },
  'Classic':      { bg: '#F3E8FF',        text: '#7C3AED'       },
  'Traditional':  { bg: '#FFF7E6',        text: '#B45309'       },
};

const TIME_COLORS: Record<string, string> = {
  Breakfast: COLORS.peach,
  Lunch:     COLORS.greenMid,
  Dinner:    '#5E7CE2',
};

function MealCard({ meal }: { meal: typeof PLAN['Monday'][0] }) {
  const tag = TAG_COLORS[meal.tag] ?? { bg: COLORS.greenPale, text: COLORS.greenMid };
  const accent = TIME_COLORS[meal.time] ?? COLORS.greenMid;

  return (
    <View style={[styles.mealCard, { borderLeftColor: accent }]}>
      <View style={styles.mealCardTop}>
        <View style={[styles.timeBadge, { backgroundColor: accent + '18' }]}>
          <Text style={[styles.timeBadgeText, { color: accent }]}>{meal.time}</Text>
        </View>
        <View style={[styles.tagBadge, { backgroundColor: tag.bg }]}>
          <Text style={[styles.tagText, { color: tag.text }]}>{meal.tag}</Text>
        </View>
      </View>
      <Text style={styles.mealName}>{meal.name}</Text>
      <View style={styles.mealFooter}>
        <View style={styles.mealChip}>
          <View style={[styles.chipDot, { backgroundColor: COLORS.greenSoft }]} />
          <Text style={styles.chipText}>{meal.kcal}</Text>
        </View>
        <View style={styles.mealChip}>
          <View style={[styles.chipDot, { backgroundColor: COLORS.peach }]} />
          <Text style={styles.chipText}>{meal.cost}</Text>
        </View>
      </View>
    </View>
  );
}

export default function MealPlanScreen() {
  const { user, profileData } = useAuth();
  const [activeDay, setActiveDay] = useState<number>(0);
  const [mealPlanData, setMealPlanData] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get current week number dynamically based on user's app usage
  const getCurrentWeek = () => {
    // Get user's start date from profileData (from database)
    let userStartDate: Date;
    
    if (profileData?.startDate) {
      // Use the start date from database
      userStartDate = new Date(profileData.startDate);
      console.log('Using start date from database:', profileData.startDate);
    } else {
      // Fallback to app launch date if no start date in database
      userStartDate = new Date('2026-01-01');
      console.log('No start date in database, using default:', userStartDate.toISOString().split('T')[0]);
    }
    
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - userStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysSinceStart / 7) + 1; // Week 1 starts from day 0
    
    console.log('Week calculation:', {
      today: today.toISOString().split('T')[0],
      userStartDate: userStartDate.toISOString().split('T')[0],
      daysSinceStart,
      weekNumber
    });
    
    return weekNumber;
  };

  // Get current date dynamically
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Get dates for all days of the week
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.getDate());
    }
    return weekDates;
  };

  const generatePersonalizedPlan = (): MealPlan => {
    const basePlan: MealPlan = {
      Monday: [
        { time: 'Breakfast', name: 'Bsisa with Olive Oil', kcal: '320 kcal', cost: '50 DA', tag: 'Light' },
        { time: 'Lunch',     name: 'Rechta with Chicken',  kcal: '620 kcal', cost: '300 DA', tag: 'High Protein' },
        { time: 'Dinner',    name: 'Vegetable Shorba',      kcal: '280 kcal', cost: '120 DA', tag: 'Light' },
      ],
      Tuesday: [
        { time: 'Breakfast', name: 'Msemen & Honey',         kcal: '380 kcal', cost: '80 DA',  tag: 'Classic' },
        { time: 'Lunch',     name: 'Frik Soup & Salad',      kcal: '450 kcal', cost: '250 DA', tag: 'Balanced' },
        { time: 'Dinner',    name: 'Grilled Fish & Veggies', kcal: '520 kcal', cost: '350 DA', tag: 'High Protein' },
      ],
      Wednesday: [
        { time: 'Breakfast', name: 'Chakchouka & Bread',      kcal: '350 kcal', cost: '90 DA',  tag: 'Balanced' },
        { time: 'Lunch',     name: 'Couscous with Lamb',    kcal: '680 kcal', cost: '400 DA', tag: 'High Protein' },
        { time: 'Dinner',    name: 'Lentil Soup',           kcal: '220 kcal', cost: '100 DA', tag: 'Light' },
      ],
      Thursday: [
        { time: 'Breakfast', name: 'Baghrir & Honey',       kcal: '300 kcal', cost: '70 DA',  tag: 'Classic' },
        { time: 'Lunch',     name: 'Chicken Tajine',       kcal: '580 kcal', cost: '320 DA', tag: 'High Protein' },
        { time: 'Dinner',    name: 'Harira Soup',          kcal: '260 kcal', cost: '110 DA', tag: 'Light' },
      ],
      Friday: [
        { time: 'Breakfast', name: 'Rogag & Eggs',          kcal: '400 kcal', cost: '120 DA', tag: 'Balanced' },
        { time: 'Lunch',     name: 'Merguez Sandwich',      kcal: '550 kcal', cost: '280 DA', tag: 'High Protein' },
        { time: 'Dinner',    name: 'Salad & Yogurt',       kcal: '180 kcal', cost: '80 DA',  tag: 'Light' },
      ],
      Saturday: [
        { time: 'Breakfast', name: 'Khobz & Jam',           kcal: '280 kcal', cost: '60 DA',  tag: 'Classic' },
        { time: 'Lunch',     name: 'Grilled Chicken',       kcal: '620 kcal', cost: '350 DA', tag: 'High Protein' },
        { time: 'Dinner',    name: 'Vegetable Couscous',    kcal: '480 kcal', cost: '200 DA', tag: 'Balanced' },
      ],
      Sunday: [
        { time: 'Breakfast', name: 'Crepe & Honey',         kcal: '320 kcal', cost: '85 DA',  tag: 'Classic' },
        { time: 'Lunch',     name: 'Beef Brochettes',       kcal: '590 kcal', cost: '380 DA', tag: 'High Protein' },
        { time: 'Dinner',    name: 'Mixed Green Salad',     kcal: '150 kcal', cost: '70 DA',  tag: 'Light' },
      ],
    };

    if (profileData?.dietaryRestrictions?.includes('gluten-free')) {
      basePlan.Monday[0].name = 'Gluten-Free Porridge';
      basePlan.Tuesday[0].name = 'Rice Flour Pancakes';
    }

    if (profileData?.healthConditions?.includes('diabetes')) {
      basePlan.Monday[0].name = 'Low-Sugar Oatmeal';
      basePlan.Monday[0].kcal = '250 kcal';
      basePlan.Tuesday[0].name = 'Sugar-Free Msemen';
      basePlan.Tuesday[0].kcal = '300 kcal';
    }

    if (profileData?.foodPreferences?.includes('halal')) {
      basePlan.Monday[1].name = 'Halal Rechta with Chicken';
      basePlan.Tuesday[2].name = 'Halal Grilled Fish';
    }

    if (profileData?.monthlyBudget) {
      const dailyBudget = profileData.monthlyBudget / 30;
      const budgetFactor = dailyBudget / 800; // 800 DA is default daily budget
      
      Object.keys(basePlan).forEach(day => {
        basePlan[day].forEach(meal => {
          const baseCost = parseInt(meal.cost);
          meal.cost = `${Math.round(baseCost * budgetFactor)} DA`;
        });
      });
    }

    return basePlan;
  };

  const personalizedPlan = generatePersonalizedPlan();

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    // For now, skip API call since user.id is not available
    // TODO: Re-enable when user authentication is properly implemented
    console.log('Skipping meal plan API call for now');
    
    // Use personalized meal plan based on user profile
    setMealPlanData(personalizedPlan);
    setLoading(false);
    console.log('Using personalized meal plan data:', personalizedPlan);
    console.log('Based on user profile:', profileData);
    
    return;

    // Original code (commented out for now)
    /*
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await mealPlanAPI.getLatestPlan(user.id);
      setMealPlanData(data);
      console.log('Meal plan data loaded:', data);
    } catch (err) {
      console.error('Error loading meal plan:', err);
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
    */
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.greenSoft} />
          <Text style={styles.loadingText}>Loading meal plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dayName = DAYS_FULL[activeDay];
  const meals = mealPlanData?.[dayName] || personalizedPlan[dayName];
  const totalCost = meals.reduce((sum: number, m: Meal) => sum + parseInt(m.cost || '0'), 0);
  const totalKcal = meals.reduce((sum: number, m: Meal) => sum + parseInt(m.kcal || '0'), 0);
  const weekDates = getWeekDates();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Weekly Plan</Text>
            <Text style={styles.headerSub}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>Week {getCurrentWeek()}</Text>
          </View>
        </View>

        {/* Day Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              onPress={() => setActiveDay(i)}
              activeOpacity={0.8}
              style={[styles.dayBtn, i === activeDay && styles.dayBtnActive]}
            >
              <Text style={[styles.dayLabel, i === activeDay && styles.dayLabelActive]}>{d}</Text>
              <Text style={[styles.dayNum, i === activeDay && styles.dayNumActive]}>{weekDates[i]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.greenMid }]}>
            <Text style={styles.summaryVal}>{totalKcal}</Text>
            <Text style={styles.summaryLbl}>Total kcal</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.peach }]}>
            <Text style={styles.summaryVal}>{totalCost} DA</Text>
            <Text style={styles.summaryLbl}>Est. Cost</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#5E7CE2' }]}>
            <Text style={styles.summaryVal}>{meals.length}</Text>
            <Text style={styles.summaryLbl}>Meals</Text>
          </View>
        </View>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>{dayName}'s Meals</Text>

        {/* Meal Cards */}
        {meals.map((meal: Meal, i: number) => (
          <MealCard key={i} meal={meal} />
        ))}

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <View style={styles.tipStar} />
          </View>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Tip: </Text>
            {profileData?.dietaryRestrictions?.includes('gluten-free') 
              ? 'Prep your gluten-free alternatives in advance to save time during busy weekdays.'
              : profileData?.healthConditions?.includes('diabetes')
              ? 'Monitor your blood sugar levels after meals and adjust portions as needed.'
              : profileData?.foodPreferences?.includes('halal')
              ? 'Ensure all your ingredients are certified halal for peace of mind.'
              : 'Prep your Rechta broth the night before to save time on busy mornings.'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.greenDark },
  header:         { backgroundColor: COLORS.greenDark, paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 8, marginBottom: 20 },
  headerTitle:    { fontFamily: 'serif', fontSize: 22, fontWeight: '600', color: COLORS.white, lineHeight: 28 },
  headerSub:      { fontSize: 13, color: COLORS.greenSoft, marginTop: 4 },
  weekBadge:      { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  weekBadgeText:  { fontSize: 12, fontWeight: '600', color: COLORS.white },

  daysRow:        { paddingHorizontal: 18, gap: 8 },
  dayBtn:         { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', minWidth: 48 },
  dayBtnActive:   { backgroundColor: COLORS.greenSoft },
  dayLabel:       { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  dayLabelActive: { color: COLORS.greenDark },
  dayNum:         { fontSize: 16, fontWeight: '700', color: COLORS.white, marginTop: 2 },
  dayNumActive:   { color: COLORS.greenDark },

  scroll:         { flex: 1, backgroundColor: COLORS.cream },
  scrollContent:  { padding: 20, paddingBottom: 32 },
  sectionLabel:   { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

  summaryRow:     { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard:    { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.border },
  summaryVal:     { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  summaryLbl:     { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },

  mealCard:       { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  mealCardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timeBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  timeBadgeText:  { fontSize: 11, fontWeight: '700' },
  tagBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  tagText:        { fontSize: 10, fontWeight: '600' },
  mealName:       { fontSize: 16, fontWeight: '600', color: COLORS.textDark, lineHeight: 22, marginBottom: 10 },
  mealFooter:     { flexDirection: 'row', gap: 8 },
  mealChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.cream, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  chipDot:        { width: 6, height: 6, borderRadius: 3 },
  chipText:       { fontSize: 12, color: COLORS.textMuted },

  tipCard:        { backgroundColor: COLORS.greenDark, borderRadius: 20, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginTop: 8 },
  tipIcon:        { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipStar:        { width: 14, height: 14, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2, transform: [{ rotate: '45deg' as any }] },
  tipText:        { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  tipBold:        { fontWeight: '700', color: COLORS.white },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.greenDark },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.greenSoft },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.greenDark, padding: 20 },
  errorText: { fontSize: 16, color: COLORS.peach, textAlign: 'center' },
});