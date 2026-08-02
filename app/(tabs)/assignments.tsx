import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFoxDen } from '@/context/FoxDenContext';
import { AssignmentCard } from '@/components/AssignmentCard';
import { Assignment } from '@/types';

type Filter = 'all' | 'active' | 'today' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'today', label: 'Due Today' },
  { key: 'completed', label: 'Done' },
];

export default function AssignmentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { assignments, completeAssignment, deleteAssignment } = useFoxDen();
  const [filter, setFilter] = useState<Filter>('active');

  const today = new Date().toISOString().split('T')[0];

  const filtered = assignments.filter((a) => {
    switch (filter) {
      case 'all':
        return true;
      case 'active':
        return a.status !== 'completed';
      case 'today':
        return a.dueDate === today && a.status !== 'completed';
      case 'completed':
        return a.status === 'completed';
    }
  }).sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
    const pw = { high: 0, medium: 1, low: 2 };
    if (pw[a.priority] !== pw[b.priority]) return pw[a.priority] - pw[b.priority];
    return a.dueDate.localeCompare(b.dueDate);
  });

  const handleComplete = (a: Assignment) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeAssignment(a.id);
  };

  const webTop = Platform.OS === 'web' ? 67 : insets.top;

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Assignments</Text>
        <View style={styles.headerRight}>
          <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {assignments.filter((a) => a.status !== 'completed').length}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/new-assignment')}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.background }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.card,
                borderColor: filter === f.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              (Platform.OS === 'web' ? 84 : insets.bottom) + 80,
          },
        ]}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <AssignmentCard
              assignment={item}
              onPress={() => router.push({ pathname: '/assignment-detail', params: { id: item.id } })}
              onComplete={() => handleComplete(item)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Ionicons name="book-outline" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter === 'completed' ? 'No completed assignments yet.' : 'The trail is clear.'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {filter === 'completed'
                ? 'Your victories will appear here.'
                : 'Add an assignment to get started.'}
            </Text>
            {filter !== 'completed' && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/new-assignment')}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                  Add Assignment
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  countText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  emptyState: {
    marginTop: 40,
    borderRadius: 16,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
