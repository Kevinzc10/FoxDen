import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface Props {
  current: number;
  needed: number;
  progress: number; // 0 to 1
  level: number;
  title: string;
  compact?: boolean;
}

export function XPBar({ current, needed, progress, level, title, compact = false }: Props) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 800 });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as `${number}%`,
  }));

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.track, { backgroundColor: colors.muted, height: 6, borderRadius: 3 }]}>
          <Animated.View
            style={[
              styles.fill,
              animatedStyle,
              { backgroundColor: colors.accent, borderRadius: 3, height: 6 },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.level, { color: colors.mutedForeground }]}>Level {level}</Text>
        </View>
        <Text style={[styles.xpText, { color: colors.accent }]}>
          {current} / {needed} XP
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[styles.fill, animatedStyle, { backgroundColor: colors.accent }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  compactContainer: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  level: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  xpText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
