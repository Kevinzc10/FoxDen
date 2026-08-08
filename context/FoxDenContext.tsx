import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Assignment,
  DailyHunt,
  Difficulty,
  FocusSessionRecord,
  Fox,
  FoxPersonality,
  HuntObjective,
  Priority,
  Situation,
  Subtask,
  XPRecord,
} from '@/types';
import { generateId, getFoxDialogue, isOverdue, todayString } from '@/constants/foxData';
import { STORAGE_KEYS } from '@/services/storage/keys';
import { readJson, writeJson } from '@/services/storage/localStore';
import {
  assignmentsSchema,
  dailyHuntSchema,
  focusSessionsSchema,
  foxSchema,
  xpLogSchema,
} from '@/services/storage/schemas';

const DEFAULT_FOX: Fox = {
  name: 'Ember',
  personality: 'mischievous',
  xp: 0,
  coins: 0,
};

interface TodayStats {
  completed: number;
  remaining: number;
  studyMinutes: number;
  xpEarned: number;
}

interface FoxDenContextType {
  fox: Fox;
  updateFoxName: (name: string) => void;
  updateFoxPersonality: (p: FoxPersonality) => void;

  assignments: Assignment[];
  addAssignment: (data: {
    title: string;
    subject: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: Priority;
    estimatedMinutes: number;
    difficulty: Difficulty;
  }) => Assignment;
  updateAssignment: (id: string, data: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  completeAssignment: (id: string) => void;
  addSubtask: (assignmentId: string, title: string) => void;
  toggleSubtask: (assignmentId: string, subtaskId: string) => void;
  deleteSubtask: (assignmentId: string, subtaskId: string) => void;

  focusSessions: FocusSessionRecord[];
  addFocusSession: (session: { assignmentId: string; minutes: number }) => void;

  dailyHunt: DailyHunt | null;
  claimHuntReward: () => void;

  xpLog: XPRecord[];

  getTodayStats: () => TodayStats;
  getNextRecommendedAssignment: () => Assignment | null;
  getDialogue: (situation: Situation) => string;
  awardXP: (amount: number, reason?: string) => void;

  isLoaded: boolean;
}

const FoxDenContext = createContext<FoxDenContextType | null>(null);

function generateDailyHunt(assignments: Assignment[]): DailyHunt {
  const pending = assignments.filter((a) => a.status === 'not_started' || a.status === 'in_progress');
  const objectives: HuntObjective[] = [];

  const targetCount = Math.min(Math.max(pending.length, 1), 3);
  objectives.push({
    id: 'complete_assignments',
    title: `Complete ${targetCount} Assignment${targetCount > 1 ? 's' : ''}`,
    description: `Finish ${targetCount} piece${targetCount > 1 ? 's' : ''} of work today`,
    type: 'complete_assignments',
    target: targetCount,
    current: 0,
    xpReward: 25 * targetCount,
  });

  objectives.push({
    id: 'focus_minutes',
    title: 'Study for 20 Minutes',
    description: 'Complete at least one focus session',
    type: 'focus_minutes',
    target: 20,
    current: 0,
    xpReward: 30,
  });

  const highPriority = pending.filter((a) => a.priority === 'high');
  if (highPriority.length > 0) {
    objectives.push({
      id: 'complete_priority',
      title: 'Tackle a Priority Task',
      description: 'Complete one high-priority assignment',
      type: 'complete_priority',
      target: 1,
      current: 0,
      xpReward: 40,
    });
  } else {
    const hasSubtasks = pending.some((a) => a.subtasks.length > 0);
    if (hasSubtasks) {
      objectives.push({
        id: 'complete_subtasks',
        title: 'Complete 3 Subtasks',
        description: 'Work through steps on your assignments',
        type: 'complete_subtasks',
        target: 3,
        current: 0,
        xpReward: 20,
      });
    }
  }

  return { date: todayString(), objectives, claimed: false };
}

function calcHuntProgress(
  hunt: DailyHunt,
  assignments: Assignment[],
  focusSessions: FocusSessionRecord[]
): DailyHunt {
  const today = todayString();
  const completedToday = assignments.filter((a) => a.completedAt && a.completedAt.startsWith(today));
  const focusToday = focusSessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.minutes, 0);
  const highPriorityToday = completedToday.filter((a) => a.priority === 'high').length;
  const subtasksToday = completedToday.flatMap((a) => a.subtasks.filter((s) => s.completed)).length;

