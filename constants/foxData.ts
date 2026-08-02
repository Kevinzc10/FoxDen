import { FoxPersonality, Situation } from '@/types';

export interface FoxLevel {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
}

export const FOX_LEVELS: FoxLevel[] = [
  { level: 1, title: 'Lost Little Fox', minXP: 0, maxXP: 99 },
  { level: 2, title: 'Trail Finder', minXP: 100, maxXP: 249 },
  { level: 3, title: 'Clever Scout', minXP: 250, maxXP: 499 },
  { level: 4, title: 'Night Runner', minXP: 500, maxXP: 899 },
  { level: 5, title: 'Den Keeper', minXP: 900, maxXP: 1499 },
  { level: 6, title: 'Shadow Warden', minXP: 1500, maxXP: 2499 },
  { level: 7, title: 'Moon Runner', minXP: 2500, maxXP: 4999 },
  { level: 8, title: 'Ember Fox', minXP: 5000, maxXP: Infinity },
];

export function getFoxLevel(xp: number): FoxLevel {
  for (let i = FOX_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= FOX_LEVELS[i].minXP) return FOX_LEVELS[i];
  }
  return FOX_LEVELS[0];
}

export function getXPForNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const level = getFoxLevel(xp);
  if (level.level === 8) return { current: xp - level.minXP, needed: 1000, progress: 1 };
  const current = xp - level.minXP;
  const needed = level.maxXP - level.minXP + 1;
  return { current, needed, progress: current / needed };
}

export interface SubjectDef {
  name: string;
  color: string;
}

export const SUBJECTS: SubjectDef[] = [
  { name: 'Math', color: '#E8823A' },
  { name: 'Science', color: '#5BAD6F' },
  { name: 'English', color: '#6B8FCF' },
  { name: 'History', color: '#D4A84E' },
  { name: 'Geography', color: '#7BAB8A' },
  { name: 'Art', color: '#D4699E' },
  { name: 'Music', color: '#9B7AC4' },
  { name: 'PE', color: '#5BBFBA' },
  { name: 'CS', color: '#58B7E8' },
  { name: 'Other', color: '#8A9E8F' },
];

export function getSubjectColor(subject: string): string {
  const found = SUBJECTS.find((s) => s.name.toLowerCase() === subject.toLowerCase());
  return found?.color ?? '#8A9E8F';
}

export const PERSONALITIES: { key: FoxPersonality; label: string; emoji: string }[] = [
  { key: 'energetic', label: 'Energetic', emoji: '⚡' },
  { key: 'sleepy', label: 'Sleepy', emoji: '💤' },
  { key: 'mischievous', label: 'Mischievous', emoji: '🦊' },
  { key: 'calm', label: 'Calm', emoji: '🌿' },
  { key: 'wise', label: 'Wise', emoji: '📖' },
];

