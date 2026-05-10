"use client";

import { useEffect, useRef, useState, RefObject } from "react";

interface Options {
  rootMargin?: string;
  threshold?: number;
  /** Disable observer entirely (e.g. when nothing more to load). */
  enabled?: boolean;
}

/** Lightweight wrapper around IntersectionObserver. Returns a ref + visibility flag. */
export function useInView<T extends HTMLElement>(
  options: Options = {}
): [RefObject<T | null>, boolean] {
  const { rootMargin = "200px", threshold = 0, enabled = true } = options;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin, threshold }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [enabled, rootMargin, threshold]);

  return [ref, visible];
}
