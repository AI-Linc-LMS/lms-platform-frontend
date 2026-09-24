/**
 * What the server said when it refused a profile save, in words a learner can act on.
 *
 * A failed save used to be reported as "Profile saved locally", an *info* toast, with the reason
 * thrown away - so the one thing that would have let anyone fix it, the server's own message,
 * never left the browser. The endpoint is specific ("A point can be at most 1000 characters",
 * "This field may not be blank"); there is no reason to replace that with a shrug.
 *
 * The shape to dig through, because the endpoint wraps its errors:
 *   { "error": { "experience": [ { "start_date": ["Date has wrong format..."] }, {} ] } }
 *   { "error": { "portfolio_website_url": ["Enter a valid URL."] } }
 *   { "error": "User profile not found" }
 * and, when the request never arrived at all, nothing but a network failure.
 */

export interface ProfileSaveFailure {
  /** One line, ready to show. Never empty. */
  message: string;
  /** Per top-level field, for a form that can point at its own inputs. */
  fields: Record<string, string>;
}

/** "portfolio_website_url" -> "Portfolio website url". */
function label(field: string): string {
  const words = field.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The first real problem inside a DRF error value, with the field names it was found under.
 *
 * The list sections nest: `{"experience": [{"start_date": ["Date has wrong format"]}, {}]}` is
 * "entry 1 of Experience has a bad start date", and reporting only "Experience: Date has wrong
 * format" makes the learner hunt for which of five fields it means. The inner names are kept.
 */
function firstProblem(value: unknown, depth = 0): { path: string[]; message: string } | null {
  if (depth > 4) return null;
  if (typeof value === "string") {
    const text = value.trim();
    return text ? { path: [], message: text } : null;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstProblem(entry, depth + 1);
      // A list of plain strings is DRF's message list for ONE field, not a nested path.
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const found = firstProblem(entry, depth + 1);
      if (found) return { path: [key, ...found.path], message: found.message };
    }
  }
  return null;
}

/** The first human sentence inside a DRF error value, whatever it is nested under. */
function firstMessage(value: unknown): string | null {
  return firstProblem(value)?.message ?? null;
}

/** "experience" + ["start_date"] -> "Experience - Start date". */
function fullLabel(field: string, path: string[]): string {
  return [field, ...path].map(label).join(" - ");
}

/** The error body, unwrapped from whichever envelope this endpoint used. */
function errorBody(err: unknown): unknown {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = (data as Record<string, unknown>).error;
    if (inner !== undefined) return inner;
    const detail = (data as Record<string, unknown>).detail;
    if (detail !== undefined && Object.keys(data).length === 1) return detail;
  }
  return data;
}

export function readProfileSaveError(err: unknown, fallback: string): ProfileSaveFailure {
  const body = errorBody(err);
  const fields: Record<string, string> = {};

  // The sentence shown, per top-level field, which may name a nested one. `fields` stays keyed
  // by the TOP-LEVEL name, because that is what a form knows its own inputs by.
  const lines: string[] = [];
  if (body && typeof body === "object" && !Array.isArray(body)) {
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      const problem = firstProblem(value);
      if (!problem) continue;
      fields[key] = problem.message;
      // Non-field errors ("detail", "error") read better without a label in front of them.
      lines.push(
        key === "detail" || key === "error"
          ? problem.message
          : `${fullLabel(key, problem.path)}: ${problem.message}`,
      );
    }
  }

  if (lines.length) return { message: lines.join("; "), fields };

  const plain = firstMessage(body);
  return { message: plain ?? fallback, fields };
}
