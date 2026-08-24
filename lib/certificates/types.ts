/**
 * The certificates module contract, reconciled against the real backend
 * (certificates/serializers.py, views.py, admin_views.py).
 *
 * ONE CASING RULE, WITH TWO PRINCIPLED EXCEPTIONS.
 *
 * Everything the backend serialises is snake_case EXCEPT the DESIGN
 * VOCABULARY, which is camelCase because those objects are passed straight
 * into the React artwork component as drawing parameters. The design
 * vocabulary is: every key inside a `design` block, every key of a preset
 * summary (`metalLabel`, `ornamentLevel`, `brandAccent`), and the
 * `fieldPlacements` key space including `credentialId`. `resolved_palette` is
 * snake_case because it is a computed server field, not part of that
 * vocabulary.
 *
 * Do not "tidy" one side into the other: the wire format is the contract, and
 * a template's WRITE side is snake_case (`band_label`, `seal_code`,
 * `ornament_level`, `palette_overrides`, `field_placements`) while its READ
 * side hands back a resolved camelCase `design`. `toWriteShape` /
 * `fromDesign` at the bottom of this file are the only places that translation
 * is allowed to happen.
 *
 * Fields are REQUIRED when the backend always sends them. An optional key here
 * means the backend genuinely omits it, never "the backend is still being
 * written": an optional key that always arrives is a type-level lie that hides
 * a mismatch instead of surfacing it.
 */

/* ------------------------------------------------------------------ *
 * Canvas + design primitives
 * ------------------------------------------------------------------ */

/**
 * Every certificate renders on this fixed canvas (the sqrt-2 A4-landscape
 * ratio) so a single export path - html-to-image at pixelRatio 2.5 into a
 * jsPDF ('l','mm','a4') at 297x210mm - works for every layout.
 *
 * The server publishes the same numbers on `GET presets/` as `canvas`; these
 * constants are the compile-time mirror of that.
 */
export const CERTIFICATE_CANVAS_WIDTH = 1000;
export const CERTIFICATE_CANVAS_HEIGHT = 707;

/** `design` artwork drawn in code from a palette, or an admin-uploaded background. */
export type CertificateDesignKind = "design" | "upload";

/** kind="upload" ignores the layout and draws text fields over the background. */
export type CertificateLayout = "classic" | "panel" | "minimal";

/** The 10 seeded presets. A tenant never invents a slug; it picks one of these. */
export type CertificatePresetSlug =
  | "brand-classic"
  | "brand-minimal"
  | "brand-obsidian"
  | "sapphire"
  | "emerald"
  | "amethyst"
  | "bronze"
  | "platinum"
  | "gold"
  | "grand-gold";

/** How much ornamentation the artwork draws: 1 is a hairline, 7 is grand gold. */
export type CertificateOrnamentLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * The palette token set, identical for every preset. `bg` is a full CSS
 * background value (the presets use radial-gradients), the rest are colours.
 */
export interface CertificatePalette {
  bg: string;
  ink: string;
  sub: string;
  faint: string;
  accent: string;
  accentDeep: string;
  metal: string;
  metalDeep: string;
  metalInk: string;
  frame: string;
  pattern: string;
}

/** The six text fields an uploaded background can position. Matches the
 *  backend's `PLACEMENT_FIELDS` exactly; a seventh would store a placement
 *  that silently never draws. */
export type CertificateFieldName =
  | "recipient"
  | "title"
  | "subtitle"
  | "date"
  | "credentialId"
  | "metric";

export interface CertificateFieldPlacement {
  /** 0..1 fraction of the canvas width, not pixels, so the same placement
   *  survives the export scale-up and any future canvas change. */
  x: number;
  /** 0..1 fraction of the canvas height. */
  y: number;
  size: number;
  weight: number;
  color: string;
  align: "left" | "center" | "right";
  font: string;
}

export type CertificateFieldPlacements = Partial<
  Record<CertificateFieldName, CertificateFieldPlacement>
