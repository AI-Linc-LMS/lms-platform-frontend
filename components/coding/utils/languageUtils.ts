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
  'c#': "c#",
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

// Get Judge0 language ID
export function getLanguageId(language: string): number {
  return LANGUAGE_ID_MAPPING[language] || LANGUAGE_ID_MAPPING[MONACO_LANGUAGE_MAPPING[language]] || 71;
}

// Get Monaco language
export function getMonacoLanguage(language: string): string {
  return MONACO_LANGUAGE_MAPPING[language] || language;
}







