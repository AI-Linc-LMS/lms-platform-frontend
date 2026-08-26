import { useId } from "react";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificates/types";
import type {
  CertificateOrnamentLevel,
  CertificatePalette,
} from "@/lib/certificates/types";

/**
 * The certificate ornament kit: pure SVG, no state, no data fetching.
 *
 * Ported from the zskillup certificate artwork, with one deliberate change that
 * matters more than it looks. In the original every threshold was driven off the
 * TIER number, which meant ornamentation and prestige were the same axis and a
 * tenant could not have an ornate course certificate without inventing a fake
 * high tier. Here every threshold reads `ornamentLevel` instead, so a brand
 * template authored at level 4 is exactly as ornate as a tier-4 certificate and
 * the two concepts are finally independent. Nothing else about the drawing
 * changed, so a certificate reissued on this platform still looks like the one a
 * learner already holds.
 *
 * Everything here is rasterised by html-to-image during export, which is why
 * these are plain SVG primitives with inline attributes rather than styled
 * components: anything that resolves late (a CSS variable, a webfont that has
 * not loaded, a lazily hydrated icon) shows up as a blank patch in the exported
 * PNG rather than as an error anybody would notice.
 */

/** Ornament level, as a plain number, for the threshold comparisons below. */
type Level = CertificateOrnamentLevel | number;

/**
 * Concentric-rosette guilloche: the security-paper watermark under the content.
 *
 * Ring count and opacity both climb with the level so a level-7 certificate
 * reads as engraved and a level-2 one reads as almost plain paper. Kept under
 * 0.12 opacity at the top end because this sits directly beneath the recipient
 * name and a denser pattern makes the name look like it is printed on fabric.
 */