>;

/**
 * The drawing parameters. camelCase throughout (see the file header).
 *
 * For an ISSUED certificate this is the frozen snapshot the server took at
 * issuance: editing or deleting the template it came from must never rewrite a
 * credential someone has already shared on LinkedIn, so the server's copy
 * always wins over anything the frontend can recompute from a preset.
 */
export interface CertificateDesign {
  kind: CertificateDesignKind;
  layout: CertificateLayout;
  preset: CertificatePresetSlug;
  dark: boolean;
  palette: CertificatePalette;
  metalLabel: string;
  ornamentLevel: CertificateOrnamentLevel;
  /** Band across the artwork, e.g. "CERTIFICATE OF COMPLETION". */
  bandLabel: string;
  /** Two letters struck into the wax seal, and the middle segment of the
   *  credential id, e.g. "CO". */
  sealCode: string;
  /** kind="upload" only. Re-signed by the server on every render and NEVER
   *  persisted: the stored value is a storage key (see CertificateAsset). */
  backgroundUrl: string | null;
  /** kind="upload" only. */
  fieldPlacements: CertificateFieldPlacements | null;
}

/* ------------------------------------------------------------------ *
 * Render payload - the single shape the artwork component consumes
 * ------------------------------------------------------------------ */

export type CertificateStatus = "issued" | "revoked";

/**
 * What earned the certificate. These three are the whole of the backend's
 * `SOURCE_KIND_CHOICES`, and there is deliberately NO string escape hatch: the
 * `| (string & {})` that used to sit here is exactly why TypeScript never
 * caught `points_tier` being sent where the wire says `points`.
 */
export type CertificateSourceKind = "adaptive_course" | "assessment" | "points";

export interface CertificateSource {
  kind: CertificateSourceKind;
  /** Course / assessment / tier row id. Null when the source has no row. */
  id: number | null;
  label: string;
}

/** Always the CLIENT's identity: a certificate carries the tenant's brand. */
export interface CertificateIssuer {
  name: string;
  logo_url: string | null;
  /** The tenant's theme colour, substituted into brandAccent presets. */
  accent: string;
  signatory_name: string;
  signatory_title: string;
  signature_url: string | null;
}

/** Small stat chips under the recipient, e.g. { label: "Completion", value: "100%" }. */
export interface CertificateMetric {
  label: string;
  value: string;
}

/**
 * `services.render_payload`. The admin preview, the learner list, the learner
 * detail, the claim response and the public verification page all return
 * exactly this, which is why one component draws all five.
 */
export interface CertificateRenderPayload {
  credential_id: string;
  status: CertificateStatus;
  title: string;
  subtitle: string;
  tagline: string;
  recipient_name: string;
  issued_at: string;
  verify_url: string;
  issuer: CertificateIssuer;
  source: CertificateSource;
  metrics: CertificateMetric[];
  design: CertificateDesign;
  /** Set on rows adapted from the pre-module `adaptive_journey.JourneyCertificate`.
   *  Additive, and there for support: "why does this one look different" is
   *  answerable from the payload. */
  legacy?: boolean;
  /** Only on `admin/clients/<cid>/preview/`, alongside a `…PREVIEW000`
   *  credential id, so a preview can never be mistaken for a real credential. */
  preview?: boolean;
  /** Only on the preview endpoint: the saved template the preview started from. */
  template_id?: number;
  /** Only on the PUBLIC credential endpoint, which is the one surface answering a yes/no
   *  question rather than rendering a wallet. It equals `status === "issued"`, so it is
   *  derivable, but the server is the side entitled to decide what "verified" means and a
   *  verification page should print the server's answer rather than recompute it. */
  verified?: boolean;
}

/* ------------------------------------------------------------------ *
 * Admin: presets
 * ------------------------------------------------------------------ */

