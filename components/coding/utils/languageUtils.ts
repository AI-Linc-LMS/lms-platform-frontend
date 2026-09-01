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

/**
 * Per-language starter scaffolds, used when a problem has no (or an unusable) template for the
 * language the learner selects. Mirrors `_default_template_code` in the backend's
 * ai_linc/utils/ai_service.py - the two must stay in step.
 *
 * Every scaffold reads stdin and prints to stdout, because that is the whole grading contract:
 * Judge0 runs the file as a program and diffs its stdout against the expected output. There is no
 * harness that calls a named function.
 *
 * The previous stubs were unusable rather than terse. `javascript`/`typescript` were a bare
 * `// Write your solution here`, and `java`/`cpp`/`c`/`c#` were an empty `main` shell. Not one of
 * them read input or printed anything, so a learner who wrote a correct function still failed
 * every test case with empty output, and nothing said a driver was required.
 *
 * These are a floor. A per-problem, per-language `template_code` still wins in `starterCodeFor`.
 */
export const DEFAULT_CODE_STUBS: Record<string, string> = {
  python:
    "import sys\n\n" +
    "def solve(data: str) -> str:\n" +
    '    """Only edit this function. `data` is everything on stdin."""\n' +
    "    # TODO: parse `data`, compute the answer, and return it as a string.\n" +
    "    raise NotImplementedError\n\n" +
    'if __name__ == "__main__":\n' +
    "    print(solve(sys.stdin.read()))\n",
  javascript:
    "const fs = require('fs');\n\n" +
    "// Only edit this function. `data` is everything on stdin.\n" +
    "function solve(data) {\n" +
    "  // TODO: parse `data`, compute the answer, and return it.\n" +
    "  throw new Error('Not implemented');\n" +
    "}\n\n" +
    "console.log(solve(fs.readFileSync(0, 'utf8')));\n",
  typescript:
    "import * as fs from 'fs';\n\n" +
    "// Only edit this function. `data` is everything on stdin.\n" +
    "function solve(data: string): string | number {\n" +
    "  // TODO: parse `data`, compute the answer, and return it.\n" +
    "  throw new Error('Not implemented');\n" +
    "}\n\n" +
    "console.log(solve(fs.readFileSync(0, 'utf8')));\n",
  java:
    "import java.io.*;\n\n" +
    "public class Main {\n" +
    "    // Only edit this method. `data` is everything on stdin.\n" +
    "    static String solve(String data) {\n" +
    "        // TODO: parse `data`, compute the answer, and return it.\n" +
    '        throw new UnsupportedOperationException("Not implemented");\n' +
    "    }\n\n" +
    "    public static void main(String[] args) throws IOException {\n" +
    "        StringBuilder sb = new StringBuilder();\n" +
    "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n" +
    "        String line;\n" +
    '        while ((line = br.readLine()) != null) sb.append(line).append("\\n");\n' +
    "        System.out.println(solve(sb.toString()));\n" +
    "    }\n" +
    "}\n",
  cpp:
    "#include <bits/stdc++.h>\n" +
    "using namespace std;\n\n" +
    "// Only edit this function. `data` is everything on stdin.\n" +
    "string solve(const string& data) {\n" +
    "    // TODO: parse `data`, compute the answer, and return it.\n" +
    '    throw runtime_error("Not implemented");\n' +
    "}\n\n" +
    "int main() {\n" +
    "    ios::sync_with_stdio(false);\n" +
    "    string data((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());\n" +
    "    cout << solve(data) << endl;\n" +
    "    return 0;\n" +
    "}\n",
  "c#":
    "using System;\n\n" +
    "class Program {\n" +
    "    // Only edit this method. `data` is everything on stdin.\n" +
    "    static string Solve(string data) {\n" +
    "        // TODO: parse `data`, compute the answer, and return it.\n" +
    "        throw new NotImplementedException();\n" +
    "    }\n\n" +
    "    static void Main() {\n" +
    "        Console.WriteLine(Solve(Console.In.ReadToEnd()));\n" +
    "    }\n" +
    "}\n",
  c:
    "#include <stdio.h>\n" +
    "#include <stdlib.h>\n" +
    "#include <string.h>\n\n" +
    "/* Only edit this function. `data` is everything on stdin.\n" +
    "   C has no easy string return, so PRINT the answer here rather than returning it. */\n" +
    "void solve(const char *data) {\n" +
    "    /* TODO: parse `data`, compute the answer, and print it. For example:\n" +
    '       printf("%s\\n", answer);  */\n' +
    "    (void)data;\n" +
    "}\n\n" +
    "int main(void) {\n" +
    "    static char data[1 << 20];\n" +
    "    size_t n = fread(data, 1, sizeof(data) - 1, stdin);\n" +
    "    data[n] = '\\0';\n" +
    "    solve(data);\n" +
    "    return 0;\n" +
    "}\n",
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







