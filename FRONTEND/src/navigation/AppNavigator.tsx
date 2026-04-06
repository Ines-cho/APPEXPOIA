// navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Circle, Rect, Path, Line, G, Text as SvgText,
} from 'react-native-svg';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Splash: undefined;
  Auth:   undefined;
  Main:   undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Palette ────────────────────────────────────────────
const G_DARK  = '#1B4332';
const G_MID   = '#2D6A4F';
const G_SOFT  = '#74C69D';
const G_PALE  = 'rgba(116,198,157,0.15)';
const WHITE   = '#FFFFFF';

// ── AnimatedLetter ─────────────────────────────────────
function AnimatedLetter({
  char, color, weight, delay, size = 42,
}: {
  char: string; color: string; weight: string; delay: number; size?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 120, delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.Text style={{
      fontFamily: 'serif', fontSize: size,
      fontWeight: weight as any, color,
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
    }}>
      {char}
    </Animated.Text>
  );
}

// ── Logo SVG ───────────────────────────────────────────
function LogoIcon({ progress }: { progress: Animated.Value }) {
  return (
    <Svg width={144} height={144} viewBox="0 0 144 144">
      {/* Background pill */}
      <Rect x={0} y={0} width={144} height={144} rx={36} fill={G_MID} />
      <Rect x={0} y={0} width={144} height={144} rx={36} fill="none"
        stroke="rgba(116,198,157,0.25)" strokeWidth={1.5} />
      {/* Inner square */}
      <Rect x={14} y={14} width={116} height={116} rx={26}
        fill="rgba(27,67,50,0.4)" />

      {/* Steam */}
      <Path d="M57 74 Q54 67 57 60 Q60 53 57 46"
        fill="none" stroke="rgba(116,198,157,0.6)" strokeWidth={2} strokeLinecap="round" />
      <Path d="M72 72 Q69 65 72 58 Q75 51 72 44"
        fill="none" stroke="rgba(116,198,157,0.6)" strokeWidth={2} strokeLinecap="round" />
      <Path d="M87 74 Q84 67 87 60 Q90 53 87 46"
        fill="none" stroke="rgba(116,198,157,0.6)" strokeWidth={2} strokeLinecap="round" />

      {/* Bowl rim */}
      <Line x1={32} y1={82} x2={112} y2={82}
        stroke={G_SOFT} strokeWidth={3} strokeLinecap="round" />
      {/* Bowl curve */}
      <Path d="M37 82 Q37 110 72 112 Q107 110 107 82"
        fill="none" stroke={G_SOFT} strokeWidth={3.5} strokeLinecap="round" />
      {/* Bowl base */}
      <Line x1={57} y1={112} x2={87} y2={112}
        stroke={G_SOFT} strokeWidth={2.5} strokeLinecap="round" />

      {/* Leaf left */}
      <Path d="M48 94 Q32 82 30 68 Q38 66 50 78 Q54 84 52 94 Z"
        fill="none" stroke={G_SOFT} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M48 94 Q39 80 34 70"
        fill="none" stroke="rgba(116,198,157,0.5)"
        strokeWidth={1.2} strokeLinecap="round" />

      {/* Leaf right */}
      <Path d="M96 94 Q112 82 114 68 Q106 66 94 78 Q90 84 92 94 Z"
        fill="none" stroke={G_SOFT} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M96 94 Q105 80 110 70"
        fill="none" stroke="rgba(116,198,157,0.5)"
        strokeWidth={1.2} strokeLinecap="round" />

      {/* Top dot */}
      <Circle cx={72} cy={35} r={5} fill={G_SOFT} />
    </Svg>
  );
}

