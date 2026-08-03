import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

function isValidSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Keeps guest mode working when Supabase is absent or misconfigured.
 * AuthContext checks this flag before accessing the client.
 */
export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey,
);

/**
 * The app's single client-side Supabase instance.
 *
 * Expo public environment variables are intentionally used here: the anon key
 * is designed for client use and database access remains protected by RLS.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
