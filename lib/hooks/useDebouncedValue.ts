import { useEffect, useState } from "react";

/**
 * `value`, once it has held still for `delayMs`.
 *
 * For a search box that drives a request: the input stays controlled and instant, and the request
 * keys off the returned value, which only follows the input after a pause in typing. The repo had
 * no shared debounce before this (the one in the assessment take page is a ref and a setTimeout
 * inlined around a screenshot), so this is deliberately the smallest thing that does the job: no
 * leading edge, no maxWait, nothing to configure.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return settled;
}
