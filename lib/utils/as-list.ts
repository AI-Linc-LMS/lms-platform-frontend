/**
 * Coerce a value the API *claims* is `string[]` into one that actually is.
 *
 * TypeScript types describe a promise, not a guarantee — they are erased at runtime, so a
 * `string[]` annotation on an API response is documentation and nothing more. `target_skills` is
 * a Django `JSONField`, which happily accepts a bare string, and the tables it is copied from
 * (`lms_core.MCQ.skills`, `lms_core.CodingProblem.skills`) are `CharField`s holding
 * `"python, loops"`. When one leaked through, `target_skills.slice(0, 2).join(", ")` ran on a
 * string: `.length` passed the truthiness gate, `.slice` returned `"py"`, and `.join` was
 * undefined — which took the entire admin course page down behind an error boundary.
 *
 * The backend write boundaries are fixed and the stored rows are repaired. This exists because a
 * single malformed row should degrade one chip, not white-screen a page a student or an admin is
 * in the middle of using. Belt and braces, deliberately.
 *
 * A comma/pipe/semicolon-separated string is split rather than discarded, matching the backend's
 * `split_skills`, so the legacy shape still renders something meaningful.
 */
export function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim() !== "");
  }
  if (typeof value === "string") {
    return value
      .split(/[,|/;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Same guarantee for a list of objects: never throws on `.map`, whatever the server sent. */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