export function Guilloche({
  color,
  level,
  width = CERTIFICATE_CANVAS_WIDTH,
  height = CERTIFICATE_CANVAS_HEIGHT,
}: {
  color: string;
  level: Level;
  width?: number;
  height?: number;
}) {
  const rings = 6 + Math.max(0, Math.round(Number(level) || 0)) * 3;
  const opacity = level >= 6 ? 0.12 : level >= 4 ? 0.1 : 0.06;
  const cx = width / 2;
  const cy = height / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
      }}
    >
      <g fill="none" stroke={color} strokeWidth={0.6}>
        {Array.from({ length: rings }).map((_, i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={120 + i * 26}
            ry={78 + i * 17}
            transform={`rotate(${i * 9} ${cx} ${cy})`}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * One corner flourish, drawn in the top-left orientation. The caller mirrors it
 * into the other three corners with a scale transform, which is why this returns
 * a bare <g> rather than its own <svg>.
 *
 * Level 4 adds a third arc and level 6 adds the filled fleuron, so the corner
 * grows with the design instead of switching between two hardcoded looks.
 */
export function Corner({
  color,
  deep,
  level,
}: {
  color: string;
  deep: string;
  level: Level;
}) {
  return (
    <g fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round">
      <path d="M0 34 C 0 14, 14 0, 34 0" stroke={deep} strokeWidth={2} />
      <path d="M8 40 C 8 20, 20 8, 40 8" />
      {level >= 4 && <path d="M16 46 C 16 28, 28 16, 46 16" strokeWidth={1} />}
      <circle cx={12} cy={12} r={2.4} fill={deep} stroke="none" />
      {level >= 6 && (
        <path
          d="M2 62 q 10 -6 12 -18 q 2 12 18 12 q -12 2 -12 18 q -2 -14 -18 -12 Z"
          fill={color}
          stroke="none"
          opacity={0.9}
        />
      )}
    </g>
  );
}

/**
 * A single laurel branch curving up from its base. Mirror it with scaleX(-1) to
 * get the matching half of a wreath. Leaf count leans on the level so the wreath
 * on a grand-gold seal is visibly fuller than the one on a bronze seal.
 */
export function LaurelBranch({
  color,
  level = 4,
}: {
  color: string;
  level?: Level;
}) {
  const count = level >= 6 ? 9 : 7;
  return (
    <g stroke={color} fill={color}>
      <path d="M0 44 C -10 30, -14 16, -12 0" fill="none" strokeWidth={2.4} />
      {Array.from({ length: count }).map((_, i) => {
        const t = i / (count - 1);
        const x = -12 * (1 - t) - 12 * t * 0.2;
        const y = 44 - t * 44;
        return (
          <ellipse
            key={i}
            cx={x - 6}
            cy={y}
            rx={6.5}
            ry={2.8}
            transform={`rotate(${-50 + t * 20} ${x - 6} ${y})`}
            opacity={0.95}
          />
        );
      })}
    </g>
  );
}

/**
 * Round a trig-derived coordinate to three decimals.
 *
 * Node and the browser do not agree on the last bits of Math.cos/Math.sin: the
 * server rendered a scallop at cx="19.7810999467264" and the client recomputed
 * 19.781099946726393, which React reports as a hydration mismatch and refuses
 * to patch. It logged a console error on every seal at ornament level 6 or 7,
 * so the top two ladder tiers were the ones shouting in production.
 *
 * Three decimals is far below a pixel at any size this seal is drawn, and it
 * makes both environments emit the identical string.
 */
function q(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * A five-pointed star as a path, so it inherits fill and opacity like any other
 * SVG shape. Exported because the artwork uses the same star for the small
 * inline dividers, not just for the seal.
 */
export function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.44;
    pts.push(`${q(cx + Math.cos(a) * rad)},${q(cy + Math.sin(a) * rad)}`);
  }
  return `M${pts.join("L")}Z`;
}

export interface SealProps {
  palette: CertificatePalette;
  level: Level;
  /** Two letters struck into the middle of the seal, e.g. "CO" or "SM". */
  code: string;
  /** Word on the ribbon, e.g. "Gold". Rendered uppercase. */
  metalLabel: string;
  /** Small caps under the code. Passed in so the copy can be translated. */
  certifiedLabel?: string;
  size?: number;
  /** Font stacks are passed down so the seal matches the artwork it sits on. */
  displayFont?: string;
  sansFont?: string;
}

const FALLBACK_DISPLAY =
  '"Satoshi", "Satoshi Variable", ui-sans-serif, system-ui, sans-serif';
const FALLBACK_SANS =
  '"Satoshi", "Satoshi Variable", ui-sans-serif, system-ui, sans-serif';

/**
 * The specular highlight on the seal's metal ring. This is white on purpose and
 * is NOT a palette token: a lit metal edge reflects the light source, not its
 * own tint, so pulling this from the palette would make the bronze and gold
 * seals look flat and the obsidian seal look like a hole.
 */
const SPECULAR_HIGHLIGHT = "#ffffff";

/**
 * The wax-seal medallion: metal ring, struck code, star, ribbon, and at higher
 * levels laurels (>= 4) and a scalloped outer edge (>= 6).
 *
 * The radial gradient gets an id from useId() with the separators stripped.
 * That is not decoration: a learner's gallery renders a dozen seals at once, and
 * a fixed id (the original keyed it off the tier number) makes every seal on the
 * page resolve `url(#seal-metal-4)` to whichever one mounted first, so two
 * different palettes at the same level silently paint the same metal. useId
 * gives each instance its own gradient; stripping the colons keeps the id
 * legal inside a url(#...) reference in every renderer, html-to-image's cloned
 * SVG included.
 */
export function Seal({
  palette,
  level,
  code,
  metalLabel,
  certifiedLabel = "CERTIFIED",
  size = 132,
  displayFont = FALLBACK_DISPLAY,
  sansFont = FALLBACK_SANS,
}: SealProps) {
  const rawId = useId();
  const gid = `certseal${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const { metal, metalDeep, metalInk } = palette;
  const c = size / 2;
  const withLaurels = level >= 4;
  const scalloped = level >= 6;
  // The ribbon has to fit its word. "Brand" and "Grand Gold" differ by five
  // characters, and a fixed-width ribbon lets the longer one hang off both ends.
  const label = metalLabel.toUpperCase();
  const ribbonWidth = Math.min(
    size * 1.06,
    Math.max(size * 0.697, label.length * size * 0.063 + size * 0.16),
  );
  const ribbonHalf = ribbonWidth / 2;

  // The ribbon hangs below the disc, so the viewBox is taller than it is wide.
  const height = size + 26;

  return (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${size} ${height}`}
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <radialGradient id={gid} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={SPECULAR_HIGHLIGHT} stopOpacity={0.9} />
          <stop offset="30%" stopColor={metal} />
          <stop offset="100%" stopColor={metalDeep} />
        </radialGradient>
      </defs>

      {withLaurels && (
        <>
          <g transform={`translate(${c - 40}, ${c + 30})`}>
            <LaurelBranch color={metal} level={level} />
          </g>
          <g transform={`translate(${c + 40}, ${c + 30}) scale(-1,1)`}>
            <LaurelBranch color={metal} level={level} />
          </g>
        </>
      )}

      {scalloped &&
        Array.from({ length: 28 }).map((_, i) => {
          const a = (i / 28) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={q(c + Math.cos(a) * (c - 8))}
              cy={q(c + Math.sin(a) * (c - 8))}
              r={size * 0.03}
              fill={metalDeep}
            />
          );
        })}

      <circle
        cx={c}
        cy={c}
        r={c - 12}
        fill={`url(#${gid})`}
        stroke={metalDeep}
        strokeWidth={2}
      />
      {/* Flat inner disc. The gradient above reads as a lit metal edge, but text
          sitting directly on it looks washed out at the top and muddy at the
          bottom, so the struck code gets a consistent ground of its own. */}
      <circle cx={c} cy={c} r={c - 24} fill={metal} />
      <circle
        cx={c}
        cy={c}
        r={c - 22}
        fill="none"
        stroke={metalInk}
        strokeWidth={1}
        strokeDasharray="1 4"
        opacity={0.55}
      />

      <path d={starPath(c, c - size * 0.2, size * 0.068)} fill={metalInk} opacity={0.9} />

      <text
        x={c}
        y={c + size * 0.076}
        textAnchor="middle"
        fontFamily={displayFont}
        fontWeight={800}
        fontSize={size * 0.197}
        fill={metalInk}
        letterSpacing="1"
      >
        {code}
      </text>
      <text
        x={c}
        y={c + size * 0.227}
        textAnchor="middle"
        fontFamily={sansFont}
        fontWeight={700}
        fontSize={size * 0.061}
        fill={metalInk}
        letterSpacing="2"
        opacity={0.85}
      >
        {certifiedLabel.toUpperCase()}
      </text>

      {/* Ribbon */}
      <g>
        <rect
          x={c - ribbonHalf}
          y={size - 12}
          width={ribbonWidth}
          height={22}
          rx={3}
          fill={metalDeep}
        />
        <path
          d={`M${c - ribbonHalf} ${size + 10} l -10 16 l 16 -6 Z`}
          fill={metalDeep}
          opacity={0.8}
        />
        <path
          d={`M${c + ribbonHalf} ${size + 10} l 10 16 l -16 -6 Z`}
          fill={metalDeep}
          opacity={0.8}
        />
        <text
          x={c}
          y={size + 3}
          textAnchor="middle"
          fontFamily={sansFont}
          fontWeight={800}
          fontSize={size * 0.076}
          fill={metalInk}
          letterSpacing="2"
        >
          {label}
        </text>
      </g>
    </svg>
  );
}

/**
 * The line-diamond-line rule that sits under the recipient name. Small enough to
 * live here rather than in the artwork so all three layouts draw the same one.
 */
export function DiamondRule({
  color,
  accent,
  width = 120,
}: {
  color: string;
  accent: string;
  width?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: "center",
      }}
    >
      <span style={{ width, height: 1, background: color }} />
      <span
        style={{
          width: 7,
          height: 7,
          transform: "rotate(45deg)",
          background: accent,
        }}
      />
      <span style={{ width, height: 1, background: color }} />
    </div>
  );
}
