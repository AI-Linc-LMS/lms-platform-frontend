/**
 * Maps the engine's internal SE (standard error) stop threshold into a
 * label/tier that non-technical authors can reason about — "how sure does
 * the AI need to be before ending the quiz?".
 *
 * The underlying value is still SE on the per-skill ability estimate; this
 * file exists so the create wizard, edit page, publish summary, and quiz
 * card all show the same plain-English name for the same numeric value.
 */

export interface ConfidenceTier {
  /** Friendly tier name (shown to authors). */
  name: string;
  /** One-line subtitle — what the tier feels like to a student. */
  blurb: string;
  /** Typical quiz length in plain English. */
  typicalLength: string;
  /** Accent color used by the slider/chip/card UI. */
  accent: string;
  /** Icon used on chips. */
  icon: string;
}

/**
 * Bucket the SE threshold into 3 author-facing tiers. Boundaries chosen so
 * the default 0.35 lands cleanly in the middle tier.
 */
export function confidenceTier(seThreshold: number): ConfidenceTier {
  if (seThreshold <= 0.32) {
    return {
      name: "Tight read",
      blurb: "Keep asking until very confident.",
      typicalLength: "Usually 15–20 questions",
      accent: "#6366f1",
      icon: "mdi:bullseye-arrow",
    };
  }
  if (seThreshold <= 0.4) {
    return {
      name: "Balanced",
      blurb: "Good for most practice and homework.",
      typicalLength: "Usually 10–14 questions",
      accent: "#10b981",
      icon: "mdi:scale-balance",
    };
  }
  return {
    name: "Quick check",
    blurb: "Stop sooner with a rougher estimate.",
    typicalLength: "Usually 6–9 questions",
    accent: "#f59e0b",
    icon: "mdi:flash-outline",
  };
}

export interface CertaintyBand {
  /** Friendly label shown on the live quiz surface. */
  label: string;
  /** Color used to tint the label. */
  accent: string;
}

/**
 * Live-quiz counterpart to {@link confidenceTier}: maps the engine's current
 * average SE (across target skills) into a layman certainty band so the
 * student sees "how sure the AI is right now" rather than a number.
 */
export function certaintyBand(avgSe: number | null): CertaintyBand {
  if (avgSe == null || avgSe >= 0.8) return { label: "Just getting to know you", accent: "#a855f7" };
  if (avgSe >= 0.5) return { label: "Building a picture", accent: "#6366f1" };
  if (avgSe >= 0.35) return { label: "Getting clearer", accent: "#10b981" };
  return { label: "Confident read", accent: "#059669" };
}

