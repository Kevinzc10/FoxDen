import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Assignment } from '@/types';
import { formatDueDate, formatMinutes, getSubjectColor } from '@/constants/foxData';

interface Props {
  assignment: Assignment;
  onPress: () => void;
  onComplete?: () => void;
  compact?: boolean;
}

const PRIORITY_COLORS = { low: '#7A9E82', medium: '#F5C842', high: '#E8823A' };

export function AssignmentCard({ assignment, onPress, onComplete, compact = false }: Props) {
  const colors = useColors();
  const subjectColor = getSubjectColor(assignment.subject);
  const priorityColor = PRIORITY_COLORS[assignment.priority];
  const isCompleted = assignment.status === 'completed';
  const isOverdueStatus = assignment.status === 'overdue';

  const completedSubtasks = assignment.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = assignment.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isOverdueStatus ? colors.destructive : colors.border,
          opacity: isCompleted ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.subjectBar, { backgroundColor: subjectColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleArea}>
            <Text
              style={[
                styles.title,
                { color: colors.foreground, textDecorationLine: isCompleted ? 'line-through' : 'none' },
              ]}
              numberOfLines={compact ? 1 : 2}
            >
              {assignment.title}
            </Text>
            <Text style={[styles.subject, { color: subjectColor }]}>{assignment.subject}</Text>
          </View>
          {onComplete && !isCompleted && (
            <TouchableOpacity
              onPress={onComplete}
              style={[styles.completeBtn, { borderColor: colors.border }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="checkmark" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {isCompleted && (
            <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          )}
        </View>

        {!compact && (
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={[styles.badgeText, { color: priorityColor }]}>
                {assignment.priority}
              </Text>
            </View>
            <View style={[styles.metaItem]}>
              <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatMinutes(assignment.estimatedMinutes)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdueStatus ? colors.destructive : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.metaText,
                  { color: isOverdueStatus ? colors.destructive : colors.mutedForeground },
                ]}
              >
                {formatDueDate(assignment.dueDate)}
              </Text>
            </View>
          </View>
        )}

        {compact && (
          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={11}
              color={isOverdueStatus ? colors.destructive : colors.mutedForeground}
            />
            <Text
              style={[
                styles.metaText,
                { color: isOverdueStatus ? colors.destructive : colors.mutedForeground },
              ]}
            >
              {formatDueDate(assignment.dueDate)}
            </Text>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              · {formatMinutes(assignment.estimatedMinutes)}
            </Text>
          </View>
        )}

        {totalSubtasks > 0 && !compact && (
          <View style={styles.subtaskRow}>
            <View style={[styles.subtaskTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.subtaskFill,
                  { backgroundColor: colors.primary, width: `${subtaskProgress * 100}%` as `${number}%` },
                ]}
              />
            </View>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {completedSubtasks}/{totalSubtasks} steps
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  subjectBar: {
    width: 4,
    minHeight: 70,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleArea: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  subject: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  completeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  completedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtaskFill: {
    height: '100%',
    borderRadius: 2,
  },
});
