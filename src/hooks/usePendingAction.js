import { useState } from 'react';

// Shared "don't double-submit" guard: disables whatever triggered `run`
// until its async work finishes, keyed so only one action is pending at a time.
export function usePendingAction() {
  const [pendingKey, setPendingKey] = useState(null);

  const run = async (key, fn) => {
    if (pendingKey) return;
    setPendingKey(key);
    try {
      await fn();
    } finally {
      setPendingKey(null);
    }
  };

  return [pendingKey, run];
}
