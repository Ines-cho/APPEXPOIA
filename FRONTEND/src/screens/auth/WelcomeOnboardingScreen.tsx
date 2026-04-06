import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, StatusBar, SafeAreaView, ScrollView,
} from 'react-native';
import Svg, { Circle, Path, G, Rect, Line, Ellipse } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

const COLORS = {
  greenDark: '#1B4332', greenMid: '#2D6A4F', greenSoft: '#74C69D',
  greenPale: '#D8F3DC', cream: '#F8F4EF', peach: '#F4A261',
  peachPale: '#FEF3E2', white: '#FFFFFF', textDark: '#1B2A22',
  textMuted: '#6B8C7A', border: 'rgba(27,67,50,0.07)',
};

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'WelcomeOnboarding'>;
};

// ── Illustration 1 ─────────────────────────────────────
function IllustrationNutri() {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (anim: Animated.Value, delay: number, range: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: -range, duration: 1800, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,      duration: 1800,        useNativeDriver: true }),
      ])).start();
    loop(float1, 0,   8);
    loop(float2, 400, 6);
    loop(float3, 200, 10);
  }, []);

  return (
    <View style={styles.illustrationWrap}>
      <View style={[styles.bgCircle, { backgroundColor: COLORS.greenPale }]} />
      <Animated.View style={[styles.floatItem, { top: 30, left: 30, transform: [{ translateY: float1 }] }]}>
        <Svg width={56} height={56} viewBox="0 0 56 56">
          <Circle cx={28} cy={28} r={28} fill={COLORS.greenPale} />
          <Path d="M12 30 Q12 42 28 44 Q44 42 44 30" fill="none" stroke={COLORS.greenMid} strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={10} y1={30} x2={46} y2={30} stroke={COLORS.greenMid} strokeWidth={2.5} strokeLinecap="round" />
          <Ellipse cx={28} cy={24} rx={10} ry={5} fill={COLORS.greenSoft} opacity={0.6} />
          <Circle cx={28} cy={22} r={3} fill={COLORS.greenMid} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.floatItem, { top: 20, right: 20, transform: [{ translateY: float2 }] }]}>
        <Svg width={48} height={48} viewBox="0 0 48 48">
          <Circle cx={24} cy={24} r={24} fill={COLORS.peachPale} />
          <Path d="M24 10 L20 30 Q24 34 28 30 Z" fill={COLORS.peach} />
          <Path d="M24 10 Q20 6 18 8" fill="none" stroke={COLORS.greenMid} strokeWidth={2} strokeLinecap="round" />
          <Path d="M24 10 Q24 5 22 4" fill="none" stroke={COLORS.greenMid} strokeWidth={2} strokeLinecap="round" />
          <Path d="M24 10 Q28 6 30 8" fill="none" stroke={COLORS.greenMid} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.floatItem, { bottom: 40, left: 20, transform: [{ translateY: float3 }] }]}>
        <Svg width={52} height={52} viewBox="0 0 52 52">
          <Circle cx={26} cy={26} r={26} fill={COLORS.greenPale} />
          <Path d="M26 10 Q40 16 38 30 Q34 40 26 42 Q18 40 14 30 Q12 16 26 10Z" fill={COLORS.greenSoft} />
          <Path d="M26 10 Q26 42 26 42" fill="none" stroke={COLORS.greenMid} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M26 22 Q34 22 36 28" fill="none" stroke={COLORS.greenMid} strokeWidth={1} strokeLinecap="round" />
          <Path d="M26 30 Q18 30 16 24" fill="none" stroke={COLORS.greenMid} strokeWidth={1} strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <View style={styles.mainIllustration}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <Ellipse cx={90} cy={155} rx={55} ry={8} fill="rgba(27,67,50,0.08)" />
          <Ellipse cx={90} cy={130} rx={60} ry={18} fill={COLORS.white} />
          <Ellipse cx={90} cy={130} rx={60} ry={18} fill="none" stroke={COLORS.greenPale} strokeWidth={2} />
          <Path d="M40 100 Q40 140 90 142 Q140 140 140 100" fill={COLORS.white} stroke={COLORS.greenPale} strokeWidth={2} />
          <Path d="M35 100 L145 100" stroke={COLORS.greenMid} strokeWidth={3} strokeLinecap="round" />
          <Ellipse cx={90} cy={95} rx={44} ry={14} fill={COLORS.greenSoft} opacity={0.5} />
          <Circle cx={75} cy={90} r={8} fill={COLORS.peach} />
          <Circle cx={95} cy={88} r={7} fill={COLORS.greenMid} />
          <Circle cx={110} cy={92} r={6} fill={COLORS.peach} opacity={0.7} />
          <Path d="M70 82 Q67 72 70 62 Q73 52 70 42" fill="none" stroke="rgba(116,198,157,0.5)" strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M90 78 Q87 68 90 58 Q93 48 90 38" fill="none" stroke="rgba(116,198,157,0.5)" strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M110 82 Q107 72 110 62 Q113 52 110 42" fill="none" stroke="rgba(116,198,157,0.5)" strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      </View>
      <View style={[styles.badge, { backgroundColor: COLORS.greenDark, bottom: 24, right: 16 }]}>
        <Text style={styles.badgeText}>🇩🇿 Algérien</Text>
      </View>
    </View>
  );
}