  const objectives = hunt.objectives.map((obj) => {
    let current = 0;
    switch (obj.type) {
      case 'complete_assignments':
        current = completedToday.length;
        break;
      case 'focus_minutes':
        current = focusToday;
        break;
      case 'complete_priority':
        current = highPriorityToday;
        break;
      case 'complete_subtasks':
        current = subtasksToday;
        break;
    }
    return { ...obj, current: Math.min(current, obj.target) };
  });

  return { ...hunt, objectives };
}

export function FoxDenProvider({ children }: { children: React.ReactNode }) {
  const [fox, setFox] = useState<Fox>(DEFAULT_FOX);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSessionRecord[]>([]);
  const [dailyHunt, setDailyHunt] = useState<DailyHunt | null>(null);
  const [xpLog, setXPLog] = useState<XPRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep latest values in refs for callbacks that close over stale state
  const assignmentsRef = useRef(assignments);
  const focusSessionsRef = useRef(focusSessions);
  const foxRef = useRef(fox);
  const huntRef = useRef(dailyHunt);
  assignmentsRef.current = assignments;
  focusSessionsRef.current = focusSessions;
  foxRef.current = fox;
  huntRef.current = dailyHunt;

  // Load each persisted slice independently so a corrupted key cannot discard
  // valid data stored under another FoxDen key.
  useEffect(() => {
    (async () => {
      try {
        const [foxResult, assignmentsResult, focusResult, huntResult, xpResult] = await Promise.all([
          readJson(STORAGE_KEYS.FOX, foxSchema, DEFAULT_FOX),
          readJson(STORAGE_KEYS.ASSIGNMENTS, assignmentsSchema, [] as Assignment[]),
          readJson(STORAGE_KEYS.FOCUS_SESSIONS, focusSessionsSchema, [] as FocusSessionRecord[]),
          readJson(STORAGE_KEYS.HUNT, dailyHuntSchema.nullable(), null),
          readJson(STORAGE_KEYS.XP_LOG, xpLogSchema, [] as XPRecord[]),
        ]);

        const loadedFox: Fox = foxResult.value;
        const loadedAssignments: Assignment[] = assignmentsResult.value;
        const loadedFocus: FocusSessionRecord[] = focusResult.value;
        const loadedXP: XPRecord[] = xpResult.value;

        // Update overdue statuses
        const today = todayString();
        const updatedAssignments = loadedAssignments.map((a) => {
          if (isOverdue(a.dueDate, a.status)) return { ...a, status: 'overdue' as const };
          return a;
        });

        // Hunt: load or generate fresh if new day
        const storedHunt = huntResult.value;
        const hunt =
          storedHunt && storedHunt.date === today
            ? calcHuntProgress(storedHunt, updatedAssignments, loadedFocus)
            : generateDailyHunt(updatedAssignments);

        setFox(loadedFox);
        setAssignments(updatedAssignments);
        setFocusSessions(loadedFocus);
        setDailyHunt(hunt);
        setXPLog(loadedXP);
      } catch {
        // Individual storage corruption is already handled by readJson. This
        // fallback only protects startup from an unexpected load-time error.
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist fox
  const saveFox = useCallback((f: Fox) => {
    void writeJson(STORAGE_KEYS.FOX, f, foxSchema);
  }, []);

  // Persist assignments and update hunt
  const saveAssignments = useCallback((a: Assignment[], f?: FocusSessionRecord[]) => {
    void writeJson(STORAGE_KEYS.ASSIGNMENTS, a, assignmentsSchema);
    const sessions = f ?? focusSessionsRef.current;
    const hunt = huntRef.current;
    if (hunt) {
      const updated = calcHuntProgress(hunt, a, sessions);
      setDailyHunt(updated);
      void writeJson(STORAGE_KEYS.HUNT, updated, dailyHuntSchema);
    }
  }, []);

  // Persist focus sessions and update hunt
  const saveFocusSessions = useCallback((sessions: FocusSessionRecord[]) => {
    void writeJson(STORAGE_KEYS.FOCUS_SESSIONS, sessions, focusSessionsSchema);
    const hunt = huntRef.current;
    if (hunt) {
      const updated = calcHuntProgress(hunt, assignmentsRef.current, sessions);
      setDailyHunt(updated);
      void writeJson(STORAGE_KEYS.HUNT, updated, dailyHuntSchema);
    }
  }, []);

  const awardXP = useCallback((amount: number, reason = 'Task completed') => {
    setFox((prev) => {
      const updated = { ...prev, xp: prev.xp + amount };
      saveFox(updated);
      return updated;
    });
    const record: XPRecord = { date: todayString(), amount, reason };
    setXPLog((prev) => {
      const updated = [...prev, record];
      void writeJson(STORAGE_KEYS.XP_LOG, updated, xpLogSchema);
      return updated;
    });
  }, [saveFox]);

  const updateFoxName = useCallback((name: string) => {
    setFox((prev) => {
      const updated = { ...prev, name };
      saveFox(updated);
      return updated;
    });
  }, [saveFox]);

  const updateFoxPersonality = useCallback((personality: FoxPersonality) => {
    setFox((prev) => {
      const updated = { ...prev, personality };
      saveFox(updated);
      return updated;
    });
  }, [saveFox]);

  const addAssignment = useCallback((data: {
    title: string;
    subject: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: Priority;
    estimatedMinutes: number;
    difficulty: Difficulty;
  }): Assignment => {
    const newAssignment: Assignment = {
      id: generateId(),
      ...data,
      status: 'not_started',
      subtasks: [],
      createdAt: new Date().toISOString(),
      completedAt: '',
    };
    setAssignments((prev) => {
      const updated = [newAssignment, ...prev];
      saveAssignments(updated);
      return updated;
    });
    return newAssignment;
  }, [saveAssignments]);

  const updateAssignment = useCallback((id: string, data: Partial<Assignment>) => {
    setAssignments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...data } : a));
      saveAssignments(updated);
      return updated;
    });
  }, [saveAssignments]);

  const deleteAssignment = useCallback((id: string) => {
    setAssignments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveAssignments(updated);
      return updated;
    });
  }, [saveAssignments]);

  const completeAssignment = useCallback((id: string) => {
    setAssignments((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        };
      });
      saveAssignments(updated);
      return updated;
    });
    const assignment = assignmentsRef.current.find((a) => a.id === id);
    const xp = assignment?.difficulty ? assignment.difficulty * 10 + 15 : 25;
    const coins = assignment?.difficulty ? assignment.difficulty * 2 + 5 : 10;
    awardXP(xp, 'Assignment completed');
    setFox((prev) => {
      const updated = { ...prev, coins: prev.coins + coins };
      saveFox(updated);
      return updated;
    });
  }, [saveAssignments, awardXP, saveFox]);

  const addSubtask = useCallback((assignmentId: string, title: string) => {
    const subtask: Subtask = { id: generateId(), title, completed: false };
    setAssignments((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== assignmentId) return a;
        return { ...a, subtasks: [...a.subtasks, subtask] };
      });
      saveAssignments(updated);
      return updated;
    });
  }, [saveAssignments]);

  const toggleSubtask = useCallback((assignmentId: string, subtaskId: string) => {
    setAssignments((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const subtasks = a.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...a, subtasks };
      });
      saveAssignments(updated);
      return updated;
    });
    awardXP(5, 'Subtask completed');
  }, [saveAssignments, awardXP]);

  const deleteSubtask = useCallback((assignmentId: string, subtaskId: string) => {
    setAssignments((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== assignmentId) return a;
        return { ...a, subtasks: a.subtasks.filter((s) => s.id !== subtaskId) };
      });
      saveAssignments(updated);
      return updated;
    });
  }, [saveAssignments]);

  const addFocusSession = useCallback((session: { assignmentId: string; minutes: number }) => {
    const record: FocusSessionRecord = {
      id: generateId(),
      date: todayString(),
      ...session,
    };
    setFocusSessions((prev) => {
      const updated = [...prev, record];
      saveFocusSessions(updated);
      return updated;
    });
    const xp = Math.floor(session.minutes / 5) * 10;
    if (xp > 0) awardXP(xp, 'Focus session');
    const coins = Math.floor(session.minutes / 10) * 2;
    if (coins > 0) {
      setFox((prev) => {
        const updated = { ...prev, coins: prev.coins + coins };
        saveFox(updated);
        return updated;
      });
    }
  }, [saveFocusSessions, awardXP, saveFox]);

  const claimHuntReward = useCallback(() => {
    const hunt = huntRef.current;
    if (!hunt || hunt.claimed) return;
    const allComplete = hunt.objectives.every((o) => o.current >= o.target);
    if (!allComplete) return;
    const totalXP = hunt.objectives.reduce((sum, o) => sum + o.xpReward, 0);
    awardXP(totalXP, 'Daily Hunt completed');
    setFox((prev) => {
      const updated = { ...prev, coins: prev.coins + 25 };
      saveFox(updated);
      return updated;
    });
    const claimed = { ...hunt, claimed: true };
    setDailyHunt(claimed);
    void writeJson(STORAGE_KEYS.HUNT, claimed, dailyHuntSchema);
  }, [awardXP, saveFox]);

  const getTodayStats = useCallback((): TodayStats => {
    const today = todayString();
    const completed = assignments.filter((a) => a.completedAt?.startsWith(today)).length;
    const remaining = assignments.filter(
      (a) => a.status === 'not_started' || a.status === 'in_progress' || a.status === 'overdue'
    ).length;
    const studyMinutes = focusSessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.minutes, 0);
    const xpEarned = xpLog.filter((r) => r.date === today).reduce((sum, r) => sum + r.amount, 0);
    return { completed, remaining, studyMinutes, xpEarned };
  }, [assignments, focusSessions, xpLog]);

  const getNextRecommendedAssignment = useCallback((): Assignment | null => {
    const pending = assignments.filter(
      (a) => a.status === 'not_started' || a.status === 'in_progress' || a.status === 'overdue'
    );
    if (pending.length === 0) return null;
    return [...pending].sort((a, b) => {
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      const pa = priorityWeight[a.priority];
      const pb = priorityWeight[b.priority];
      if (pa !== pb) return pa - pb;
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return a.dueDate.localeCompare(b.dueDate);
    })[0];
  }, [assignments]);

  const getDialogue = useCallback((situation: Situation): string => {
    return getFoxDialogue(foxRef.current.personality, situation);
  }, []);

  return (
    <FoxDenContext.Provider
      value={{
        fox,
        updateFoxName,
        updateFoxPersonality,
        assignments,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        completeAssignment,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        focusSessions,
        addFocusSession,
        dailyHunt,
        claimHuntReward,
        xpLog,
        getTodayStats,
        getNextRecommendedAssignment,
        getDialogue,
        awardXP,
        isLoaded,
      }}
    >
      {children}
    </FoxDenContext.Provider>
  );
}

export function useFoxDen(): FoxDenContextType {
  const ctx = useContext(FoxDenContext);
  if (!ctx) throw new Error('useFoxDen must be used inside FoxDenProvider');
  return ctx;
}
