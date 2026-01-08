import { useEffect, useRef } from 'react';

/**
 * Custom hook that ensures useEffect only runs once, even in React StrictMode
 * This prevents duplicate API calls during development
 */
export function useEffectOnce(callback: () => void | (() => void)) {
  const hasRun = useRef(false);
  const cleanup = useRef<(() => void) | void>(undefined);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    cleanup.current = callback();

    return () => {
      if (cleanup.current && typeof cleanup.current === 'function') {
        cleanup.current();
      }
      hasRun.current = false;
    };
  }, []);
}