/** One entry of `GET admin/clients/<cid>/presets/`.`presets[]`. */
export interface CertificatePresetSummary {
  slug: CertificatePresetSlug;
  label: string;
  dark: boolean;
  metalLabel: string;
  ornamentLevel: CertificateOrnamentLevel;
  brandAccent: boolean;
  /** The preset as authored. */
  palette: CertificatePalette;
  /** What a template using this preset would actually draw for THIS tenant:
   *  the three brandAccent presets have the workspace colour substituted in.
   *  This, not `palette`, is what the picker should render swatches from. */
  resolved_palette: CertificatePalette;
}

export interface CertificateLabelledChoice<T extends string = string> {
  value: T;
  label: string;
}

/** The whole of `GET admin/clients/<cid>/presets/` - the design vocabulary the
 *  admin picker is built from, served from the backend so a frontend list can
 *  never offer a preset the API then rejects. */
export interface CertificatePresetsResponse {
  presets: CertificatePresetSummary[];
  palette_tokens: Array<keyof CertificatePalette>;
  layouts: CertificateLabelledChoice<CertificateLayout>[];
  kinds: CertificateLabelledChoice<CertificateDesignKind>[];
  canvas: { width: number; height: number };
  placement_fields: CertificateFieldName[];
  placement_keys: Array<keyof CertificateFieldPlacement>;
  issuer: CertificateIssuer;
}

/* ------------------------------------------------------------------ *
 * Admin: templates
 * ------------------------------------------------------------------ */

/**
 * A background image, stored as a STORAGE KEY and never as a URL.
 * `AWS_S3_QUERYSTRING_EXPIRE` is seven days, so a persisted signed URL gives
 * every certificate printed on this background a picture that 403s a week
 * later, on a public page a graduate has already linked from LinkedIn. The
 * write serializer refuses a URL here for exactly that reason.
 */
export interface CertificateAsset {
  /** The storage key from the upload endpoint's `key` field. */
  name: string;
  alt?: string;
}

/** How many rungs, rules and credentials point at a template. What makes the
 *  archive action honest: an admin can see what archiving will orphan. */
export interface CertificateTemplateUsage {
  tiers: number;
  rules: number;
  issued: number;
}

/** The two-or-three fields a tier/rule row needs to name its template. */
export interface CertificateTemplateRef {
  id: number;
  slug: string;
  name: string;
  kind: CertificateDesignKind;
  layout: CertificateLayout;
  preset: CertificatePresetSlug;
  is_archived: boolean;
}

/**
 * A reusable design, as `CertificateTemplateSerializer` sends it.
 *
 * There is deliberately NO `title` and NO `tagline`: a template is a design, and
 * baking a title into it would mean a tenant needing a separate template per
 * course. A certificate's title comes from the rule's `label` or the course
 * config at mint time.
 *
 * `design` is the fully resolved camelCase block, identical to the one on a
 * render payload, so the picker can draw real artwork for a template that has
 * never issued anything. Preview from THAT rather than reassembling one.
 */
export interface CertificateTemplate {
  id: number;
  slug: string;
  name: string;
  description: string;
  kind: CertificateDesignKind;
  layout: CertificateLayout;
  preset: CertificatePresetSlug;
  /** Only the tokens the admin actually changed; the preset supplies the rest. */
  palette_overrides: Partial<CertificatePalette> | null;
  ornament_level: CertificateOrnamentLevel | null;
  band_label: string;
  seal_code: string;
  asset: CertificateAsset | null;
  /** Signed fresh on every read. Never send this back. */
  asset_url: string | null;
  field_placements: CertificateFieldPlacements | null;
  /**
   * `is_active` is "offer this in pickers"; `is_archived` is "this design is
   * retired and must not be bound or issued". They are NOT the same flag:
   * eligibility and both write validators filter on `is_archived`, and DELETE
   * sets both. Collapsing them removes an admin's ability to quietly retire a
   * design from the picker without breaking the courses already using it.
   */
  is_active: boolean;
  is_archived: boolean;
  /** The tenant default for one source kind, consulted by `_template_for`
   *  after the rule and tier bindings and before the seeded slug fallback.
   *  Null on every template that is not a default. */
  default_for: CertificateSourceKind | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  design: CertificateDesign;
  usage: CertificateTemplateUsage;
}

