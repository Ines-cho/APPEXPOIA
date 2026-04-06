import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';

const COLORS = {
  greenDark: '#1B4332', greenMid: '#2D6A4F', greenSoft: '#74C69D',
  greenPale: '#D8F3DC', cream: '#F8F4EF', peach: '#F4A261',
  white: '#FFFFFF', textDark: '#1B2A22', textMuted: '#6B8C7A',
  border: 'rgba(27,67,50,0.07)',
};

// ── Metric Card ────────────────────────────────────────
function MetricCard({
  title, value, sub, accentColor, progress, iconBg,
}: {
  title: string; value: string; sub: string;
  accentColor: string; progress: number; iconBg: string;
}) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: accentColor }]}>
      <View style={[styles.metricIconWrap, { backgroundColor: iconBg }]}>
        <View style={[styles.metricDot, { backgroundColor: accentColor }]} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

// ── Dashboard Screen ───────────────────────────────────
export default function DashboardScreen() {
  const { user, profileData } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current date dynamically
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Sbah el Khir!';
    if (hour < 17) return 'Sbah el kheir!';
    if (hour < 21) return 'Msa el kheir!';
    return 'Lila mbarka!';
  };

  // Get user initial
  const getUserInitial = () => {
    const name = user?.fullName || user?.email?.split('@')[0] || 'User';
    return name.charAt(0).toUpperCase();
  };

  // Get daily journey step based on time
  const getDailyJourneyStep = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return { step: 1, title: 'Morning Check-in', message: 'Start your day with a healthy breakfast!' };
    if (hour >= 9 && hour < 12) return { step: 2, title: 'Mid-Morning Activity', message: 'Time for a light snack and hydration!' };
    if (hour >= 12 && hour < 14) return { step: 3, title: 'Lunch Time', message: 'Enjoy your nutritious lunch!' };
    if (hour >= 14 && hour < 17) return { step: 4, title: 'Afternoon Energy', message: 'Stay focused with healthy choices!' };
    if (hour >= 17 && hour < 20) return { step: 5, title: 'Evening Meal', message: 'Dinner time - balance your plate!' };
    if (hour >= 20 && hour < 22) return { step: 6, title: 'Evening Reflection', message: 'Review your day and plan tomorrow!' };
    return { step: 7, title: 'Rest & Recover', message: 'Good night! Sleep well for tomorrow.' };
  };

  // Get personalized daily tip
  const getDailyTip = () => {
    const journeyStep = getDailyJourneyStep();
    const tips: Record<number, string> = {
      1: profileData?.healthConditions?.includes('diabetes') 
          ? 'Start with low-sugar breakfast options like oatmeal with berries.'
          : 'Begin with protein-rich breakfast to keep you energized.',
      2: profileData?.dietaryRestrictions?.includes('gluten-free')
          ? 'Try gluten-free crackers with hummus for your snack.'
          : 'Keep hydrated with water and herbal teas.',
      3: profileData?.foodPreferences?.includes('halal')
          ? 'Choose halal-certified proteins for your lunch.'
          : 'Include vegetables in at least half your plate.',
      4: profileData?.monthlyBudget && profileData.monthlyBudget < 20000
          ? 'Opt for budget-friendly snacks like fruits and nuts.'
          : 'Maintain steady energy with balanced nutrition.',
      5: profileData?.familySize && profileData.familySize > 4
          ? 'Cook larger portions to save time and money.'
          : 'Focus on portion control and balanced nutrition.',
      6: profileData?.healthConditions?.includes('diabetes')
          ? 'Track your blood sugar and plan tomorrow\'s meals.'
          : 'Prepare ingredients for tomorrow\'s meals.',
      7: 'Quality sleep is essential for your health goals.'
    };
    return tips[journeyStep.step] || tips[1];
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Use personalized data based on user's actual profile
    const personalizedData = {
      user: {
        name: user?.fullName || user?.email?.split('@')[0] || 'User',
        id: user?.id || 'temp-user'
      },
      stats: {
        totalMeals: profileData?.familySize ? profileData.familySize * 21 : 21, // 21 meals per person
        caloriesPerDay: profileData?.healthConditions?.includes('diabetes') ? 1800 : 2200,
        budgetUsed: profileData?.monthlyBudget ? Math.round(profileData.monthlyBudget * 0.75) : 15000,
        budgetTotal: profileData?.monthlyBudget || 20000
      },
      recentMeals: [
        { 
          id: 1, 
          name: profileData?.foodPreferences?.includes('halal') ? 'Halal Chicken' : 'Grilled Chicken', 
          calories: profileData?.healthConditions?.includes('diabetes') ? 350 : 450, 
          time: 'Lunch' 
        },
        { 
          id: 2, 
          name: profileData?.dietaryRestrictions?.includes('gluten-free') ? 'Rice Bowl' : 'Couscous', 
          calories: profileData?.healthConditions?.includes('diabetes') ? 150 : 200, 
          time: 'Dinner' 
        }
      ]
    };
    
    setDashboardData(personalizedData);
    setLoading(false);
    console.log('Using personalized dashboard data:', personalizedData);
    console.log('Based on user profile:', profileData);
    
    return;

    // Original code (commented out for now)
    /*
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await dashboardAPI.getDashboardData(user.id);
      setDashboardData(data);
      console.log('Dashboard data loaded:', data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
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
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingName}>{getGreeting()}</Text>
            <Text style={styles.greetingSub}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitial()}</Text>
          </View>
        </View>
        <View style={styles.statsPill}>
          {[
            { val: `${Math.round(dashboardData?.stats?.caloriesPerDay * 0.85 || 1850).toLocaleString()}`, lbl: 'kcal eaten' },
            { val: `${dashboardData?.stats?.caloriesPerDay?.toLocaleString() || 2200}`, lbl: 'kcal goal'  },
            { val: `${dashboardData?.stats?.budgetUsed?.toLocaleString() || 450} DA`,   lbl: 'DA spent'   },
            { val: `${Math.round((dashboardData?.stats?.budgetTotal || 20000) / 30).toLocaleString()} DA`,   lbl: 'DA budget'  },
          ].map((item, i, arr) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.statsDivider} />}
              <View style={styles.statsItem}>
                <Text style={styles.statsVal}>{item.val}</Text>
                <Text style={styles.statsLbl}>{item.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Text style={styles.sectionLabel}>Today's Summary</Text>
        <View style={styles.cardsRow}>
          <MetricCard
            title="Calories" value={`${Math.round(dashboardData?.stats?.caloriesPerDay * 0.85 || 1850).toLocaleString()}`} sub={`of ${dashboardData?.stats?.caloriesPerDay?.toLocaleString() || 2200} kcal`}
            accentColor={COLORS.greenMid} progress={85} iconBg={COLORS.greenPale}
          />
          <MetricCard
            title="Daily Budget" value={`${Math.round((dashboardData?.stats?.budgetTotal || 20000) / 30)} DA`} sub={`of ${Math.round((dashboardData?.stats?.budgetTotal || 20000) / 30)} DA`}
            accentColor={COLORS.peach} progress={75} iconBg="#FEF3E2"
          />
        </View>

        {/* Meal */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Up Next: Lunch</Text>
        <View style={styles.mealCard}>
          <View style={styles.mealTop}>
            <View style={styles.mealBadge}>
              <Text style={styles.mealBadgeText}>Lunch</Text>
            </View>
          </View>
          <Text style={styles.mealName}>{dashboardData?.recentMeals?.[0]?.name || 'Frik Soup & Grilled Chicken Salad'}</Text>
          <View style={styles.mealMeta}>
            {[
              { label: `${dashboardData?.recentMeals?.[0]?.calories || 450} kcal`,    dot: COLORS.greenSoft },
              { label: `${Math.round((dashboardData?.recentMeals?.[0]?.calories || 450) * 0.07)}g Protein`, dot: COLORS.greenSoft },
              { label: `${Math.round((dashboardData?.stats?.budgetTotal || 20000) / 60)} DA`,      dot: COLORS.peach     },
            ].map((chip, i) => (
              <View key={i} style={styles.metaChip}>
                <View style={[styles.metaDot, { backgroundColor: chip.dot }]} />
                <Text style={styles.metaChipText}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Journey */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Your Daily Journey</Text>
        <View style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <View style={styles.journeyStep}>
              <Text style={styles.journeyStepNumber}>{getDailyJourneyStep().step}</Text>
              <Text style={styles.journeyStepText}>Step</Text>
            </View>
            <View style={styles.journeyInfo}>
              <Text style={styles.journeyTitle}>{getDailyJourneyStep().title}</Text>
              <Text style={styles.journeyMessage}>{getDailyJourneyStep().message}</Text>
            </View>
          </View>
          <View style={styles.journeyProgress}>
            <View style={styles.journeyDots}>
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <View 
                  key={step} 
                  style={[
                    styles.journeyDot, 
                    step <= getDailyJourneyStep().step && styles.journeyDotActive
                  ]} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Daily Tip */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Today's Tip</Text>
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <View style={styles.tipStar} />
          </View>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Tip: </Text>
            {getDailyTip()}
          </Text>
        </View>

        {/* Insight */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Daily Insights</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <View style={styles.insightStar} />
          </View>
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>You're {Math.round((dashboardData?.stats?.budgetTotal || 20000) / 30 - (dashboardData?.stats?.budgetUsed || 450))} DA under budget today! </Text>
            Great job sticking to the plan.
          </Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.greenDark },
  header:        { backgroundColor: COLORS.greenDark, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, paddingTop: 8 },
  greetingName:  { fontFamily: 'serif', fontSize: 22, fontWeight: '600', color: COLORS.white, lineHeight: 28 },
  greetingSub:   { fontSize: 13, color: COLORS.greenSoft, marginTop: 4 },
  avatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText:    { fontSize: 16, fontWeight: '600', color: COLORS.greenDark },

  statsPill:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50, paddingVertical: 10, paddingHorizontal: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'space-between' },
  statsItem:     { alignItems: 'center', flex: 1 },
  statsVal:      { fontSize: 15, fontWeight: '600', color: COLORS.white },
  statsLbl:      { fontSize: 10, color: COLORS.greenSoft, marginTop: 2 },
  statsDivider:  { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  scroll:        { flex: 1, backgroundColor: COLORS.cream },
  scrollContent: { padding: 20, paddingBottom: 32 },
  sectionLabel:  { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  cardsRow:      { flexDirection: 'row', gap: 12 },
  metricCard:    { flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.border },
  metricIconWrap:{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricDot:     { width: 10, height: 10, borderRadius: 5 },
  metricTitle:   { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', marginBottom: 4 },
  metricVal:     { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  metricSub:     { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  progressBar:   { height: 5, backgroundColor: COLORS.greenPale, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },

  mealCard:      { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  mealTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  mealBadge:     { backgroundColor: COLORS.greenPale, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50 },
  mealBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.greenMid },
  mealName:      { fontSize: 16, fontWeight: '600', color: COLORS.textDark, lineHeight: 22, marginBottom: 10 },
  mealMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.cream, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  metaDot:       { width: 6, height: 6, borderRadius: 3 },
  metaChipText:  { fontSize: 12, color: COLORS.textMuted },

  insightCard:   { backgroundColor: COLORS.greenDark, borderRadius: 20, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  insightIcon:   { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightStar:   { width: 14, height: 14, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2, transform: [{ rotate: '45deg' as any }] },
  insightText:   { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  insightBold:   { fontWeight: '700', color: COLORS.white },

  journeyCard:   { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  journeyHeader:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  journeyStep:    { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' },
  journeyStepNumber: { fontSize: 20, fontWeight: '700', color: COLORS.greenDark },
  journeyStepText: { fontSize: 10, color: COLORS.greenDark, marginTop: 2 },
  journeyInfo:    { flex: 1 },
  journeyTitle:   { fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  journeyMessage: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  journeyProgress: { alignItems: 'center' },
  journeyDots:    { flexDirection: 'row', gap: 8 },
  journeyDot:     { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(27,67,50,0.1)' },
  journeyDotActive: { backgroundColor: COLORS.greenMid },

  tipCard:        { backgroundColor: COLORS.greenDark, borderRadius: 20, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  tipIcon:        { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipStar:        { width: 14, height: 14, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2, transform: [{ rotate: '45deg' as any }] },
  tipText:        { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  tipBold:        { fontWeight: '700', color: COLORS.white },

  // Loading and error states
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.greenDark },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.greenSoft },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.greenDark, padding: 20 },
  errorText: { fontSize: 16, color: COLORS.peach, textAlign: 'center' },
});