/**
 * /certificates on a phone.
 *
 * Measured on a real iPhone viewport against the demo tenant: the artwork was drawn at
 * 1000-1080px inside a page that scrolled sideways, so a learner saw the top-left corner of
 * their own certificate; four tap targets were under 40px; 59 text nodes were under 12px.
 *
 * jsdom has no layout engine, so nothing here measures a pixel. What it asserts is the
 * STRUCTURE that decides the layout: whether the fixed 1000px canvas is in flow (it is what
 * made the column 1000px wide), whether a grid column is allowed to be narrower than its
 * content, whether the ladder announces itself as a scroller, and what the xs branch of each
 * `sx` actually resolves to. `phoneStyle` reads the last declaration that applies at phone
 * width by dropping every `min-width: >=1px` media block from the emotion sheet.
 */
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("@/components/common/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { first_name: "Asha", last_name: "Rao" } }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { name: "Demo Institute" } }),
}));

import { getPreset } from "@/lib/certificates/presets";
import type {
  CertificateDesign,
  CertificateRenderPayload,
  LearnerCertificatesResponse,
  LearnerTierStatus,
} from "@/lib/certificates/types";
import { CertificatePreview } from "./CertificatePreview";
import { PointsLadderRail } from "./PointsLadderRail";
import { CertificateGallery } from "./CertificateGallery";
import { CertificateDetailDialog } from "./CertificateDetailDialog";

/* ------------------------------------------------------------------ *
 * Reading the phone branch of an `sx`
 * ------------------------------------------------------------------ */

