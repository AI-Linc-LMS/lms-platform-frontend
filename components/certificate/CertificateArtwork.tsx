"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificates/types";
import type {
  CertificateDesign,
  CertificateFieldName,
  CertificateFieldPlacement,
  CertificateFieldPlacements,
  CertificateMetric,
  CertificatePalette,
  CertificateRenderPayload,
} from "@/lib/certificates/types";
import { getPreset, resolvePalette } from "@/lib/certificates/presets";
import {
  formatCertificateDate,
  recipientFontSize,
  verifyUrlFor,
} from "@/lib/certificates/format";
import { Corner, DiamondRule, Guilloche, Seal } from "./ornaments";

/**
 * The one component that renders every certificate this platform issues: three
 * parametric layouts plus admin-uploaded backgrounds, all on the same fixed
 * 1000x707 canvas so a single export path serves all of them.
 *
 * TWO DECISIONS THAT LOOK LIKE STYLE VIOLATIONS AND ARE NOT:
 *
 * 1. Plain divs with inline styles, no MUI `sx`, anywhere inside the canvas.
 *    A certificate is a fixed-size document, not app chrome: it has no light and
 *    dark variant to honour because its colours ARE the design, frozen into
 *    `design_snapshot` at issuance. More practically, `sx` compiles to Emotion
 *    classes in a stylesheet, and export has to reach those rules through
 *    CSSStyleSheet.cssRules - the exact call that needed the cross-origin patch
 *    in lib/utils/pdf-generation.utils.ts before certificate exports would work
 *    at all. Inline styles are carried on the cloned node itself and cannot fail
 *    that way. The surrounding chrome (see CertificatePreview) is MUI and is
 *    theme-aware; the document inside it is not.
 *
 * 2. No hooks and no data fetching in the render path. html-to-image rasterises
 *    whatever is in the DOM at capture time, so anything that resolves one tick
 *    late lands in the learner's PNG as a blank patch nobody notices until it is
 *    on LinkedIn. Translated document copy therefore arrives as a `labels` prop
 *    that the caller resolves ahead of time (useCertificateArtworkLabels below
 *    does that in one line).
 *
 * Every colour is read from the resolved palette. The only literal colours in
 * this file are pure black and pure white, and they exist solely as endpoints
 * for deriving a legible contrast against a palette colour, never as a design
 * choice - see CONTRAST_LIGHT / CONTRAST_DARK.
 */

/* ------------------------------------------------------------------ *
 * Type stacks
 * ------------------------------------------------------------------ */

/** Satoshi is self-hosted from app/globals.css, so it is same-origin and
 *  html-to-image can inline it. A webfont on a third-party host cannot be
 *  embedded and silently falls back mid-export. */
const SANS = '"Satoshi", "Satoshi Variable", ui-sans-serif, system-ui, sans-serif';
const DISPLAY = SANS;
const SERIF = 'Georgia, "Times New Roman", "Iowan Old Style", serif';
/** Also self-hosted (globals.css), and already used by the previous certificate
 *  component, so learners who have one of those recognise the hand. */
const SCRIPT = '"Alex Brush", "Brush Script MT", "Segoe Script", cursive';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/**
 * Average glyph advance, in em, for each face the artwork sets. Measured in a
 * headless render at 1000x707 rather than guessed: a 33-character signatory in
 * Alex Brush measured 361px at 30px (0.365em), and a 40-character recipient in
 * Georgia measured 1046px at 54px (0.484em). The uppercase, 2px-tracked caption
 * face measures 0.836em INCLUDING its tracking, which is why it has its own
 * entry instead of sharing the sans number.
 *
 * These only ever drive `fitFontSize`, which shrinks text so it fits. Being
 * slightly wrong is safe in both directions: too generous and the ellipsis that
 * is still on every one of these nodes catches it, too mean and the line is
 * merely a point or two smaller than it had to be.
 */
const ADVANCE_EM = {
  script: 0.365,
  serif: 0.484,
  sans: 0.5,
  /** Glyphs only. The caption face is set with 2px of tracking, which is a flat
   *  per-character cost that does NOT scale with font size, so it is passed to
   *  fitFontSize separately instead of being folded in here. Folding it in is
   *  what left the classic signatory title 10px over its 210px box: the fold is
   *  only correct at the one size it was measured at. */
  caption: 0.636,
} as const;

/**
 * The largest size at or below `base` that fits `text` into `boxWidth`.
 *
 * Certificates are the one surface where truncating is not an acceptable
 * fallback: "Dr. Evangelina Christodoulopo..." under the signature line is not
 * a cosmetic problem, it is the wrong person's name on a credential. A
 * headless pass over every layout found the signatory clipped at 210px in
 * classic, 230px in panel and 200px in minimal for a perfectly ordinary
 * 33-character name, and a 40-character recipient overrunning the upload
 * layout's default placement by 110px.
 *
 * Shrinking is deliberately preferred to wrapping: these blocks sit in a fixed
 * footer, and a second line pushes the row down rather than being absorbed.
 *
 * `min` keeps the result legible; below it the node's own ellipsis takes over,
 * because a name too long to set at all is better cut than set at 4px.
 */
function fitFontSize(
  text: string,
  boxWidth: number,
  base: number,
  advanceEm: number,
  min: number,
  /** Letter-spacing in px. A fixed cost per character that does not scale with
   *  the font size, so it comes off the budget before the size is solved for.
   *  Counted once per character including the last, because CSS emits the
   *  trailing gap too. */
  trackingPx = 0,
): number {
  const len = (text || "").trim().length;
  if (!len || boxWidth <= 0) return base;
  const perChar = boxWidth / len - trackingPx;
  if (perChar <= 0) return min;
  const needed = perChar / advanceEm;
  if (needed >= base) return base;
  return Math.max(min, Math.floor(needed));
}

