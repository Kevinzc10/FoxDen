export type Priority = 'low' | 'medium' | 'high';
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';
export type FoxPersonality = 'energetic' | 'sleepy' | 'mischievous' | 'calm' | 'wise';
export type Situation =
  | 'greeting'
  | 'task_added'
  | 'task_complete'
  | 'task_hard_complete'
  | 'procrastinating'
  | 'all_done'
  | 'comeback'
  | 'stuck';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string;
  priority: Priority;
  estimatedMinutes: number;
  difficulty: Difficulty;
  status: AssignmentStatus;
  subtasks: Subtask[];
  createdAt: string;
  completedAt: string;
}

export interface Fox {
  name: string;
  personality: FoxPersonality;
  xp: number;
  coins: number;
}

export interface HuntObjective {
  id: string;
  title: string;
  description: string;
  type: 'complete_assignments' | 'focus_minutes' | 'complete_priority' | 'complete_subtasks';
  target: number;
  current: number;
  xpReward: number;
}

export interface DailyHunt {
  date: string; // YYYY-MM-DD
  objectives: HuntObjective[];
  claimed: boolean;
}

export interface FocusSessionRecord {
  id: string;
  date: string;
  assignmentId: string;
  minutes: number;
}

export interface XPRecord {
  date: string;
  amount: number;
  reason: string;
}
