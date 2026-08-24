/**
 * The certificates module contract, mirroring docs/specs/certificates-module.md.
 *
 * One casing rule runs through this whole file and it is deliberate, not an
 * oversight: everything the backend serialises is snake_case EXCEPT the keys
 * inside `design`, which are camelCase because that object is passed straight
 * into the React artwork component as drawing parameters (palette tokens,
 * ornamentLevel, fieldPlacements). Backend and frontend agreed on that split so
 * the artwork component never has to rename anything at render time. Do not
 * "tidy" one side into the other: the wire format is the contract.
 *
 * Fields the spec pins down exactly are required. Fields the spec implies but
 * does not enumerate (admin template/tier/rule bookkeeping) are optional on
 * purpose: the backend is being written in parallel, and an optional key that
 * turns up missing shows as `undefined` at the call site instead of the type
 * system promising a value that was never sent.
 */

/* ------------------------------------------------------------------ *
 * Canvas + design primitives
 * ------------------------------------------------------------------ */

/**
 * Every certificate renders on this fixed canvas (the sqrt-2 A4-landscape
 * ratio) so a single export path - html-to-image at pixelRatio 2.5 into a
 * jsPDF ('l','mm','a4') at 297x210mm - works for every layout.
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

/** The six text fields an uploaded background can position. */
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
 * For an ISSUED certificate this is the frozen `design_snapshot`: editing or
 * deleting the template it came from must never rewrite a credential someone
 * has already shared on LinkedIn, so the server's copy always wins over
 * anything the frontend can recompute from a preset.
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
  /** kind="upload" only. */
  backgroundUrl: string | null;
  /** kind="upload" only. */
  fieldPlacements: CertificateFieldPlacements | null;
}

/* ------------------------------------------------------------------ *
 * Render payload - the single shape the artwork component consumes
 * ------------------------------------------------------------------ */

export type CertificateStatus = "issued" | "revoked";

/**
 * What earned the certificate. The kinds below are the ones the spec names;
 * the string escape hatch is there because a new source kind shipping on the
 * backend must degrade to "render it with the label the server sent", never to
 * a type error in a component that only wanted `label`.
 */
export type CertificateSourceKind =
  | "adaptive_course"
  | "assessment"
  | "points_tier"
  | (string & Record<never, never>);

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
}

/* ------------------------------------------------------------------ *
 * Admin: templates, tiers, rules, issued
 * ------------------------------------------------------------------ */

/** One row of GET admin/clients/<cid>/presets/: the server's copy of presets.py. */
export interface CertificatePresetSummary {
  slug: CertificatePresetSlug;
  label: string;
  dark: boolean;
  metalLabel: string;
  ornamentLevel: CertificateOrnamentLevel;
  brandAccent: boolean;
  palette: CertificatePalette;
}

/**
 * A reusable design. The design-shaped keys stay camelCase here too, because a
 * template is just an unissued `design` plus the copy that goes on it.
 */
