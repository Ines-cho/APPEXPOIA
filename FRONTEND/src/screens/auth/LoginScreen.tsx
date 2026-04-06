// screens/auth/LoginScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Path, Line, Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors, spacing, shadows } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// ── Constants ───────────────────────────────────────────
const G_MID  = '#2d6a4f';
const G_SOFT = '#74c69d';
const O_MID  = '#f97316'; // Orange accent for login elements

// ── Logo SVG (Consistent with Signup) ──────────────────
function LogoIcon() {
  return (
    <Svg width={100} height={100} viewBox="0 0 144 144">
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
      {/* Leaf right */}
      <Path d="M96 94 Q112 82 114 68 Q106 66 94 78 Q90 84 92 94 Z"
        fill="none" stroke={G_SOFT} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Top dot */}
      <Circle cx={72} cy={35} r={5} fill={G_SOFT} />
    </Svg>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── Animations ─────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const shimmer   = useRef(new Animated.Value(-1)).current;

  // Staggered field animations
  const fieldAnims = useRef(
    Array.from({ length: 3 }, () => ({
      opacity:   new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  useEffect(() => {
    // Page fade + slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, tension: 50, friction: 8, useNativeDriver: true,
      }),
    ]).start();

    // Logo pop-in
    Animated.spring(logoScale, {
      toValue: 1, tension: 70, friction: 7,
      delay: 300, useNativeDriver: true,
    }).start();

    // Logo idle float
    const floatLoop = () =>
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 0,  duration: 2000, useNativeDriver: true }),
      ]).start(() => floatLoop());
    floatLoop();

    // Stagger fields in
    fieldAnims.forEach((a, i) => {
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1, duration: 500,
          delay: 500 + i * 150, useNativeDriver: true,
        }),
        Animated.spring(a.translateY, {
          toValue: 0, tension: 50, friction: 8,
          delay: 500 + i * 150, useNativeDriver: true,
        }),
      ]).start();
    });

    // Shimmer loop on button
    const shimmerLoop = () =>
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 2, duration: 1500, delay: 2500, useNativeDriver: true,
        }),
        Animated.timing(shimmer, { toValue: -1, duration: 0, useNativeDriver: true }),
      ]).start(() => shimmerLoop());
    shimmerLoop();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        // Navigation will be handled by the auth context
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [-1, 2],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.container}>
      {/* Soft background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* ── Logo ── */}
            <Animated.View
              style={[
                styles.logoWrap,
                {
                  transform: [
                    { scale: logoScale },
                    { translateY: logoFloat },
                  ],
                },
              ]}
            >
              <View style={styles.logoGlow}>
                <LogoIcon />
              </View>
            </Animated.View>

            {/* ── Header ── */}
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue your health journey with us</Text>

            {/* ── Form ── */}
            <View style={styles.formCard}>
              {/* Email */}
              <Animated.View style={[styles.field, { opacity: fieldAnims[0].opacity, transform: [{ translateY: fieldAnims[0].translateY }] }]}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.icon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="example@mail.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </Animated.View>

              {/* Password */}
              <Animated.View style={[styles.field, { opacity: fieldAnims[1].opacity, transform: [{ translateY: fieldAnims[1].translateY }] }]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.icon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                    <Text style={styles.icon}>{showPwd ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Submit Button */}
              <Animated.View style={{ opacity: fieldAnims[2].opacity, transform: [{ translateY: fieldAnims[2].translateY }] }}>
                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitText}>Sign In</Text>
                      <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* ── Footer ── */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Create new account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f4', // Very light green background
  },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(74,163,96,0.12)',
  },
  blob2: {
    position: 'absolute',
    bottom: 80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(116,198,157,0.08)',
  },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoGlow: {
    shadowColor: G_MID,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b4332',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#52796f',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  field: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: G_MID,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316', // Orange for forgot password
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d8eee2',
    paddingHorizontal: spacing.md,
    height: 56,
    ...shadows.small,
  },
  icon: {
    fontSize: 18,
    marginRight: spacing.xs,
    color: '#94a3b8',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1b4332',
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  submitBtn: {
    backgroundColor: G_MID,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 10,
    ...shadows.medium,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  signupText: {
    color: '#52796f',
    fontSize: 15,
  },
  signupLink: {
    color: G_MID,
    fontSize: 15,
    fontWeight: 'bold',
  },
});