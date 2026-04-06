/**
 * Minimal className merge (no tailwind-merge) for UI primitives.
 * Prefer explicit classes; expand later with clsx + tailwind-merge if needed.
 */
export function cn(...inputs: Array<string | undefined | null | false>): string {
  return inputs.filter(Boolean).join(" ");
}
