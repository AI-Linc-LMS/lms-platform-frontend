/**
 * Tokens and labels for the practice deck on a topic page.
 *
 * Literal constants rather than CSS custom properties, for the reason DESIGN.md gives: a new
 * `--var` has to be registered in `CAMEL_TO_CSS`, `DEFAULT_THEME_FLAT`, `ALLOWED_THEME_KEYS` and
 * the Python serializer, or it is silently dropped.
 *
 * The palette here is DESIGN.md §2 verbatim. The difficulty scale is NOT part of the accent
 * budget: DESIGN.md allows violet exactly three uses (primary button, focus ring, links), and
 * difficulty is semantic state, which earns its own colour the same way an error does. What the
 * old rows did - four per-content-type brand colours, one of them a second violet - was
 * decoration wearing the costume of state, and is gone.
 */

export const P = {
  ink: "#0f172a",
  inkMuted: "#475569",
  inkFaint: "#64748b",
  canvas: "#fbfbfd",
  surface: "#ffffff",
  hairline: "#e6e8ef",
  violet: "#7c3aed",
} as const;

/** Semantic status scale. Each pair is AA on its own background at 12px/500. */
export const TONE = {
  easy: { fg: "#047857", bg: "#ecfdf5" },
  medium: { fg: "#b45309", bg: "#fffbeb" },
  hard: { fg: "#b91c1c", bg: "#fef2f2" },
  ahead: { fg: "#92400e", bg: "#fffbeb", line: "#fde68a" },
  done: { fg: "#047857", bg: "#ecfdf5" },
} as const;

export type DifficultyKey = keyof Pick<typeof TONE, "easy" | "medium" | "hard">;

/** `difficulty_level` is free text on the wire and arrives as "Easy", "easy" and "EASY". */
export function difficultyKey(level: string | undefined | null): DifficultyKey {
  const v = (level ?? "").trim().toLowerCase();
  if (v === "easy") return "easy";
  if (v === "hard") return "hard";
  return "medium";
}

export const DIFFICULTY_LABEL: Record<DifficultyKey, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/**
 * How the "reaches past this topic" chip reads.
 *
 * The old copy was `Needs Hash Tables - not taught yet`, which reads as a fault in the course
 * rather than a note about the problem. The backend's gate is defined as "a concept this course
 * teaches as a submodule topic, in a LATER week" (`adaptive_coding/prerequisites.py`), so
 * "taught later" is something we can actually stand behind. What we do NOT have is which week:
 * `requires_upcoming` is a list of display labels and carries no position, so the chip must not
 * name one.
 */
export function aheadLabel(needs: string[]): string {
  if (needs.length === 0) return "";
  const names =
    needs.length === 1 ? needs[0]
    : needs.length === 2 ? `${needs[0]} and ${needs[1]}`
    : `${needs[0]}, ${needs[1]} and ${needs.length - 2} more`;
  return `${names} · taught later`;
}

export const RADIUS = { card: 12, chip: 6, control: 8 } as const;

/** DESIGN.md §6: the inner canvas-coloured buffer ring guarantees separation from any backdrop. */
export const focusRing = `0 0 0 2px ${P.canvas}, 0 0 0 4px ${P.violet}`;
export const hairline = `0 0 0 1px ${P.hairline}`;
