import AsyncStorage from '@react-native-async-storage/async-storage';
import type { z } from 'zod';
import type { StorageKey } from '@/services/storage/keys';
import { enqueueLocalWrite } from '@/services/storage/writeQueue';

export type StorageReadStatus = 'ok' | 'missing' | 'corrupt' | 'unavailable';

export interface StorageIssue {
  key: StorageKey;
  operation: 'read' | 'parse' | 'validate' | 'serialize' | 'write';
  message: string;
}

export type StorageReadResult<T> = {
  value: T;
  status: StorageReadStatus;
  issue?: StorageIssue;
};

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; issue: StorageIssue };

/**
 * Reads one FoxDen-owned JSON value without allowing a malformed key to affect
 * unrelated local data. Corrupt raw data is left untouched for later recovery.
 */
export async function readJson<T>(
  key: StorageKey,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<StorageReadResult<T>> {
  let raw: string | null;

  try {
    raw = await AsyncStorage.getItem(key);
  } catch (error) {
    return {
      value: fallback,
      status: 'unavailable',
      issue: { key, operation: 'read', message: 'Unable to read local data.' },
    };
  }

  if (raw === null) {
    return { value: fallback, status: 'missing' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      value: fallback,
      status: 'corrupt',
      issue: {
        key,
        operation: 'parse',
        message: 'Stored data could not be parsed.',
      },
    };
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    return {
      value: fallback,
      status: 'corrupt',
      issue: {
        key,
        operation: 'validate',
        message: 'Stored data does not match the expected FoxDen format.',
      },
    };
  }

  return { value: validated.data, status: 'ok' };
}

/**
 * Validates then serializes a FoxDen-owned JSON value. The local write queue
 * keeps writes for the same key ordered without involving remote sync.
 */
export async function writeJson<T>(
  key: StorageKey,
  value: T,
  schema: z.ZodType<T>,
): Promise<StorageWriteResult> {
  const validated = schema.safeParse(value);
  if (!validated.success) {
    return {
      ok: false,
      issue: {
        key,
        operation: 'validate',
        message: 'Refusing to write data that does not match the expected FoxDen format.',
      },
    };
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(validated.data);
  } catch (error) {
    return {
      ok: false,
      issue: {
        key,
        operation: 'serialize',
        message: 'Unable to prepare local data for saving.',
      },
    };
  }

  try {
    await enqueueLocalWrite(key, () => AsyncStorage.setItem(key, serialized));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      issue: { key, operation: 'write', message: 'Unable to save local data.' },
    };
  }
}
