import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFoxDen } from '@/context/FoxDenContext';
import { SUBJECTS } from '@/constants/foxData';
import { Difficulty, Priority } from '@/types';

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: '#7A9E82' },
  { key: 'medium', label: 'Medium', color: '#F5C842' },
  { key: 'high', label: 'High', color: '#E8823A' },
];

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 1, label: 'Easy' },
  { key: 2, label: 'Medium' },
  { key: 3, label: 'Hard' },
  { key: 4, label: 'Very Hard' },
  { key: 5, label: 'Brutal' },
];

const TIME_OPTIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
];

export default function NewAssignmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addAssignment, getDialogue } = useFoxDen();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0].name);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const webTop = Platform.OS === 'web' ? 67 : insets.top;

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give your assignment a name first.');
      return;
    }
    if (!dueDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      Alert.alert('Invalid date', 'Enter date as YYYY-MM-DD (e.g. 2025-08-15).');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addAssignment({
      title: title.trim(),
      subject,
      description: description.trim(),
      dueDate: dueDate.trim(),
      dueTime: '',
      priority,
      estimatedMinutes,
      difficulty,
    });
    router.back();
  };

  const subjectColor = SUBJECTS.find((s) => s.name === subject)?.color ?? colors.primary;

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
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Assignment</Text>
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What's the assignment?"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            maxLength={100}
            autoFocus
          />
        </View>

        {/* Subject */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s.name}
                onPress={() => setSubject(s.name)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: subject === s.name ? s.color : colors.card,
                    borderColor: subject === s.name ? s.color : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: subject === s.name ? '#fff' : colors.mutedForeground },
                  ]}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Due date */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DUE DATE</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PRIORITY</Text>
          <View style={styles.segmentRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPriority(p.key)}
                style={[
                  styles.segment,
                  {
                    backgroundColor: priority === p.key ? p.color : colors.card,
                    borderColor: priority === p.key ? p.color : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: priority === p.key ? '#fff' : colors.mutedForeground },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimated time */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ESTIMATED TIME</Text>
          <View style={styles.timeRow}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setEstimatedMinutes(t.value)}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: estimatedMinutes === t.value ? colors.primary : colors.card,
                    borderColor: estimatedMinutes === t.value ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    { color: estimatedMinutes === t.value ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DIFFICULTY</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.key}
                onPress={() => setDifficulty(d.key)}
                style={[
                  styles.diffChip,
                  {
                    backgroundColor: difficulty === d.key ? colors.primary : colors.card,
                    borderColor: difficulty === d.key ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.diffText,
                    { color: difficulty === d.key ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description (optional) */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTES (OPTIONAL)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Any extra details..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              styles.multilineInput,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
            ]}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>
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
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  addBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20 },
  field: { gap: 10 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  timeChipText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  diffText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
