import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { FoxCompanion } from '@/components/FoxCompanion';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setFormError('Enter your email and password to continue.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await signIn(normalizedEmail, password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not sign you in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={[
            styles.content,
            { paddingTop: Math.max(insets.top, 24) + 16, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
          >
            <Ionicons name="close" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={styles.hero}>
            <FoxCompanion size={112} animated />
            <Text style={[styles.title, { color: colors.foreground }]}>Welcome back.</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign in to keep your FoxDen connected across your devices.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              style={[styles.input, { color: colors.inputForeground, backgroundColor: colors.surface, borderColor: colors.border }]}
            />

            <View style={styles.passwordLabelRow}>
              <Text style={[styles.label, { color: colors.foreground }]}>PASSWORD</Text>
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={[styles.link, { color: colors.primary }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
                style={[styles.passwordText, { color: colors.inputForeground }]}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible((visible) => !visible)}
                style={styles.visibilityButton}
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + '16' }]}>
                <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSignIn}
              disabled={isSubmitting}
              activeOpacity={0.85}
              style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>New to FoxDen?</Text>
            <TouchableOpacity onPress={() => router.replace('/signup')}>
              <Text style={[styles.link, { color: colors.primary }]}>Create an account</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.guestButton}>
            <Text style={[styles.guestText, { color: colors.mutedForeground }]}>Continue as guest</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollViewCompat>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  closeButton: { alignSelf: 'flex-end', padding: 8 },
  hero: { alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 28 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, textAlign: 'center', maxWidth: 290 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 10 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter_400Regular' },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  passwordInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12 },
  passwordText: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter_400Regular' },
  visibilityButton: { padding: 13 },
  link: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 10, padding: 12, marginTop: 4 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  primaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 26, marginTop: 10 },
  primaryButtonText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  guestButton: { alignSelf: 'center', padding: 14, marginTop: 2 },
  guestText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
