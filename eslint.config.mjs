import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Jobs v2 colour discipline.
 *
 * Colour in the jobs module goes through the `--j-*` custom properties declared in the
 * `.jobs-scope` block of `app/globals.css` and referenced from
 * `components/jobs-v2/ui/jobsTokens.ts`. That is what makes dark mode a one-attribute flip with
 * zero component edits, and what stops a fourth accent appearing on a surface that is only
 * allowed three.
 *
 * So, inside the jobs trees: no raw hex, and no `var(--font-light)` — a *text* token that
 * happens to be `#ffffff` today and was being used as a card surface in nine places, inverting
 * or vanishing under any tenant palette that is not white.
 *
 * The `#RGB`-or-longer pattern deliberately does not match a bare `#`, so `href="#"` and
 * fragment ids are unaffected.
 */
const JOBS_TREES = [
  "components/jobs-v2/**/*.ts",
  "components/jobs-v2/**/*.tsx",
  "components/admin/jobs-v2/**/*.ts",
  "components/admin/jobs-v2/**/*.tsx",
  "app/jobs-v2/**/*.ts",
  "app/jobs-v2/**/*.tsx",
  "app/admin/jobs-v2/**/*.ts",
  "app/admin/jobs-v2/**/*.tsx",
  "lib/jobs-v2/**/*.ts",
  "lib/jobs-v2/**/*.tsx",
];

const HEX = String.raw`#[0-9a-fA-F]{3,8}`;
const FONT_LIGHT = String.raw`var\(\s*--font-light`;

const NO_RAW_COLOUR_MESSAGE =
  "jobs-v2: no raw hex colours. Use a token from components/jobs-v2/ui/jobsTokens.ts " +
  "(J.*, var(--j-*)) so the scope's dark block can re-point it. See the redesign spec, 2.3.";

const NO_FONT_LIGHT_MESSAGE =
  "jobs-v2: `var(--font-light)` is a TEXT token, not a surface. Use J.surface / J.onDark. " +
  "See the redesign spec, 2.3.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: JOBS_TREES,
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${HEX}/]`,
          message: NO_RAW_COLOUR_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${HEX}/]`,
          message: NO_RAW_COLOUR_MESSAGE,
        },
        {
          selector: `Literal[value=/${FONT_LIGHT}/]`,
          message: NO_FONT_LIGHT_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${FONT_LIGHT}/]`,
          message: NO_FONT_LIGHT_MESSAGE,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
