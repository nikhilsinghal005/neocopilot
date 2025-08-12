import { useEffect, useState } from 'react';

/**
 * Tiny hook to persist simple serialisable state to localStorage.
 * Falls back gracefully if storage is unavailable.
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const read = () => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) {return defaultValue;}
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  };

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}

export default usePersistentState;
