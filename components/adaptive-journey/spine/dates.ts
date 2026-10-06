/**
 * Date formatting for the journey spine. Lifted verbatim out of `JourneyBoard.tsx` when the
 * board was split, so every format on the page keeps rendering exactly what it rendered before.
 *
 * Every one of these swallows a bad date into "" rather than throwing: the board renders
 * server-supplied ISO strings, and a single malformed schedule used to take the whole course
 * page down with it.
 */

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/** "Jul 11 – 14" when same month, else "Jul 11 – Aug 2". */
export function fmtRange(a: string, b: string): string {
  try {
    const da = new Date(a);
    const db = new Date(b);
    const mon = (d: Date) => d.toLocaleDateString(undefined, { month: "short" });
    if (mon(da) === mon(db)) return `${mon(da)} ${da.getDate()} – ${db.getDate()}`;
    return `${fmtDate(a)} – ${fmtDate(b)}`;
  } catch {
    return "";
  }
}

export function fmtLongDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime() - Date.now();
  return Math.ceil(d / 86_400_000);
}
