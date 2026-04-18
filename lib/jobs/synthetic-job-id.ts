/** Stable negative id from apply URL (matches legacy static JSON feed / external store). */
export function syntheticIdFromApplyLink(applyLink: string): number {
  let h = 2166136261 >>> 0;
  const s = applyLink.trim();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return -(1_000_000_000 + (Math.abs(h) % 900_000_000));
}
