/**
 * Stable AsyncStorage keys owned by FoxDen.
 *
 * Values intentionally match the existing persisted keys exactly. Renaming a
 * value here would make existing local data unavailable, so key migrations
 * must always be handled explicitly in a future migration step.
 */
export const STORAGE_KEYS = {
  FOX: '@foxden/fox',
  ASSIGNMENTS: '@foxden/assignments',
  FOCUS_SESSIONS: '@foxden/focus_sessions',
  HUNT: '@foxden/hunt',
  XP_LOG: '@foxden/xp_log',
  PLAN_STATE: 'foxden_plan_v1',
  OWNER_METADATA: '@foxden/owner',
  STUDY_PLANS: 'foxden_study_plans_v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