/** `GET admin/clients/<cid>/templates/` */
export interface CertificateTemplateListResponse {
  templates: CertificateTemplate[];
  count: number;
}

/** Server-side filters on the template list. */
export interface CertificateTemplateQuery {
  /** Archived rows are hidden unless this is set. */
  include_archived?: boolean;
  kind?: CertificateDesignKind;
  /** Matches name or slug. */
  q?: string;
}

/**
 * POST/PATCH body for a template, in the backend's own snake_case. Every key
 * optional on PATCH; `CertificateTemplateWriteSerializer` rejects any key not
 * listed here, so nothing may be added speculatively.
 */
export interface CertificateTemplateWrite {
  slug?: string;
  name?: string;
  description?: string;
  kind?: CertificateDesignKind;
  layout?: CertificateLayout;
  preset?: CertificatePresetSlug;
  palette_overrides?: Partial<CertificatePalette> | null;
  ornament_level?: CertificateOrnamentLevel | null;
  band_label?: string;
  seal_code?: string;
  asset?: CertificateAsset | null;
  field_placements?: CertificateFieldPlacements | null;
  is_active?: boolean;
  is_archived?: boolean;
  default_for?: CertificateSourceKind | null;
}

/** `DELETE admin/clients/<cid>/templates/<id>/` - an ARCHIVE, and a 200 with
 *  the archived row rather than a 204. */
export type CertificateTemplateArchiveResponse = CertificateTemplate & {
  archived: true;
  detail: string;
};

/**
 * `POST admin/clients/<cid>/templates/upload-asset/`.
 *
 * The response names its own destination field: store `key` at `asset.name`.
 * `url` is signed, short-lived and for the admin's eyes only.
 */
export interface CertificateAssetUploadResponse {
  key: string;
  url: string | null;
  filename: string;
  module: string;
  uploaded_file_id: number;
  asset: { key_field: string; value: string };
}

/* ------------------------------------------------------------------ *
 * Admin: tiers (the points ladder)
 * ------------------------------------------------------------------ */

/**
 * A rung on the points ladder: a threshold bound to a template. Seeded per
 * client from the default 7-rung ladder, then admin-editable.
 */
export interface CertificateTier {
  id: number;
  /** 1..7 in the seeded ladder; the ordering the learner climbs. Unique per client. */
  rank: number;
  slug: string;
  name: string;
  short_name: string;
  /** Two letters, struck into the seal and the credential id, e.g. "LF". */
  code: string;
  tagline: string;
  /** The FLOOR that gates this rung, not a learner's balance. */
  points_threshold: number;
  template: CertificateTemplateRef | null;
  template_id: number | null;
  is_active: boolean;
  /** Whether `tiers/reset-defaults/` would overwrite this rung. */
  is_default: boolean;
  design: CertificateDesign | null;
  /** Why DELETE is dangerous: removing a rung that has awarded credentials
   *  NULLs their tier FK and disarms the partial unique that stops the sweep
   *  minting them a second time. */
  issued_count: number;
}

/** POST/PATCH body for a rung. `points_threshold` is REQUIRED on create. */
export interface CertificateTierWrite {
  rank?: number;
  slug?: string;
  name?: string;
  short_name?: string;
  code?: string;
  tagline?: string;
  points_threshold?: number;
  template_id?: number | null;
  is_active?: boolean;
}

/** `GET admin/clients/<cid>/tiers/` */
export interface CertificateTierListResponse {
  tiers: CertificateTier[];
  count: number;
  /** The slugs `reset-defaults/` would restore, so the reset button can say
   *  what it will touch. */
  default_slugs: string[];
}