const FOX_DIALOGUE: Record<FoxPersonality, Record<Situation, string[]>> = {
  energetic: {
    greeting: ["Let's GO! The trail's calling!", "Rise and grind — the path is waiting!"],
    task_added: ['Another trail discovered!', "On the list — let's chase it!"],
    task_complete: ['YES! Another one down!', 'Speed and precision. Done.'],
    task_hard_complete: ['THAT WAS THE BIG ONE.', "You cleared the hardest trail. Incredible."],
    procrastinating: ["The task is still here. Still waiting.", "The deadline doesn't sleep."],
    all_done: ['CLEARED. Everything.', 'Zero tasks remaining. Unstoppable.'],
    comeback: ["YOU'RE BACK! The trail missed you!", "Welcome back — let's make up for lost time!"],
    stuck: ["Let's break this down. Nothing stops us.", 'We tackle this piece by piece.'],
  },
  sleepy: {
    greeting: ['...oh. You are here. Good morning. Probably.', 'mmmkay... let us do this. After a stretch.'],
    task_added: ['Sure, added it... I think.', "Yep. Logged. We'll get there."],
    task_complete: ['...nice. That one is done.', 'Oh hey, you finished it. Good job.'],
    task_hard_complete: ['That... took some effort. Well done. *yawns*', 'Impressive. Even I am a little awake now.'],
    procrastinating: ["The assignment is still there. It won't do itself.", 'Hey... pssst. You have work.'],
    all_done: ['All done. Amazing. Can we rest now?', "Everything is finished. I am proud. And sleepy."],
    comeback: ["Oh, you are back. That is nice. The trail waited for you.", 'The den was quiet without you.'],
    stuck: ['Let us take this slow. One piece at a time.', 'Break it down. Small steps.'],
  },
  mischievous: {
    greeting: ['The fox is in. What trouble today?', 'Another day, another trail. Or the same trail? Tricky.'],
    task_added: ["Caught it in the trap — I mean, the list.", 'New prey on the task list. Interesting.'],
    task_complete: ['Snatched it. Clean getaway.', "You didn't let that one see you coming."],
    task_hard_complete: ['That one had teeth. You still got it.', 'The hardest prey caught. You are scary.'],
    procrastinating: ['The assignment is still here. I checked. It did not vanish.', 'Procrastinating? Classic. The task disagrees.'],
    all_done: ['All tasks eliminated. No witnesses.', 'Clean trail. Ghost of productivity.'],
    comeback: ['The wanderer returns! The trail was lonely.', 'Welcome back, adventurer. The den kept your spot.'],
    stuck: ['Ooh, a puzzle. Let me help you pick the lock.', "This one is tricky. Good. That means it's worth it."],
  },
  calm: {
    greeting: ['The trail is here when you are ready.', 'Good to see you. Let us move at your pace today.'],
    task_added: ['Another step on the path.', 'Added. Every task is progress.'],
    task_complete: ['Steady progress. Well done.', 'One step further down the trail.'],
    task_hard_complete: ['You finished something difficult. That matters.', 'That took real effort.'],
    procrastinating: ['The work will wait. It is still here when you are ready.', 'When you feel ready, the task is here.'],
    all_done: ['The trail is clear. Appreciate that.', 'Everything done. Peace in the den.'],
    comeback: ['Welcome back. The trail is still here.', 'Good to see you return. We continue where we left off.'],
    stuck: ['Let us look at this together. No rush.', "It is okay to feel stuck. Let's find a way through."],
  },
  wise: {
    greeting: ['Every trail begins with a single step.', 'What we accomplish today shapes tomorrow.'],
    task_added: ['Each task is a stone on your path.', 'A new challenge. Growth awaits.'],
    task_complete: ['Knowledge becomes wisdom through completion.', 'You have walked further down the trail.'],
    task_hard_complete: ['The hardest trails forge the strongest foxes.', 'Difficulty is the trail testing you. You passed.'],
    procrastinating: ['A task postponed is a burden doubled.', 'The trail does not shorten by waiting.'],
    all_done: ['The den is quiet. The trail is clear. Rest and remember this.', 'You have done much. Let it teach you.'],
    comeback: ['The trail never disappears. It waits for those who seek it.', 'Return is itself a form of progress.'],
    stuck: ['Understanding begins with asking why. Let us start there.', 'Break the great into the small. Mountains are climbed one step at a time.'],
  },
};

export function getFoxDialogue(personality: FoxPersonality, situation: Situation): string {
  const options = FOX_DIALOGUE[personality][situation];
  return options[Math.floor(Math.random() * options.length)];
}

export function getPriorityLabel(priority: 'low' | 'medium' | 'high'): string {
  return { low: 'Low', medium: 'Medium', high: 'High' }[priority];
}

export function getDifficultyLabel(difficulty: number): string {
  return ['', 'Easy', 'Medium', 'Hard', 'Very Hard', 'Brutal'][difficulty] ?? 'Unknown';
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDueDate(dueDate: string): string {
  if (!dueDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff <= 7) return `Due in ${diff}d`;
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function isOverdue(dueDate: string, status: string): boolean {
  if (status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return due < today;
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
