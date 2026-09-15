import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";

/**
 * Every nav label and description key the sidebar and the phone bar ask for, against both
 * shipped languages.
 *
 * A missing key does not throw. The sidebar passes an English fallback, so a key that is absent
 * from a locale just renders English (or, for a description, nothing) and no test or build
 * notices. That is how Arabic tenants read "Adaptive Courses" in English, and how the Arabic
 * string for the builder came to say "Adaptive quizzes", a different module.
 */

const ROOT = path.resolve(__dirname, "../..");

function keysIn(file: string): string[] {
  const src = readFileSync(path.join(ROOT, file), "utf8");
  const found = new Set<string>();
  for (const m of src.matchAll(/(?:labelKey|descKey):\s*"([^"]+)"/g)) found.add(m[1]);
  return [...found];
}

function lookup(bundle: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>(
    (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
    bundle,
  );
}

const NAV_FILES = ["components/layout/Sidebar.tsx", "components/layout/BottomNavigation.tsx"];

// The keys the course entries resolve through. Arabic has to carry these itself; an English
// fallback in the sidebar of an Arabic tenant is exactly the defect this file exists for.
const COURSE_KEYS = [
  "nav.courses",
  "nav.classicCourses",
  "nav.courseBuilder",
  "navDesc.courses",
  "navDesc.classicCourses",
  "navDesc.admin_course_builder",
];

describe("nav i18n keys", () => {
  it("the course entries resolve through the course keys (and the source scan works)", () => {
    const keys = NAV_FILES.flatMap(keysIn);
    expect(keys.length).toBeGreaterThan(20);
    expect(keys).toEqual(expect.arrayContaining(COURSE_KEYS));
  });

  it("every labelKey and descKey the nav uses exists in English", () => {
    // instructorNav.* is excluded: the instructor nav is static English by design (see the
    // comment on INSTRUCTOR_NAVIGATION_ITEMS) and has never had locale entries.
    const missing = NAV_FILES.flatMap(keysIn)
      .filter((k) => !k.startsWith("instructorNav."))
      .filter((k) => typeof lookup(en, k) !== "string");
    expect(missing).toEqual([]);
  });

  it("Arabic carries every course nav key itself", () => {
    const missing = COURSE_KEYS.filter((k) => typeof lookup(ar, k) !== "string" || !String(lookup(ar, k)).trim());
    expect(missing).toEqual([]);
  });

  it("Courses and Classic courses never read the same, in either language", () => {
    for (const bundle of [en, ar]) {
      const courses = lookup(bundle, "nav.courses");
      const classic = lookup(bundle, "nav.classicCourses");
      // Both must be real strings first: two missing keys would also be "not equal".
      expect(typeof courses === "string" && courses.trim()).toBeTruthy();
      expect(typeof classic === "string" && classic.trim()).toBeTruthy();
      expect(classic).not.toEqual(courses);
    }
  });

  it("no nav label still says Adaptive", () => {
    const labels = (bundle: unknown) =>
      NAV_FILES.flatMap(keysIn)
        .filter((k) => k.startsWith("nav."))
        .map((k) => [k, String(lookup(bundle, k) ?? "")] as const);
    const adaptive = [...labels(en), ...labels(ar)].filter(([, v]) => /adaptive|التكيفية/i.test(v));
    expect(adaptive).toEqual([]);
  });
});