/** `POST admin/clients/<cid>/tiers/reset-defaults/` */
export interface CertificateTierResetResponse {
  tiers: CertificateTier[];
  detail: string;
}

/* ------------------------------------------------------------------ *
 * Admin: rules
 * ------------------------------------------------------------------ */

/**
 * Rules attach to an ADAPTIVE COURSE or to an assessment.
 *
 * `adaptive_course`, never `course`: this codebase has two course models
 * (`lms_core.Course` and `adaptive_quiz.AdaptiveCourse`) and the ambiguity is
 * what let a legacy course id reach an endpoint that resolves against the
 * adaptive one. It also matches `CertificateSourceKind`, so a rule's scope and
 * the credential it issues read as the same word.
 */
export type CertificateRuleScope = "adaptive_course" | "assessment";

/**
 * A local UI preset key, NOT a wire field. The backend stores a free-text
 * `label` so an institution can name a band "With Honours" instead of choosing
 * from three hard-coded English words; these three only seed a new row.
 */
export type CertificateRuleCriterion = "completion" | "participation" | "excellence";

/** One band: "at or above this percent on this object, award this template". */
export interface CertificateRule {
  id: number;
  scope: CertificateRuleScope;
  /** The read-side key. Note `adaptive_course_id`, not `course_id`. */
  adaptive_course_id: number | null;
  assessment_id: number | null;
  /** Free text, e.g. "Distinction". May be blank. */
  label: string;
  /** The floor this band fires at, 0..100. */
  min_percent: number;
  template: CertificateTemplateRef | null;
  /** Never null: a rule with no template awards nothing, so the column is a
   *  non-nullable CASCADE FK. */
  template_id: number;
  order: number;
  is_active: boolean;
}

/** Query for `GET admin/clients/<cid>/rules/`. The write side calls the same
 *  number `course_id`; only the READ side says `adaptive_course_id`. */
export interface CertificateRuleQuery {
  scope?: CertificateRuleScope;
  course_id?: number;
  assessment_id?: number;
}

/** One row inside a bulk replace. `template_id` is required and non-nullable. */
export interface CertificateRuleItemWrite {
  id?: number;
  label?: string;
  min_percent?: number;
  template_id: number;
  order?: number;
  is_active?: boolean;
}

/**
 * `PUT admin/clients/<cid>/rules/` is a BULK REPLACE for one scope+object, not
 * a patch: the array you send becomes the complete rule set for that course or
 * assessment. Send every rule you want to keep.
 *
 * Send `course_id` ONLY with scope `adaptive_course` and `assessment_id` ONLY
 * with scope `assessment` - the backend rejects the sibling being present at
 * all, so omit the key rather than sending null.
 */
export interface CertificateRulesBulkPayload {
  scope: CertificateRuleScope;
  course_id?: number;
  assessment_id?: number;
  rules: CertificateRuleItemWrite[];
}

/** `GET admin/clients/<cid>/rules/` */
export interface CertificateRuleListResponse {
  rules: CertificateRule[];
  count: number;
  scope: CertificateRuleScope | null;
  course_id: number | null;
  assessment_id: number | null;
}

/** `PUT admin/clients/<cid>/rules/` - `removed` is how many bands the replace
 *  deleted, which is the one thing a bulk replace has to be able to report. */
export interface CertificateRuleBulkResponse extends CertificateRuleListResponse {
  scope: CertificateRuleScope;
  removed: number;
}

/* ------------------------------------------------------------------ *
 * Admin: issued register
 * ------------------------------------------------------------------ */

/** Identity, nested: `recipient_name` is the frozen name PRINTED on the
 *  document and can legitimately differ from the account's current name, so a
 *  flat `recipient_email` beside it would invite exactly that confusion. */
export interface IssuedCertificateStudent {
  profile_id: number;
  name: string;
  email: string;
}

