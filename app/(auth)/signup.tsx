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

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignUp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || !confirmPassword) {
      setFormError('Complete every field to create your account.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setFormError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Your passwords do not match.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await signUp(normalizedEmail, password);
      setConfirmationSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
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
            <FoxCompanion size={104} animated />
            <Text style={[styles.title, { color: colors.foreground }]}>Build your den.</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Create an account to keep your progress safe as FoxDen grows.
            </Text>
          </View>

          {confirmationSent ? (
            <View style={[styles.card, styles.successCard, { backgroundColor: colors.card, borderColor: colors.success + '70' }]}>
              <Ionicons name="mail-open-outline" size={38} color={colors.success} />
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Check your email</Text>
              <Text style={[styles.successText, { color: colors.mutedForeground }]}>We sent a confirmation link to {email.trim()}.</Text>
              <TouchableOpacity
                onPress={() => router.replace('/login')}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
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

              <Text style={[styles.label, styles.spacedLabel, { color: colors.foreground }]}>PASSWORD</Text>
              <View style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  style={[styles.passwordText, { color: colors.inputForeground }]}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible((visible) => !visible)}
                  style={styles.visibilityButton}
                  accessibilityRole="button"
                  accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  <Ionicons name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, styles.spacedLabel, { color: colors.foreground }]}>CONFIRM PASSWORD</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Enter it again"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSignUp}
                style={[styles.input, { color: colors.inputForeground, backgroundColor: colors.surface, borderColor: colors.border }]}
              />

              {formError ? (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + '16' }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{formError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
              >
                {isSubmitting ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Create Account</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={[styles.link, { color: colors.primary }]}>Sign in</Text>
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
  hero: { alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 22 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, textAlign: 'center', maxWidth: 300 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 10 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  spacedLabel: { marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter_400Regular' },
  passwordInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12 },
  passwordText: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter_400Regular' },
  visibilityButton: { padding: 13 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 10, padding: 12, marginTop: 4 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  primaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 26, marginTop: 10 },
  primaryButtonText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  successCard: { alignItems: 'center', paddingVertical: 28 },
  successTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  successText: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  link: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  guestButton: { alignSelf: 'center', padding: 14, marginTop: 2 },
  guestText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