/* ------------------------------------------------------------------ *
 * Colour helpers
 * ------------------------------------------------------------------ */

/**
 * Contrast endpoints. Not palette colours and not design choices: they are the
 * two poles a derived colour is mixed toward when the artwork needs "a legible
 * version of this palette colour on a dark ground" and the palette does not ship
 * one. Deriving them keeps the panel sidebar readable for all ten presets
 * without hardcoding a tenth set of sidebar tokens.
 */
const CONTRAST_LIGHT = "#ffffff";
const CONTRAST_DARK = "#000000";

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function toChannels(hex: string): [number, number, number] | null {
  if (!HEX_RE.test(hex)) return null;
  let body = hex.slice(1);
  if (body.length === 3) {
    body = body
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/**
 * Mix a colour toward a target by `ratio`. Returns the input untouched when it
 * is not a plain hex, so a tenant that stored `var(--brand)` or an rgb() string
 * as its accent degrades to "no derived shade" instead of painting an NaN onto
 * something a learner will print.
 *
 * This intentionally duplicates the private `shade()` in lib/certificates/presets.ts
 * rather than importing it: the artwork must be able to render a frozen
 * design_snapshot without touching the preset table at all, because an issued
 * certificate's colours are whatever the server baked in, not whatever the
 * preset says today.
 */
function mix(color: string, target: string, ratio: number): string {
  const from = toChannels(color);
  const to = toChannels(target);
  if (!from || !to) return color;
  const out = from.map((c, i) =>
    Math.max(0, Math.min(255, Math.round(c + (to[i] - c) * ratio))),
  );
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** rgba() form of a hex, for scrims and hairlines. Falls back to the opaque
 *  colour when the input is not hex, which is dimmer than intended but never
 *  invisible. */
function tint(color: string, alpha: number): string {
  const c = toChannels(color);
  if (!c) return color;
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

/**
 * A dark ground for the panel layout's sidebar, derived so it stays dark for all
 * ten presets. Light presets already carry a near-black `ink`; dark presets
 * carry a light `ink` and a mid-dark `frame`, so those derive from `frame`
 * instead. Reading `bg` is not an option: it is a full CSS gradient string, not
 * a colour, and cannot be composed.
 */
function sidebarGround(palette: CertificatePalette, dark: boolean): string {
  const base = dark
    ? mix(palette.frame, CONTRAST_DARK, 0.55)
    : mix(palette.ink, CONTRAST_DARK, 0.1);
  const crown = mix(palette.accentDeep, CONTRAST_DARK, dark ? 0.35 : 0.08);
  return `linear-gradient(165deg, ${crown} 0%, ${base} 58%, ${mix(base, CONTRAST_DARK, 0.35)} 100%)`;
}

/* ------------------------------------------------------------------ *
 * Document copy
 * ------------------------------------------------------------------ */

export interface CertificateArtworkLabels {
  /** Above the recipient name. */
  presentedTo: string;
  /** Prefix on the issue date. */
  issued: string;
  /** Under the signature rule when the tenant set no signatory title. */
  issuingAuthority: string;
  /** Above the credential id in the footer. */
  credentialId: string;
  /** Prefix on the verify host line. */
  verifyAt: string;
  /** Struck under the code on the seal. */
  certified: string;
  /** Stamped across a revoked credential. */
  revoked: string;
}

export const DEFAULT_CERTIFICATE_LABELS: CertificateArtworkLabels = {
  presentedTo: "This certificate is proudly presented to",
  issued: "Issued",
  issuingAuthority: "Issuing authority",
  credentialId: "Credential ID",
  verifyAt: "Verify at",
  certified: "Certified",
  revoked: "Revoked",
};

/**
 * Resolves the document copy through i18n so the caller can hand
 * them to <CertificateArtwork labels={...} /> as a plain object. Deliberately a
 * hook the CALLER runs, not something the artwork does for itself: see the file
 * header on why nothing inside the canvas may resolve late.
 */
export function useCertificateArtworkLabels(): CertificateArtworkLabels {
  const { t } = useTranslation("common");
  return {
    presentedTo: t(
      "certificatesUpload.artPresentedTo",
      DEFAULT_CERTIFICATE_LABELS.presentedTo,
    ),
    issued: t("certificatesUpload.artIssued", DEFAULT_CERTIFICATE_LABELS.issued),
    issuingAuthority: t(
      "certificatesUpload.artIssuingAuthority",
      DEFAULT_CERTIFICATE_LABELS.issuingAuthority,
    ),
    credentialId: t(
      "certificatesUpload.artCredentialId",
      DEFAULT_CERTIFICATE_LABELS.credentialId,
    ),
    verifyAt: t("certificatesUpload.artVerifyAt", DEFAULT_CERTIFICATE_LABELS.verifyAt),
    certified: t(
      "certificatesUpload.artCertified",
      DEFAULT_CERTIFICATE_LABELS.certified,
    ),
    revoked: t("certificatesUpload.artRevoked", DEFAULT_CERTIFICATE_LABELS.revoked),
  };
}

/* ------------------------------------------------------------------ *
 * Upload field placement defaults
 * ------------------------------------------------------------------ */

/**
 * Where the six text fields go on an uploaded background when the template has
 * no `fieldPlacements` yet.
 *
 * This exists because of an entirely predictable admin flow: upload a
 * background, hit save, and look at the result before dragging anything. With no
 * fallback every field renders at (0,0) in black and the admin sees six lines of
 * text stacked in the top-left corner of their artwork and concludes the feature
 * is broken. These coordinates are a plausible centred certificate instead, so
 * the first render is a starting point rather than a bug report.
 *
 * Colours here are the one place a literal is unavoidable: an uploaded
 * background has no palette, and its ink is whatever the admin's artwork wants.
 * Near-black on the assumption of light stationery is the safer default, and the
 * admin overrides per field from the placement editor.
 */
export const DEFAULT_FIELD_PLACEMENTS: Required<CertificateFieldPlacements> = {
  title: {
    x: 0.5,
    y: 0.26,
    size: 34,
    weight: 800,
    color: "#1b1f2a",
    align: "center",
    font: DISPLAY,
  },
  recipient: {
    x: 0.5,
    y: 0.46,
    size: 54,
    weight: 400,
    color: "#1b1f2a",
    align: "center",
    font: SERIF,
  },
  subtitle: {
    x: 0.5,
    y: 0.58,
    size: 20,
    weight: 600,
    color: "#5b6373",
    align: "center",
    font: SANS,
  },
  metric: {
    x: 0.5,
    y: 0.68,
    size: 15,
    weight: 600,
    color: "#5b6373",
    align: "center",
    font: SANS,
  },
  date: {
    x: 0.28,
    y: 0.86,
    size: 14,
    weight: 600,
    color: "#5b6373",
    align: "center",
    font: SANS,
  },
  credentialId: {
    x: 0.72,
    y: 0.86,
    size: 13,
    weight: 700,
    color: "#5b6373",
    align: "center",
    font: MONO,
  },
};

/* ------------------------------------------------------------------ *
 * Props
 * ------------------------------------------------------------------ */

export interface CertificateArtworkProps {
  /** The full render payload from the backend, or a locally assembled preview
   *  of an unsaved admin design. Either way this is the only data source. */
  payload: CertificateRenderPayload;
  /**
   * Tenant theme colour for the three brandAccent presets. Defaults to
   * `payload.issuer.accent`. For an ISSUED certificate the server already
   * resolved the palette into `design.palette`, so passing this is a no-op and
   * the frozen snapshot still wins.
   */
  accent?: string | null;
  /** Translated document copy. Falls back to English when omitted. */
  labels?: Partial<CertificateArtworkLabels>;
  /** BCP-47 tag for the issue date. */
  locale?: string;
  className?: string;
  /** Merged onto the canvas root, after the fixed size. Used by the preview
   *  wrapper for the corner radius; do not put a transform here. */
  style?: CSSProperties;
}

/* ------------------------------------------------------------------ *
 * Shared derived context
 * ------------------------------------------------------------------ */

interface LayoutContext {
  payload: CertificateRenderPayload;
  design: CertificateDesign;
  palette: CertificatePalette;
  labels: CertificateArtworkLabels;
  dark: boolean;
  level: number;
  /** Recipient name, and the size that keeps it on one line. */
  name: string;
  nameSize: number;
  dateText: string;
  /** Host of the verify URL, for the printed verification line. */
  verifyHost: string;
  metrics: CertificateMetric[];
  /** The big display line. See the comment where it is computed. */
  headline: string;
  bandLabel: string;
  logoUrl: string;
  clientName: string;
  signatoryName: string;
  signatoryTitle: string;
  signatureUrl: string;
}

/** Host only. The full URL is far too long to print legibly at 10px, and the
 *  credential id printed beside it is what a human actually types in. */
function hostOf(url: string): string {
  const stripped = (url || "").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return stripped.split("/")[0] || "";
}

/** The client name is the one string on the artwork with no length bound: a
 *  tenant can be "AI Linc" or "Institute of Advanced Computing and Analytics".
 *  Shrink the type and tighten the tracking rather than letting it wrap into
 *  the band label. */
function clientNameStyle(name: string, color: string): CSSProperties {
  const len = name.length;
  return {
    fontFamily: DISPLAY,
    fontWeight: 800,
    fontSize: len > 40 ? 12 : len > 26 ? 13 : 15,
    letterSpacing: len > 26 ? 2 : 5,
    color,
    textTransform: "uppercase",
    lineHeight: 1.25,
    maxWidth: 620,
    // Two lines maximum, then ellipsis. A third line pushes the band label into
    // the title and the whole top of the certificate loses its rhythm.
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
  } as CSSProperties;
}

/* ------------------------------------------------------------------ *
 * Small shared pieces
 * ------------------------------------------------------------------ */

/** The client logo. An <img> with referrerPolicy="no-referrer" and NO
 *  crossOrigin, matching what the previous certificate component learned the
 *  hard way: tenant logos live on arbitrary external hosts (GitHub raw, S3
 *  buckets, a marketing CDN), and asking for CORS makes those hosts refuse the
 *  request outright, which loses the logo on the page as well as in the export.
 *  Without it they usually render. next/image is not usable here either: the
 *  optimiser rejects unconfigured remote hosts. */
function ClientLogo({
  url,
  maxHeight,
  maxWidth,
  style,
}: {
  url: string;
  maxHeight: number;
  maxWidth: number;
  style?: CSSProperties;
}) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      style={{
        maxHeight,
        maxWidth,
        objectFit: "contain",
        display: "block",
        ...style,
      }}
    />
  );
}

function MetricChips({
  metrics,
  palette,
  compact = false,
}: {
  metrics: CertificateMetric[];
  palette: CertificatePalette;
  compact?: boolean;
}) {
  if (!metrics.length) return null;
  return (
    <>
      {metrics.map((m, i) => (
        <span
          key={`${m.label}-${i}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: compact ? 12 : 13,
            fontWeight: 700,
            color: palette.ink,
            border: `1px solid ${palette.frame}`,
            borderRadius: 999,
            padding: compact ? "5px 12px" : "6px 14px",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: palette.accent }}>&#9670;</span>
          {m.value}
          <span style={{ color: palette.sub, fontWeight: 600 }}>{m.label}</span>
        </span>
      ))}
    </>
  );
}

/** Signature: the tenant's uploaded image when it has one, otherwise the
 *  signatory's name set in a script hand. Never blank, because an empty
 *  signature line reads as an unfinished document. */
function SignatureBlock({
  ctx,
  align = "center",
  width = 210,
}: {
  ctx: LayoutContext;
  align?: "left" | "center";
  width?: number;
}) {
  const { palette, signatureUrl, signatoryName, signatoryTitle } = ctx;
  // The signatory is the authority on the document, so it shrinks to fit rather
  // than ellipsing: see fitFontSize for the headless measurements that showed
  // an ordinary long name being cut in all three layouts.
  const nameSize = fitFontSize(signatoryName, width, 30, ADVANCE_EM.script, 15);
  const titleSize = fitFontSize(signatoryTitle, width, 10, ADVANCE_EM.caption, 7, 2);
  return (
    <div style={{ width, textAlign: align }}>
      {signatureUrl ? (
        <ClientLogo
          url={signatureUrl}
          maxHeight={44}
          maxWidth={width}
          style={{ marginLeft: align === "center" ? "auto" : 0, marginRight: align === "center" ? "auto" : 0 }}
        />
      ) : (
        <div
          style={{
            fontFamily: SCRIPT,
            fontSize: nameSize,
            // Held at the 30px line box even when the glyphs shrink, so a long
            // signatory does not lift the rule underneath it and misalign the
            // footer against the seal and credential blocks beside it.
            lineHeight: `${Math.round(30 * 1.35)}px`,
            color: palette.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {signatoryName}
        </div>
      )}
      <div style={{ height: 1, background: palette.frame, margin: "6px 0" }} />
      <div
        style={{
          fontSize: titleSize,
          letterSpacing: 2,
          color: palette.sub,
          fontWeight: 700,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {signatoryTitle}
      </div>
    </div>
  );
}

function CredentialBlock({
  ctx,
  align = "center",
  width = 230,
}: {
  ctx: LayoutContext;
  align?: "left" | "center" | "right";
  width?: number;
}) {
  const { palette, payload, labels, verifyHost } = ctx;
  return (
    <div style={{ width, textAlign: align }}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 13,
          fontWeight: 700,
          color: palette.ink,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {payload.credential_id}
      </div>
      <div style={{ height: 1, background: palette.frame, margin: "6px 0" }} />
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          color: palette.sub,
          fontWeight: 600,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {verifyHost ? `${labels.verifyAt} ${verifyHost}` : labels.credentialId}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Layout: classic
 * ------------------------------------------------------------------ */

/** Centred and ornate: double frame, guilloche, four mirrored corner
 *  flourishes, a full-size seal in the footer. The direct port of the zskillup
 *  artwork, with the brand block at the top now carrying the CLIENT's identity
 *  instead of a hardcoded wordmark. */
function ClassicLayout({ ctx }: { ctx: LayoutContext }) {
  const { palette, level, labels, name, nameSize, dateText, metrics, headline, bandLabel, logoUrl, clientName, design, dark } = ctx;

  const corners = [
    [40, 40, 1, 1],
    [CERTIFICATE_CANVAS_WIDTH - 40, 40, -1, 1],
    [40, CERTIFICATE_CANVAS_HEIGHT - 40, 1, -1],
    [CERTIFICATE_CANVAS_WIDTH - 40, CERTIFICATE_CANVAS_HEIGHT - 40, -1, -1],
  ] as const;

  return (
    <>
      {level >= 2 && <Guilloche color={palette.pattern} level={level} />}

      {/* Double frame */}
      <div
        style={{
          position: "absolute",
          inset: 26,
          border: `2px solid ${palette.accentDeep}`,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 33,
          border: `1px solid ${palette.frame}`,
          borderRadius: 2,
        }}
      />

      {level >= 2 &&
        corners.map(([x, y, sx, sy], i) => (
          <svg
            key={i}
            style={{
              position: "absolute",
              left: x - (sx === 1 ? 0 : 64),
              top: y - (sy === 1 ? 0 : 64),
            }}
            width={64}
            height={64}
            viewBox="0 0 64 64"
            aria-hidden
          >
            <g
              transform={`scale(${sx},${sy}) translate(${sx === 1 ? 0 : -64}, ${
                sy === 1 ? 0 : -64
              })`}
            >
              <Corner color={palette.accent} deep={palette.accentDeep} level={level} />
            </g>
          </svg>
        ))}

      <div
        style={{
          position: "absolute",
          inset: 33,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "28px 66px 24px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Brand block: logo above the client name, stacked rather than in a row,
            because a tenant with both a wide logo and a long name overflows a
            row and there is no way to know which of the two matters more. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <ClientLogo url={logoUrl} maxHeight={40} maxWidth={210} />
          <div style={clientNameStyle(clientName, palette.ink)}>{clientName}</div>
        </div>

        {/* Everything between the brand block and the footer sits in its own
            centred column. Without it, `marginTop: auto` on the footer dumps all
            the slack into one gap below the metrics and the certificate reads
            top-heavy the moment a tagline is short or a metric is missing. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
        <div
          style={{
            fontSize: 12,
            letterSpacing: 6,
            color: palette.accent,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {bandLabel}
        </div>

        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: headline.length > 44 ? 32 : 42,
            lineHeight: 1.08,
            marginTop: 6,
            color: palette.ink,
            maxWidth: 780,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {headline}
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 17,
            color: palette.sub,
            marginTop: 14,
          }}
        >
          {labels.presentedTo}
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontSize: nameSize,
            lineHeight: 1.15,
            color: palette.accentDeep,
            marginTop: 4,
            maxWidth: 820,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>

        <div style={{ marginTop: 4 }}>
          <DiamondRule color={palette.frame} accent={palette.accent} />
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 16,
            lineHeight: 1.5,
            color: palette.sub,
            marginTop: 12,
            maxWidth: 600,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {ctx.payload.tagline}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 18,
            marginTop: 14,
          }}
        >
          <MetricChips metrics={metrics} palette={palette} />
          {dateText && (
            <span style={{ fontSize: 13, color: palette.sub }}>
              {labels.issued}{" "}
              <strong style={{ color: palette.ink }}>{dateText}</strong>
            </span>
          )}
        </div>

        </div>

        {/* Footer: signature | seal | credential. It sits after the flexed
            middle column, so it stays pinned to the inner frame no matter how
            much of that column was clamped away. */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <SignatureBlock ctx={ctx} />
          <div style={{ transform: "translateY(6px)" }}>
            <Seal
              palette={palette}
              level={level}
              code={design.sealCode}
              metalLabel={design.metalLabel}
              certifiedLabel={labels.certified}
              size={124}
              displayFont={DISPLAY}
              sansFont={SANS}
            />
          </div>
          <CredentialBlock ctx={ctx} />
        </div>
      </div>

      {/* A dark preset needs a touch of lift at the edges or the frame reads as
          a sticker sitting on the page rather than an impression in it. */}
      {dark && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(120% 90% at 50% 50%, transparent 55%, ${tint(
              CONTRAST_DARK,
              0.35,
            )} 100%)`,
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Layout: panel
 * ------------------------------------------------------------------ */

const PANEL_SIDEBAR_WIDTH = 288;

/**
 * Light content panel plus a dark branded sidebar carrying the logo, the seal
 * and the credential id. This is the shape of the certificate this platform has
 * been issuing all along (components/certificate/DynamicCertificate.tsx), moved
 * onto the shared 1000x707 canvas and driven entirely by the palette instead of
 * the seven hardcoded purples it used to carry.
 */
function PanelLayout({ ctx }: { ctx: LayoutContext }) {
  const { palette, level, labels, name, nameSize, dateText, metrics, headline, bandLabel, logoUrl, clientName, design, dark, payload } = ctx;

  const ground = sidebarGround(palette, dark);
  // Text on the sidebar has to survive whatever that derived ground turned out
  // to be, so it is derived against the light pole rather than read from the
  // palette (a light preset's `ink` is near-black and would vanish).
  const onSidebar = CONTRAST_LIGHT;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* Content panel */}
      <div
        style={{
          flex: 1,
          position: "relative",
          padding: "34px 44px 30px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {level >= 4 && (
          <Guilloche
            color={palette.pattern}
            level={level}
            width={CERTIFICATE_CANVAS_WIDTH - PANEL_SIDEBAR_WIDTH}
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 12,
              letterSpacing: 3,
              fontWeight: 700,
              color: palette.accent,
              textTransform: "uppercase",
            }}
          >
            {bandLabel}
          </span>
          {dateText && (
            <span style={{ fontSize: 12, color: palette.sub, whiteSpace: "nowrap" }}>
              {labels.issued}{" "}
              <strong style={{ color: palette.ink }}>{dateText}</strong>
            </span>
          )}
        </div>

        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: headline.length > 40 ? 32 : 40,
            lineHeight: 1.08,
            marginTop: 14,
            color: palette.ink,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {headline}
        </div>

        <div
          style={{
            width: 96,
            height: 3,
            borderRadius: 2,
            background: palette.accent,
            marginTop: 12,
          }}
        />

        {/* Header above, footer below, and the citation itself centred in
            whatever is left. Left top-anchored instead, a short tagline or a
            missing metric leaves a 150px hole above the signature. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 16,
            color: palette.sub,
            marginTop: 24,
          }}
        >
          {labels.presentedTo}
        </div>

        {/* Script hand at a larger size than the serif ladder, because Alex
            Brush has roughly two thirds the x-height of Georgia and the shared
            ladder in format.ts is tuned for the serif.
            The second term is a width budget rather than a length bucket: the
            panel is ~580px of usable line and the ladder in format.ts is sized
            for the classic layout's 820px, so a name that fits there ellipses
            here. 2.1 approximates a script face's average advance (~0.48em);
            nowrap plus the ellipsis below is still the backstop, but a shrunk
            name beats a truncated one on somebody's certificate. */}
        <div
          style={{
            fontFamily: SCRIPT,
            fontSize: Math.round(
              Math.min(nameSize * 1.22, (580 / Math.max(1, name.length)) * 2.1),
            ),
            lineHeight: 1.2,
            color: palette.accentDeep,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>

        <div
          style={{
            height: 2,
            background: tint(palette.frame, 0.9),
            marginTop: 6,
            width: "82%",
          }}
        />

        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 15,
            lineHeight: 1.55,
            color: palette.sub,
            marginTop: 16,
            maxWidth: 520,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
          }}
        >
          {payload.tagline}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 16,
          }}
        >
          <MetricChips metrics={metrics} palette={palette} compact />
        </div>

        </div>

        {/* Signature only. The credential id belongs to the sidebar in this
            layout, printed there with the verify host under it; repeating it
            here put the same code on the document twice, which reads as a
            rendering fault on something a learner posts publicly. */}
        <div style={{ paddingTop: 20 }}>
          <SignatureBlock ctx={ctx} align="left" width={230} />
        </div>
      </div>

      {/* Branded sidebar */}
      <div
        style={{
          width: PANEL_SIDEBAR_WIDTH,
          flexShrink: 0,
          background: ground,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "34px 22px 26px",
          textAlign: "center",
        }}
      >
        {/* The logo disc keeps a light plate behind the logo. Tenant logos are
            almost always dark-on-transparent, and dropping one straight onto a
            dark sidebar loses it entirely. With no logo the disc becomes a
            monogram of the client's initials so the sidebar is never headless. */}
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: "50%",
            border: `3px solid ${palette.metal}`,
            boxShadow: `0 0 26px ${tint(palette.accent, 0.55)}`,
            background: logoUrl
              ? tint(CONTRAST_LIGHT, 0.94)
              : `radial-gradient(circle at 30% 25%, ${tint(CONTRAST_LIGHT, 0.16)}, transparent 58%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: logoUrl ? 14 : 0,
            boxSizing: "border-box",
          }}
        >
          {logoUrl ? (
            <ClientLogo url={logoUrl} maxHeight={80} maxWidth={80} />
          ) : (
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 34,
                letterSpacing: 2,
                color: onSidebar,
              }}
            >
              {initialsOf(clientName)}
            </span>
          )}
        </div>

        <div
          style={{
            ...clientNameStyle(clientName, onSidebar),
            marginTop: 18,
            maxWidth: 240,
          }}
        >
          {clientName}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            letterSpacing: 3,
            lineHeight: 1.7,
            color: tint(onSidebar, 0.72),
            textTransform: "uppercase",
          }}
        >
          {payload.source.label || payload.title}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 18 }}>
          <Seal
            palette={palette}
            level={level}
            code={design.sealCode}
            metalLabel={design.metalLabel}
            certifiedLabel={labels.certified}
            size={104}
            displayFont={DISPLAY}
            sansFont={SANS}
          />
        </div>

        <div
          style={{
            marginTop: 26,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: 0.6,
            color: tint(onSidebar, 0.9),
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 240,
          }}
        >
          {payload.credential_id}
        </div>
        {ctx.verifyHost && (
          <div
            style={{
              marginTop: 4,
              fontSize: 9,
              letterSpacing: 1.2,
              color: tint(onSidebar, 0.6),
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 240,
            }}
          >
            {labels.verifyAt} {ctx.verifyHost}
          </div>
        )}
      </div>
    </div>
  );
}

/** Up to two initials from the client name, for the logo-less sidebar disc. */
function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ *
 * Layout: minimal
 * ------------------------------------------------------------------ */

/** Generous whitespace, one hairline rule, a small seal, no guilloche. Left
 *  aligned on purpose: it is the only layout of the three that is not centred,
 *  which is most of what makes it read as modern next to the other two. */
function MinimalLayout({ ctx }: { ctx: LayoutContext }) {
  const { palette, level, labels, name, nameSize, dateText, metrics, headline, bandLabel, logoUrl, clientName, design, payload } = ctx;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "56px 68px 48px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <ClientLogo url={logoUrl} maxHeight={34} maxWidth={140} />
          <div style={{ ...clientNameStyle(clientName, palette.ink), maxWidth: 420 }}>
            {clientName}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 4,
            fontWeight: 700,
            color: palette.accent,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {bandLabel}
        </div>
      </div>

      {/* The single hairline. Everything else in this layout is spacing. */}
      <div style={{ height: 1, background: palette.frame, marginTop: 22 }} />

      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 16,
          color: palette.sub,
          marginTop: 64,
        }}
      >
        {labels.presentedTo}
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontSize: nameSize,
          lineHeight: 1.15,
          color: palette.ink,
          marginTop: 6,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </div>

      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 0.4,
          color: palette.accentDeep,
          marginTop: 18,
          maxWidth: 640,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {headline}
      </div>

      <div
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: palette.sub,
          marginTop: 10,
          maxWidth: 560,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {payload.tagline}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <MetricChips metrics={metrics} palette={palette} compact />
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 28,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1.6,
              color: palette.sub,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {labels.credentialId}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 700,
              color: palette.ink,
              letterSpacing: 0.6,
            }}
          >
            {payload.credential_id}
          </div>
          {dateText && (
            <div style={{ fontSize: 12, color: palette.sub, marginTop: 4 }}>
              {labels.issued} {dateText}
            </div>
          )}
          {ctx.verifyHost && (
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.2,
                color: palette.faint,
                marginTop: 2,
                textTransform: "uppercase",
              }}
            >
              {labels.verifyAt} {ctx.verifyHost}
            </div>
          )}
        </div>

        <SignatureBlock ctx={ctx} align="left" width={200} />

        <Seal
          palette={palette}
          level={level}
          code={design.sealCode}
          metalLabel={design.metalLabel}
          certifiedLabel={labels.certified}
          size={84}
          displayFont={DISPLAY}
          sansFont={SANS}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Layout: uploaded background
 * ------------------------------------------------------------------ */

const UPLOAD_FIELD_ORDER: CertificateFieldName[] = [
  "title",
  "subtitle",
  "recipient",
  "metric",
  "date",
  "credentialId",
];

/**
 * kind="upload": the admin's own artwork fills the canvas and the six text
 * fields are positioned over it from `fieldPlacements`, whose x/y are 0..1
 * fractions rather than pixels so a placement authored in a scaled-down editor
 * still lands in the right spot at export resolution.
 *
 * Each field is anchored on its own centre vertically and on its `align` edge
 * horizontally, which is what makes dragging one in the editor feel like moving
 * the text rather than moving an invisible box the text hangs off.
 */
/** Neutral paper for an upload design that has no background image yet. Not a
 *  palette colour on purpose: it is the ground the DEFAULT_FIELD_PLACEMENTS ink
 *  was chosen against, so the two have to move together or neither is right. */
const UPLOAD_FALLBACK_GROUND = "#f4f5f7";

function UploadLayout({ ctx }: { ctx: LayoutContext }) {
  const { design, payload, name, dateText, metrics } = ctx;
  const placements = design.fieldPlacements ?? DEFAULT_FIELD_PLACEMENTS;

  const firstMetric = metrics[0];
  const values: Record<CertificateFieldName, string> = {
    recipient: name,
    title: payload.title,
    subtitle: payload.subtitle,
    date: dateText,
    credentialId: payload.credential_id,
    metric: firstMetric ? `${firstMetric.value} ${firstMetric.label}`.trim() : "",
  };

  return (
    <>
      {/* The stationery this layout assumes.
          Field colours default to near-black because an uploaded background is
          almost always light, but with no background the preset's own `bg`
          shows through, and half the presets are dark: a headless pass over the
          upload variant on `bronze` came out as near-black text on a near-black
          gradient, effectively blank. That is not a hypothetical - an admin who
          switches a template to upload mode sees exactly this until the asset
          finishes uploading, and so does any export where the image URL is slow
          or broken. Painting the paper the defaults were written for keeps the
          fields readable in that window without touching a design that HAS its
          background. */}
      {!design.backgroundUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: UPLOAD_FALLBACK_GROUND,
          }}
        />
      )}

      {design.backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={design.backgroundUrl}
          alt=""
          referrerPolicy="no-referrer"
          style={{
            position: "absolute",
            inset: 0,
            width: CERTIFICATE_CANVAS_WIDTH,
            height: CERTIFICATE_CANVAS_HEIGHT,
            // cover, not contain: the admin uploads at the canvas ratio and a
            // slightly-off crop is far less alarming than letterbox bars in the
            // middle of somebody's branded stationery.
            objectFit: "cover",
            display: "block",
          }}
        />
      )}

      {UPLOAD_FIELD_ORDER.map((field) => {
        const placement: CertificateFieldPlacement | undefined =
          placements[field] ?? DEFAULT_FIELD_PLACEMENTS[field];
        const value = values[field];
        if (!placement || !value) return null;

        const translateX =
          placement.align === "center"
            ? "-50%"
            : placement.align === "right"
              ? "-100%"
              : "0";

        const left = placement.x * CERTIFICATE_CANVAS_WIDTH;
        /**
         * How much canvas this field actually has, given where the admin put it
         * and which edge it is anchored on. The old budget was a flat
         * canvas-minus-64, which is only true for a centred field at x=0.5: a
         * left-aligned field at x=0.8 has 200px of canvas to its right and was
         * being allowed to draw 936px into the void, where the root's
         * overflow:hidden cut it off at the border.
         */
        const budget =
          placement.align === "center"
            ? Math.min(left, CERTIFICATE_CANVAS_WIDTH - left) * 2
            : placement.align === "right"
              ? left
              : CERTIFICATE_CANVAS_WIDTH - left;
        const maxWidth = Math.max(0, Math.min(budget, CERTIFICATE_CANVAS_WIDTH) - 24);
        /**
         * Shrink to fit rather than ellipse. An uploaded background has no
         * reflow room at all, and the default recipient placement sets 54px,
         * which a 40-character name overruns by 110px: the learner's own name
         * came out cut. The face is whatever the admin chose per field, so this
         * uses the generic sans advance and leans on the ellipsis below as the
         * backstop for a face far wider than the estimate.
         */
        const fontSize = fitFontSize(
          value,
          maxWidth,
          placement.size,
          ADVANCE_EM.sans,
          Math.min(placement.size, 12),
        );

        return (
          <div
            key={field}
            style={{
              position: "absolute",
              left,
              top: placement.y * CERTIFICATE_CANVAS_HEIGHT,
              transform: `translate(${translateX}, -50%)`,
              fontFamily: placement.font || SANS,
              fontSize,
              fontWeight: placement.weight,
              color: placement.color,
              textAlign: placement.align,
              lineHeight: 1.2,
              // Never wrap: an uploaded design has no reflow room, and a second
              // line would land on whatever artwork sits below the field.
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth,
            }}
          >
            {value}
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

const PRESET_FALLBACK_PALETTE = getPreset("brand-classic").palette;

/**
 * The last-resort design.
 *
 * Deliberately plain: it is not a substitute for a real design, it is what
 * stops a missing one from being a TypeError on a page whose only job is to
 * show a learner something they earned. `brand-classic` at the lowest
 * ornamentation reads as a sober document rather than as a broken one.
 */
const NEUTRAL_DESIGN: CertificateDesign = {
  kind: "design",
  layout: "minimal",
  preset: "brand-classic",
  dark: false,
  palette: PRESET_FALLBACK_PALETTE,
  metalLabel: "Brand",
  ornamentLevel: 1,
  bandLabel: "CERTIFICATE",
  sealCode: "CE",
  backgroundUrl: null,
  fieldPlacements: null,
};

/**
 * Renders one certificate at its native 1000x707. Callers that want it smaller
 * wrap it in <CertificatePreview>, which scales the display copy with a CSS
 * transform while still forwarding this ref to the full-size node so exports
 * stay at full resolution.
 */
export const CertificateArtwork = forwardRef<HTMLDivElement, CertificateArtworkProps>(
  function CertificateArtwork(
    { payload, accent, labels: labelOverrides, locale = "en-GB", className, style },
    ref,
  ) {
    // A read-only gallery must never crash. If a payload ever arrives without
    // its design block - a future field rename, a hand-built row, a partial
    // response - the card degrades to a plain neutral certificate rather than
    // throwing at `design.sealCode` and taking the whole subtree down with it.
    const design = payload.design ?? NEUTRAL_DESIGN;
    const palette = resolvePalette(design, accent ?? payload.issuer.accent);
    const labels = { ...DEFAULT_CERTIFICATE_LABELS, ...labelOverrides };

    const name = (payload.recipient_name || "").trim();
    const clientName = (payload.issuer.name || "").trim();
    const logoUrl = (payload.issuer.logo_url || "").trim();
    const verifyUrl = payload.verify_url || verifyUrlFor(payload.credential_id);

    /**
     * The big display line. `bandLabel` already says "CERTIFICATE OF
     * COMPLETION", so setting `title` large underneath it prints the same
     * sentence twice at two sizes. The subtitle is the thing that is actually
     * specific to this credential (the course, the assessment, the tier), so
     * that is what gets the display size, with `title` as the fallback for a
     * design that has no subtitle.
     */
    const headline = (payload.subtitle || "").trim() || (payload.title || "").trim();

    const ctx: LayoutContext = {
      payload,
      design,
      palette,
      labels,
      dark: design.dark,
      level: design.ornamentLevel,
      name,
      nameSize: recipientFontSize(name.length),
      dateText: formatCertificateDate(payload.issued_at, locale),
      verifyHost: hostOf(verifyUrl),
      // Three chips is what fits on one row at every layout width; a fourth
      // wraps and drags the footer off the canvas.
      metrics: (payload.metrics || []).slice(0, 3),
      headline,
      bandLabel: (design.bandLabel || payload.title || "").trim(),
      logoUrl,
      clientName,
      signatoryName:
        (payload.issuer.signatory_name || "").trim() || clientName,
      signatoryTitle:
        (payload.issuer.signatory_title || "").trim() || labels.issuingAuthority,
      signatureUrl: (payload.issuer.signature_url || "").trim(),
    };

    let body: ReactNode;
    if (design.kind === "upload") {
      body = <UploadLayout ctx={ctx} />;
    } else if (design.layout === "panel") {
      body = <PanelLayout ctx={ctx} />;
    } else if (design.layout === "minimal") {
      body = <MinimalLayout ctx={ctx} />;
    } else {
      body = <ClassicLayout ctx={ctx} />;
    }

    return (
      <div
        ref={ref}
        className={className}
        data-certificate-root=""
        data-credential-id={payload.credential_id}
        style={{
          // min/max as well as width/height: this node is often a flex child of
          // a scaled preview wrapper, and a flex parent will happily squash a
          // plain width, which silently changes the export's aspect ratio.
          width: CERTIFICATE_CANVAS_WIDTH,
          height: CERTIFICATE_CANVAS_HEIGHT,
          minWidth: CERTIFICATE_CANVAS_WIDTH,
          minHeight: CERTIFICATE_CANVAS_HEIGHT,
          maxWidth: CERTIFICATE_CANVAS_WIDTH,
          maxHeight: CERTIFICATE_CANVAS_HEIGHT,
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          // `bg` is a full CSS background value, not a colour: the presets ship
          // radial gradients in it. An uploaded background covers this, but it
          // still has to be painted so a slow or broken image URL shows the
          // preset ground rather than the page behind the canvas.
          background: palette.bg,
          color: palette.ink,
          fontFamily: SANS,
          ...style,
        }}
      >
        {body}

        {/* A revoked credential must never be exportable as a clean one. The
            server still serves its render payload so the public verify page can
            show what was revoked, and this band is the only thing standing
            between that and a screenshot passed off as valid. */}
        {payload.status === "revoked" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
              background: tint(CONTRAST_LIGHT, 0.05),
            }}
          >
            <div
              style={{
                transform: "rotate(-18deg)",
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 128,
                letterSpacing: 14,
                color: tint(palette.accentDeep, 0.22),
                border: `10px solid ${tint(palette.accentDeep, 0.22)}`,
                borderRadius: 12,
                padding: "10px 40px",
                textTransform: "uppercase",
              }}
            >
              {labels.revoked}
            </div>
          </div>
        )}
      </div>
    );
  },
);

export { CERTIFICATE_CANVAS_HEIGHT, CERTIFICATE_CANVAS_WIDTH };