// ── Illustration 2 ─────────────────────────────────────
function IllustrationBudget() {
  const coinAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(coinAnim,  { toValue: -12, duration: 900, useNativeDriver: true }),
      Animated.timing(coinAnim,  { toValue: 0,   duration: 900, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <View style={styles.illustrationWrap}>
      <View style={[styles.bgCircle, { backgroundColor: COLORS.peachPale }]} />
      <Animated.View style={[styles.floatItem, { top: 24, left: 24, transform: [{ translateY: coinAnim }] }]}>
        <Svg width={50} height={50} viewBox="0 0 50 50">
          <Circle cx={25} cy={25} r={25} fill="#FEF3E2" />
          <Circle cx={25} cy={25} r={16} fill={COLORS.peach} />
          <Circle cx={25} cy={25} r={16} fill="none" stroke="#E8924F" strokeWidth={1.5} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.mainIllustration, { transform: [{ scale: scaleAnim }] }]}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <Rect x={20} y={55} width={140} height={95} rx={16} fill={COLORS.greenDark} />
          <Rect x={20} y={55} width={140} height={30} rx={16} fill={COLORS.greenMid} />
          <Rect x={110} y={80} width={42} height={40} rx={12} fill={COLORS.greenDark} stroke="rgba(116,198,157,0.3)" strokeWidth={1.5} />
          <Circle cx={131} cy={100} r={10} fill={COLORS.peach} />
          <Rect x={32} y={100} width={60} height={6} rx={3} fill="rgba(255,255,255,0.15)" />
          <Rect x={32} y={113} width={40} height={6} rx={3} fill="rgba(255,255,255,0.1)" />
          <Path d="M60 55 Q60 35 90 35 Q120 35 120 55" fill="none" stroke={COLORS.greenMid} strokeWidth={8} strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <View style={[styles.badge, { backgroundColor: COLORS.peach, top: 28, right: 16 }]}>
        <Text style={[styles.badgeText, { color: COLORS.white }]}>800 DA / jour</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: COLORS.greenDark, bottom: 24, left: 16 }]}>
        <Text style={styles.badgeText}>Économisez!</Text>
      </View>
    </View>
  );
}

// ── Illustration 3 ─────────────────────────────────────
function IllustrationHealth() {
  const heartAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1,    duration: 400, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1.1,  duration: 300, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <View style={styles.illustrationWrap}>
      <View style={[styles.bgCircle, { backgroundColor: '#FDE8EA' }]} />
      <Animated.View style={[styles.pulseRing, {
        opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
        transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
      }]} />
      <View style={styles.mainIllustration}>
        <Svg width={200} height={180} viewBox="0 0 200 180">
          <Rect x={10} y={30} width={180} height={130} rx={20} fill={COLORS.white} stroke={COLORS.greenPale} strokeWidth={1.5} />
          <Path
            d="M20 100 L50 100 L60 70 L70 130 L80 85 L90 100 L180 100"
            fill="none" stroke="#E63946" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          />
          <Rect x={20} y={40} width={80} height={22} rx={11} fill={COLORS.greenPale} />
        </Svg>
      </View>
      <Animated.View style={[styles.floatItem, { top: 18, right: 24, transform: [{ scale: heartAnim }] }]}>
        <Svg width={54} height={54} viewBox="0 0 54 54">
          <Circle cx={27} cy={27} r={27} fill="#FDE8EA" />
          <Path d="M27 38 Q14 28 14 20 Q14 13 20 13 Q24 13 27 17 Q30 13 34 13 Q40 13 40 20 Q40 28 27 38Z"
            fill="#E63946" />
        </Svg>
      </Animated.View>
      <View style={[styles.badge, { backgroundColor: COLORS.greenDark, bottom: 24, right: 16 }]}>
        <Text style={styles.badgeText}>BMI Normal</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: '#E63946', top: 28, left: 16 }]}>
        <Text style={styles.badgeText}>♥ 72 bpm</Text>
      </View>
    </View>
  );
}

