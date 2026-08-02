import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFoxDen } from '@/context/FoxDenContext';
import { SubtaskRow } from '@/components/SubtaskRow';
import {
  formatDueDate,
  formatMinutes,
  getDifficultyLabel,
  getPriorityLabel,
  getSubjectColor,
} from '@/constants/foxData';

const STUCK_OPTIONS = [
  { id: 'dont_understand', label: "I don't understand the question", icon: 'help-circle-outline' },
  { id: 'dont_know_start', label: "I don't know where to start", icon: 'map-outline' },
  { id: 'too_big', label: 'This assignment is too big', icon: 'resize-outline' },
  { id: 'procrastinating', label: 'I keep procrastinating', icon: 'time-outline' },
  { id: 'need_plan', label: 'I need a study plan', icon: 'list-outline' },
];

const STUCK_TIPS: Record<string, string[]> = {
  dont_understand: [
    "Read the question twice, slowly. Underline key words.",
    "Look up any terms you don't recognize.",
    "Try explaining it in your own words — that usually reveals what you know.",
    "Check your notes or textbook for similar examples.",
  ],
  dont_know_start: [
    "Write down everything you already know about this topic.",
    "Break it into the smallest possible first step — just open the document.",
    "Start in the middle if the beginning feels stuck.",
    "Ask: what would I need to do first if I had to finish this in 10 minutes?",
  ],
  too_big: [
    "Break it into 5 smaller steps. Add them as subtasks.",
    "Focus only on the first step. Ignore the rest for now.",
    "Set a timer for 10 minutes — just work on it for 10 minutes.",
    "Finishing 20% today is better than finishing 0% because it felt overwhelming.",
  ],
  procrastinating: [
    "Start with just 2 minutes. Anyone can do 2 minutes.",
    "Remove distractions — phone in another room, close social media.",
    "Tell yourself you only have to START, not finish.",
    "The fox is watching. Kindly.",
  ],
  need_plan: [
    "List every step the assignment needs.",
    "Estimate how long each step takes.",
    "Schedule the hardest parts when you have the most energy.",
    "Add each step as a subtask in FoxDen and tackle one at a time.",
  ],
};

