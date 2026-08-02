import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFoxDen } from '@/context/FoxDenContext';
import { ProgressRing } from '@/components/ProgressRing';
import { formatMinutes } from '@/constants/foxData';

type Mode = '25/5' | '50/10' | 'custom';
type Phase = 'idle' | 'focusing' | 'paused' | 'break' | 'complete';

const MODES: { key: Mode; label: string; focus: number; break: number }[] = [
  { key: '25/5', label: '25 / 5', focus: 25, break: 5 },
  { key: '50/10', label: '50 / 10', focus: 50, break: 10 },
  { key: 'custom', label: 'Custom', focus: 30, break: 5 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function FocusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { assignments, addFocusSession, focusSessions } = useFoxDen();

  const [mode, setMode] = useState<Mode>('25/5');
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [focusedSeconds, setFocusedSeconds] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusedRef = useRef(0);

  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  useEffect(() => {
    if (phase === 'focusing') {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.03, { duration: 1000 }), withTiming(0.98, { duration: 1000 })),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [phase, pulseScale]);

  const currentMode = MODES.find((m) => m.key === mode) ?? MODES[0];
  const progress = 1 - secondsLeft / totalSeconds;

  const pendingAssignments = assignments.filter(
    (a) => a.status !== 'completed'
  );

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const todayMinutes = focusSessions
    .filter((s) => s.date === new Date().toISOString().split('T')[0])
    .reduce((sum, s) => sum + s.minutes, 0);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStart = useCallback(() => {
    if (phase === 'idle' || phase === 'paused' || phase === 'complete') {
      if (phase === 'idle' || phase === 'complete') {
        const totalSecs = currentMode.focus * 60;
        setTotalSeconds(totalSecs);
        setSecondsLeft(totalSecs);
        focusedRef.current = 0;
        setFocusedSeconds(0);
      }
      setPhase('focusing');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopInterval();
            focusedRef.current += 1;
            setFocusedSeconds(focusedRef.current);
            // Save session
            const minutes = Math.floor(focusedRef.current / 60);
            if (minutes >= 1) {
              addFocusSession({ assignmentId: selectedAssignmentId, minutes });
            }
            setCompletedSessions((c) => c + 1);
            setPhase('break');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const breakSecs = currentMode.break * 60;
            setTotalSeconds(breakSecs);
            return breakSecs;
          }
          focusedRef.current += 1;
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'break') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopInterval();
            setPhase('idle');
            const focusSecs = currentMode.focus * 60;
            setTotalSeconds(focusSecs);
            return focusSecs;
          }
          return prev - 1;
        });
      }, 1000);
      setPhase('focusing');
    }
  }, [phase, currentMode, addFocusSession, selectedAssignmentId, stopInterval]);

  const handlePause = useCallback(() => {
    stopInterval();
    setPhase('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [stopInterval]);

  const handleStop = useCallback(() => {
    stopInterval();
    const minutes = Math.floor(focusedRef.current / 60);
    if (minutes >= 1) {
      addFocusSession({ assignmentId: selectedAssignmentId, minutes });
    }
    focusedRef.current = 0;
    setFocusedSeconds(0);
    setPhase('idle');
    const totalSecs = currentMode.focus * 60;
    setTotalSeconds(totalSecs);
    setSecondsLeft(totalSecs);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [stopInterval, addFocusSession, selectedAssignmentId, currentMode]);

  useEffect(() => () => stopInterval(), [stopInterval]);

  const handleModeChange = (m: Mode) => {
    if (phase !== 'idle') return;
    setMode(m);
    const found = MODES.find((x) => x.key === m);
    if (found) {
      const secs = found.focus * 60;
      setTotalSeconds(secs);
      setSecondsLeft(secs);
    }
  };

  const webTop = Platform.OS === 'web' ? 67 : insets.top;

  const phaseLabel = phase === 'break' ? 'Take a Break' : phase === 'focusing' ? 'Stay Focused' : phase === 'paused' ? 'Paused' : phase === 'complete' ? 'Session Complete' : 'Ready';
  const foxMessage = phase === 'break' ? 'Rest. You earned it.' : phase === 'focusing' ? 'The trail is warmer.' : phase === 'paused' ? 'Trail on hold.' : 'Ready when you are.';

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Focus</Text>
        <View style={[styles.statsBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="timer-outline" size={14} color={colors.primary} />
          <Text style={[styles.statsText, { color: colors.foreground }]}>{todayMinutes}m today</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 84 : insets.bottom) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode selector */}
        {phase === 'idle' && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.modeRow}>
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => handleModeChange(m.key)}
                  style={[
                    styles.modeTab,
                    {
                      backgroundColor: mode === m.key ? colors.primary : colors.card,
                      borderColor: mode === m.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      { color: mode === m.key ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Assignment selector */}
        {phase === 'idle' && (
          <Animated.View entering={FadeInDown.delay(140).springify()}>
            <View style={[styles.assignmentPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Working on</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity
                  onPress={() => setSelectedAssignmentId('')}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: !selectedAssignmentId ? colors.primary : colors.surface,
                      borderColor: !selectedAssignmentId ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: !selectedAssignmentId ? colors.primaryForeground : colors.mutedForeground }]}>
                    Free study
                  </Text>
                </TouchableOpacity>
                {pendingAssignments.slice(0, 8).map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setSelectedAssignmentId(a.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedAssignmentId === a.id ? colors.primary : colors.surface,
                        borderColor: selectedAssignmentId === a.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selectedAssignmentId === a.id ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {a.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {/* Timer */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.timerArea}>
          <Animated.View style={pulseStyle}>
            <ProgressRing
              progress={progress}
              size={240}
              strokeWidth={14}
              color={phase === 'break' ? colors.success : colors.primary}
              trackColor={colors.muted}
            >
              <View style={styles.timerInner}>
                <Text style={[styles.phaseLabel, { color: colors.mutedForeground }]}>{phaseLabel}</Text>
                <Text style={[styles.timerText, { color: colors.foreground }]}>{formatTime(secondsLeft)}</Text>
                {selectedAssignment && phase !== 'idle' && (
                  <Text style={[styles.assignmentLabel, { color: colors.primary }]} numberOfLines={1}>
                    {selectedAssignment.title}
                  </Text>
                )}
              </View>
            </ProgressRing>
          </Animated.View>
          <Text style={[styles.foxMessage, { color: colors.mutedForeground }]}>{foxMessage}</Text>
        </Animated.View>

        {/* Controls */}
        <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.controls}>
          {phase === 'idle' || phase === 'complete' ? (
            <TouchableOpacity
              style={[styles.primaryControl, { backgroundColor: colors.primary }]}
              onPress={handleStart}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={24} color={colors.primaryForeground} />
              <Text style={[styles.controlText, { color: colors.primaryForeground }]}>Start Session</Text>
            </TouchableOpacity>
          ) : phase === 'paused' ? (
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={[styles.secondaryControl, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleStop}
              >
                <Ionicons name="stop" size={22} color={colors.destructive} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryControl, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={22} color={colors.primaryForeground} />
                <Text style={[styles.controlText, { color: colors.primaryForeground }]}>Resume</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={[styles.secondaryControl, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleStop}
              >
                <Ionicons name="stop" size={22} color={colors.destructive} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryControl, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handlePause}
                activeOpacity={0.85}
              >
                <Ionicons name="pause" size={22} color={colors.primaryForeground} />
                <Text style={[styles.controlText, { color: colors.primaryForeground }]}>Pause</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Session stats */}
        {completedSessions > 0 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={[styles.sessionStats, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sessionStatItem}>
                <Text style={[styles.sessionStatValue, { color: colors.primary }]}>{completedSessions}</Text>
                <Text style={[styles.sessionStatLabel, { color: colors.mutedForeground }]}>sessions</Text>
              </View>
              <View style={[styles.sessionDivider, { backgroundColor: colors.border }]} />
              <View style={styles.sessionStatItem}>
                <Text style={[styles.sessionStatValue, { color: colors.accent }]}>{Math.floor(focusedSeconds / 60)}m</Text>
                <Text style={[styles.sessionStatLabel, { color: colors.mutedForeground }]}>focused</Text>
              </View>
              <View style={[styles.sessionDivider, { backgroundColor: colors.border }]} />
              <View style={styles.sessionStatItem}>
                <Text style={[styles.sessionStatValue, { color: colors.success }]}>
                  +{Math.floor(focusedSeconds / 60 / 5) * 10} XP
                </Text>
                <Text style={[styles.sessionStatLabel, { color: colors.mutedForeground }]}>earned</Text>
              </View>
            </View>
          </Animated.View>
        )}
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
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statsText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, gap: 20, alignItems: 'stretch' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  assignmentPicker: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  pickerLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    maxWidth: 180,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  timerArea: { alignItems: 'center', gap: 16 },
  timerInner: { alignItems: 'center', gap: 6, paddingHorizontal: 20 },
  phaseLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  timerText: { fontSize: 52, fontFamily: 'Inter_700Bold', letterSpacing: -2 },
  assignmentLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  foxMessage: { fontSize: 14, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  controls: { gap: 10 },
  controlRow: { flexDirection: 'row', gap: 10 },
  primaryControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryControl: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  controlText: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  sessionStats: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-around',
  },
  sessionStatItem: { alignItems: 'center', gap: 4 },
  sessionStatValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  sessionStatLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sessionDivider: { width: 1, height: '100%' },
});