/**
 * A credential as the admin register lists it. Every value is read from the
 * row's snapshot columns and never recomputed.
 *
 * There is deliberately no `design` block: an eleven-token palette across 25
 * rows is dead weight, and the register is a table. Open the artwork on demand
 * through `verify_url` or the preview endpoint.
 */
export interface IssuedCertificate {
  id: number;
  credential_id: string;
  status: CertificateStatus;
  source_kind: CertificateSourceKind;
  title: string;
  subtitle: string;
  tagline: string;
  /** The name printed on the document, frozen at issuance. */
  recipient_name: string;
  issuer_name: string;
  student: IssuedCertificateStudent;
  source: CertificateSource;
  metrics: CertificateMetric[];
  completion_percent: number | null;
  score_percent: number | null;
  points_at_issue: number | null;
  threshold_at_issue: number | null;
  serial_no: string;
  template_id: number | null;
  tier_id: number | null;
  rule_id: number | null;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  verify_url: string;
}

/** Query for `GET admin/clients/<cid>/issued/`. */
export interface IssuedCertificateQuery {
  /** Free text over credential id, recipient, title, subtitle, serial and the
   *  learner's email or username. */
  q?: string;
  status?: CertificateStatus;
  source_kind?: CertificateSourceKind;
  /** A tier slug OR a tier id; the backend accepts either. */
  tier?: string | number;
  course_id?: number;
  assessment_id?: number;
  page?: number;
  /** Capped at 200 server-side. */
  page_size?: number;
}

/** Page-numbered, not cursor-based: use `num_pages`, there is no next/previous. */
export interface IssuedCertificateList {
  results: IssuedCertificate[];
  count: number;
  page: number;
  page_size: number;
  num_pages: number;
}

/* ------------------------------------------------------------------ *
 * Admin: overview + preview
 * ------------------------------------------------------------------ */

export interface CertificatesOverviewCounts {
  templates: number;
  active_templates: number;
  archived_templates: number;
  tiers: number;
  active_tiers: number;
  rules: number;
  active_rules: number;
  /** How many COURSES have a rule, which is the question "criteria set" is
   *  actually asking - not how many rule rows exist. */
  ruled_courses: number;
  ruled_assessments: number;
  issued: number;
  live: number;
  revoked: number;
}

/** `GET admin/clients/<cid>/overview/` - the numbers on the module landing page. */
export interface CertificatesOverview {
  client: { id: number; name: string };
  issuer: CertificateIssuer;
  counts: CertificatesOverviewCounts;
  issued_by_source: Partial<Record<CertificateSourceKind, number>>;
  /** What THIS request seeded. Zeros on every call after the first, which is
   *  how "never configured" is told apart from "configured then emptied". */
  seeded: { templates: number; tiers: number };
  ladder: CertificateTier[];
  recent_issued: IssuedCertificate[];
}

/**
 * `GET|POST admin/clients/<cid>/preview/` - the render payload for a design,
 * without issuing anything, built by the same `render_payload` a learner gets.
 *
 * There is no `tier_id`: preview a rung by passing its `template_id` plus
 * `source_kind: "points"`.
 */
export interface CertificatePreviewQuery {
  template_id?: number;
  slug?: string;
  preset?: CertificatePresetSlug;
  layout?: CertificateLayout;
  kind?: CertificateDesignKind;
  band_label?: string;
  seal_code?: string;
  ornament_level?: CertificateOrnamentLevel;
  palette_overrides?: Partial<CertificatePalette> | null;
  source_kind?: CertificateSourceKind;
  title?: string;
  subtitle?: string;
  tagline?: string;
  recipient_name?: string;
}

/* ------------------------------------------------------------------ *
 * Learner
 * ------------------------------------------------------------------ */

/**
 * Where the gating points came from. `total` is the same number the response's
 * own `points_total` carries (the view reads it from here), so the two can
 * never disagree. Surfacing the split answers the most common support question
 * about this feature: "why does the ladder think I have fewer points than the
 * dashboard says".
 */
export interface CertificatePointsBreakdown {
  total: number;
  adaptive: number;
  community: number;
}