export default function AssignmentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assignments, completeAssignment, deleteAssignment, addSubtask, toggleSubtask, deleteSubtask } = useFoxDen();

  const [newSubtask, setNewSubtask] = useState('');
  const [showStuck, setShowStuck] = useState(false);
  const [stuckChoice, setStuckChoice] = useState('');

  const assignment = assignments.find((a) => a.id === id);
  const webTop = Platform.OS === 'web' ? 67 : insets.top;

  if (!assignment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: webTop + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Assignment not found</Text>
        </View>
      </View>
    );
  }

  const subjectColor = getSubjectColor(assignment.subject);
  const isCompleted = assignment.status === 'completed';
  const isOverdue = assignment.status === 'overdue';

  const completedSubtasks = assignment.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = assignment.subtasks.length > 0 ? completedSubtasks / assignment.subtasks.length : 0;

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeAssignment(assignment.id);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Assignment', 'Are you sure you want to delete this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAssignment(assignment.id);
          router.back();
        },
      },
    ]);
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask(assignment.id, newSubtask.trim());
      setNewSubtask('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStuck = (choice: string) => {
    setStuckChoice(choice);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const tips = stuckChoice ? STUCK_TIPS[stuckChoice] : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: webTop + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerSubject, { color: subjectColor }]}>{assignment.subject}</Text>
        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={22} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title & status */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.foreground }]}>{assignment.title}</Text>
            <View style={styles.statusRow}>
              {isOverdue && (
                <View style={[styles.statusBadge, { backgroundColor: colors.destructive + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.destructive }]}>Overdue</Text>
                </View>
              )}
              {isCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.statusText, { color: colors.success }]}>Completed</Text>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: subjectColor + '20' }]}>
                <Text style={[styles.statusText, { color: subjectColor }]}>{assignment.subject}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Meta */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Due</Text>
                  <Text style={[styles.metaValue, { color: isOverdue ? colors.destructive : colors.foreground }]}>
                    {formatDueDate(assignment.dueDate)}
                  </Text>
                </View>
              </View>
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Time</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {formatMinutes(assignment.estimatedMinutes)}
                  </Text>
                </View>
              </View>
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Priority</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {getPriorityLabel(assignment.priority)}
                  </Text>
                </View>
              </View>
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metaItem}>
                <Ionicons name="barbell-outline" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Level</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {getDifficultyLabel(assignment.difficulty)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Description */}
        {assignment.description ? (
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NOTES</Text>
              <Text style={[styles.descText, { color: colors.foreground }]}>{assignment.description}</Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Subtasks */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.subtaskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subtaskHeader}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>STEPS</Text>
              {assignment.subtasks.length > 0 && (
                <Text style={[styles.subtaskCount, { color: colors.primary }]}>
                  {completedSubtasks}/{assignment.subtasks.length}
                </Text>
              )}
            </View>
            {assignment.subtasks.length > 0 && (
              <View style={[styles.subtaskProgress, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.subtaskFill,
                    { backgroundColor: colors.primary, width: `${subtaskProgress * 100}%` as `${number}%` },
                  ]}
                />
              </View>
            )}
            {assignment.subtasks.map((subtask) => (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                onToggle={() => toggleSubtask(assignment.id, subtask.id)}
                onDelete={() => deleteSubtask(assignment.id, subtask.id)}
              />
            ))}
            {!isCompleted && (
              <View style={[styles.addSubtaskRow, { borderColor: colors.border }]}>
                <TextInput
                  value={newSubtask}
                  onChangeText={setNewSubtask}
                  placeholder="Add a step..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.subtaskInput, { color: colors.foreground }]}
                  onSubmitEditing={handleAddSubtask}
                  returnKeyType="done"
                  maxLength={100}
                />
                <TouchableOpacity
                  onPress={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  style={[
                    styles.addSubtaskBtn,
                    { backgroundColor: newSubtask.trim() ? colors.primary : colors.muted },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={newSubtask.trim() ? colors.primaryForeground : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* I'm Stuck */}
        {!isCompleted && (
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <TouchableOpacity
              onPress={() => { setShowStuck(!showStuck); setStuckChoice(''); }}
              style={[
                styles.stuckBtn,
                {
                  backgroundColor: showStuck ? colors.accent + '20' : colors.card,
                  borderColor: showStuck ? colors.accent : colors.border,
                },
              ]}
            >
              <Ionicons name="help-buoy-outline" size={20} color={showStuck ? colors.accent : colors.primary} />
              <Text style={[styles.stuckBtnText, { color: showStuck ? colors.accent : colors.primary }]}>
                {showStuck ? 'Hide help' : "I'm Stuck"}
              </Text>
            </TouchableOpacity>

            {showStuck && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={[styles.stuckCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.stuckTitle, { color: colors.foreground }]}>What's the problem?</Text>
                  {STUCK_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleStuck(opt.id)}
                      style={[
                        styles.stuckOption,
                        {
                          backgroundColor: stuckChoice === opt.id ? colors.primary + '15' : 'transparent',
                          borderColor: stuckChoice === opt.id ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={18}
                        color={stuckChoice === opt.id ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.stuckOptionText,
                          { color: stuckChoice === opt.id ? colors.primary : colors.foreground },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {tips.length > 0 && (
                    <View style={[styles.tipsBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                      <Text style={[styles.tipsTitle, { color: colors.primary }]}>The fox suggests:</Text>
                      {tips.map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                          <Ionicons name="arrow-forward-outline" size={14} color={colors.primary} />
                          <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Complete button */}
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: colors.success }]}
            onPress={handleComplete}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={[styles.completeBtnText, { color: '#fff' }]}>Mark Complete</Text>
          </TouchableOpacity>
        )}
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
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSubject: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  content: { padding: 20, gap: 14 },
  titleSection: { gap: 10 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 28 },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  metaCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  metaValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  metaDivider: { width: 1, height: '100%' },
  descCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  descText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  subtaskCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  subtaskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subtaskCount: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  subtaskProgress: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  subtaskFill: { height: '100%', borderRadius: 2 },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 8,
    gap: 10,
  },
  subtaskInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 4 },
  addSubtaskBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stuckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  stuckBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  stuckCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  stuckTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  stuckOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  stuckOptionText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  tipsBox: { borderRadius: 10, borderWidth: 1, padding: 14, gap: 10, marginTop: 4 },
  tipsTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  completeBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold' },
});
