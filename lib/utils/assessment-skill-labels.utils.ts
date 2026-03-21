import type { SkillStats } from "@/lib/services/assessment.service";

/**
 * Strip `[`, `]`, and surrounding quotes from API fragments like
 * `['conditional rendering'` or `'text content manipulation']`.
 */
export function stripSkillArrayDecor(s: string): string {
  let t = s.trim();
  for (let k = 0; k < 12; k++) {
    const before = t;
    t = t.replace(/^\[+/, "").replace(/^\s+/, "");
    t = t.replace(/^['"]+/, "");
    t = t.replace(/\s*\]+$/, "").replace(/\s+$/, "");
    t = t.replace(/['"]+$/, "");
    t = t.trim();
    if (t === before) break;
  }
  return t;
}

/**
 * Parse a single string that is a whole list: `['a', 'b']` or `["a","b"]`.
 * Returns null if the string is not a bracketed list.
 */
export function parseSkillListString(s: string): string[] | null {
  const t = s.trim();
  if (!t.startsWith("[") || !t.endsWith("]")) return null;
  const inner = t.slice(1, -1).trim();
  if (inner.length === 0) return [];

  const parts: string[] = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) i++;
    if (i >= inner.length) break;
    const q = inner[i];
    if (q === "'" || q === '"') {
      i++;
      const start = i;
      while (i < inner.length && inner[i] !== q) {
        if (inner[i] === "\\") i++;
        i++;
      }
      parts.push(inner.slice(start, i));
      if (i < inner.length) i++;
    } else {
      const start = i;
      while (i < inner.length && inner[i] !== ",") i++;
      parts.push(inner.slice(start, i).trim());
    }
  }

  const cleaned = parts.map((p) => stripSkillArrayDecor(p)).filter(Boolean);
  return cleaned.length ? cleaned : [];
}

function rawSkillStrings(
  top_skills: (SkillStats | string)[] | undefined
): string[] {
  if (!top_skills?.length) return [];
  const out: string[] = [];
  for (const item of top_skills) {
    if (typeof item === "string") out.push(item);
    else if (
      item &&
      typeof item === "object" &&
      typeof (item as SkillStats).skill === "string"
    ) {
      out.push((item as SkillStats).skill);
    }
  }
  return out;
}

/**
 * Normalized labels for "top skills" UI/PDF when the API returns list-like
 * strings or broken fragments.
 */
export function normalizeTopSkillDisplayNames(
  top_skills: SkillStats[] | string[] | undefined,
  limit = 3
): string[] {
  const raw = rawSkillStrings(top_skills);
  const expanded: string[] = [];

  for (const s of raw) {
    const trimmed = s.trim();
    const parsed = parseSkillListString(trimmed);
    if (parsed && parsed.length > 0) {
      expanded.push(...parsed);
    } else {
      expanded.push(stripSkillArrayDecor(trimmed));
    }
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const x of expanded) {
    const n = x.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    unique.push(n);
  }

  const top = unique.slice(0, limit);
  while (top.length < limit) top.push("—");
  return top;
}

export interface WeakSkillDisplayRow {
  label: string;
  accuracyPercent: number | null;
  correct: number | null;
  total: number | null;
}

/**
 * Structured weak-skill rows for rich UI (cards, bars); same cleanup rules as PDF strings.
 */
export function getWeakSkillDisplayRows(
  low_skills: SkillStats[] | string[] | undefined,
  limit = 6
): WeakSkillDisplayRow[] {
  const rows: WeakSkillDisplayRow[] = [];

  const pushRow = (row: WeakSkillDisplayRow) => {
    if (rows.length >= limit || !row.label) return;
    rows.push(row);
  };

  for (const item of low_skills ?? []) {
    if (rows.length >= limit) break;

    if (typeof item === "string") {
      const trimmed = item.trim();
      const parsed = parseSkillListString(trimmed);
      const labels =
        parsed && parsed.length > 0
          ? parsed.map((p) => stripSkillArrayDecor(p)).filter(Boolean)
          : [stripSkillArrayDecor(trimmed)];
      for (const lab of labels) {
        pushRow({
          label: lab,
          accuracyPercent: null,
          correct: null,
          total: null,
        });
      }
      continue;
    }

    if (
      item &&
      typeof item === "object" &&
      typeof (item as SkillStats).skill === "string"
    ) {
      const s = item as SkillStats;
      const label = stripSkillArrayDecor(s.skill);
      const acc = Number.isFinite(s.accuracy_percent)
        ? Math.round(s.accuracy_percent)
        : null;
      const correct = Number.isFinite(s.correct) ? s.correct : null;
      const total = Number.isFinite(s.total) ? s.total : null;
      pushRow({ label, accuracyPercent: acc, correct, total });
    }
  }

  return rows;
}

/**
 * Lines for “skills needing attention” in plain-text / PDF.
 */
export function formatWeakSkillsForReport(
  low_skills: SkillStats[] | string[] | undefined,
  limit = 6
): string[] {
  return getWeakSkillDisplayRows(low_skills, limit).map((r) => {
    const hasCounts =
      r.correct != null &&
      r.total != null &&
      r.total > 0;
    if (r.accuracyPercent != null && hasCounts) {
      return `${r.label} — ${r.accuracyPercent}% (${r.correct}/${r.total} correct)`;
    }
    if (r.accuracyPercent != null) {
      return `${r.label} — ${r.accuracyPercent}% accuracy`;
    }
    return r.label;
  });
}
