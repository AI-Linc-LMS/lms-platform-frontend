# ATS Feature – Development Guidelines Compliance

Comparison of today’s ATS-related code changes with `DEVELOPMENT_GUIDELINES.md`.

---

## Compliant

| Guideline | Status | Notes |
|-----------|--------|--------|
| **TypeScript** | Yes | All new code is TypeScript. |
| **"use client"** | Yes | `ATSScoreCard.tsx` has `"use client"` at top. |
| **Comments** | Yes | Comments removed; code is self-explanatory where possible. |
| **Import order** | Yes | React → third-party (MUI, i18next) → internal/components → types. |
| **Named exports** | Yes | `ATSScoreCard`, `computeStandardATSScoreReport`, `computeATSScore`, etc. are named exports. |
| **Props interface** | Yes | `ATSScoreCardProps` and other interfaces are defined and used. |
| **Single responsibility** | Yes | Components/modules have a clear, focused role. |
| **useState initial values** | Yes | All `useState` calls have initial values. |
| **useCallback / useMemo** | Yes | `runAIAnalysis`, `runAIAnalysisWithoutJob`, `setAiResultFromData` use `useCallback`; `report`, `overall`, `standardReport`, etc. use `useMemo`. |
| **Styling: sx prop** | Yes | MUI `sx` is used; no raw inline `style` for layout/theme. |
| **Colors** | Yes | Colors come from global CSS variables (`var(--ats-*)`, `var(--border-default)`, etc.), not hex in components. |
| **Spacing** | Yes | MUI spacing scale used (e.g. `p: 2`, `gap: 1`, `mb: 2`). |
| **Type safety** | Yes | No `any`; `unknown` and proper types used (e.g. in API response handling). |
| **Optional chaining** | Yes | Used for nullable data (e.g. `report.detailedReport?.executiveSummary`). |
| **IconWrapper** | Yes | Icons use `IconWrapper` with `size` and `color` (no `sx` on IconWrapper). |
| **Loading states** | Yes | `aiLoading` and `CircularProgress` for async analysis. |
| **Environment variables** | Yes | `GEMINI_API_KEY` from `process.env`, not committed or exposed to client. |
| **File naming** | Yes | `ATSScoreCard.tsx` (PascalCase), `atsScore.ts` / `atsStandardReport.ts` in feature folder; API route under `app/api/ats-analyze/`. |

---

## Gaps and Fixes

| Guideline | Gap | Fix |
|-----------|-----|-----|
| **Component size** (§ Component Development) | “Keep components under 300 lines.” `ATSScoreCard` is ~910 lines. | Not changed in this pass. Recommend splitting into smaller components (e.g. `ATSScoreGauge`, `ATSScoreBreakdown`, `ATSCtaBlock`, `ATSDetailedReport`) in a follow-up. |
| **Error feedback** (§ Error Handling) | “Use the useToast hook for user feedback” for errors. ATS currently only sets `aiError` and shows it in the UI. | **Fixed.** `useToast` is used; `showToast(message, "error")` is called when analysis fails (in both `runAIAnalysis` and `runAIAnalysisWithoutJob`). |
| **Accessibility** (§ Accessibility) | “Add ARIA labels for interactive elements.” IconButton (info) and action buttons have no `aria-label`. | **Fixed.** `aria-label` added to the info `IconButton` (tooltip text) and to “Analyze with AI” / “Check for job role” buttons. |
| **API services** (§ API Services) | Guidelines show a `lib/services` pattern with a single service object. ATS uses `fetch` inside the component. | Optional: add `lib/services/ats.service.ts` (or similar) that wraps the ATS API and is used by `ATSScoreCard`. Kept as-is for this pass; route is only used by this feature. |

---

## Summary

- **Compliant:** Import order, TypeScript, types, naming, styling (sx + CSS variables), hooks (useCallback/useMemo), loading and error state handling, security (env vars), IconWrapper, and overall structure match the guidelines.
- **Addressed in code:** Error feedback (useToast) and accessibility (aria-labels) are fixed below.
- **Deferred:** Reducing `ATSScoreCard` below 300 lines (split into subcomponents) and optional ATS service module are left for a later refactor.