// ── Slides ─────────────────────────────────────────────
const slides = [
  {
    id: '1',
    title: 'Bienvenue sur\nNutriAlgérie',
    description: 'Votre nutritionniste personnel algérien. Des repas adaptés à votre culture et vos goûts.',
    accent: COLORS.greenMid,
    Illustration: IllustrationNutri,
  },
  {
    id: '2',
    title: 'Cuisinez Local\n& Économisez',
    description: 'Optimisez vos achats au marché. Des recettes délicieuses sans dépasser votre budget.',
    accent: COLORS.peach,
    Illustration: IllustrationBudget,
  },
  {
    id: '3',
    title: 'Suivez Votre\nSanté',
    description: "Une IA qui comprend vos besoins médicaux pour une vie plus saine au quotidien.",
    accent: '#E63946',
    Illustration: IllustrationHealth,
  },
];

// ── Main Screen ────────────────────────────────────────
export default function WelcomeOnboardingScreen({ navigation }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX   = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  // ✅ الدالة الوحيدة للتنقل — تحدث currentSlide يدوياً
  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
    setCurrentSlide(index);
  };

  // ✅ handleNext مبني على goTo فقط
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goTo(currentSlide + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const accent = slides[currentSlide].accent;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoMini}>
          <Text style={styles.logoMiniText}>N</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        // ✅ onMomentumScrollEnd فقط للسحب اليدوي
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentSlide(index);
        }}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <slide.Illustration />
            <Animated.View style={[styles.textWrap, { opacity: fadeAnim }]}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDesc}>{slide.description}</Text>
            </Animated.View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>

        {/* Dots */}
        <View style={styles.pagination}>
          {slides.map((_, i) => {
            const dotW = scrollX.interpolate({
              inputRange: [width * (i - 1), width * i, width * (i + 1)],
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const op = scrollX.interpolate({
              inputRange: [width * (i - 1), width * i, width * (i + 1)],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <Animated.View style={[styles.dot, {
                  width: dotW, opacity: op, backgroundColor: accent,
                }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: accent }]}
          onPress={handleNext}
          activeOpacity={0.88}
        >
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? 'Commencer' : 'Continuer'}
          </Text>
          <View style={styles.buttonIcon}>
            <Text style={[styles.buttonIconText, { color: accent }]}>
              {currentSlide === slides.length - 1 ? '✓' : '›'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            Déjà un compte?{' '}
            <Text style={[styles.loginLinkBold, { color: accent }]}>Se connecter</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.cream },

  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  logoMini:         { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.greenDark, alignItems: 'center', justifyContent: 'center' },
  logoMiniText:     { fontSize: 16, fontWeight: '700', color: COLORS.greenSoft, fontFamily: 'serif' },
  skipBtn:          { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 50, backgroundColor: 'rgba(27,67,50,0.06)' },
  skipText:         { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },

  slide:            { width, alignItems: 'center', paddingTop: 16 },

  illustrationWrap: { width: width - 48, height: height * 0.38, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bgCircle:         { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  mainIllustration: { alignItems: 'center', justifyContent: 'center' },
  floatItem:        { position: 'absolute' },
  pulseRing:        { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: '#E63946' },
  badge:            { position: 'absolute', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  badgeText:        { fontSize: 12, fontWeight: '700', color: COLORS.white },

  textWrap:         { paddingHorizontal: 32, marginTop: 24, alignItems: 'center' },
  slideTitle:       { fontFamily: 'serif', fontSize: 30, fontWeight: '700', color: COLORS.textDark, textAlign: 'center', lineHeight: 38, marginBottom: 14 },
  slideDesc:        { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', lineHeight: 26 },

  footer:           { paddingHorizontal: 24, paddingBottom: 24 },
  pagination:       { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot:              { height: 8, borderRadius: 4 },

  button:           { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText:       { fontSize: 17, fontWeight: '700', color: COLORS.white },
  buttonIcon:       { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  buttonIconText:   { fontSize: 18, fontWeight: '700', lineHeight: 24 },

  loginLink:        { alignItems: 'center', marginTop: 16 },
  loginLinkText:    { fontSize: 14, color: COLORS.textMuted },
  loginLinkBold:    { fontWeight: '700' },
});