import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { HuntObjective } from '@/types';

interface Props {
  objective: HuntObjective;
}

const ICONS: Record<HuntObjective['type'], string> = {
  complete_assignments: 'checkmark-circle-outline',
  focus_minutes: 'timer-outline',
  complete_priority: 'flame-outline',
  complete_subtasks: 'list-outline',
};

export function HuntObjectiveCard({ objective }: Props) {
  const colors = useColors();
  const isComplete = objective.current >= objective.target;
  const progress = Math.min(objective.current / objective.target, 1);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isComplete ? colors.success : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: isComplete ? colors.success + '20' : colors.primary + '20' },
        ]}
      >
        <Ionicons
          name={ICONS[objective.type] as any}
          size={22}
          color={isComplete ? colors.success : colors.primary}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: isComplete ? colors.success : colors.foreground,
                textDecorationLine: isComplete ? 'line-through' : 'none',
              },
            ]}
          >
            {objective.title}
          </Text>
          <Text style={[styles.xpBadge, { color: colors.accent }]}>+{objective.xpReward} XP</Text>
        </View>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {objective.description}
        </Text>
        <View style={styles.progressRow}>
          <View style={[styles.track, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: isComplete ? colors.success : colors.primary,
                  width: `${progress * 100}%` as `${number}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {objective.current}/{objective.target}
          </Text>
        </View>
      </View>
      {isComplete && (
        <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    marginRight: 8,
  },
  xpBadge: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  description: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
