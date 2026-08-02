import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Subtask } from '@/types';

interface Props {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
}

export function SubtaskRow({ subtask, onToggle, onDelete }: Props) {
  const colors = useColors();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={handleToggle} style={styles.checkArea} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: subtask.completed ? colors.success : colors.border,
              backgroundColor: subtask.completed ? colors.success : 'transparent',
            },
          ]}
        >
          {subtask.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>
      </TouchableOpacity>
      <Text
        style={[
          styles.title,
          {
            color: subtask.completed ? colors.mutedForeground : colors.foreground,
            textDecorationLine: subtask.completed ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={2}
      >
        {subtask.title}
      </Text>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.deleteBtn}
      >
        <Ionicons name="close" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  checkArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 2,
  },
});
