import { z } from 'zod';

const prioritySchema = z.enum(['low', 'medium', 'high']);
const assignmentStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'overdue',
]);
const foxPersonalitySchema = z.enum([
  'energetic',
  'sleepy',
  'mischievous',
  'calm',
  'wise',
]);

/**
 * Persisted objects intentionally allow unknown fields. A newer app version
 * must not erase fields it does not yet understand when it later re-saves a
 * valid local record.
 */
export const foxSchema = z
  .object({
    name: z.string(),
    personality: foxPersonalitySchema,
    xp: z.number().finite().nonnegative(),
    coins: z.number().finite().nonnegative(),
  })
  .passthrough();

export const subtaskSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
  })
  .passthrough();

export const assignmentSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    subject: z.string(),
    description: z.string(),
    dueDate: z.string(),
    dueTime: z.string(),
    priority: prioritySchema,
    estimatedMinutes: z.number().finite().nonnegative(),
    difficulty: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
    status: assignmentStatusSchema,
    subtasks: z.array(subtaskSchema),
    createdAt: z.string(),
    // Existing records use an empty string until completion.
    completedAt: z.string(),
  })
  .passthrough();

export const assignmentsSchema = z.array(assignmentSchema);

export const focusSessionSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    assignmentId: z.string(),
    minutes: z.number().finite().positive(),
  })
  .passthrough();

export const focusSessionsSchema = z.array(focusSessionSchema);

const huntObjectiveTypeSchema = z.enum([
  'complete_assignments',
  'focus_minutes',
  'complete_priority',
  'complete_subtasks',
]);

export const huntObjectiveSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    type: huntObjectiveTypeSchema,
    target: z.number().finite().nonnegative(),
    current: z.number().finite().nonnegative(),
    xpReward: z.number().finite().nonnegative(),
  })
  .passthrough();

export const dailyHuntSchema = z
  .object({
    date: z.string(),
    objectives: z.array(huntObjectiveSchema),
    claimed: z.boolean(),
  })
  .passthrough();

export const xpRecordSchema = z
  .object({
    date: z.string(),
    amount: z.number().finite(),
    reason: z.string(),
  })
  .passthrough();

export const xpLogSchema = z.array(xpRecordSchema);

export const planStateSchema = z
  .object({
    plan: z.enum(['free', 'foxplus']),
    foxScanUsesThisWeek: z.number().finite().nonnegative(),
    weekStartDate: z.string(),
    devMode: z.boolean(),
  })
  .passthrough();

export const ownerMetadataSchema = z
  .object({
    ownerUserId: z.string().nullable(),
    migrationStatus: z.enum(['none', 'complete']),
    lastSyncedAt: z.string().nullable(),
  })
  .passthrough();

const studyDaySchema = z
  .object({
    date: z.string(),
    label: z.string(),
    tasks: z.array(z.string()),
    completed: z.boolean(),
  })
  .passthrough();

export const studyPlansSchema = z.array(
  z
    .object({
      id: z.string(),
      subject: z.string(),
      testDate: z.string(),
      createdAt: z.string(),
      days: z.array(studyDaySchema),
    })
    .passthrough(),
);
