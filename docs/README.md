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

**Filenames are lowercase kebab-case** — `development-guidelines.md`, not the SCREAMING_SNAKE_CASE
these files used to have. Same rule as the backend repo.

**Cite documents by PATH, not by name** — `docs/guides/development-guidelines.md`, not
`DEVELOPMENT_GUIDELINES`. A path survives `git grep` *and* tells the reader where to look; a bare
name does neither once files move. Nothing in this repo's source cites a doc today; the backend has
~39 such citations, which is why the rule exists. If you rename a cited document, update its
citations in the same commit.

**Date point-in-time documents.** An audit or RCA without a date is impossible to trust later — say
up front when it was written and against which branch or environment.

**Binary documents live here too.** A PDF is documentation even though it cannot be diffed or
grepped. Prefer Markdown for anything the team maintains; keep PDFs for what is genuinely
distributed or produced as a PDF.

**Colocated `README.md` files stay put.** `components/community/README.md`, `lib/telemetry/README.md`
and `public/assets/fonts/README.md` explain the code sitting next to them. They are not project
documentation and should not be moved here.

## Contents

### guides/
- [`development-guidelines.md`](guides/development-guidelines.md) — conventions for working in this
  codebase.

### reference/
- [`api-contract.md`](reference/api-contract.md) — the backend contract this app consumes.
  *(Was `API_CONTRACT (1).md`; the `(1)` was a browser-download artefact and nothing referenced it.)*
- [`admin-dashboard-export-2026-02-15-to-2026-02-22.pdf`](reference/admin-dashboard-export-2026-02-15-to-2026-02-22.pdf)
  — a print-to-PDF of the admin dashboard for the week of 2026-02-15. Kept as a record of what the
  export produced; note the charts did not render, so the file is mostly blank. If the export is
  meant to be usable, that is the bug to fix, not this file.

### audits/
- [`assessment-mgmt-fe-revamp-rca.md`](audits/assessment-mgmt-fe-revamp-rca.md) — assessment
  management frontend revamp analysis.

### modules/
- [`mock-interview-admin-dashboard.md`](modules/mock-interview-admin-dashboard.md)
- [`mock-interview-structure.md`](modules/mock-interview-structure.md)
