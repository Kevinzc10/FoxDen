import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

const OWNER_STORAGE_KEY = '@foxden/owner';

export type AuthState =
  | 'initializing'
  | 'guest'
  | 'authenticating'
  | 'migrating'
  | 'synced'
  | 'syncError';

export type AuthError =
  | { type: 'authFailed'; message: string }
  | { type: 'migrationFailed'; message: string }
  | { type: 'triggerFailed'; message: string }
  | { type: 'sessionExpired'; message: string };

export interface OwnerMetadata {
  ownerUserId: string | null;
  migrationStatus: 'none' | 'complete';
  lastSyncedAt: string | null;
}

interface AuthContextValue {
  authState: AuthState;
  user: User | null;
  error: AuthError | null;
  ownerMetadata: OwnerMetadata;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setOwnerMetadata: (metadata: OwnerMetadata) => Promise<void>;
  reportMigrationResult: (result: 'success' | 'failure', error?: AuthError) => void;
}

const DEFAULT_OWNER_METADATA: OwnerMetadata = {
  ownerUserId: null,
  migrationStatus: 'none',
  lastSyncedAt: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isOwnerMetadata(value: unknown): value is OwnerMetadata {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    (typeof candidate.ownerUserId === 'string' || candidate.ownerUserId === null) &&
    (candidate.migrationStatus === 'none' || candidate.migrationStatus === 'complete') &&
    (typeof candidate.lastSyncedAt === 'string' || candidate.lastSyncedAt === null)
  );
}

async function readOwnerMetadata(): Promise<OwnerMetadata> {
  try {
    const raw = await AsyncStorage.getItem(OWNER_STORAGE_KEY);
    if (!raw) return DEFAULT_OWNER_METADATA;

    const parsed: unknown = JSON.parse(raw);
    return isOwnerMetadata(parsed) ? parsed : DEFAULT_OWNER_METADATA;
  } catch {
    return DEFAULT_OWNER_METADATA;
  }
}

function toAuthError(error: unknown): AuthError {
  const message = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  return { type: 'authFailed', message };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [ownerMetadata, setOwnerMetadataState] = useState<OwnerMetadata>(DEFAULT_OWNER_METADATA);

  useEffect(() => {
    let isActive = true;
    let hasReceivedAuthEvent = false;

    void readOwnerMetadata().then((metadata) => {
      if (isActive) setOwnerMetadataState(metadata);
    });

    if (!isSupabaseConfigured || !supabase) {
      setAuthState('guest');
      return () => {
        isActive = false;
      };
    }

    const applySession = (nextUser: User | null) => {
      if (!isActive) return;

      setUser(nextUser);
      setError(null);
      // Migration routing is intentionally not decided here. The later
      // MigrationController will own that behavior using domain state.
      setAuthState(nextUser ? 'synced' : 'guest');
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      hasReceivedAuthEvent = true;
      applySession(session?.user ?? null);
    });

    // Read the cached session once as a startup fallback. The subscription
    // remains the ongoing source of truth, while this guarantees that startup
    // always leaves `initializing` even if the initial auth event is delayed.
    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isActive || hasReceivedAuthEvent) return;

        if (sessionError) {
          applySession(null);
          setError({ type: 'sessionExpired', message: sessionError.message });
          return;
        }

        applySession(data.session?.user ?? null);
      })
      .catch(() => {
        if (!isActive || hasReceivedAuthEvent) return;
        applySession(null);
        setError({
          type: 'sessionExpired',
          message: 'Your saved session could not be restored. You can continue as a guest.',
        });
      });

    return () => {
      isActive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const setOwnerMetadata = useCallback(async (metadata: OwnerMetadata) => {
    await AsyncStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(metadata));
    setOwnerMetadataState(metadata);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const nextError: AuthError = {
        type: 'authFailed',
        message: 'Account features are not configured in this build.',
      };
      setError(nextError);
      throw new Error(nextError.message);
    }

    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      const nextError = toAuthError(signUpError);
      setError(nextError);
      throw new Error(nextError.message);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const nextError: AuthError = {
        type: 'authFailed',
        message: 'Account features are not configured in this build.',
      };
      setError(nextError);
      throw new Error(nextError.message);
    }

    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const nextError = toAuthError(signInError);
      setError(nextError);
      throw new Error(nextError.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      const nextError = toAuthError(signOutError);
      setError(nextError);
      throw new Error(nextError.message);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      const nextError: AuthError = {
        type: 'authFailed',
        message: 'Account features are not configured in this build.',
      };
      setError(nextError);
      throw new Error(nextError.message);
    }

    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
      const nextError = toAuthError(resetError);
      setError(nextError);
      throw new Error(nextError.message);
    }
  }, []);

  const reportMigrationResult = useCallback((result: 'success' | 'failure', migrationError?: AuthError) => {
    if (result === 'success') {
      setError(null);
      setAuthState('synced');
      return;
    }

    setError(
      migrationError ?? {
        type: 'migrationFailed',
        message: 'Your local data could not be synced. It remains safely on this device.',
      },
    );
    setAuthState('syncError');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,
        user,
        error,
        ownerMetadata,
        signUp,
        signIn,
        signOut,
        resetPassword,
        setOwnerMetadata,
        reportMigrationResult,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
