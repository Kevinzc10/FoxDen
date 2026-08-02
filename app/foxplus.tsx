/**
 * FoxPlus upgrade screen.
 * In development: use the dev-mode toggle to test FoxPlus features.
 * In production: wire setPlan('foxplus') to a real payment confirmation callback.
 */
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlan } from '@/context/PlanContext';
import { FoxCompanion } from '@/components/FoxCompanion';

const FREE_FEATURES = [
  { icon: 'book-outline', text: 'Unlimited assignments & tracking' },
  { icon: 'compass-outline', text: 'Daily Fox Hunt objectives' },
  { icon: 'timer-outline', text: 'Focus timer & study sessions' },
  { icon: 'paw-outline', text: 'Fox companion & XP progression' },
  { icon: 'camera-outline', text: '14 FoxScan scans per week' },
];

const PLUS_FEATURES = [
  { icon: 'camera', text: 'Unlimited FoxScan AI assistance' },
  { icon: 'calendar', text: 'AI Study Planner' },
  { icon: 'bar-chart', text: 'Advanced statistics & insights' },
  { icon: 'home', text: 'Expanded Den customization' },
  { icon: 'shirt-outline', text: 'Fox outfits & accessories' },
  { icon: 'gift', text: 'Seasonal content & exclusive items' },
];

export default function FoxPlusScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan, devMode, toggleDevMode, setPlan } = usePlan();
  const [loading, setLoading] = useState(false);

  const isFoxPlus = plan === 'foxplus';

  const handleUpgrade = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Replace this with real payment provider (RevenueCat / Stripe / Whop)
    // For now: show dev-mode upgrade for testing
    Alert.alert(
      'FoxPlus',
      'Payment integration coming soon!\n\nUse the developer toggle below to test FoxPlus features.',
      [{ text: 'Got it', style: 'default' }],
    );
  };

  const handleDevToggle = async () => {
    setLoading(true);
    await toggleDevMode();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        {isFoxPlus && (
          <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
            <Ionicons name="diamond" size={13} color={colors.primary} />
            <Text style={[styles.activeBadgeText, { color: colors.primary }]}>FoxPlus Active</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.hero}>
          <FoxCompanion size={120} animated />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {isFoxPlus ? 'Your Fox is Thriving.' : 'Give Your Fox More.'}
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            {isFoxPlus
              ? 'You have FoxPlus. Enjoy unlimited access to every feature.'
              : 'FoxPlus unlocks AI tools, deeper customization, and seasonal adventures.'}
          </Text>
        </Animated.View>

        {/* Plan cards */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.cards}>
          {/* Free card */}
          <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.planName, { color: colors.mutedForeground }]}>🆓 FOXDEN FREE</Text>
            <View style={styles.featureList}>
              {FREE_FEATURES.map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <Ionicons name={f.icon as any} size={15} color={colors.mutedForeground} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* FoxPlus card */}
          <View
            style={[
              styles.planCard,
              styles.planCardPremium,
              {
                backgroundColor: colors.primary + '0F',
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.planNameRow}>
              <Text style={[styles.planName, { color: colors.primary }]}>🌙 FOXPLUS</Text>
              <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.popularText, { color: colors.primaryForeground }]}>BEST</Text>
              </View>
            </View>
            <View style={styles.featureList}>
              {PLUS_FEATURES.map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <Ionicons name={f.icon as any} size={15} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* CTA */}
        {!isFoxPlus && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
              activeOpacity={0.85}
            >
              <Ionicons name="diamond" size={20} color={colors.primaryForeground} />
              <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Upgrade to FoxPlus</Text>
            </TouchableOpacity>
            <Text style={[styles.ctaNote, { color: colors.mutedForeground }]}>
              Payment integration coming soon
            </Text>
          </Animated.View>
        )}

        {/* Already subscribed */}
        {isFoxPlus && !devMode && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={[styles.activeCard, { backgroundColor: colors.card, borderColor: colors.primary + '40' }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text style={[styles.activeTitle, { color: colors.foreground }]}>FoxPlus is Active</Text>
              <Text style={[styles.activeSub, { color: colors.mutedForeground }]}>
                Enjoy all premium features. Thank you for supporting FoxDen!
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Dev Mode toggle (development only) */}
        <Animated.View entering={FadeInDown.delay(280).springify()}>
          <View style={[styles.devSection, { borderColor: colors.border }]}>
            <Text style={[styles.devTitle, { color: colors.mutedForeground }]}>🛠 Developer Mode</Text>
            <Text style={[styles.devDesc, { color: colors.mutedForeground }]}>
              Test FoxPlus features without a real subscription. This toggle is for development only.
            </Text>
            <TouchableOpacity
              style={[
                styles.devBtn,
                {
                  backgroundColor: devMode ? colors.primary + '20' : colors.card,
                  borderColor: devMode ? colors.primary : colors.border,
                },
              ]}
              onPress={handleDevToggle}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons
                name={devMode ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={devMode ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.devBtnText, { color: devMode ? colors.primary : colors.mutedForeground }]}>
                {devMode ? 'FoxPlus Dev Mode ON' : 'Enable FoxPlus Dev Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 20, gap: 16 },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  heroTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  heroSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  cards: { gap: 12 },
  planCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  planCardPremium: { borderWidth: 2 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  popularBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  featureList: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 32,
    marginTop: 4,
  },
  ctaText: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  ctaNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8 },
  activeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  activeTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  activeSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  devSection: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    gap: 10,
  },
  devTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  devDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  devBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  devBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
