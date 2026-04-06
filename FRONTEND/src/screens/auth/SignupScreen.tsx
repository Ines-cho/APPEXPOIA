// screens/auth/SignupScreen.tsx
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

// ── Logo SVG ───────────────────────────────────────────
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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation }: Props) {
  const { registerOnly } = useAuth();
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [showPwd,      setShowPwd]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  // ── Animations ─────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const shimmer   = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 7, delay: 250, useNativeDriver: true }).start();

    const floatLoop = () =>
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ]).start(() => floatLoop());
    setTimeout(floatLoop, 1000);

    const shimmerLoop = () =>
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 2, duration: 1400, delay: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: -1, duration: 0, useNativeDriver: true }),
      ]).start(() => shimmerLoop());
    shimmerLoop();
  }, []);

  const handleSignup = async () => {
    console.log('Signup button pressed');
    console.log('Form data:', { fullName, email, password, confirmPwd });
    
    // 1. Validation
    if (!fullName || !email || !password || !confirmPwd) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPwd) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    console.log('Validation passed, starting signup...');
    setIsLoading(true);
    
    try {
      console.log('Calling registerOnly function...');
      const result = await registerOnly(fullName, email, password);
      console.log('Signup result:', result);
      if (result.success) {
        // Navigate to Health screen after successful signup without setting auth yet
        Alert.alert('Success', result.message);
        navigation.navigate('Health', { 
          email: email, 
          name: fullName 
        });
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Signup error:', error);
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
            {/* Logo */}
            <Animated.View
              style={[
                styles.logoWrap,
                { transform: [{ scale: logoScale }, { translateY: logoFloat }] },
              ]}
            >
              <View style={styles.logoGlow}>
                <LogoIcon />
              </View>
            </Animated.View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start your healthy journey</Text>

            {/* Inputs */}
            <View style={styles.form}>
                <View style={[styles.inputWrapper]}>
                  <Text style={styles.inputLabel}>Full name</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="john doe"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                    <Text style={styles.inputIcon}>{showPwd ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={confirmPwd}
                    onChangeText={setConfirmPwd}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    <Text style={styles.inputIcon}>{showConfirm ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Continue  →</Text>
                    <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] } ]} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9f4' },
  blob1: { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(74,163,96,0.12)' },
  blob2: { position: 'absolute', bottom: 80, left: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(116,198,157,0.08)' },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  content: { paddingHorizontal: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  logoGlow: { shadowColor: G_MID, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1b4332', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#52796f', textAlign: 'center', marginBottom: 24 },
  form: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 20 },
  row: { flexDirection: 'row', gap: 12 },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: G_MID, marginBottom: 6, textTransform: 'uppercase' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#d8eee2', paddingHorizontal: 12, height: 52 },
  inputIcon: { fontSize: 16, marginRight: 8, color: '#94a3b8' },
  input: { flex: 1, fontSize: 15, color: '#1b4332' },
  eyeBtn: { padding: 4 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#d8eee2', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  genderBtnActive: { backgroundColor: G_MID, borderColor: G_MID },
  genderEmoji: { fontSize: 16 },
  genderText: { fontSize: 14, fontWeight: '600', color: '#52796f' },
  genderTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: G_MID, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(255,255,255,0.2)' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: '#52796f', fontSize: 14 },
  footerLink: { color: G_MID, fontSize: 14, fontWeight: 'bold' },
});