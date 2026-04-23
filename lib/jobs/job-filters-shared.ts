import indianLocationMarkers from "./indian-location-markers.json";

/** Virtual location: all listings that look India-based (cities, states, "India"). */
export const INDIA_LOCATION_OPTION = "India";

export function appendIndiaToLocationOptions(locations: string[]): string[] {
  const rest = locations.filter((l) => l.trim().toLowerCase() !== "india");
  return [INDIA_LOCATION_OPTION, ...rest];
}

function titleCaseLocationToken(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Preset cities/states for the student jobs location field (before any listings load),
 * so the dropdown is not only "India". Merged with job-derived locations on the page.
 */
export function getDefaultStudentLocationAutocompleteOptions(): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const raw of indianLocationMarkers) {
    const label = titleCaseLocationToken(raw);
    if (!label) continue;
    const k = label.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    labels.push(label);
  }
  labels.sort((a, b) => a.localeCompare(b));
  return appendIndiaToLocationOptions(labels);
}

function isLikelyIndianLocation(locLower: string): boolean {
  if (!locLower) return false;
  if (/\bindia\b/.test(locLower)) return true;
  return indianLocationMarkers.some((m) => locLower.includes(m));
}

/** Match job location string against sidebar/search selection (includes India aggregate). */
export function locationMatchesFilter(
  jobLocation: string | undefined,
  selected: string | undefined
): boolean {
  const sel = (selected ?? "").trim().toLowerCase();
  if (!sel) return true;
  const loc = (jobLocation ?? "").trim().toLowerCase();
  if (sel === "india") return isLikelyIndianLocation(loc);
  return loc.includes(sel);
}

const POSTED_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

/** True if job falls within the posting window; unknown/invalid dates excluded when window is set. */
export function jobPostedWithin(
  dateIso: string | undefined,
  windowKey: string | undefined,
  nowMs = Date.now()
): boolean {
  const key = (windowKey ?? "").trim();
  if (!key) return true;
  const maxAge = POSTED_MS[key];
  if (!maxAge) return true;
  const t = dateIso ? new Date(dateIso).getTime() : NaN;
  if (Number.isNaN(t)) return false;
  const age = nowMs - t;
  if (age < 0) return true;
  return age <= maxAge;
}
