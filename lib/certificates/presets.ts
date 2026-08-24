import type {
  CertificateDesign,
  CertificateOrnamentLevel,
  CertificatePalette,
  CertificatePresetSlug,
} from "./types";

/**
 * The 10 design presets, mirrored from the backend's certificates/presets.py.
 *
 * WHY THIS DUPLICATION IS DELIBERATE, not drift: the admin design picker has to
 * repaint a full 1000x707 preview on every click - preset, layout, ornament,
 * accent - and a round trip per click makes that picker feel broken. So the
 * palettes live here too, purely to drive the local preview.
 *
 * The server stays the source of truth. An ISSUED certificate renders from its
 * frozen `design_snapshot`, never from this table, so editing a preset on the
 * backend can never rewrite a credential someone already shared. If this file
 * and presets.py ever disagree, the issued certificate is still right and this
 * file is the one to fix.
 *
 * The sapphire..grand-gold palettes are the verbatim zskillup CERT_THEMES
 * values (tiers 1..7 of the original certificate ladder), copied unchanged so
 * a certificate reissued on this platform looks identical to the one a learner
 * already has.
 */

export interface CertificatePreset {
  slug: CertificatePresetSlug;
  /** Display name for the picker. */
  label: string;
  dark: boolean;
  /** Shown on the seal ribbon, e.g. "Gold". */
  metalLabel: string;
  ornamentLevel: CertificateOrnamentLevel;
  /**
   * True for the three brand presets: `accent`/`accentDeep` are replaced with
   * the tenant's theme colour at render time so a tenant's certificates match
   * its app. The rest of a brand palette is authored brand-neutral (paper,
   * graphite, champagne) precisely so any tenant colour can drop in without
   * clashing with the metal or the frame.
   */
  brandAccent: boolean;
  /** What the seeder wires this preset to by default. */
  defaultRole: string;
  palette: CertificatePalette;
}

/**
 * Fallback accent for a brand preset when no tenant colour is available yet
 * (an unauthenticated preview, or a client whose branding is unset). Matches
 * the issuer accent in the spec's example payload.
 */
export const DEFAULT_BRAND_ACCENT = "#2f6bd8";

