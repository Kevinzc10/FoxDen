/**
 * Advanced Statistics — FoxPlus exclusive.
 * Derives all data from the existing FoxDenContext.
 * Free users see the PremiumGate paywall.
 */
import React, { useMemo } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { usePlan } from '@/context/PlanContext';
import { PremiumGate } from '@/components/PremiumGate';
import { useFoxDen } from '@/context/FoxDenContext';
import { getSubjectColor } from '@/constants/foxData';

function StatsContent() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { assignments, focusSessions, xpLog, fox } = useFoxDen();
  const foxLevelData = React.useMemo(() => ({ level: Math.floor(fox.xp / 100) + 1 }), [fox.xp]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Last 7 days
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Assignments completed per day (last 7)
    const completedPerDay = days.map((day) => ({
      label: new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      count: assignments.filter((a) => a.status === 'completed' && a.completedAt?.startsWith(day)).length,
      isToday: day === today,
    }));

    // Focus minutes per day (last 7)
    const focusPerDay = days.map((day) => ({
      label: new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: focusSessions.filter((s) => s.date === day).reduce((sum, s) => sum + s.minutes, 0),
      isToday: day === today,
    }));

    // Subject breakdown
    const subjectMap: Record<string, number> = {};
    assignments.filter((a) => a.status === 'completed').forEach((a) => {
      subjectMap[a.subject] = (subjectMap[a.subject] ?? 0) + 1;
    });
    const subjectBreakdown = Object.entries(subjectMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    // Totals
    const totalCompleted = assignments.filter((a) => a.status === 'completed').length;
    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.minutes, 0);
    const totalXPEarned = xpLog.reduce((sum, r) => sum + r.amount, 0);

    // This week XP
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weeklyXP = xpLog
      .filter((r) => r.date >= weekStartStr)
      .reduce((sum, r) => sum + r.amount, 0);

    // Weekly completed
    const weeklyCompleted = assignments.filter(
      (a) => a.status === 'completed' && (a.completedAt ?? '') >= weekStartStr,
    ).length;

    // Best day (most focus minutes)
    const dayFocusMap: Record<string, number> = {};
    focusSessions.forEach((s) => {
      dayFocusMap[s.date] = (dayFocusMap[s.date] ?? 0) + s.minutes;
    });
    const bestDay = Object.entries(dayFocusMap).sort(([, a], [, b]) => b - a)[0];
    const bestDayLabel = bestDay
      ? new Date(bestDay[0] + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : null;

    // Max for chart scaling
    const maxCompleted = Math.max(...completedPerDay.map((d) => d.count), 1);
    const maxFocusMinutes = Math.max(...focusPerDay.map((d) => d.minutes), 30);

    return {
      completedPerDay,
      focusPerDay,
      subjectBreakdown,
      totalCompleted,
      totalFocusMinutes,
      totalXPEarned,
      weeklyXP,
      weeklyCompleted,
      bestDayLabel,
      bestDayFocusMinutes: bestDay ? bestDay[1] : 0,
      maxCompleted,
      maxFocusMinutes,
      totalSubjects: subjectBreakdown.length,
    };
  }, [assignments, focusSessions, xpLog]);

  const webTop = Platform.OS === 'web' ? 67 : insets.top;
  const totalSubjectCount = stats.subjectBreakdown.reduce((s, [, n]) => s + n, 0) || 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: webTop + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Advanced Stats</Text>
          <View style={[styles.plusBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
            <Ionicons name="diamond" size={11} color={colors.primary} />
            <Text style={[styles.plusBadgeText, { color: colors.primary }]}>FoxPlus</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* This week summary */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>THIS WEEK</Text>
          <View style={[styles.summaryGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: 'checkmark-circle-outline', label: 'Completed', value: stats.weeklyCompleted.toString(), color: colors.success },
              { icon: 'flash-outline', label: 'XP earned', value: `+${stats.weeklyXP}`, color: colors.accent },
            ].map((item, i) => (
              <View key={item.label} style={[
                styles.summaryItem,
                i === 0 ? { borderRightWidth: 1, borderRightColor: colors.border } : {},
              ]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>{item.value}</Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Assignments chart */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ASSIGNMENTS — LAST 7 DAYS</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.barChart}>
              {stats.completedPerDay.map((d, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barWrap}>
                    {d.count > 0 ? (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(d.count / stats.maxCompleted) * 100}%`,
                            backgroundColor: d.isToday ? colors.primary : colors.primary + '60',
                            borderRadius: 4,
                          },
                        ]}
                      />
                    ) : (
                      <View style={[styles.barEmpty, { backgroundColor: colors.muted }]} />
                    )}
                  </View>
                  <Text style={[styles.barLabel, { color: d.isToday ? colors.primary : colors.mutedForeground }]}>
                    {d.label}
                  </Text>
                  {d.count > 0 && (
                    <Text style={[styles.barValue, { color: colors.foreground }]}>{d.count}</Text>
                  )}
                </View>
              ))}
            </View>
            {stats.totalCompleted === 0 && (
              <Text style={[styles.chartEmpty, { color: colors.mutedForeground }]}>
                Complete assignments to see your progress here.
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Focus chart */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FOCUS TIME — LAST 7 DAYS</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.barChart}>
              {stats.focusPerDay.map((d, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barWrap}>
                    {d.minutes > 0 ? (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(d.minutes / stats.maxFocusMinutes) * 100}%`,
                            backgroundColor: d.isToday ? colors.secondary : colors.secondary + '70',
                            borderRadius: 4,
                          },
                        ]}
                      />
                    ) : (
                      <View style={[styles.barEmpty, { backgroundColor: colors.muted }]} />
                    )}
                  </View>
                  <Text style={[styles.barLabel, { color: d.isToday ? colors.secondary : colors.mutedForeground }]}>
                    {d.label}
                  </Text>
                  {d.minutes > 0 && (
                    <Text style={[styles.barValue, { color: colors.foreground }]}>{d.minutes}m</Text>
                  )}
                </View>
              ))}
            </View>
            {stats.totalFocusMinutes === 0 && (
              <Text style={[styles.chartEmpty, { color: colors.mutedForeground }]}>
                Use the Focus timer to track your study time.
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Subject breakdown */}
        {stats.subjectBreakdown.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUBJECT BREAKDOWN</Text>
            <View style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {stats.subjectBreakdown.map(([subject, count]) => {
                const pct = (count / totalSubjectCount) * 100;
                const subjectColor = getSubjectColor(subject);
                return (
                  <View key={subject} style={styles.subjectRow}>
                    <View style={styles.subjectMeta}>
                      <View style={[styles.subjectDot, { backgroundColor: subjectColor }]} />
                      <Text style={[styles.subjectName, { color: colors.foreground }]}>{subject}</Text>
                      <Text style={[styles.subjectCount, { color: colors.mutedForeground }]}>{count}</Text>
                    </View>
                    <View style={[styles.subjectBar, { backgroundColor: colors.muted }]}>
                      <View style={[styles.subjectFill, { width: `${pct}%`, backgroundColor: subjectColor }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* All-time totals */}
        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ALL TIME</Text>
          <View style={[styles.totalsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: 'checkmark-circle', label: 'Assignments done', value: stats.totalCompleted.toString(), color: colors.success },
              { icon: 'timer-outline', label: 'Total study time', value: formatMinutes(stats.totalFocusMinutes), color: colors.primary },
              { icon: 'star-outline', label: 'Total XP earned', value: stats.totalXPEarned.toString(), color: colors.accent },
              { icon: 'paw', label: 'Fox level', value: `Level ${foxLevelData.level}`, color: colors.secondary },
            ].map((item, i) => (
              <View
                key={item.label}
                style={[
                  styles.totalRow,
                  i < 3 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border } : {},
                ]}
              >
                <Ionicons name={item.icon as any} size={20} color={item.color} />
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.totalValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Best day */}
        {stats.bestDayLabel && (
          <Animated.View entering={FadeInDown.delay(260).springify()}>
            <View style={[styles.bestDayCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <Ionicons name="trophy" size={28} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bestDayTitle, { color: colors.foreground }]}>Most Productive Day</Text>
                <Text style={[styles.bestDayValue, { color: colors.primary }]}>{stats.bestDayLabel}</Text>
                <Text style={[styles.bestDayMinutes, { color: colors.mutedForeground }]}>
                  {formatMinutes(stats.bestDayFocusMinutes)} of focused study
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AdvancedStatsScreen() {
  return (
    <PremiumGate
      feature="advancedStats"
      title="Advanced Statistics"
      description="Deep insights into your study habits — weekly charts, subject breakdowns, focus trends, and your most productive days."
    >
      <StatsContent />
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  plusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  plusBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 20, gap: 14 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.1, marginBottom: 8 },
  summaryGrid: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  summaryItem: { flex: 1, padding: 20, alignItems: 'center', gap: 6 },
  summaryValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barWrap: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '80%' },
  barEmpty: { width: '80%', height: 4, borderRadius: 2 },
  barLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  barValue: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  chartEmpty: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 12, paddingBottom: 8 },
  subjectCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  subjectRow: { gap: 6 },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectDot: { width: 10, height: 10, borderRadius: 5 },
  subjectName: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  subjectCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  subjectBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  subjectFill: { height: '100%', borderRadius: 3 },
  totalsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  totalLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  totalValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  bestDayCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 18 },
  bestDayTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bestDayValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  bestDayMinutes: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
