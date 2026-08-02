/**
 * PlanContext — manages the user's FoxDen plan (free | foxplus) and
 * FoxScan weekly usage tracking.
 *
 * Designed so it can later be wired to a real payment provider
 * (RevenueCat, Stripe, etc.) without changing the rest of the app.
 *
 * Feature gate API:
 *   const { plan, canUse, foxScanRemaining, useFoxScan } = usePlan();
 *   canUse('foxScan')       → boolean
 *   canUse('studyPlanner')  → boolean
 *   canUse('advancedStats') → boolean
 *   canUse('premiumDen')    → boolean
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- Types ----------

export type Plan = 'free' | 'foxplus';

export type Feature =
  | 'foxScan'
  | 'studyPlanner'
  | 'advancedStats'
  | 'premiumDen'
  | 'foxCustomization'
  | 'seasonalContent';

export interface PlanState {
  plan: Plan;
  foxScanUsesThisWeek: number;
  weekStartDate: string; // ISO 'YYYY-MM-DD' of Sunday that started the week
  devMode: boolean;       // dev-only toggle, never expose to prod
}

interface PlanContextValue extends PlanState {
  isLoaded: boolean;
  /** Check whether the user can access a feature */
  canUse: (feature: Feature) => boolean;
  /** How many FoxScan scans remain this week (Infinity for FoxPlus) */
  foxScanRemaining: number;
  /** Record one FoxScan use. Returns true if allowed, false if at limit. */
  useFoxScan: () => Promise<boolean>;
  /** Upgrade plan (call after successful payment confirmation) */
  setPlan: (plan: Plan) => Promise<void>;
  /** Dev-only: toggle FoxPlus for testing */
  toggleDevMode: () => Promise<void>;
}

const FREE_FOXSCAN_LIMIT = 14;
const STORAGE_KEY = 'foxden_plan_v1';

// ---------- Helpers ----------

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d.toISOString().split('T')[0];
}

function defaultState(): PlanState {
  return {
    plan: 'free',
    foxScanUsesThisWeek: 0,
    weekStartDate: getWeekStart(new Date()),
    devMode: false,
  };
}

function featureRequiresPlan(feature: Feature): Plan {
  switch (feature) {
    case 'foxScan':
      return 'free'; // free with limit; unlimited on foxplus
    case 'studyPlanner':
    case 'advancedStats':
    case 'premiumDen':
    case 'foxCustomization':
    case 'seasonalContent':
      return 'foxplus';
  }
}

// ---------- Context ----------

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlanState>(defaultState());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage and reset weekly counter if needed
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: PlanState = JSON.parse(raw);
          const currentWeekStart = getWeekStart(new Date());
          // Reset weekly usage if it's a new week
          if (saved.weekStartDate !== currentWeekStart) {
            saved.foxScanUsesThisWeek = 0;
            saved.weekStartDate = currentWeekStart;
          }
          setState(saved);
        }
      } catch {
        // use defaults
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: PlanState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const effectivePlan: Plan = state.devMode ? 'foxplus' : state.plan;

  const canUse = useCallback(
    (feature: Feature): boolean => {
      const required = featureRequiresPlan(feature);
      if (required === 'foxplus') return effectivePlan === 'foxplus';
      // FoxScan: free users have a weekly limit
      if (feature === 'foxScan') {
        if (effectivePlan === 'foxplus') return true;
        return state.foxScanUsesThisWeek < FREE_FOXSCAN_LIMIT;
      }
      return true;
    },
    [effectivePlan, state.foxScanUsesThisWeek],
  );

  const foxScanRemaining =
    effectivePlan === 'foxplus'
      ? Infinity
      : Math.max(0, FREE_FOXSCAN_LIMIT - state.foxScanUsesThisWeek);

  const useFoxScan = useCallback(async (): Promise<boolean> => {
    if (effectivePlan === 'foxplus') return true;
    if (state.foxScanUsesThisWeek >= FREE_FOXSCAN_LIMIT) return false;
    await persist({ ...state, foxScanUsesThisWeek: state.foxScanUsesThisWeek + 1 });
    return true;
  }, [effectivePlan, state, persist]);

  const setPlan = useCallback(
    async (plan: Plan) => {
      await persist({ ...state, plan });
    },
    [state, persist],
  );

  const toggleDevMode = useCallback(async () => {
    await persist({ ...state, devMode: !state.devMode });
  }, [state, persist]);

  return (
    <PlanContext.Provider
      value={{
        ...state,
        plan: effectivePlan,
        isLoaded,
        canUse,
        foxScanRemaining,
        useFoxScan,
        setPlan,
        toggleDevMode,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}
