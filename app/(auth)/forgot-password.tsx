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
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setFormError('Enter the email address connected to your FoxDen account.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(normalizedEmail);
      setEmailSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not send a reset email. Please try again.');
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to sign in">
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.hero}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="key-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Reset your password</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Enter your email and we’ll send a link to help you get back to your den.</Text>
          </View>

          {emailSent ? (
            <View style={[styles.card, styles.successCard, { backgroundColor: colors.card, borderColor: colors.success + '70' }]}>
              <Ionicons name="mail-open-outline" size={38} color={colors.success} />
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Check your email</Text>
              <Text style={[styles.successText, { color: colors.mutedForeground }]}>If an account exists for {email.trim()}, a reset link is on its way.</Text>
              <TouchableOpacity onPress={() => router.replace('/login')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
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
                returnKeyType="send"
                onSubmitEditing={handleReset}
                style={[styles.input, { color: colors.inputForeground, backgroundColor: colors.surface, borderColor: colors.border }]}
              />

              {formError ? (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + '16' }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{formError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleReset}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
              >
                {isSubmitting ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Send Reset Link</Text>}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAwareScrollViewCompat>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  backButton: { alignSelf: 'flex-start', padding: 8 },
  hero: { alignItems: 'center', gap: 12, marginTop: 42, marginBottom: 30 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, textAlign: 'center', maxWidth: 310 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 10 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter_400Regular' },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 10, padding: 12, marginTop: 4 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  primaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 26, marginTop: 10, alignSelf: 'stretch' },
  primaryButtonText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  successCard: { alignItems: 'center', paddingVertical: 28 },
  successTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  successText: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
