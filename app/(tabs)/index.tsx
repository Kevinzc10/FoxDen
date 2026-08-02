import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFoxDen } from '@/context/FoxDenContext';
import { usePlan } from '@/context/PlanContext';
import { FoxCompanion } from '@/components/FoxCompanion';
import { AssignmentCard } from '@/components/AssignmentCard';
import { ProgressRing } from '@/components/ProgressRing';
import { XPBar } from '@/components/XPBar';
import { getFoxLevel, getXPForNextLevel, formatMinutes, todayString } from '@/constants/foxData';
import { Assignment } from '@/types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fox, assignments, completeAssignment, getTodayStats, getNextRecommendedAssignment, getDialogue, dailyHunt } = useFoxDen();
  const { plan } = usePlan();

  const [dialogue, setDialogue] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const stats = getTodayStats();
  const next = getNextRecommendedAssignment();
  const foxLevel = getFoxLevel(fox.xp);
  const xpProgress = getXPForNextLevel(fox.xp);

  const upcoming = assignments
    .filter((a) => a.status !== 'completed' && a.status !== 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const overdue = assignments.filter((a) => a.status === 'overdue').slice(0, 3);

  const totalPending = assignments.filter(
    (a) => a.status === 'not_started' || a.status === 'in_progress' || a.status === 'overdue'
  ).length;

  const todayTotal = stats.completed + totalPending;
  const ringProgress = todayTotal > 0 ? stats.completed / todayTotal : 0;

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  useEffect(() => {
    const sit = stats.remaining === 0 && todayTotal > 0 ? 'all_done' : 'greeting';
    setDialogue(getDialogue(sit));
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setDialogue(getDialogue('greeting'));
    setTimeout(() => setRefreshing(false), 600);
  }, [getDialogue]);

  const handleFAB = () => {
    fabScale.value = withSpring(0.9, {}, () => { fabScale.value = withSpring(1); });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/new-assignment');
  };

  const handleComplete = (a: Assignment) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeAssignment(a.id);
  };

  const webTop = Platform.OS === 'web' ? 67 : insets.top;

  const huntObjectivesComplete = dailyHunt?.objectives.filter((o) => o.current >= o.target).length ?? 0;
  const huntTotal = dailyHunt?.objectives.length ?? 0;

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
        <View style={styles.headerLeft}>
          <FoxCompanion size={48} animated />
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {getGreeting()}, {fox.name}
            </Text>
            <Text style={[styles.levelBadge, { color: colors.primary }]}>{foxLevel.title}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/foxscan')}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="camera-outline" size={18} color={plan === 'foxplus' ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.coinBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={[styles.coinText, { color: colors.foreground }]}>{fox.coins}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 84 : insets.bottom) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Fox quote */}
        {dialogue ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
              <Text style={[styles.quoteText, { color: colors.mutedForeground }]} numberOfLines={2}>
                {dialogue}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Today's Trail */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TODAY'S TRAIL</Text>
                <Text style={[styles.trailCount, { color: colors.foreground }]}>
                  {stats.completed} of {Math.max(todayTotal, stats.completed)} complete
                </Text>
              </View>
              <ProgressRing
                progress={ringProgress}
                size={72}
                strokeWidth={8}
                color={colors.primary}
                trackColor={colors.muted}
              >
                <Text style={[styles.ringText, { color: colors.foreground }]}>
                  {Math.round(ringProgress * 100)}%
                </Text>
              </ProgressRing>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="timer-outline" size={16} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.studyMinutes}m</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>studied</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons name="star-outline" size={16} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>+{stats.xpEarned}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>XP today</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons name="compass-outline" size={16} color={colors.secondary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{huntObjectivesComplete}/{huntTotal}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>hunt</Text>
              </View>
            </View>
            <XPBar
              current={xpProgress.current}
              needed={xpProgress.needed}
              progress={xpProgress.progress}
              level={foxLevel.level}
              title={foxLevel.title}
              compact
            />
          </View>
        </Animated.View>

        {/* Next on the Trail */}
        {next && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NEXT ON THE TRAIL</Text>
            <View style={[styles.nextCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
              <View style={styles.nextContent}>
                <View style={[styles.nextIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="trail-sign" size={18} color="#fff" />
                </View>
                <View style={styles.nextText}>
                  <Text style={[styles.nextTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {next.title}
                  </Text>
                  <Text style={[styles.nextMeta, { color: colors.mutedForeground }]}>
                    {next.subject} · {formatMinutes(next.estimatedMinutes)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: '/assignment-detail', params: { id: next.id } })}
                activeOpacity={0.8}
              >
                <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>Start</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.destructive }]}>OVERDUE</Text>
            {overdue.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onPress={() => router.push({ pathname: '/assignment-detail', params: { id: a.id } })}
                onComplete={() => handleComplete(a)}
                compact
              />
            ))}
          </Animated.View>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>UPCOMING</Text>
            {upcoming.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onPress={() => router.push({ pathname: '/assignment-detail', params: { id: a.id } })}
                onComplete={() => handleComplete(a)}
                compact
              />
            ))}
          </Animated.View>
        )}

        {/* Empty state */}
        {assignments.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="leaf-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>The trail is quiet.</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Add your first assignment to begin.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/new-assignment')}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Add Assignment</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* FAB */}
      <Animated.View
        style={[
          styles.fab,
          fabStyle,
          { bottom: (Platform.OS === 'web' ? 84 : insets.bottom) + 16 },
        ]}
      >
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.primary }]}
          onPress={handleFAB}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={colors.primaryForeground} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  levelBadge: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 2 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  coinText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12 },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  quoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  trailCount: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 4 },
  ringText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, height: 30 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginTop: 8, marginBottom: 4 },
  nextCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  nextContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nextText: { flex: 1 },
  nextTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  nextMeta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 3 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  startBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  fab: { position: 'absolute', right: 20 },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
