import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFoxDen } from '@/context/FoxDenContext';
import { usePlan } from '@/context/PlanContext';
import { FoxCompanion } from '@/components/FoxCompanion';
import { XPBar } from '@/components/XPBar';
import { getFoxLevel, getXPForNextLevel, PERSONALITIES } from '@/constants/foxData';
import { FoxPersonality } from '@/types';

const ACHIEVEMENTS = [
  { id: 'first_trail', title: 'First Trail', description: 'Complete your first assignment', icon: 'trail-sign-outline', xpReq: 25 },
  { id: 'night_owl', title: 'Night Owl', description: 'Study after 8 PM', icon: 'moon-outline', xpReq: 10 },
  { id: 'big_game', title: 'Big Game Hunter', description: 'Complete a high-priority task', icon: 'flame-outline', xpReq: 40 },
  { id: 'trailblazer', title: 'Trailblazer', description: 'Earn 500 XP', icon: 'star-outline', xpReq: 500 },
  { id: 'comeback_fox', title: 'Comeback Fox', description: 'Return and complete work', icon: 'refresh-outline', xpReq: 50 },
  { id: 'den_keeper', title: 'Den Keeper', description: 'Reach Level 5', icon: 'home-outline', xpReq: 900 },
];

export default function DenScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fox, updateFoxName, updateFoxPersonality, assignments, focusSessions } = useFoxDen();
  const router = useRouter();
  const { plan } = usePlan();
  const isFoxPlus = plan === 'foxplus';
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(fox.name);

  const foxLevel = getFoxLevel(fox.xp);
  const xpProgress = getXPForNextLevel(fox.xp);
  const totalCompleted = assignments.filter((a) => a.status === 'completed').length;
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.minutes, 0);
  const webTop = Platform.OS === 'web' ? 67 : insets.top;

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateFoxName(nameInput.trim());
    }
    setEditingName(false);
  };

  const handlePersonality = (p: FoxPersonality) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateFoxPersonality(p);
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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>The Den</Text>
        <View style={[styles.coinBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="star" size={14} color={colors.accent} />
          <Text style={[styles.coinText, { color: colors.foreground }]}>{fox.coins} coins</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 84 : insets.bottom) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fox hero */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.foxHero}>
              <FoxCompanion size={160} animated />
              <View style={styles.foxInfo}>
                {editingName ? (
                  <View style={styles.nameEditRow}>
                    <TextInput
                      value={nameInput}
                      onChangeText={setNameInput}
                      style={[
                        styles.nameInput,
                        { color: colors.foreground, borderColor: colors.primary, backgroundColor: colors.surface },
                      ]}
                      maxLength={20}
                      autoFocus
                      onSubmitEditing={handleSaveName}
                      returnKeyType="done"
                    />
                    <TouchableOpacity onPress={handleSaveName} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => { setNameInput(fox.name); setEditingName(true); }} style={styles.nameRow}>
                    <Text style={[styles.foxName, { color: colors.foreground }]}>{fox.name}</Text>
                    <Ionicons name="pencil-outline" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
                <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.levelText, { color: colors.primary }]}>
                    Lv.{foxLevel.level} {foxLevel.title}
                  </Text>
                </View>
              </View>
            </View>
            <XPBar
              current={xpProgress.current}
              needed={xpProgress.needed}
              progress={xpProgress.progress}
              level={foxLevel.level}
              title={foxLevel.title}
            />
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>STATS</Text>
          <View style={[styles.statsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: 'Assignments', value: totalCompleted.toString(), icon: 'checkmark-circle-outline', color: colors.success },
              { label: 'Focus Time', value: `${totalFocusMinutes}m`, icon: 'timer-outline', color: colors.primary },
              { label: 'Total XP', value: fox.xp.toString(), icon: 'star-outline', color: colors.accent },
              { label: 'Coins', value: fox.coins.toString(), icon: 'ellipse-outline', color: colors.secondary },
            ].map((stat, i) => (
              <View
                key={stat.label}
                style={[
                  styles.statItem,
                  i % 2 === 0 ? { borderRightWidth: 1, borderRightColor: colors.border } : {},
                  i < 2 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {},
                ]}
              >
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Personality */}
        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FOX PERSONALITY</Text>
          <View style={[styles.personalityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.personalityHint, { color: colors.mutedForeground }]}>
              Changes how Ember talks to you
            </Text>
            <View style={styles.personalityRow}>
              {PERSONALITIES.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => handlePersonality(p.key)}
                  style={[
                    styles.personalityBtn,
                    {
                      backgroundColor: fox.personality === p.key ? colors.primary : colors.surface,
                      borderColor: fox.personality === p.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.personalityEmoji}>{p.emoji}</Text>
                  <Text
                    style={[
                      styles.personalityLabel,
                      { color: fox.personality === p.key ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* FoxPlus Section */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <View style={[styles.foxplusSection, { backgroundColor: isFoxPlus ? colors.primary + '0A' : colors.card, borderColor: isFoxPlus ? colors.primary + '40' : colors.border }]}>
            <View style={styles.foxplusSectionHeader}>
              <Ionicons name="diamond" size={16} color={isFoxPlus ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.foxplusSectionTitle, { color: isFoxPlus ? colors.primary : colors.mutedForeground }]}>
                {isFoxPlus ? 'FOXPLUS FEATURES' : 'FOXPLUS'}
              </Text>
              {!isFoxPlus && (
                <TouchableOpacity onPress={() => router.push('/foxplus')} style={[styles.upgradePill, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.upgradePillText, { color: colors.primaryForeground }]}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.foxplusBtns}>
              {[
                { icon: 'bar-chart-outline', label: 'Advanced Stats', route: '/advanced-stats' as const },
                { icon: 'calendar-outline', label: 'Study Planner', route: '/study-planner' as const },
                { icon: 'camera-outline', label: 'FoxScan', route: '/foxscan' as const },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(item.route); }}
                  style={[styles.foxplusBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  activeOpacity={0.75}
                >
                  <Ionicons name={item.icon as any} size={20} color={isFoxPlus ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.foxplusBtnLabel, { color: isFoxPlus ? colors.foreground : colors.mutedForeground }]}>{item.label}</Text>
                  {!isFoxPlus && <Ionicons name="lock-closed" size={12} color={colors.mutedForeground} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACHIEVEMENTS</Text>
          <View style={styles.achievementGrid}>
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = fox.xp >= ach.xpReq;
              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: unlocked ? colors.primary + '60' : colors.border,
                      opacity: unlocked ? 1 : 0.5,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      { backgroundColor: unlocked ? colors.primary + '20' : colors.muted },
                    ]}
                  >
                    <Ionicons
                      name={ach.icon as any}
                      size={22}
                      color={unlocked ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  <Text
                    style={[styles.achievementTitle, { color: unlocked ? colors.foreground : colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {ach.title}
                  </Text>
                  <Text style={[styles.achievementDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {ach.description}
                  </Text>
                  {!unlocked && (
                    <Text style={[styles.achievementReq, { color: colors.accent }]}>
                      {ach.xpReq} XP
                    </Text>
                  )}
                  {unlocked && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.achievementCheck} />
                  )}
                </View>
              );
            })}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  coinText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, gap: 12 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 20,
  },
  foxHero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  foxInfo: { flex: 1, gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foxName: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
  statsGrid: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statItem: {
    width: '50%',
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  personalityCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  personalityHint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  personalityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personalityBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personalityEmoji: { fontSize: 14 },
  personalityLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementItem: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    position: 'relative',
  },
  achievementIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  achievementDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  achievementReq: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  achievementCheck: { position: 'absolute', top: 10, right: 10 },
  foxplusSection: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  foxplusSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foxplusSectionTitle: { flex: 1, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.1 },
  upgradePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  upgradePillText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  foxplusBtns: { flexDirection: 'row', gap: 8 },
  foxplusBtn: { flex: 1, alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  foxplusBtnLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },
});