export interface CertificateTemplate {
  id: number;
  name: string;
  kind: CertificateDesignKind;
  layout: CertificateLayout;
  preset: CertificatePresetSlug;
  /** Heading, e.g. "Certificate of Completion". */
  title: string;
  tagline: string;
  bandLabel?: string;
  sealCode?: string;
  /**
   * Design overrides layered on top of the preset when the tenant wanted this
   * one template a little different: a heavier frame, or a metal that matches a
   * sponsor. Omit them and the preset's own values stand.
   *
   * These two are the only template keys the spec's Endpoints section does not
   * name outright, and they are here because the spec's own render payload puts
   * `ornamentLevel` and `palette` inside `design`. A template is an unissued
   * design plus its copy, so a design the admin tuned has to be storable
   * somewhere or the tuning cannot survive a page reload. Optional on both
   * sides, so a backend that resolves everything from the preset simply never
   * sends them and the editor falls back to the preset values it already has.
   */
  ornamentLevel?: CertificateOrnamentLevel;
  /** Partial: only the tokens the admin actually changed. */
  palette?: Partial<CertificatePalette> | null;
  /** kind="upload" only: the asset returned by the upload-asset endpoint. */
  backgroundUrl?: string | null;
  fieldPlacements?: CertificateFieldPlacements | null;
  is_default?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** POST/PATCH body for a template. Every key optional on PATCH. */
export type CertificateTemplateWrite = Partial<
  Omit<CertificateTemplate, "id" | "created_at" | "updated_at">
>;

/** POST admin/clients/<cid>/templates/upload-asset/ */
export interface CertificateAssetUploadResponse {
  url: string;
  /** Present when the backend echoes what it stored. */
  name?: string;
  size?: number;
  content_type?: string;
}

/**
 * A rung on the points ladder: a threshold bound to a template. Seeded per
 * client from the default 7-rung ladder, then admin-editable.
 */
export interface CertificateTier {
  id: number;
  /** 1..7 in the seeded ladder; the ordering the learner climbs. */
  rank: number;
  slug: string;
  name: string;
  short_name: string;
  /** Two letters, struck into the seal and the credential id, e.g. "LF". */
  code: string;
  points: number;
  template_id: number | null;
  /** Expanded template when the serialiser inlines it. */
  template?: CertificateTemplate | null;
  is_active?: boolean;
}

export type CertificateTierWrite = Partial<
  Omit<CertificateTier, "id" | "template">
>;

/** Rules attach to a course or to an assessment. */
export type CertificateRuleScope = "course" | "assessment";

/** What has to be true on that object for the template to be awarded. */
export type CertificateRuleCriterion = "completion" | "participation" | "excellence";

export interface CertificateRule {
  id: number;
  scope: CertificateRuleScope;
  course_id: number | null;
  assessment_id: number | null;
  criterion: CertificateRuleCriterion;
  /** Percent the criterion needs, when the criterion is a threshold one. */
  threshold: number | null;
  template_id: number | null;
  template?: CertificateTemplate | null;
  is_active?: boolean;
}

/** Query for GET admin/clients/<cid>/rules/ */
export interface CertificateRuleQuery {
  scope?: CertificateRuleScope;
  course_id?: number;
  assessment_id?: number;
}

/**
 * PUT admin/clients/<cid>/rules/ is a BULK REPLACE for one scope+object, not a
 * patch: the array you send becomes the complete rule set for that course or
 * assessment. Send every rule you want to keep.
 */
export interface CertificateRulesBulkPayload {
  scope: CertificateRuleScope;
  course_id?: number | null;
  assessment_id?: number | null;
  rules: Array<
    Partial<Omit<CertificateRule, "id" | "template" | "scope">> & {
      id?: number;
      criterion: CertificateRuleCriterion;
      template_id: number | null;
    }
  >;
}

/**
 * The credential a learner holds. Immutable: `title`, `tagline`,
 * `threshold_at_issue` and `design_snapshot` are frozen copies taken at
 * issuance so editing or deleting a template cannot rewrite history.
 */
export interface IssuedCertificate {
  id: number;
  credential_id: string;
  status: CertificateStatus;
  title: string;
  subtitle?: string;
  tagline: string;
  threshold_at_issue: number | null;
  design_snapshot: CertificateDesign;
  source: CertificateSource;
  recipient_name: string;
  recipient_email?: string;
  student_id?: number;
  issued_at: string;
  revoked_at?: string | null;
  revoked_reason?: string | null;
  verify_url?: string;
}

/** Query for GET admin/clients/<cid>/issued/ */
export interface IssuedCertificateQuery {
  search?: string;
  status?: CertificateStatus;
  source_kind?: CertificateSourceKind;
  tier_slug?: string;
  course_id?: number;
  assessment_id?: number;
  page?: number;
  page_size?: number;
}

/** DRF-shaped page of issued certificates. */
export interface IssuedCertificateList {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: IssuedCertificate[];
}

/** GET admin/clients/<cid>/overview/ - the numbers on the module landing page. */
export interface CertificatesOverview {
  templates_count: number;
  tiers_count: number;
  rules_count: number;
  issued_count: number;
  revoked_count?: number;
  learners_with_certificates?: number;
  recent_issued?: IssuedCertificate[];
}

/** Query for GET admin/clients/<cid>/preview/ (fake recipient, real design). */
export interface CertificatePreviewQuery {
  template_id?: number;
  tier_id?: number;
  /** Preview an unsaved picker state without creating a template first. */
  preset?: CertificatePresetSlug;
  layout?: CertificateLayout;
  recipient_name?: string;
}

/* ------------------------------------------------------------------ *
 * Learner
 * ------------------------------------------------------------------ */

/**
 * Where the gating points came from. Backend computes the total as
 * `Sum(adaptive_journey.PointsWallet.total)` + `community_points_total`, and
 * the learner's dashboard shows that same number: the breakdown is here so the
 * certificates page can explain a total that must never diverge from it.
 */
export interface CertificatePointsBreakdown {
  adaptive: number;
  community: number;
}

/** A ladder rung as the learner sees it: reached, or still N points away. */
export interface LearnerTierStatus {
  rank: number;
  slug: string;
  name: string;
  short_name: string;
  code: string;
  points: number;
  achieved: boolean;
  /** Set once the tier has actually been issued to this learner. */
  credential_id: string | null;
  /** Points still needed; 0 once the threshold is crossed. */
  points_remaining?: number;
}

/**
 * Something the learner has earned but not yet pulled. Mirrors the render
 * payload's `source` shape so the claim button knows which endpoint to POST:
 * points_tier -> tiers/<slug>/claim/, adaptive_course -> courses/<id>/claim/,
 * assessment -> assessments/<id>/claim/.
 */
export interface ClaimableCertificate {
  kind: CertificateSourceKind;
  id: number | null;
  label: string;
  tier_slug?: string | null;
  title?: string;
}

export interface LearnerCertificatesResponse {
  points_total: number;
  /** Optional because the spec's Endpoints section does not list it. Nothing
   *  renders it yet, so a backend that omits it costs the page nothing; typing
   *  it required would have been a type-level lie that reads as a crash. */
  points_breakdown?: CertificatePointsBreakdown;
  issued: IssuedCertificate[];
  tiers: LearnerTierStatus[];
  /**
   * Earned but not yet pulled.
   *
   * The spec's Endpoints line calls this key `pending` while the payload work
   * was specified as `claimable`, and the backend is being written in parallel,
   * so which one ships is still open. `claimable` is the name the whole
   * frontend reads; `pending` is accepted as an alias and normalised away in
   * learnerCertificatesService.list. Without that, the mismatch would not throw
   * anywhere: every consumer guards with `?? []`, so the claim strip would just
   * never appear and a learner would silently be unable to pull a certificate
   * they had earned.
   */
  claimable?: ClaimableCertificate[];
  /** @see claimable - the spec's name for the same list. Read only by the
   *  service normaliser; never read a component off this. */
  pending?: ClaimableCertificate[];
}

/** POST .../claim/ returns the credential that was issued (or already existed:
 *  issuance is an idempotent get_or_create, so claiming twice is harmless). */
export interface ClaimCertificateResponse {
  credential_id: string;
  certificate: IssuedCertificate;
  /** False when the claim resolved to a credential the learner already had. */
  created?: boolean;
}
