/** Humanise a raw skill key for display.
 *
 *  Strips the Python-list-repr artifacts (`[`, `]`, quotes) that leaked into some stored skill
 *  keys - skills were sometimes saved as a stringified list (`"['A', 'B']"`) then split on commas,
 *  so keys arrived as `['A'` / `'B']`. Then collapses underscores and title-cases.
 *
 *  `fallback` is returned for an empty/blank key (callers vary: "General", "this skill", …).
 */
export function prettySkill(raw: string | null | undefined, fallback = "General"): string {
  const cleaned = (raw || "").trim().replace(/^[\s[\]'"]+|[\s[\]'"]+$/g, "").trim();
  if (!cleaned) return fallback;
  return cleaned.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