// ── Splash Screen ──────────────────────────────────────
function SplashScreen() {
  const logoScale    = useRef(new Animated.Value(0)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const dotOpacity   = useRef(new Animated.Value(0)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const tagY         = useRef(new Animated.Value(8)).current;
  const lineWidth    = useRef(new Animated.Value(0)).current;
  const dotBlink     = useRef(new Animated.Value(1)).current;
  const progress     = useRef(new Animated.Value(0)).current;

  // Letters: "Nutri" white, "·" dot, "Algérie" green
  const letters = [
    { char: 'N', color: WHITE,  weight: '700', delay: 1100 },
    { char: 'u', color: WHITE,  weight: '400', delay: 1220 },
    { char: 't', color: WHITE,  weight: '400', delay: 1340 },
    { char: 'r', color: WHITE,  weight: '400', delay: 1460 },
    { char: 'i', color: WHITE,  weight: '400', delay: 1580 },
  ];
  const letters2 = [
    { char: 'A', color: G_SOFT, weight: '700', delay: 1780 },
    { char: 'l', color: G_SOFT, weight: '400', delay: 1900 },
    { char: 'g', color: G_SOFT, weight: '400', delay: 2020 },
    { char: 'é', color: G_SOFT, weight: '400', delay: 2140 },
    { char: 'r', color: G_SOFT, weight: '400', delay: 2260 },
    { char: 'i', color: G_SOFT, weight: '400', delay: 2380 },
    { char: 'e', color: G_SOFT, weight: '400', delay: 2500 },
  ];

  useEffect(() => {
    // 1. Logo pop in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // 2. Separator dot
    Animated.timing(dotOpacity, {
      toValue: 1, duration: 150, delay: 1680, useNativeDriver: true,
    }).start();

    // 3. Underline grows
    Animated.timing(lineWidth, {
      toValue: 1, duration: 500, delay: 2700,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();

    // 4. Tagline
    Animated.parallel([
      Animated.timing(tagOpacity, { toValue: 1, duration: 500, delay: 2900, useNativeDriver: true }),
      Animated.timing(tagY, { toValue: 0, duration: 500, delay: 2900, useNativeDriver: true }),
    ]).start();

    // 5. Dot blink loop
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(dotBlink, { toValue: 0.25, duration: 600, delay: 3400, useNativeDriver: true }),
        Animated.timing(dotBlink, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    setTimeout(() => blink.start(), 3400);
  }, []);

  return (
    <View style={styles.splashContainer}>
      {/* Decorative rings */}
      <View style={styles.decorTL} />
      <View style={styles.decorBR} />

      {/* Decorative dots */}
      <View style={[styles.decorDot, { top: 120, left: 60,  width: 6, height: 6,  opacity: 0.3 }]} />
      <View style={[styles.decorDot, { top: 160, left: 40,  width: 3, height: 3,  opacity: 0.2 }]} />
      <View style={[styles.decorDot, { bottom: 180, right: 55, width: 5, height: 5, opacity: 0.25 }]} />
      <View style={[styles.decorDot, { bottom: 220, right: 35, width: 3, height: 3, opacity: 0.15 }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <View style={styles.logoRing} />
        <LogoIcon progress={progress} />
      </Animated.View>

      {/* Name row */}
      <View style={styles.nameRow}>
        {letters.map((l, i) => (
          <AnimatedLetter key={i} {...l} />
        ))}
        {/* Separator dot */}
        <Animated.View style={[styles.separatorDot, { opacity: dotOpacity }]} />
        {letters2.map((l, i) => (
          <AnimatedLetter key={i} {...l} />
        ))}
        {/* Blinking dot */}
        <Animated.View style={[styles.liveDot, { opacity: dotBlink }]} />
      </View>

      {/* Underline */}
      <Animated.View style={[styles.underline, {
        width: lineWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '70%'] }),
      }]} />

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, {
        opacity: tagOpacity,
        transform: [{ translateY: tagY }],
      }]}>
        NUTRITION · ALGÉRIE
      </Animated.Text>

      {/* Version pill */}
      <Animated.View style={[styles.versionPill, { opacity: tagOpacity }]}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

// ── App Navigator ──────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1, backgroundColor: G_DARK,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  decorTL: {
    position: 'absolute', top: -80, left: -80,
    width: 280, height: 280, borderRadius: 140,
    borderWidth: 60, borderColor: 'rgba(116,198,157,0.06)',
  },
  decorBR: {
    position: 'absolute', bottom: -100, right: -100,
    width: 320, height: 320, borderRadius: 160,
    borderWidth: 60, borderColor: 'rgba(116,198,157,0.05)',
  },
  decorDot: {
    position: 'absolute', borderRadius: 10,
    backgroundColor: G_SOFT,
  },

  logoWrap:  { marginBottom: 36, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  logoRing:  {
    position: 'absolute', width: 172, height: 172, borderRadius: 86,
    borderWidth: 1, borderColor: 'rgba(116,198,157,0.15)',
  },

  nameRow:       { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  separatorDot:  {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: G_SOFT, marginHorizontal: 6, marginBottom: 10,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: G_SOFT, marginLeft: 5, marginBottom: 8,
  },

  underline: {
    height: 1.5, backgroundColor: 'rgba(116,198,157,0.25)',
    borderRadius: 1, marginBottom: 14, alignSelf: 'center',
  },

  tagline: {
    fontFamily: 'serif', fontSize: 13,
    color: 'rgba(116,198,157,0.65)',
    letterSpacing: 4, marginBottom: 20,
  },

  versionPill: {
    paddingHorizontal: 16, paddingVertical: 5,
    borderRadius: 50,
    backgroundColor: 'rgba(116,198,157,0.1)',
    borderWidth: 1, borderColor: 'rgba(116,198,157,0.2)',
  },
  versionText: {
    fontSize: 11, fontFamily: 'serif',
    color: 'rgba(116,198,157,0.6)',
  },
});