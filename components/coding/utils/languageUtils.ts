// Language ID mapping for Judge0
export const LANGUAGE_ID_MAPPING: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  python3: 71,
  java: 62,
  cpp: 54,
  "c++": 54,
  c: 50,
  sql: 82,
  'c#': 51,
  csharp: 51,
};

// Map language names to Monaco Editor language identifiers
export const MONACO_LANGUAGE_MAPPING: Record<string, string> = {
  python3: "python",
  "c++": "cpp",
  cpp: "cpp",
  javascript: "javascript",
  typescript: "typescript",
  js: "javascript",
  ts: "typescript",
  python: "python",
  java: "java",
  c: "c",
  sql: "sql",
  'c#': "csharp",
  csharp: "csharp",
};

// Map display names
export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  python3: "Python 3",
  python: "Python",
  "c++": "C++",
  cpp: "C++",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  java: "Java",
  c: "C",
  sql: "SQL",
  'c#': "C#",
  csharp: "C#",
};

export type LanguageOption = {
  value: string;
  label: string;
  monacoLanguage: string;
};

/**
 * One entry per logical language (no duplicate labels: e.g. javascript+js, cpp+c++, ts+typescript).
 * Alias keys (js, ts, c++) stay in LANGUAGE_DISPLAY_NAMES for template_code / API compatibility.
 */
const ALL_LANGUAGES_CANONICAL_KEYS: string[] = [
  "python3",
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "c",
  "sql",
  "c#",
];

/** Every language we support in the editor / Judge0, independent of problem template_code */
export function getAllLanguages(): LanguageOption[] {
  return ALL_LANGUAGES_CANONICAL_KEYS.filter((k) => k in LANGUAGE_DISPLAY_NAMES)
    .map((lang) => ({
      value: lang,
      label: LANGUAGE_DISPLAY_NAMES[lang] || lang,
      monacoLanguage: MONACO_LANGUAGE_MAPPING[lang] || lang,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Get languages available for a problem based on template_code
export function getAvailableLanguages(templateCode: Record<string, string> | undefined) {
  if (!templateCode) return [];

  return Object.keys(templateCode).map(lang => ({
    value: lang,
    label: LANGUAGE_DISPLAY_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1),
    monacoLanguage: MONACO_LANGUAGE_MAPPING[lang] || lang,
  }));
}

/** Curated fallback languages when a problem ships no template_code - the common
 * interview/competitive languages. An AI-generated problem can arrive with an empty
 * template_code ({}), which would otherwise leave the editor with no selectable language
 * and no way to type. This keeps the IDE usable (Judge0 + Monaco both key off the value). */
const DEFAULT_FALLBACK_LANGUAGE_KEYS = ["python", "java", "cpp", "c", "javascript", "c#"];

export function getAvailableLanguagesOrDefault(
  templateCode: Record<string, string> | undefined
): LanguageOption[] {
  const fromTemplate = getAvailableLanguages(templateCode);
  if (fromTemplate.length > 0) return fromTemplate;
  return DEFAULT_FALLBACK_LANGUAGE_KEYS.map((lang) => ({
    value: lang,
    label: LANGUAGE_DISPLAY_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1),
    monacoLanguage: MONACO_LANGUAGE_MAPPING[lang] || lang,
  }));
}

/**
 * The languages offered in the coding editor, as a CONSISTENT algorithmic set — so the dropdown
 * doesn't depend on which languages a given problem happened to be generated with (some arrived
 * with SQL + C# but no C++/TypeScript). SQL is offered only for a genuine SQL problem (its
 * template_code is SQL-only). Every language here runs on Judge0 (see LANGUAGE_ID_MAPPING).
 */
const CODING_LANGUAGE_KEYS = ["python", "javascript", "typescript", "java", "cpp", "c#"];

/** Minimal per-language starter skeletons (mirrors the backend defaults) — used when a problem
 *  has no, or an unusable, template for a language the learner selects. */
export const DEFAULT_CODE_STUBS: Record<string, string> = {
  python: "# Write your solution here\n",
  javascript: "// Write your solution here\n",
  typescript: "// Write your solution here\n",
  java:
    "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  cpp:
    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  "c#":
    "using System;\n\nclass Program {\n    static void Main() {\n        // Write your solution here\n    }\n}\n",
  c: "#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  sql: "-- Write your SQL query here\n",
};

/** True when a stored template is a placeholder for a language the problem can't be solved in
 *  ("SQL version not applicable…", "not suitable…") rather than real starter code. */
export function isPlaceholderTemplate(tpl: string | undefined): boolean {
  return /not\s+(suitable|applicable)/i.test(tpl ?? "");
}

/** Languages to show in the coding editor for a problem (curated set; SQL only for SQL problems). */
export function getCodingLanguages(templateCode?: Record<string, string>): LanguageOption[] {
  const keys = templateCode ? Object.keys(templateCode).map((k) => k.toLowerCase()) : [];
  const isSqlOnly = keys.length > 0 && keys.every((k) => k === "sql");
  const wanted = isSqlOnly ? ["sql"] : CODING_LANGUAGE_KEYS;
  return wanted
    .filter((k) => k in LANGUAGE_DISPLAY_NAMES)
    .map((lang) => ({
      value: lang,
      label: LANGUAGE_DISPLAY_NAMES[lang] || lang,
      monacoLanguage: MONACO_LANGUAGE_MAPPING[lang] || lang,
    }));
}

/** Starter code to seed the editor with: the problem's own template when it's real, else a stub. */
export function starterCodeFor(lang: string, templateCode?: Record<string, string>): string {
  const key = (lang || "").toLowerCase();
  const tpl = templateCode?.[lang] ?? templateCode?.[key];
  if (tpl && !isPlaceholderTemplate(tpl)) return tpl;
  return DEFAULT_CODE_STUBS[lang] ?? DEFAULT_CODE_STUBS[key] ?? "";
}

// Get Judge0 language ID
export function getLanguageId(language: string): number {
  return LANGUAGE_ID_MAPPING[language] || LANGUAGE_ID_MAPPING[MONACO_LANGUAGE_MAPPING[language]] || 71;
}

// Get Monaco language
export function getMonacoLanguage(language: string): string {
  return MONACO_LANGUAGE_MAPPING[language] || language;
}







