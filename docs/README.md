# Documentation

All project documentation lives here. The repository root holds only `README.md`.

This mirrors the structure in the backend repo, so the same rule applies in both places.

## Where does a new document go?

| Folder | What belongs there | Test |
|---|---|---|
| `guides/` | Conventions and how-tos for people writing code here | Would a new engineer read this before their first PR? |
| `reference/` | Contracts and specs consumed rather than read start-to-finish | Do you look things *up* in it? |
| `audits/` | RCA and audit reports — **point-in-time findings** | Does it describe problems found on a specific date? |
| `modules/` | Deep dives on **one feature area** | Is it scoped to a single module? |
| `plans/` | Proposals not yet built (create when first needed) | Does it describe work not yet finished? |

If a document spans two, file it by its **primary purpose** — an audit that also proposes fixes is
still an audit.

## Conventions

**Date point-in-time documents.** An audit or RCA without a date is impossible to trust later — say
up front when it was written and against which branch or environment.

**Colocated `README.md` files stay put.** `components/community/README.md`, `lib/telemetry/README.md`
and `public/assets/fonts/README.md` explain the code sitting next to them. They are not project
documentation and should not be moved here.

**Check for citations before renaming.** Nothing in this repo's source cites a doc by filename today
(unlike the backend, where ~27 code comments do), but run `git grep "<OLD-NAME>"` before any rename
so that stays true.

## Contents

### guides/
- [`DEVELOPMENT_GUIDELINES.md`](guides/DEVELOPMENT_GUIDELINES.md) — conventions for working in this
  codebase.

### reference/
- [`API_CONTRACT.md`](reference/API_CONTRACT.md) — the backend contract this app consumes.
  *(Was `API_CONTRACT (1).md`; the `(1)` was a browser-download artefact and nothing referenced it.)*

### audits/
- [`ASSESSMENT-MGMT-FE-REVAMP-RCA.md`](audits/ASSESSMENT-MGMT-FE-REVAMP-RCA.md) — assessment
  management frontend revamp analysis.

### modules/
- [`MOCK_INTERVIEW_ADMIN_DASHBOARD.md`](modules/MOCK_INTERVIEW_ADMIN_DASHBOARD.md)
- [`MOCK_INTERVIEW_STRUCTURE.md`](modules/MOCK_INTERVIEW_STRUCTURE.md)