/** A ladder rung as the learner sees it. The whole ACTIVE ladder is sent,
 *  locked rungs included and carrying artwork, so the UI can blur-preview what
 *  is still ahead. */
export interface LearnerTierStatus {
  id: number;
  slug: string;
  rank: number;
  name: string;
  short_name: string;
  code: string;
  tagline: string;
  /** The floor, not the learner's balance. */
  points_threshold: number;
  /** Crossed the threshold. */
  unlocked: boolean;
  /** Holds the document. Genuinely different from `unlocked`: a learner can be
   *  unlocked and not yet have claimed. */
  issued: boolean;
  credential_id: string | null;
  /** Points still needed; 0 once the threshold is crossed. */
  remaining_points: number;
  /** Computed server-side WITH a divide-by-zero guard for threshold-0 rungs. */
  progress_percent: number;
  /** POST here to claim. Server-supplied; never assemble it. */
  claim_path: string;
  /** The frozen snapshot for an issued rung, the live design otherwise - so a
   *  tenant that rebound a rung to a custom template sees it on a locked card. */
  design: CertificateDesign | null;
}

/**
 * Something the learner has earned but not yet pulled.
 *
 * Three real element shapes, discriminated on `kind`: a points rung carries
 * `slug`, an adaptive course carries `completion_percent`/`threshold`, an
 * assessment carries neither. All three carry `claim_path`, which is the only
 * URL that should ever be POSTed to.
 */
export type ClaimableCertificate =
  | {
      kind: "points";
      id: number;
      slug: string;
      label: string;
      claim_path: string;
    }
  | {
      kind: "adaptive_course";
      id: number;
      label: string;
      completion_percent: number;
      threshold: number;
      claim_path: string;
    }
  | {
      kind: "assessment";
      id: number;
      label: string;
      claim_path: string;
    };

/** `GET me/certificates/` - the learner's whole certificate wall in one call. */
export interface LearnerCertificatesResponse {
  points_total: number;
  points_breakdown: CertificatePointsBreakdown;
  /**
   * These are FULL RENDER PAYLOADS, not register rows: the server already
   * resolved the design and the metrics. Legacy `JourneyCertificate` rows are
   * appended here too, flagged `legacy: true`.
   */
  issued: CertificateRenderPayload[];
  tiers: LearnerTierStatus[];
  /** Earned but not yet pulled. The backend has only ever called this
   *  `claimable`; the `pending` alias the client used to tolerate is gone. */
  claimable: ClaimableCertificate[];
}

/**
 * `POST .../claim/`. Always 200, on the first claim and on every repeat: the
 * endpoint is idempotent and `created` carries the one bit that differs, which
 * is what drives the confetti.
 *
 * The body is a FLATTENED render payload - byte-identical to the detail and
 * public-verify payloads - so there is no nested `certificate` key and no
 * reason to follow up with a `detail()` round trip.
 */
export type ClaimCertificateResponse = CertificateRenderPayload & {
  created: boolean;
  /** Claiming one rung mints every rung the learner has crossed; the ones they
   *  did not press the button for come back here. Render them or a learner who
   *  crosses three rungs at once is shown one and silently granted three. */
  also_issued?: CertificateRenderPayload[];
};

/**
 * The 409 body every ineligible claim returns.
 *
 * `code` matters: LOCKED is "go and earn more", UNAVAILABLE is a tenant
 * misconfiguration and is not the learner's fault - telling somebody who
 * finished a course to go and earn more points is the wrong answer.
 */
export interface CertificateClaimRefusal {
  detail: string;
  code: "CERTIFICATE_LOCKED" | "CERTIFICATE_UNAVAILABLE";
  reason?: string;
  /** adaptive_course refusals. */
  completion_percent?: number;
  threshold?: number;
  /** points refusals. */
  shortfall?: number;
  points_total?: number;
}

