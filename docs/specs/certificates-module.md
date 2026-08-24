# Certificates module — contract spec

One module replaces four disconnected certificate systems. Backend owns issuance,
eligibility and design metadata; the frontend owns rendering and export.

## Vocabulary

- **Template** — a reusable design. Either `kind="design"` (parametric artwork drawn in
  code from a palette + ornament level) or `kind="upload"` (admin-supplied background
  image with text field placements). Always carries the CLIENT's name and logo.
- **Tier** — a rung on the points ladder: a points threshold bound to a template.
- **Rule** — "when this criterion is met on this course/assessment, award this template".
- **Issued certificate** — the credential a learner actually holds. Immutable snapshot.

## Canvas

Every certificate renders on a fixed **1000 x 707** px canvas (the sqrt-2 A4-landscape
ratio). Export: `html-to-image` toPng at pixelRatio 2.5 -> jsPDF `('l','mm','a4')`
addImage at 297x210mm. One canvas size for every layout so export is uniform.

## Layouts

| layout | look |
|---|---|
| `classic` | centred, ornate: double frame, guilloche, corner flourishes, wax seal. Ported from the zskillup reference. |
| `panel`   | light content panel + dark branded sidebar carrying logo, seal and credential id. |
| `minimal` | generous whitespace, single hairline rule, small seal, no guilloche. |
| (`upload`)| kind="upload" ignores layout and draws text fields over the uploaded background. |

## Design presets (`certificates/presets.py`, mirrored at `lib/certificates/presets.ts`)

Palette token set, identical for every preset:
`bg, ink, sub, faint, accent, accentDeep, metal, metalDeep, metalInk, frame, pattern`
plus `dark: bool`, `metalLabel: str`, `ornamentLevel: 1..7`.

Brand presets (`brandAccent: true`) substitute `accent`/`accentDeep` with the tenant's
theme colour at render time, so a tenant's certificates match its app.

| slug | dark | metalLabel | ornament | brandAccent | default role |
|---|---|---|---|---|---|
| `brand-classic`   | no  | Brand    | 4 | yes | course completion |
| `brand-minimal`   | no  | Brand    | 2 | yes | assessment participation |
| `brand-obsidian`  | yes | Brand    | 5 | yes | assessment excellence |
| `sapphire`        | no  | Sapphire | 3 | no  | points tier 1 |
| `emerald`         | no  | Emerald  | 3 | no  | points tier 2 |
| `amethyst`        | no  | Amethyst | 4 | no  | points tier 3 |
| `bronze`          | yes | Bronze   | 4 | no  | points tier 4 |
| `platinum`        | yes | Platinum | 5 | no  | points tier 5 |
| `gold`            | yes | Gold     | 6 | no  | points tier 6 |
| `grand-gold`      | yes | Grand Gold | 7 | no | points tier 7 |

Palettes for `sapphire`..`grand-gold` are the verbatim zskillup CERT_THEMES values.

## Default points ladder (seeded per client, then admin-editable)

| rank | slug | short name | code | points |
|---|---|---|---|---|
| 1 | learning-foundations   | Learning Foundations   | LF | 1500 |
| 2 | learning-achievement   | Learning Achievement   | LA | 3000 |
| 3 | learning-excellence    | Learning Excellence    | LE | 5000 |
| 4 | skill-readiness        | Skill Readiness        | SR | 10000 |
| 5 | skill-proficiency      | Skill Proficiency      | SP | 25000 |
| 6 | skill-excellence       | Skill Excellence       | SE | 50000 |
| 7 | skill-mastery          | Skill Mastery          | SM | 100000 |

## Points source of truth

`certificates/points.py::learner_points_total(student)` =
`Sum(adaptive_journey.PointsWallet.total for student)` + `community_forum.points.community_points_total(student)`.

This is the number the learner already sees. `adaptive_journey/views.py LearnerPointsTotalView`
must be refactored to call this helper so the gate and the displayed number cannot diverge.

## Issuance

Idempotent `get_or_create` keyed by `(student, source_kind, source_object, tier)`.
Three entry points, all landing in `certificates/services.py`:

1. **Eager** — `transaction.on_commit` after a score/points write. Throttled per
   (student, client) with a 5-minute cache key.
2. **Pull** — learner POSTs a claim endpoint. Same gate, same code path.
3. **Sweep** — a Celery beat task backfills learners who crossed a threshold before
   the feature shipped, or whose eager evaluation was missed.