export const CERTIFICATE_PRESETS: Record<CertificatePresetSlug, CertificatePreset> = {
  "brand-classic": {
    slug: "brand-classic",
    label: "Brand Classic",
    dark: false,
    metalLabel: "Brand",
    ornamentLevel: 4,
    brandAccent: true,
    defaultRole: "course completion",
    palette: {
      bg: "radial-gradient(120% 140% at 50% 0%, #ffffff 0%, #fbfaf7 55%, #f4f1e9 100%)",
      ink: "#1b1f2a",
      sub: "#5b6373",
      faint: "#a9b0bd",
      accent: DEFAULT_BRAND_ACCENT,
      accentDeep: "#1d4ed8",
      metal: "#b6923f",
      metalDeep: "#836523",
      metalInk: "#fffaf0",
      frame: "#ded8c8",
      pattern: "#cbbf9d",
    },
  },
  "brand-minimal": {
    slug: "brand-minimal",
    label: "Brand Minimal",
    dark: false,
    metalLabel: "Brand",
    ornamentLevel: 2,
    brandAccent: true,
    defaultRole: "assessment participation",
    palette: {
      // Flat, not a gradient: the minimal layout is generous whitespace and a
      // single hairline rule, and a visible gradient fights that.
      bg: "linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%)",
      ink: "#111827",
      sub: "#6b7280",
      faint: "#c2c8d2",
      accent: DEFAULT_BRAND_ACCENT,
      accentDeep: "#1d4ed8",
      metal: "#9ca3af",
      metalDeep: "#6b7280",
      metalInk: "#ffffff",
      frame: "#e5e7eb",
      pattern: "#e8eaee",
    },
  },
  "brand-obsidian": {
    slug: "brand-obsidian",
    label: "Brand Obsidian",
    dark: true,
    metalLabel: "Brand",
    ornamentLevel: 5,
    brandAccent: true,
    defaultRole: "assessment excellence",
    palette: {
      bg: "radial-gradient(130% 150% at 50% -10%, #1f2430 0%, #14181f 45%, #08090c 100%)",
      ink: "#f5f7fa",
      sub: "#aab3c2",
      faint: "#586274",
      accent: DEFAULT_BRAND_ACCENT,
      accentDeep: "#1d4ed8",
      metal: "#cbd2dd",
      metalDeep: "#8a93a3",
      metalInk: "#14181f",
      frame: "#39414f",
      pattern: "#7c8798",
    },
  },
  sapphire: {
    slug: "sapphire",
    label: "Sapphire",
    dark: false,
    metalLabel: "Sapphire",
    ornamentLevel: 3,
    brandAccent: false,
    defaultRole: "points tier 1",
    palette: {
      bg: "radial-gradient(120% 140% at 50% 0%, #ffffff 0%, #f5f8ff 55%, #eef3fb 100%)",
      ink: "#152238",
      sub: "#5a6b86",
      faint: "#9fb0c9",
      accent: "#2f6bd8",
      accentDeep: "#1d4ed8",
      metal: "#3b82f6",
      metalDeep: "#1d4ed8",
      metalInk: "#ffffff",
      frame: "#bcd3f5",
      pattern: "#3b82f6",
    },
  },
  emerald: {
    slug: "emerald",
    label: "Emerald",
    dark: false,
    metalLabel: "Emerald",
    ornamentLevel: 3,
    brandAccent: false,
    defaultRole: "points tier 2",
    palette: {
      bg: "radial-gradient(120% 140% at 50% 0%, #ffffff 0%, #f2fbf8 55%, #e6f6f1 100%)",
      ink: "#0f2b26",
      sub: "#4f7169",
      faint: "#93c1b6",
      accent: "#0d9488",
      accentDeep: "#0f766e",
      metal: "#10b981",
      metalDeep: "#0f766e",
      metalInk: "#ffffff",
      frame: "#a7e3d6",
      pattern: "#0d9488",
    },
  },
  amethyst: {
    slug: "amethyst",
    label: "Amethyst",
    dark: false,
    metalLabel: "Amethyst",
    ornamentLevel: 4,
    brandAccent: false,
    defaultRole: "points tier 3",
    palette: {
      bg: "radial-gradient(120% 140% at 50% 0%, #ffffff 0%, #f9f6ff 55%, #f1ebfe 100%)",
      ink: "#241748",
      sub: "#63558a",
      faint: "#b3a3e0",
      accent: "#7c3aed",
      accentDeep: "#6d28d9",
      metal: "#8b5cf6",
      metalDeep: "#6d28d9",
      metalInk: "#ffffff",
      frame: "#d3c4fb",
      pattern: "#7c3aed",
    },
  },
  bronze: {
    slug: "bronze",
    label: "Bronze",
    dark: true,
    metalLabel: "Bronze",
    ornamentLevel: 4,
    brandAccent: false,
    defaultRole: "points tier 4",
    palette: {
      bg: "radial-gradient(130% 150% at 50% -10%, #23324f 0%, #16223f 45%, #0a0a0c 100%)",
      ink: "#f6f8fc",
      sub: "#aebbd2",
      faint: "#4a5c7a",
      accent: "#f0a844",
      accentDeep: "#c77d1e",
      metal: "#c98a3c",
      metalDeep: "#8a5a1e",
      metalInk: "#fff5e2",
      frame: "#3a4c6d",
      pattern: "#f0a844",
    },
  },
  platinum: {
    slug: "platinum",
    label: "Platinum",
    dark: true,
    metalLabel: "Platinum",
    ornamentLevel: 5,
    brandAccent: false,
    defaultRole: "points tier 5",
    palette: {
      bg: "radial-gradient(130% 150% at 50% -10%, #29354a 0%, #1a2436 45%, #0c1220 100%)",
      ink: "#f7fafc",
      sub: "#b7c2d6",
      faint: "#5d6b83",
      accent: "#8fd0f2",
      accentDeep: "#4aa3d4",
      metal: "#d8e0ec",
      metalDeep: "#9aa8bf",
      metalInk: "#1a2436",
      frame: "#3d4a63",
      pattern: "#8fd0f2",
    },
  },
  gold: {
    slug: "gold",
    label: "Gold",
    dark: true,
    metalLabel: "Gold",
    ornamentLevel: 6,
    brandAccent: false,
    defaultRole: "points tier 6",
    palette: {
      bg: "radial-gradient(130% 150% at 50% -10%, #2a241d 0%, #1a1512 45%, #0c0a09 100%)",
      ink: "#fbf7ee",
      sub: "#c9bda6",
      faint: "#6b5f4a",
      accent: "#eec24a",
      accentDeep: "#c69524",
      metal: "#e9c25a",
      metalDeep: "#a9801f",
      metalInk: "#2a2010",
      frame: "#4a3f2a",
      pattern: "#eec24a",
    },
  },
  "grand-gold": {
    slug: "grand-gold",
    label: "Grand Gold",
    dark: true,
    metalLabel: "Grand Gold",
    ornamentLevel: 7,
    brandAccent: false,
    defaultRole: "points tier 7",
    palette: {
      bg: "radial-gradient(130% 150% at 50% -12%, #2c2417 0%, #191308 45%, #000000 100%)",
      ink: "#fdf8ea",
      sub: "#d6c8a4",
      faint: "#7a6a45",
      accent: "#f5cf5a",
      accentDeep: "#caa02e",
      metal: "#f3d06a",
      metalDeep: "#b98d22",
      metalInk: "#281d07",
      frame: "#57492b",
      pattern: "#f5cf5a",
    },
  },
};