/** The emotion sheet with every non-phone breakpoint removed. */
function phoneCss(): string {
  const all = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  return all.replace(
    /@media\s*\(min-width:\s*(\d+(?:\.\d+)?)px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g,
    (_match, px: string, body: string) => (Number(px) === 0 ? body : ""),
  );
}

/** Every emotion class in the sheet mapped to the declarations that survive at phone width. */
function phoneRules(): Map<string, Record<string, string>> {
  const css = phoneCss();
  const map = new Map<string, Record<string, string>>();
  const rule = /\.(css-[A-Za-z0-9_-]+)\s*\{([^{}]*)\}/g;
  let block: RegExpExecArray | null;
  while ((block = rule.exec(css)) !== null) {
    const decls = map.get(block[1]) ?? {};
    for (const part of block[2].split(";")) {
      const colon = part.indexOf(":");
      if (colon > 0) decls[part.slice(0, colon).trim().toLowerCase()] = part.slice(colon + 1).trim();
    }
    map.set(block[1], decls);
  }
  return map;
}

/** The value `prop` resolves to on a 390px screen, or null when nothing declares it. */
function phoneStyle(el: Element, prop: string, rules = phoneRules()): string | null {
  let value: string | null = null;
  for (const cls of (el.getAttribute("class") ?? "").split(/\s+/)) {
    const declared = rules.get(cls)?.[prop];
    if (declared) value = declared;
  }
  return value;
}

function px(value: string | null): number | null {
  if (!value) return null;
  const rem = /^(-?[\d.]+)rem$/.exec(value);
  if (rem) return Number(rem[1]) * 16;
  const abs = /^(-?[\d.]+)px$/.exec(value);
  if (abs) return Number(abs[1]);
  return null;
}

/** Every element under `root` that sets a font size, and what it sets on a phone. */
function declaredFontSizes(root: Element): { text: string; size: number }[] {
  const rules = phoneRules();
  const out: { text: string; size: number }[] = [];
  for (const el of [root, ...Array.from(root.querySelectorAll("*"))]) {
    const size = px(phoneStyle(el, "font-size", rules));
    if (size != null) out.push({ text: (el.textContent ?? "").slice(0, 40), size });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

function design(): CertificateDesign {
  const preset = getPreset("gold");
  return {
    kind: "design",
    layout: "classic",
    preset: preset.slug,
    dark: preset.dark,
    palette: preset.palette,
    metalLabel: preset.metalLabel,
    ornamentLevel: preset.ornamentLevel,
    bandLabel: "POINTS MILESTONE",
    sealCode: "GD",
    backgroundUrl: null,
    fieldPlacements: null,
  };
}

function payload(overrides: Partial<CertificateRenderPayload> = {}): CertificateRenderPayload {
  return {
    credential_id: "AILINC-GD-0000000001",
    status: "issued",
    title: "Certificate of Achievement",
    subtitle: "Python Fundamentals",
    tagline: "for completing the course",
    recipient_name: "Asha Rao",
    issued_at: "2026-05-04T00:00:00Z",
    verify_url: "https://example.test/credentials/AILINC-GD-0000000001",
    issuer: {
      name: "Demo Institute",
      logo_url: null,
      accent: "#7c3aed",
      signatory_name: "R. Mehta",
      signatory_title: "Director",
      signature_url: null,
    },
    source: { kind: "adaptive_course", id: 7, label: "Python Fundamentals" },
    metrics: [],
    design: design(),
    ...overrides,
  };
}

function tier(rank: number, name: string, threshold: number, unlocked = false): LearnerTierStatus {
  return {
    id: rank,
    slug: `tier-${rank}`,
    rank,
    name,
    short_name: name,
    code: name.slice(0, 2).toUpperCase(),
    tagline: "",
    points_threshold: threshold,
    unlocked,
    issued: false,
    credential_id: null,
    remaining_points: unlocked ? 0 : threshold,
    progress_percent: unlocked ? 100 : 0,
    claim_path: `tiers/${rank}/claim/`,
    design: null,
  };
}

const TIERS = [
  tier(1, "Sapphire", 1500, true),
  tier(2, "Emerald", 3000),
  tier(3, "Amethyst", 5000),
  tier(4, "Bronze", 7500),
  tier(5, "Platinum", 10000),
  tier(6, "Gold", 15000),
  tier(7, "Grand Gold", 25000),
];

/** Three rungs, not seven: the gallery draws real artwork per rung and the assertions
 *  below are about the column, not about how many columns there are. */
const GALLERY_TIERS = TIERS.slice(0, 3);

function learnerData(
  overrides: Partial<LearnerCertificatesResponse> = {},
): LearnerCertificatesResponse {
  return {
    points_total: 2100,
    points_breakdown: { total: 2100, adaptive: 1600, community: 500 },
    issued: [payload()],
    tiers: GALLERY_TIERS,
    claimable: [],
    ...overrides,
  };
}

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/* ------------------------------------------------------------------ *
 * Tests
 * ------------------------------------------------------------------ */

describe("the certificate artwork fits the screen it is on", () => {
  it("keeps the fixed 1000px canvas out of flow, so it cannot set the width of its column", () => {
    const { container } = render(<CertificatePreview payload={payload()} />);
    const host = container.firstElementChild as HTMLElement;
    const canvas = host.firstElementChild as HTMLElement;

    // The canvas is still 1000px - that is what keeps an export full resolution.
    expect(canvas.style.width).toBe("1000px");
    // ...but it no longer contributes that 1000px as anybody's minimum content width.
    expect(canvas.style.position).toBe("absolute");
    expect(host.style.position).toBe("relative");
    expect(host.style.minWidth).toBe("0px");
    // Visually unchanged: same origin, same clip, same reserved aspect box.
    expect(canvas.style.transformOrigin).toBe("top left");
    expect(canvas.style.top).toBe("0px");
    expect(canvas.style.left).toBe("0px");
    expect(host.style.overflow).toBe("hidden");
    expect(host.style.aspectRatio).toBe("1000 / 707");
  });

  it("still forwards the export ref to the UNTRANSFORMED canvas", () => {
    // A download taken from a 336px phone card has to come out at 2500px, which only
    // works while the ref points inside the scaled wrapper rather than at it.
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(<CertificatePreview ref={ref} payload={payload()} />);
    const scaled = (container.firstElementChild as HTMLElement).firstElementChild;
    expect(ref.current).not.toBe(scaled);
    expect(scaled?.contains(ref.current as Node)).toBe(true);
  });
});

describe("the points ladder", () => {
  function renderRail() {
    return render(
      <PointsLadderRail tiers={TIERS} pointsTotal={2100} onSelectTier={() => {}} />,
    );
  }

  it("is a scroll region that says so, instead of a row that ends at the screen edge", () => {
    renderRail();
    const rail = screen.getByRole("group", { name: /points milestones/i });
    // Seven rungs need ~812px and a phone has 358, so it has always scrolled. What is new
    // is that it is announced, snapped and faded rather than silently clipped.
    for (const t of TIERS) {
      expect(within(rail).getByText(t.short_name)).toBeTruthy();
    }
  });

  it("sets no rung label below 12px on a phone", () => {
    renderRail();
    const rail = screen.getByRole("group", { name: /points milestones/i });
    const tooSmall = declaredFontSizes(rail).filter((f) => f.size < 12);
    expect(tooSmall).toEqual([]);
  });

  it("keeps every rung a thumb-sized target", () => {
    renderRail();
    const rail = screen.getByRole("group", { name: /points milestones/i });
    const nodes = within(rail).getAllByRole("button");
    expect(nodes).toHaveLength(TIERS.length);
    // The 44px disc plus its two labels; the rung is the button, not the disc.
    for (const node of nodes) {
      expect(within(node).getByText(/^\d/)).toBeTruthy();
    }
  });

  it("snaps a flick to a rung on a phone, inside a row that fades at its edges", () => {
    renderRail();
    const rail = screen.getByRole("group", { name: /points milestones/i });
    const rules = phoneRules();
    expect(phoneStyle(rail, "overflow-x", rules)).toBe("auto");
    expect(phoneStyle(rail, "scroll-snap-type", rules)).toBe("x proximity");
    expect(phoneStyle(rail, "mask-image", rules)).toMatch(/linear-gradient/);
    for (const node of within(rail).getAllByRole("button")) {
      expect(phoneStyle(node, "scroll-snap-align", rules)).toBe("start");
    }
  });
});

describe("the certificate gallery", () => {
  function renderGallery(data = learnerData()) {
    return render(
      <Providers>
        <CertificateGallery data={data} />
      </Providers>,
    );
  }

  it("lets a card column be narrower than the certificate inside it", () => {
    const { container } = renderGallery();
    const card = screen.getByRole("button", { name: /Python Fundamentals/ });
    const grid = card.parentElement as HTMLElement;
    expect(getComputedStyle(grid).display).toBe("grid");
    // Without this a column is as wide as its widest child's minimum content, which is
    // how a 390px phone ended up holding a 1022px card.
    expect(getComputedStyle(card).minWidth).toBe("0px");

    // The locked rungs sit in the same grid and carry the same fixed-size artwork.
    const teaser = container.querySelector<HTMLElement>("#tier-tier-3");
    expect(teaser).not.toBeNull();
    expect(getComputedStyle(teaser as HTMLElement).minWidth).toBe("0px");
  });

  it("sets no caption or date below 12px on a phone", () => {
    renderGallery();
    const card = screen.getByRole("button", { name: /Python Fundamentals/ });
    const tooSmall = declaredFontSizes(card).filter((f) => f.size < 12);
    expect(tooSmall).toEqual([]);
  });

  it("gives the empty state's only action the full width and a thumb-sized height", () => {
    renderGallery(learnerData({ issued: [] }));
    const cta = screen.getByRole("button", { name: /see the ladder/i });
    expect(phoneStyle(cta, "width")).toBe("100%");
    expect(px(phoneStyle(cta, "min-height"))).toBeGreaterThanOrEqual(44);
  });

  it("gives a claim its own full-width button rather than a 29px pill", () => {
    renderGallery(
      learnerData({
        claimable: [
          {
            kind: "adaptive_course",
            id: 7,
            label: "Python Fundamentals",
            completion_percent: 100,
            claim_path: "courses/7/claim/",
          } as LearnerCertificatesResponse["claimable"][number],
        ],
      }),
    );
    const claim = screen.getByRole("button", { name: /claim/i });
    expect(phoneStyle(claim, "width")).toBe("100%");
    expect(px(phoneStyle(claim, "min-height"))).toBeGreaterThanOrEqual(44);
  });
});

describe("one certificate, opened", () => {
  function renderDialog() {
    return render(
      <Providers>
        <CertificateDetailDialog
          open
          onClose={() => {}}
          credentialId={null}
          fallbackPayload={payload()}
        />
      </Providers>,
    );
  }

  it("stacks download, verify and share as full-width actions on a phone", () => {
    renderDialog();
    for (const name of [/download png/i, /download pdf/i, /copy verify link/i]) {
      const button = screen.getByRole("button", { name });
      expect(phoneStyle(button, "width")).toBe("100%");
      expect(px(phoneStyle(button, "min-height"))).toBeGreaterThanOrEqual(44);
    }
  });

  it("gives the only way out of a full-screen dialog a 44px target", () => {
    renderDialog();
    const close = screen.getByRole("button", { name: /close/i });
    expect(px(phoneStyle(close, "width"))).toBeGreaterThanOrEqual(44);
    expect(px(phoneStyle(close, "height"))).toBeGreaterThanOrEqual(44);
  });

  it("lets the credential id wrap instead of ellipsising it away", () => {
    renderDialog();
    const id = screen.getByTitle("AILINC-GD-0000000001");
    expect(phoneStyle(id, "white-space")).toBe("normal");
  });
});
