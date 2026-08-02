/**
 * PremiumGate — wrap any FoxPlus-only screen/section with this.
 * If the user doesn't have FoxPlus, shows the paywall instead of the children.
 *
 * Usage:
 *   <PremiumGate feature="studyPlanner" title="AI Study Planner" description="…">
 *     <MyPremiumContent />
 *   </PremiumGate>
 */
import React from 'react';
import {
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
import { useColors } from '@/hooks/useColors';
import { Feature, usePlan } from '@/context/PlanContext';
import { FoxCompanion } from '@/components/FoxCompanion';

interface PremiumGateProps {
  feature: Feature;
  /** Short feature name shown in headline */
  title: string;
  /** One-sentence description of what the feature does */
  description: string;
  children: React.ReactNode;
}

const FEATURE_BULLETS: Record<Feature, string[]> = {
  foxScan: ['Unlimited homework scans', 'Step-by-step explanations', 'Concept breakdowns'],
  studyPlanner: [
    'AI-generated study schedules',
    'Adapts to your assignments',
    'Mark sessions complete',
  ],
  advancedStats: [
    'Weekly & monthly breakdowns',
    'Subject-level analytics',
    'Productive streak tracking',
  ],
  premiumDen: [
    'Exclusive furniture & décor',
    'Premium wallpapers & themes',
    'Seasonal limited items',
  ],
  foxCustomization: [
    'Outfits, hats & accessories',
    'Arctic & Fennec fox variants',
    'Special animations',
  ],
  seasonalContent: [
    'Seasonal den decorations',
    'Limited-time fox items',
    'Special seasonal Hunts',
  ],
};

export function PremiumGate({ feature, title, description, children }: PremiumGateProps) {
  const { canUse } = usePlan();
  if (canUse(feature)) return <>{children}</>;
  return <PaywallScreen feature={feature} title={title} description={description} />;
}

function PaywallScreen({
  feature,
  title,
  description,
}: {
  feature: Feature;
  title: string;
  description: string;
}) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bullets = FEATURE_BULLETS[feature] ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: (Platform.OS === 'web' ? 80 : insets.top) + 20, paddingBottom: insets.bottom + 40 },
      ]}
    >
      {/* Fox illustration */}
      <View style={styles.foxWrap}>
        <FoxCompanion size={110} animated />
      </View>

      {/* Badge */}
      <View style={[styles.badge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
        <Ionicons name="diamond" size={14} color={colors.primary} />
        <Text style={[styles.badgeText, { color: colors.primary }]}>FoxPlus Feature</Text>
      </View>

      <Text style={[styles.headline, { color: colors.foreground }]}>
        This trail goes deeper.
      </Text>

      <Text style={[styles.featureTitle, { color: colors.primary }]}>{title}</Text>

      <Text style={[styles.desc, { color: colors.mutedForeground }]}>{description}</Text>

      {/* Bullets */}
      <View style={[styles.bulletCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {bullets.map((b) => (
          <View key={b} style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.bulletText, { color: colors.foreground }]}>{b}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/foxplus')}
        activeOpacity={0.85}
      >
        <Ionicons name="diamond" size={18} color={colors.primaryForeground} />
        <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Unlock with FoxPlus</Text>
      </TouchableOpacity>

      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Support the den. Keep your fox happy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24, gap: 16 },
  foxWrap: { marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  headline: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center', marginTop: 4 },
  featureTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  bulletCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulletText: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    marginTop: 8,
  },
  ctaText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