/**
 * Picker order: the three brand presets first (they are what most tenants
 * want), then the points ladder in ascending prestige.
 */
export const CERTIFICATE_PRESET_ORDER: CertificatePresetSlug[] = [
  "brand-classic",
  "brand-minimal",
  "brand-obsidian",
  "sapphire",
  "emerald",
  "amethyst",
  "bronze",
  "platinum",
  "gold",
  "grand-gold",
];

/** Falls back to brand-classic rather than throwing: an unknown slug from a
 *  newer backend must still render something, not blank the preview. */
export function getPreset(slug: string | null | undefined): CertificatePreset {
  if (slug && slug in CERTIFICATE_PRESETS) {
    return CERTIFICATE_PRESETS[slug as CertificatePresetSlug];
  }
  return CERTIFICATE_PRESETS["brand-classic"];
}

export function isBrandAccentPreset(slug: string | null | undefined): boolean {
  return getPreset(slug).brandAccent;
}

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Darken a hex colour toward black. Returns the input untouched when it is not
 *  a plain hex (a CSS variable or a gradient), so a tenant that stored an exotic
 *  colour degrades to "no deep shade" instead of painting an NaN. */
function shade(hex: string, ratio: number): string {
  if (!HEX_RE.test(hex)) return hex;
  let body = hex.slice(1);
  if (body.length === 3) {
    body = body
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const channels = [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16));
  const scaled = channels.map((c) =>
    Math.max(0, Math.min(255, Math.round(c * (1 - ratio)))),
  );
  return `#${scaled.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The palette to actually paint with.
 *
 * For a brandAccent preset the tenant's theme colour replaces `accent`, and
 * `accentDeep` becomes a darker shade of it (the foil edge has to stay darker
 * than the accent or the artwork loses its depth). Every other token is left
 * alone: the spec substitutes accent/accentDeep only.
 *
 * Pass an issued certificate's `design` and the substitution is a no-op, since
 * the server already resolved it - the accent you pass matches the one baked
 * into the snapshot. Pass a bare `{ preset }` and you get the preset palette,
 * which is what the admin picker previews before anything is saved.
 */
export function resolvePalette(
  design: Pick<CertificateDesign, "preset"> & Partial<Pick<CertificateDesign, "palette">>,
  accent?: string | null,
): CertificatePalette {
  const preset = getPreset(design.preset);
  const base = design.palette ?? preset.palette;
  if (!preset.brandAccent) return base;
  const brand = accent?.trim() || DEFAULT_BRAND_ACCENT;
  return { ...base, accent: brand, accentDeep: shade(brand, 0.22) };
}
