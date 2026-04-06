import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, SafeAreaView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { groceryAPI } from '../../services/api';

const COLORS = {
  greenDark: '#1B4332', greenMid: '#2D6A4F', greenSoft: '#74C69D',
  greenPale: '#D8F3DC', cream: '#F8F4EF', peach: '#F4A261',
  peachPale: '#FEF3E2', white: '#FFFFFF', textDark: '#1B2A22',
  textMuted: '#6B8C7A', border: 'rgba(27,67,50,0.07)',
};

type GroceryItem = { name: string; qty: string; price: number; checked: boolean };
type Category = { title: string; emoji: string; accentColor: string; items: GroceryItem[] };

const INITIAL_CATEGORIES: Category[] = [
  {
    title: 'Lkhodra', emoji: '🥦', accentColor: COLORS.greenMid,
    items: [
      { name: 'Onions', qty: '1 kg',  price: 80,  checked: false },
      { name: 'Tomatoes',        qty: '2 kg',  price: 160, checked: true  },
      { name: 'Potatoes',        qty: '1.5 kg',price: 120, checked: false },
      { name: 'Carrots',         qty: '500 g', price: 60,  checked: false },
    ],
  },
  {
    title: 'Boucherie', emoji: '🥩', accentColor: '#E05C5C',
    items: [
      { name: 'Chicken Breast',  qty: '500 g', price: 380, checked: true  },
      { name: 'Lamb Chops',      qty: '300 g', price: 650, checked: false },
      { name: 'Merguez',         qty: '250 g', price: 280, checked: false },
    ],
  },
  {
    title: 'Épicerie', emoji: '🛒', accentColor: COLORS.peach,
    items: [
      { name: 'Olive Oil',       qty: '1 L',   price: 450, checked: false },
      { name: 'Frik (Freekeh)', qty: '500 g', price: 200, checked: true  },
      { name: 'Couscous',        qty: '1 kg',  price: 180, checked: false },
      { name: 'Lentils',         qty: '500 g', price: 120, checked: false },
    ],
  },
  {
    title: 'Boulangerie', emoji: '🥖', accentColor: '#B45309',
    items: [
      { name: 'Khobz Dar',       qty: '2 pcs', price: 60,  checked: false },
      { name: 'Msemen',          qty: '6 pcs', price: 120, checked: false },
    ],
  },
];