Snapshots on the row (`title`, `tagline`, `threshold_at_issue`, `design_snapshot`) so
editing or deleting a template NEVER rewrites an already-issued credential.

## Credential id

`AILINC-<2-letter source/tier code>-<10 chars>` from the Crockford-style alphabet
`ABCDEFGHJKMNPQRSTVWXYZ23456789`, rejection-sampled against modulo bias. Existing
`AILINC-<10 hex>` ids stay valid and resolvable unchanged.

## Render payload (the single shape the FE artwork component consumes)

```jsonc
{
  "credential_id": "AILINC-CO-4KMQ7XR2TB",
  "status": "issued",                       // issued | revoked
  "title": "Certificate of Completion",
  "subtitle": "Data Structures and Algorithms",
  "tagline": "for outstanding dedication and achievement",
  "recipient_name": "Utkarsh Singh",
  "issued_at": "2026-08-24T10:12:00Z",
  "verify_url": "https://learn.example.com/credentials/AILINC-CO-4KMQ7XR2TB",
  "issuer": {
    "name": "AI Linc", "logo_url": "https://.../logo.png", "accent": "#2f6bd8",
    "signatory_name": "", "signatory_title": "", "signature_url": null
  },
  "source": { "kind": "adaptive_course", "id": 404, "label": "Data Structures and Algorithms" },
  "metrics": [ { "label": "Completion", "value": "100%" } ],
  "design": {
    "kind": "design",                       // design | upload
    "layout": "classic",                    // classic | panel | minimal
    "preset": "brand-classic",
    "dark": false,
    "palette": { "bg": "...", "ink": "...", "sub": "...", "faint": "...",
                 "accent": "...", "accentDeep": "...", "metal": "...",
                 "metalDeep": "...", "metalInk": "...", "frame": "...", "pattern": "..." },
    "metalLabel": "Brand",
    "ornamentLevel": 4,
    "bandLabel": "CERTIFICATE OF COMPLETION",
    "sealCode": "CO",
    "backgroundUrl": null,                  // kind=upload only
    "fieldPlacements": null                 // kind=upload only
  }
}
```

`fieldPlacements` (kind=upload) is `{ field: {x, y, size, weight, color, align, font} }`
with `x`/`y` as 0..1 fractions of the canvas. Fields: `recipient`, `title`, `subtitle`,
`date`, `credentialId`, `metric`.

## Endpoints

Mounted under `/certificates/api/`.

### Admin (tenant admin, gated on `admin_certificates`)
```
GET    admin/clients/<cid>/overview/
GET    admin/clients/<cid>/presets/
GET    admin/clients/<cid>/templates/
POST   admin/clients/<cid>/templates/
GET    admin/clients/<cid>/templates/<id>/
PATCH  admin/clients/<cid>/templates/<id>/
DELETE admin/clients/<cid>/templates/<id>/
POST   admin/clients/<cid>/templates/<id>/duplicate/
POST   admin/clients/<cid>/templates/upload-asset/
GET    admin/clients/<cid>/tiers/
POST   admin/clients/<cid>/tiers/
PATCH  admin/clients/<cid>/tiers/<id>/
DELETE admin/clients/<cid>/tiers/<id>/
POST   admin/clients/<cid>/tiers/reset-defaults/
GET    admin/clients/<cid>/rules/?scope=&course_id=&assessment_id=
PUT    admin/clients/<cid>/rules/          # bulk replace for one scope+object
GET    admin/clients/<cid>/issued/
POST   admin/clients/<cid>/issued/<id>/revoke/
POST   admin/clients/<cid>/issued/<id>/reinstate/
GET    admin/clients/<cid>/preview/        # render payload for a template, fake recipient
```

### Learner
```
GET    me/certificates/                    # {points_total, issued[], tiers[], pending[]}
GET    me/certificates/<credential_id>/    # full render payload
POST   me/certificates/tiers/<slug>/claim/
POST   me/certificates/courses/<course_id>/claim/
POST   me/certificates/assessments/<assessment_id>/claim/
```

### Public (no auth, throttled)
```
GET    /certificates/api/credentials/<credential_id>/
```
`/adaptive-journey/api/credentials/<credential_id>/` keeps resolving — already-shared
LinkedIn credentials must not 404.
