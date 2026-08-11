/**
 * The roadmap canvas design tokens.
 *
 * This surface deliberately does NOT look like the rest of the product, and that is the point.
 * roadmap.sh reads as a hand-drawn poster: hard black outlines, flat fills, offset shadows with
 * no blur, and a dense layout you scan rather than read. That aesthetic is doing real work --
 * it makes a 180-node map feel like an object you can take in at a glance instead of a list.
 *
 * What we take from them: the STRUCTURE and the RULES.
 *   - a hard 2px ink outline on every node, and a hard offset shadow (no blur)
 *   - flat fills, never gradients
 *   - node FILL carries progress state, so hierarchy is left to size and shade
 *   - a completed map visibly drains toward grey, which is the "burn down" signal
 *   - text decoration doubles every state, so it survives for colour-blind readers
 *
 * What we do NOT take: their yellow. #fdff00 is roadmap.sh's brand asset and read as a foreign
 * object inside a violet product (that was the note on the first cut). The hue is ours, the
 * language is theirs. Flipping to their exact palette is a one-line change here if wanted.
 */

export const RM = {
  ink: "#0f172a",
  canvas: "#fbfbfd",
  rail: "#7c3aed",
  railSoft: "#c4b5fd",

  /** Hard offset shadow, no blur. The single biggest contributor to the poster feel. */
  shadow: (n = 3) => `${n}px ${n}px 0 ${RM.ink}`,
  border: `2px solid #0f172a`,
} as const;

type Fill = { bg: string; text: string; deco: "none" | "line-through" | "underline" };

/** Primary spine steps: the loud row of the map. */
export const SPINE_FILL: Record<string, Fill> = {
  // Untouched is the platform violet at full strength: the path you have not walked is the
  // brightest thing on the canvas, which is what pulls the eye down the spine.
  pending: { bg: "#c4b5fd", text: "#1e1b4b", deco: "none" },
  learning: { bg: "#fbcfe8", text: "#500724", deco: "underline" },
  // Their exact done treatment: drain to grey and strike the text. A finished map goes quiet.
  done: { bg: "#cbcbcb", text: "#334155", deco: "line-through" },
  skipped: { bg: "#e2e8f0", text: "#64748b", deco: "line-through" },
};

/** Branch steps: same language, one step down in weight. */
export const BRANCH_FILL: Record<string, Fill> = {
  pending: { bg: "#ede9fe", text: "#1e1b4b", deco: "none" },
  learning: { bg: "#fce7f3", text: "#500724", deco: "underline" },
  done: { bg: "#e5e5e5", text: "#475569", deco: "line-through" },
  skipped: { bg: "#f1f5f9", text: "#94a3b8", deco: "line-through" },
};