export default function GroceryListScreen() {
  const { user, profileData } = useAuth();
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Generate personalized grocery list based on user profile
  const generatePersonalizedList = () => {
    const personalizedCategories = [...INITIAL_CATEGORIES];

    // Adjust quantities based on family size
    if (profileData?.familySize && profileData.familySize > 1) {
      const familyMultiplier = profileData.familySize / 4; // Base is 4 people
      
      personalizedCategories.forEach(category => {
        category.items.forEach(item => {
          const baseQuantity = parseInt(item.qty);
          item.qty = `${Math.round(baseQuantity * familyMultiplier)} ${item.qty.split(' ')[1]}`;
        });
      });
    }

    // Add health-specific items
    if (profileData?.healthConditions?.includes('diabetes')) {
      personalizedCategories[0].items.push({ // Add to Lkhodra
        name: 'Bitter Melon',
        qty: '2 pieces',
        price: 120,
        checked: false,
      });
    }

    // Adjust for dietary restrictions
    if (profileData?.dietaryRestrictions?.includes('gluten-free')) {
      // Remove gluten items and add alternatives
      personalizedCategories[3].items = personalizedCategories[3].items.filter(
        item => !item.name.toLowerCase().includes('bread')
      );
      personalizedCategories[3].items.push({
        name: 'Gluten-Free Bread',
        qty: '2 loaves',
        price: 400,
        checked: false,
      });
    }

    // Adjust prices based on budget
    if (profileData?.monthlyBudget) {
      const weeklyBudget = profileData.monthlyBudget / 4;
      const budgetFactor = weeklyBudget / 15000; // 15000 DA is default weekly budget
      
      personalizedCategories.forEach(category => {
        category.items.forEach(item => {
          item.price = Math.round(item.price * budgetFactor);
        });
      });
    }

    return personalizedCategories;
  };

  const personalizedCategories = generatePersonalizedList();

  useEffect(() => {
    loadGroceryList();
  }, []);

  const loadGroceryList = async () => {
    // For now, skip API call since user.id is not available
    // TODO: Re-enable when user authentication is properly implemented
    console.log('Skipping grocery list API call for now');
    
    // Use personalized grocery list based on user profile
    setCategories(personalizedCategories);
    setLoading(false);
    console.log('Using personalized grocery list data:', personalizedCategories);
    console.log('Based on user profile:', profileData);
    
    return;

    // Original code (commented out for now)
    /*
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await groceryAPI.getGroceryList(user.id);
      console.log('Grocery list data loaded:', data);
      // You can update categories with real data here
    } catch (err) {
      console.error('Error loading grocery list:', err);
      setError('Failed to load grocery list');
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
          <Text style={styles.loadingText}>Loading grocery list...</Text>
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

  const toggleItem = (catIdx: number, itemIdx: number) => {
    setCategories((prevCategories: Category[]) =>
      prevCategories.map((category: Category, categoryIndex: number) =>
        categoryIndex !== catIdx ? category : {
          ...category,
          items: category.items.map((item: GroceryItem, itemIndex: number) =>
            itemIndex !== itemIdx ? item : { ...item, checked: !item.checked }
          ),
        }
      )
    );
  };

  const allItems = categories.flatMap((c: Category) => c.items);
  const totalItems = allItems.length;
  const checkedItems = allItems.filter((i: GroceryItem) => i.checked).length;
  const totalCost = allItems.reduce((s: number, i: GroceryItem) => s + i.price, 0);
  const spentCost = allItems.filter((i: GroceryItem) => i.checked).reduce((s: number, i: GroceryItem) => s + i.price, 0);
  const budget = profileData?.monthlyBudget ? profileData.monthlyBudget / 4 : 5000; // Dynamic budget
  const budgetPct = Math.min((totalCost / budget) * 100, 100);
  const budgetColor = totalCost > budget * 0.9 ? COLORS.peach : COLORS.greenSoft;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>El Marché</Text>
            <Text style={styles.headerSub}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressCircleVal}>{checkedItems}</Text>
            <Text style={styles.progressCircleSub}>/ {totalItems}</Text>
          </View>
        </View>

        {/* Budget bar */}
        <View style={styles.budgetPill}>
          <View style={styles.budgetLabels}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={[styles.budgetAmount, { color: budgetColor }]}>
              {totalCost.toLocaleString()} DA
              <Text style={styles.budgetTotal}> / {budget.toLocaleString()} DA</Text>
            </Text>
          </View>
          <View style={styles.budgetBar}>
            <View style={[styles.budgetFill, { width: `${budgetPct}%` as any, backgroundColor: budgetColor }]} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { val: `${checkedItems}/${totalItems}`, lbl: 'Checked', color: COLORS.greenMid },
            { val: `${spentCost} DA`,               lbl: 'In Cart',  color: COLORS.peach   },
            { val: `${budget - totalCost} DA`,       lbl: 'Remaining',color: '#5E7CE2'      },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Categories */}
        {categories.map((cat: Category, ci: number) => {
          const catChecked = cat.items.filter((i: GroceryItem) => i.checked).length;
          const catDone = catChecked === cat.items.length;
          return (
            <View key={ci} style={styles.categoryBlock}>
              {/* Category Header */}
              <View style={styles.catHeader}>
                <View style={[styles.catEmojiWrap, { backgroundColor: cat.accentColor + '18' }]}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <View style={[styles.catBadge, { backgroundColor: catDone ? COLORS.greenPale : COLORS.cream }]}>
                  <Text style={[styles.catBadgeText, { color: catDone ? COLORS.greenMid : COLORS.textMuted }]}>
                    {catChecked}/{cat.items.length}
                  </Text>
                </View>
              </View>

              {/* Items */}
              {cat.items.map((item: GroceryItem, ii: number) => (
                <TouchableOpacity
                  key={ii}
                  activeOpacity={0.7}
                  onPress={() => toggleItem(ci, ii)}
                  style={[styles.itemRow, item.checked && styles.itemRowChecked]}
                >
                  <View style={[
                    styles.checkCircle,
                    { borderColor: item.checked ? cat.accentColor : 'rgba(27,67,50,0.2)' },
                    item.checked && { backgroundColor: cat.accentColor },
                  ]}>
                    {item.checked && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemQty}>{item.qty}</Text>
                  </View>
                  <Text style={[styles.itemPrice, item.checked && styles.itemPriceChecked]}>
                    {item.price} DA
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {/* Insight */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <View style={styles.tipStar} />
          </View>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>You're within budget! </Text>
            Swap lamb chops for a second chicken pack to save ~370 DA.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.greenDark },

  header:           { backgroundColor: COLORS.greenDark, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8, marginBottom: 18 },
  headerTitle:      { fontFamily: 'serif', fontSize: 22, fontWeight: '600', color: COLORS.white, lineHeight: 28 },
  headerSub:        { fontSize: 13, color: COLORS.greenSoft, marginTop: 4 },

  progressCircle:   { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' },
  progressCircleVal:{ fontSize: 16, fontWeight: '700', color: COLORS.white },
  progressCircleSub:{ fontSize: 10, color: COLORS.greenSoft },

  budgetPill:       { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  budgetLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetLabel:      { fontSize: 12, color: COLORS.greenSoft, fontWeight: '500' },
  budgetAmount:     { fontSize: 13, fontWeight: '700' },
  budgetTotal:      { fontWeight: '400', color: 'rgba(255,255,255,0.5)' },
  budgetBar:        { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  budgetFill:       { height: '100%', borderRadius: 3 },

  scroll:           { flex: 1, backgroundColor: COLORS.cream },
  scrollContent:    { padding: 20, paddingBottom: 32 },

  statsRow:         { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:         { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  statVal:          { fontSize: 14, fontWeight: '700' },
  statLbl:          { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },

  categoryBlock:    { marginBottom: 16 },
  catHeader:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catEmojiWrap:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catEmoji:         { fontSize: 18 },
  catTitle:         { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  catBadge:         { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  catBadgeText:     { fontSize: 11, fontWeight: '600' },

  itemRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  itemRowChecked:   { opacity: 0.7 },
  checkCircle:      { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkMark:        { fontSize: 13, color: COLORS.white, fontWeight: '700' },
  itemInfo:         { flex: 1 },
  itemName:         { fontSize: 15, fontWeight: '500', color: COLORS.textDark },
  itemNameChecked:  { textDecorationLine: 'line-through', color: COLORS.textMuted },
  itemQty:          { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  itemPrice:        { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  itemPriceChecked: { color: COLORS.textMuted },

  tipCard:          { backgroundColor: COLORS.greenDark, borderRadius: 20, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginTop: 4 },
  tipIcon:          { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipStar:          { width: 14, height: 14, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2, transform: [{ rotate: '45deg' as any }] },
  tipText:          { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  tipBold:          { fontWeight: '700', color: COLORS.white },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.greenDark },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.greenSoft },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.greenDark, padding: 20 },
  errorText: { fontSize: 16, color: COLORS.peach, textAlign: 'center' },
});