/**
 * Serializes local writes for each storage key.
 *
 * This is intentionally not a sync queue: tasks are held only in memory and
 * are never persisted, retried across launches, or sent to a remote service.
 */
const writeTails = new Map<string, Promise<void>>();

/**
 * Runs writes for the same key in call order. A failed write is isolated so it
 * cannot prevent later writes for that key from running.
 */
export function enqueueLocalWrite<T>(
  key: string,
  task: () => Promise<T>,
): Promise<T> {
  const previous = writeTails.get(key) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(task);
  const tail = result.then(
    () => undefined,
    () => undefined,
  );

  writeTails.set(key, tail);

  void tail.finally(() => {
    if (writeTails.get(key) === tail) {
      writeTails.delete(key);
    }
  });

  return result;
}