/* ------------------------------------------------------------------ *
 * Template draft <-> wire translation
 *
 * The ONLY place camelCase design vocabulary is turned into snake_case write
 * columns, and back. Open-coding this per field is how seven keys ended up
 * being posted under names the serializer had never heard of.
 * ------------------------------------------------------------------ */

/**
 * What the template editor holds while the admin works. camelCase because it
 * is a design under a cursor; `toWriteShape` is what makes it a request body.
 */
export interface CertificateTemplateDraft {
  id?: number;
  name?: string;
  description?: string;
  kind?: CertificateDesignKind;
  layout?: CertificateLayout;
  preset?: CertificatePresetSlug;
  bandLabel?: string;
  sealCode?: string;
  ornamentLevel?: CertificateOrnamentLevel;
  /** Overrides only, never the resolved palette: posting the whole thing would
   *  freeze a brand template's accent at today's tenant colour. */
  palette?: Partial<CertificatePalette> | null;
  /** The stored background, as a storage key. */
  asset?: CertificateAsset | null;
  /**
   * A signed, short-lived URL for drawing the background in the editor.
   * EPHEMERAL: it is never submitted, and on reload it comes from the server's
   * `asset_url` rather than from anything persisted.
   */
  previewUrl?: string | null;
  fieldPlacements?: CertificateFieldPlacements | null;
  defaultFor?: CertificateSourceKind | null;
  isActive?: boolean;
  isArchived?: boolean;
}

/** The design-vocabulary half of a draft, read out of a resolved `design`
 *  block. The palette is deliberately NOT taken from here: `design.palette` is
 *  fully resolved, and a draft holds overrides. */
export function fromDesign(
  design: CertificateDesign,
): Pick<
  CertificateTemplateDraft,
  "kind" | "layout" | "preset" | "bandLabel" | "sealCode" | "ornamentLevel"
> {
  return {
    kind: design.kind,
    layout: design.layout,
    preset: design.preset,
    bandLabel: design.bandLabel,
    sealCode: design.sealCode,
    ornamentLevel: design.ornamentLevel,
  };
}

/**
 * A draft as the write serializer wants it.
 *
 * `previewUrl` is dropped on purpose - it is the signed URL, and the backend
 * 400s a URL in `asset.name`. Placement and asset data only travel for an
 * upload template; a designed one sends null so switching kinds actually
 * clears them.
 */
export function toWriteShape(draft: CertificateTemplateDraft): CertificateTemplateWrite {
  const isUpload = (draft.kind ?? "design") === "upload";
  const overrides = draft.palette && Object.keys(draft.palette).length > 0 ? draft.palette : null;
  return {
    name: draft.name?.trim(),
    description: draft.description?.trim() ?? "",
    kind: draft.kind ?? "design",
    layout: draft.layout ?? "classic",
    preset: draft.preset,
    band_label: draft.bandLabel?.trim() ?? "",
    seal_code: (draft.sealCode ?? "").trim().toUpperCase(),
    ornament_level: draft.ornamentLevel ?? null,
    palette_overrides: overrides,
    asset: isUpload ? draft.asset ?? null : null,
    field_placements: isUpload ? draft.fieldPlacements ?? null : null,
    is_active: draft.isActive ?? true,
  };
}

/**
 * The three pinned rows the rule editors offer, as a UI convenience that
 * produces `{label, min_percent}`. They are a good default ladder; they are not
 * a wire field, and identity across reloads comes from the server `id`.
 */
export const CRITERION_PRESETS: Record<
  CertificateRuleCriterion,
  { labelKey: string; labelFallback: string }
> = {
  completion: {
    labelKey: "certificatesUpload.criterionLabelCompletion",
    labelFallback: "Course completion",
  },
  participation: {
    labelKey: "certificatesUpload.criterionLabelParticipation",
    labelFallback: "Participation",
  },
  excellence: {
    labelKey: "certificatesUpload.criterionLabelExcellence",
    labelFallback: "Excellence",
  },
};
