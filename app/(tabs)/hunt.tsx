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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFoxDen } from '@/context/FoxDenContext';
import { HuntObjectiveCard } from '@/components/HuntObjectiveCard';
import { FoxCompanion } from '@/components/FoxCompanion';

export default function HuntScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dailyHunt, claimHuntReward, fox } = useFoxDen();

  const webTop = Platform.OS === 'web' ? 67 : insets.top;

  if (!dailyHunt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: webTop + 12, borderBottomColor: colors.border }]}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>The Hunt</Text>
        </View>
        <View style={styles.loadingState}>
          <Ionicons name="compass-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Scouting the trail...
          </Text>
        </View>
      </View>
    );
  }

  const completedObjectives = dailyHunt.objectives.filter((o) => o.current >= o.target).length;
  const totalObjectives = dailyHunt.objectives.length;
  const allComplete = completedObjectives === totalObjectives;
  const totalXP = dailyHunt.objectives.reduce((sum, o) => sum + o.xpReward, 0);
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleClaim = () => {
    if (!allComplete || dailyHunt.claimed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    claimHuntReward();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: webTop + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>The Hunt</Text>
          <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{dateLabel}</Text>
        </View>
        <View style={[styles.progressBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
          <Text style={[styles.progressBadgeText, { color: colors.primary }]}>
            {completedObjectives}/{totalObjectives}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 84 : insets.bottom) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hunt status card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: allComplete
                  ? (dailyHunt.claimed ? colors.card : colors.primary + '15')
                  : colors.card,
                borderColor: allComplete
                  ? (dailyHunt.claimed ? colors.border : colors.primary + '60')
                  : colors.border,
              },
            ]}
          >
            <View style={styles.statusRow}>
              <View style={styles.foxArea}>
                <FoxCompanion size={80} animated={allComplete && !dailyHunt.claimed} />
              </View>
              <View style={styles.statusText}>
                {dailyHunt.claimed ? (
                  <>
                    <Text style={[styles.statusTitle, { color: colors.success }]}>Trail Cleared!</Text>
                    <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
                      Hunt complete. Return tomorrow for a new trail.
                    </Text>
                  </>
                ) : allComplete ? (
                  <>
                    <Text style={[styles.statusTitle, { color: colors.primary }]}>Trail Complete!</Text>
                    <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
                      Claim your reward: +{totalXP} XP + 25 coins
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.statusTitle, { color: colors.foreground }]}>On the Hunt</Text>
                    <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
                      {totalObjectives - completedObjectives} objective{totalObjectives - completedObjectives !== 1 ? 's' : ''} remaining
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Progress bar */}
            <View style={[styles.huntProgressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.huntProgressFill,
                  {
                    backgroundColor: allComplete ? colors.success : colors.primary,
                    width: `${(completedObjectives / Math.max(totalObjectives, 1)) * 100}%` as `${number}%`,
                  },
                ]}
              />
            </View>

            {allComplete && !dailyHunt.claimed && (
              <TouchableOpacity
                style={[styles.claimBtn, { backgroundColor: colors.primary }]}
                onPress={handleClaim}
                activeOpacity={0.85}
              >
                <Ionicons name="star" size={18} color={colors.primaryForeground} />
                <Text style={[styles.claimBtnText, { color: colors.primaryForeground }]}>
                  Claim +{totalXP} XP
                </Text>
              </TouchableOpacity>
            )}

            {dailyHunt.claimed && (
              <View style={[styles.claimedRow, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.claimedText, { color: colors.success }]}>Reward claimed</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Objectives */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OBJECTIVES</Text>
        {dailyHunt.objectives.map((obj, i) => (
          <Animated.View key={obj.id} entering={FadeInDown.delay(150 + i * 60).springify()}>
            <HuntObjectiveCard objective={obj} />
          </Animated.View>
        ))}

        {/* How to earn XP card */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.tipsTitle, { color: colors.mutedForeground }]}>HOW TO EARN XP</Text>
            {[
              { icon: 'checkmark-circle-outline', text: 'Complete an assignment: +25–65 XP', color: colors.primary },
              { icon: 'list-outline', text: 'Finish a subtask: +5 XP', color: colors.secondary },
              { icon: 'timer-outline', text: 'Every 5 min of focus: +10 XP', color: colors.accent },
              { icon: 'compass-outline', text: 'Daily Hunt reward: +50–135 XP', color: colors.success },
            ].map((tip) => (
              <View key={tip.text} style={styles.tipRow}>
                <Ionicons name={tip.icon as any} size={16} color={tip.color} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip.text}</Text>
              </View>
            ))}
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  dateLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  progressBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  progressBadgeText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    marginBottom: 4,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  foxArea: { alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1, gap: 6 },
  statusTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statusSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  huntProgressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  huntProgressFill: { height: '100%', borderRadius: 3 },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  claimBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  claimedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  claimedText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginTop: 8 },
  tipsCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12, marginTop: 4 },
  tipsTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
