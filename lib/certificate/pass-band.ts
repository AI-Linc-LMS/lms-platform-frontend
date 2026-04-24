function parsePercent(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  const n = Number(String(raw).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

export function scoreToPercent(score: number, maximumMarks: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(maximumMarks) || maximumMarks <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (score / maximumMarks) * 100));
}

/**
 * Appreciation tier: overall percentage must fall within [lower, upper] inclusive.
 * If either bound is missing, returns false (admin should set both when certificates are on).
 */
export function isScoreInAppreciationBand(
  scorePercent: number,
  lowerRaw: string | number | null | undefined,
  upperRaw: string | number | null | undefined
): boolean {
  const lower = parsePercent(lowerRaw);
  const upper = parsePercent(upperRaw);
  if (lower == null || upper == null) return false;
  return scorePercent >= lower && scorePercent <= upper;
}
