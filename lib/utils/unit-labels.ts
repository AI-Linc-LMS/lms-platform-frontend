/**
 * What one unit of a course is called, on the ADMIN side.
 *
 * A course carries `module_only_structure`. It is vocabulary only: gating, scheduling and points
 * are identical either way. The learner board already respects it, because the API hands it the
 * computed `unitNoun`. The admin surfaces did not: they hardcoded "Week" in about a dozen strings,
 * so an admin could flip the course to modules, watch the learner view change, and still be told
 * "Week 7" by the builder they had just used to flip it.
 *
 * Mirrors `adaptive_quiz/structure_labels.py` on the backend. Keep the two in step.
 */

/** Something carrying the flag: a course detail, a list row, or a bare boolean holder. */
export type UnitStructured = { module_only_structure?: boolean } | null | undefined;

/** "Module" or "Week", capitalised for a heading or an eyebrow. */
export function unitNoun(course: UnitStructured): "Module" | "Week" {
  return course?.module_only_structure ? "Module" : "Week";
}

/** "module" or "week", for the middle of a sentence. */
export function unitWord(course: UnitStructured): "module" | "week" {
  return course?.module_only_structure ? "module" : "week";
}

/** "modules" or "weeks". */
export function unitWordPlural(course: UnitStructured): "modules" | "weeks" {
  return `${unitWord(course)}s` as "modules" | "weeks";
}

/** "Week 7" / "Module 7". Unit 0 is the entry step in both framings. */
export function unitLabel(course: UnitStructured, n: number): string {
  return n ? `${unitNoun(course)} ${n}` : "Get started";
}

/** "3 weeks" / "1 module". */
export function unitCount(course: UnitStructured, n: number): string {
  return `${n} ${n === 1 ? unitWord(course) : unitWordPlural(course)}`;
}
