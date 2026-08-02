/**
 * AI Study Planner — FoxPlus exclusive.
 * Generates a day-by-day study schedule based on subject, test date,
 * topics, and available daily study time.
 *
 * Free users see the PremiumGate paywall.
 * FoxPlus users get a fully functional planner.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { usePlan } from '@/context/PlanContext';
import { PremiumGate } from '@/components/PremiumGate';
import { useFoxDen } from '@/context/FoxDenContext';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : 'http://localhost:8080/api';

const STORAGE_KEY = 'foxden_study_plans_v1';

interface StudyDay {
  date: string;      // 'YYYY-MM-DD'
  label: string;     // 'Monday, Jan 6'
  tasks: string[];
  completed: boolean;
}

interface StudyPlan {
  id: string;
  subject: string;
  testDate: string;
  createdAt: string;
  days: StudyDay[];
}

const HOUR_OPTIONS = ['30m', '1h', '1.5h', '2h', '3h'];
const HOUR_VALUES: Record<string, number> = { '30m': 0.5, '1h': 1, '1.5h': 1.5, '2h': 2, '3h': 3 };

function PlannerContent() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { assignments } = useFoxDen();

  // Form state
  const [subject, setSubject] = useState('');
  const [testDate, setTestDate] = useState('');
  const [topics, setTopics] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('1h');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plans
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setPlans(JSON.parse(raw));
    });
  }, []);

  const savePlans = async (updated: StudyPlan[]) => {
    setPlans(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const minTestDate = new Date();
  minTestDate.setDate(minTestDate.getDate() + 1);
  const minDateStr = minTestDate.toISOString().split('T')[0];

  const handleGenerate = async () => {
    const trimmedSubject = subject.trim();
    const trimmedTopics = topics.trim();
    if (!trimmedSubject) { setError('Please enter a subject.'); return; }
    if (!testDate) { setError('Please enter your test date.'); return; }
    if (testDate < minDateStr) { setError('Test date must be in the future.'); return; }

    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      // Build context from existing assignments
      const activeAssignments = assignments
        .filter((a) => a.status !== 'completed')
        .slice(0, 5)
        .map((a) => `${a.title} (${a.subject}, due ${a.dueDate})`);

      const res = await fetch(`${API_BASE}/study-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: trimmedSubject,
          testDate,
          topics: trimmedTopics || undefined,
          hoursPerDay: HOUR_VALUES[hoursPerDay],
          existingAssignments: activeAssignments,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const newPlan: StudyPlan = {
        id: Date.now().toString(),
        subject: trimmedSubject,
        testDate,
        createdAt: new Date().toISOString(),
        days: data.plan,
      };

      const updated = [newPlan, ...plans].slice(0, 10); // keep last 10 plans
      await savePlans(updated);
      setSelectedPlan(newPlan);
      setSubject('');
      setTopics('');
      setTestDate('');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e: any) {
      if (e.name === 'TimeoutError') {
        setError('Generation took too long. Please try again.');
      } else {
        setError(e.message ?? 'Could not generate study plan. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const toggleDayComplete = async (planId: string, dayIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const days = p.days.map((d, i) =>
        i === dayIndex ? { ...d, completed: !d.completed } : d,
      );
      return { ...p, days };
    });
    await savePlans(updated);
    if (selectedPlan?.id === planId) {
      setSelectedPlan(updated.find((p) => p.id === planId) ?? null);
    }
  };

  const deletePlan = async (planId: string) => {
    const updated = plans.filter((p) => p.id !== planId);
    await savePlans(updated);
    if (selectedPlan?.id === planId) setSelectedPlan(null);
  };

  const webTop = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: webTop + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Study Planner</Text>
          <View style={[styles.plusBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
            <Ionicons name="diamond" size={11} color={colors.primary} />
            <Text style={[styles.plusBadgeText, { color: colors.primary }]}>FoxPlus</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Active plan */}
        {selectedPlan && (
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.primary + '40' }]}>
              <View style={styles.planCardHeader}>
                <View>
                  <Text style={[styles.planCardSubject, { color: colors.primary }]}>{selectedPlan.subject}</Text>
                  <Text style={[styles.planCardDate, { color: colors.mutedForeground }]}>
                    Test on {formatDate(selectedPlan.testDate)}
                  </Text>
                </View>
                <View style={styles.planCardActions}>
                  <TouchableOpacity onPress={() => setSelectedPlan(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress */}
              {(() => {
                const done = selectedPlan.days.filter((d) => d.completed).length;
                const total = selectedPlan.days.length;
                return (
                  <View style={styles.progressWrap}>
                    <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${total > 0 ? (done / total) * 100 : 0}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.mutedForeground }]}>{done}/{total} sessions done</Text>
                  </View>
                );
              })()}

              {/* Days */}
              {selectedPlan.days.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleDayComplete(selectedPlan.id, i)}
                  style={[
                    styles.dayRow,
                    {
                      backgroundColor: day.completed ? colors.primary + '10' : colors.background,
                      borderColor: day.completed ? colors.primary + '40' : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dayCheck, { backgroundColor: day.completed ? colors.primary : colors.muted }]}>
                    {day.completed && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
                  </View>
                  <View style={styles.dayContent}>
                    <Text style={[styles.dayLabel, { color: day.completed ? colors.mutedForeground : colors.foreground }]}>
                      {day.label}
                    </Text>
                    {day.tasks.map((t, ti) => (
                      <Text key={ti} style={[styles.dayTask, { color: colors.mutedForeground }]}>• {t}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => deletePlan(selectedPlan.id)}
                style={[styles.deletePlanBtn, { borderColor: colors.destructive + '40' }]}
              >
                <Ionicons name="trash-outline" size={15} color={colors.destructive} />
                <Text style={[styles.deletePlanText, { color: colors.destructive }]}>Delete plan</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Previous plans */}
        {plans.filter((p) => p.id !== selectedPlan?.id).length > 0 && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PREVIOUS PLANS</Text>
            <View style={styles.prevPlans}>
              {plans
                .filter((p) => p.id !== selectedPlan?.id)
                .map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedPlan(p)}
                    style={[styles.prevPlanItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View>
                      <Text style={[styles.prevPlanSubject, { color: colors.foreground }]}>{p.subject}</Text>
                      <Text style={[styles.prevPlanDate, { color: colors.mutedForeground }]}>Test: {formatDate(p.testDate)}</Text>
                    </View>
                    <View style={styles.prevPlanRight}>
                      <Text style={[styles.prevPlanProgress, { color: colors.primary }]}>
                        {p.days.filter((d) => d.completed).length}/{p.days.length}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </Animated.View>
        )}

        {/* New plan form */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NEW STUDY PLAN</Text>
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Subject */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Subject</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Biology, Algebra II"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              />
            </View>

            {/* Test date */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Test Date</Text>
              <TextInput
                value={testDate}
                onChangeText={setTestDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Topics */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Topics / Chapters <Text style={[styles.optional, { color: colors.mutedForeground }]}>(optional)</Text></Text>
              <TextInput
                value={topics}
                onChangeText={setTopics}
                placeholder="e.g. Chapter 1-4, photosynthesis, cell division"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.inputMulti, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Hours per day */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Study time per day</Text>
              <View style={styles.hourChips}>
                {HOUR_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setHoursPerDay(h)}
                    style={[
                      styles.hourChip,
                      {
                        backgroundColor: hoursPerDay === h ? colors.primary : colors.background,
                        borderColor: hoursPerDay === h ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.hourChipText, { color: hoursPerDay === h ? colors.primaryForeground : colors.foreground }]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {error && (
              <View style={[styles.errorRow, { backgroundColor: colors.destructive + '15' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: colors.primary, opacity: generating ? 0.7 : 1 }]}
              onPress={handleGenerate}
              disabled={generating}
              activeOpacity={0.85}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Ionicons name="calendar" size={18} color={colors.primaryForeground} />
              )}
              <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
                {generating ? 'Generating plan…' : 'Generate Study Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function StudyPlannerScreen() {
  return (
    <PremiumGate
      feature="studyPlanner"
      title="AI Study Planner"
      description="Let your fox build a personalised study schedule around your test date, topics, and existing assignments."
    >
      <PlannerContent />
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
  planCard: { borderRadius: 16, borderWidth: 1.5, padding: 18, gap: 14 },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planCardSubject: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  planCardDate: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  planCardActions: { flexDirection: 'row', gap: 12 },
  progressWrap: { gap: 6 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  dayCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  dayContent: { flex: 1, gap: 4 },
  dayLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  dayTask: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  deletePlanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  deletePlanText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  prevPlans: { gap: 8 },
  prevPlanItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, padding: 14 },
  prevPlanSubject: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  prevPlanDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  prevPlanRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prevPlanProgress: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 16 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  optional: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  hourChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  hourChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8 },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 28 },
  generateBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
