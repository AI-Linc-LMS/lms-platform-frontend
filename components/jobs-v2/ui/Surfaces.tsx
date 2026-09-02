"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, MOTION, R, SHADOW, TYPE, cardInteraction, focusRing } from "./jobsTokens";
import { useJobsSurface } from "./JobsScope";
import { BulletList } from "./BulletList";

export { cardInteraction };

/**
 * Reveal the brand-gradient hairline once the element has been seen.
 * The animation itself is one line of CSS in the `.jobs-scope` block; this only flips the
 * attribute, and `prefers-reduced-motion` resolves it to its end state without JS.
 */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || revealed) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer (older browser, jsdom): reveal on the next frame rather than
      // synchronously in the effect body, which would cascade a second render.
      const frame = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return { ref, revealed };
}

/* ==========================================================================
 * JCard — the ONE card. Four SectionCard definitions died for this.
 * ======================================================================== */

export interface JCardProps {
  children: ReactNode;
  /** Border-moves hover, pointer cursor and a focus ring. Nothing lifts or blooms. */
  interactive?: boolean;
  /**
   * Defaults from JobsSurfaceContext: student surfaces get the soft panel shadow, admin and
   * data surfaces get none. Pass explicitly only to override that for one card.
   */
  elevated?: boolean;
  padded?: boolean;
  /** Renders the brand-gradient hairline on the top edge. No coloured top strip, ever. */
  accent?: "azure" | "none";
  /** Dashed border — the empty-state treatment. */
  dashed?: boolean;
  href?: string;
  component?: ElementType;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  sx?: SxProps<Theme>;
  className?: string;
  id?: string;
  role?: string;
  tabIndex?: number;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-busy"?: boolean;
  "data-tour-id"?: string;
}

export function JCard({
  children,
  interactive = false,
  elevated,
  padded = true,
  accent = "none",
  dashed = false,
  href,
  component,
  onClick,
  sx,
  ...rest
}: JCardProps) {
  const surface = useJobsSurface();
  const raise = elevated ?? surface.elevated;
  const { ref, revealed } = useRevealed<HTMLDivElement>();

  const asComponent: ElementType = component ?? (href ? NextLink : "div");

  return (
    <Box
      {...rest}
      ref={ref}
      component={asComponent}
      href={href}
      onClick={onClick}
      className={accent === "azure" ? "j-grad-hairline" : undefined}
      data-revealed={accent === "azure" ? String(revealed) : undefined}
      sx={[
        {
          position: "relative",
          borderRadius: R.card,
          border: `1px solid ${J.hairline}`,
          borderStyle: dashed ? "dashed" : "solid",
          bgcolor: J.surface,
          color: J.ink,
          boxShadow: raise ? SHADOW.panel : SHADOW.none,
          p: padded ? { xs: 2, md: 2.5 } : 0,
          // The gradient hairline has to be clipped to the card's own radius.
          overflow: accent === "azure" ? "hidden" : undefined,
          textDecoration: "none",
          display: "block",
        },
        interactive ? cardInteraction : null,
        // cardInteraction restates the radius/border; the elevation and padding above must win.
        interactive ? { boxShadow: raise ? SHADOW.panel : SHADOW.none } : null,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

/** A card with no padding. Wraps tables and anything that paints to its own edges. */
export function JPanel({
  children,
  sx,
  ...rest
}: Omit<JCardProps, "padded">) {
  return (
    <JCard {...rest} padded={false} sx={sx}>
      {children}
    </JCard>
  );
}

/* ==========================================================================
 * HairlineStrip — THE replacement for all three copies of the 5-tile stat grid.
 *
 * No cards and no gaps: one grid whose cell borders form a single continuous rule. When a cell
 * carries `onClick` it becomes a `role="button"` filter toggle with `aria-pressed`, which is
 * how the "5 non-clickable tiles plus 6 clickable chips" duplication collapses into one row.
 * ======================================================================== */

export interface StripItem {
  key: string;
  label: string;
  value: ReactNode;
  hint?: string;
  /** A colour token string (`var(--j-*)`) for the value. Defaults to the ink. */
  tone?: string;
  onClick?: () => void;
  active?: boolean;
  icon?: string;
}

export interface HairlineStripProps {
  items: StripItem[];
  /** Overrides the responsive default of `{xs: 2, sm: 3, md: items.length}`. */
  columns?: number;
  dense?: boolean;
  /** Names the group for screen readers when the cells are filter toggles. */
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function HairlineStrip({
  items,
  columns,
  dense = false,
  ariaLabel,
  sx,
  ...rest
}: HairlineStripProps) {
  const { ref, revealed } = useRevealed<HTMLDivElement>();
  const anyInteractive = items.some((i) => i.onClick);

  return (
    <Box
      {...rest}
      ref={ref}
      role={anyInteractive ? "group" : undefined}
      aria-label={anyInteractive ? ariaLabel : undefined}
      sx={[
        {
          display: "grid",
          gridTemplateColumns: columns
            ? `repeat(${columns}, minmax(0, 1fr))`
            : {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                md: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
              },
          borderTop: `1px solid ${J.hairline}`,
          borderBottom: `1px solid ${J.hairline}`,
          bgcolor: "transparent",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {items.map((item) => {
        const interactive = Boolean(item.onClick);
        return (
          <Box
            key={item.key}
            className="j-grad-hairline"
            data-revealed={String(revealed)}
            // Every cell is a div, interactive or not, so the `:nth-of-type` rules below are
            // stable (`:nth-child` is not SSR-safe with Emotion) and a mixed strip cannot
            // renumber itself. Spec 4.4 asks for `role="button"` here, so the keyboard path is
            // role + tabIndex + Enter/Space rather than a real <button>.
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={item.onClick}
            onKeyDown={
              interactive
                ? (event: React.KeyboardEvent) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      item.onClick?.();
                    }
                  }
                : undefined
            }
            aria-pressed={interactive ? Boolean(item.active) : undefined}
            sx={{
              position: "relative",
              textAlign: "start",
              font: "inherit",
              // The continuous rule. Every cell carries the divider on its inline-start edge and
              // the first cell OF EACH ROW cancels it, so the hairlines join into one rule
              // instead of doubling — and it stays correct as the grid rewraps at every
              // breakpoint, because the cancelling is CSS, not a JS index.
              borderInlineStart: `1px solid ${J.hairline}`,
              borderTop: "1px solid transparent",
              "&:nth-of-type(2n+1)": {
                borderInlineStartColor: { xs: "transparent", sm: J.hairline },
              },
              "&:nth-of-type(3n+1)": {
                borderInlineStartColor: { sm: "transparent", md: J.hairline },
              },
              "&:first-of-type": { borderInlineStartColor: "transparent" },
              // A wrapped row needs its own top rule or the grid reads as loose columns.
              "&:nth-of-type(n+3)": { borderTopColor: { xs: J.hairline, sm: "transparent" } },
              "&:nth-of-type(n+4)": { borderTopColor: { sm: J.hairline, md: "transparent" } },
              px: dense ? 1.5 : 2,
              py: dense ? 1.25 : 2,
              minWidth: 0,
              bgcolor: item.active ? J.azureSoft : "transparent",
              color: J.ink,
              cursor: interactive ? "pointer" : "default",
              transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
              "&:hover": interactive ? { bgcolor: item.active ? J.azureSoft : J.surface2 } : undefined,
              ...(interactive ? focusRing : null),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
              {item.icon && (
                <Box sx={{ display: "inline-flex", color: item.tone ?? J.ink3, flexShrink: 0 }}>
                  <IconWrapper icon={item.icon} size={16} />
                </Box>
              )}
              <Typography
                component="div"
                sx={{
                  ...(dense ? TYPE.numSm : TYPE.numLg),
                  color: item.tone ?? J.ink,
                }}
              >
                {item.value}
              </Typography>
            </Box>
            <Typography
              component="div"
              sx={{ ...TYPE.eyebrow, color: item.active ? J.azureDeep : J.ink3 }}
            >
              {item.label}
            </Typography>
            {item.hint && (
              <Typography component="div" sx={{ ...TYPE.micro, mt: 0.5, color: J.ink4 }}>
                {item.hint}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/* ==========================================================================
 * MicroRuleList — a 1px x 8px accent rule instead of a disc. Requirement lists,
 * "what happens next" lists, empty-state hints, bulk-action consequences.
 *
 * It is now a thin `BulletList variant="rule"` wrapper and keeps its name and its signature, so
 * `JobDetailsPanel.tsx` and every admin caller are untouched while there is only ONE list
 * renderer in the module. (Job-site spec 5.2.)
 * ======================================================================== */

export function MicroRuleList({
  items,
  tone,
  sx,
}: {
  items: ReactNode[];
  /** Colour token for the rules. Defaults to azure. */
  tone?: string;
  sx?: SxProps<Theme>;
}) {
  return <BulletList items={items} variant="rule" markerColor={tone} sx={sx} />;
}

/**
 * A keyboard handler for any element that had to be a `div` with `role="button"`.
 * Every interactive non-button in this module uses it, so Enter and Space always work.
 */
export function useActivationKeys(onActivate?: () => void) {
  return useCallback(
    (event: React.KeyboardEvent) => {
      if (!onActivate) return;
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        onActivate();
      }
    },
    [onActivate],
  );
}

/* ==========================================================================
 * DefinitionList
 *
 * Two of these were written independently — one in the learner's "Job details" card, one in the
 * admin's "Classification" and "Eligibility" cards — which is the fifth `SectionCard` this
 * redesign exists to prevent. One component, two layouts, and both surfaces keep the shape they
 * were designed with:
 *
 *   - `stacked`  (default) label above value, an optional leading icon, an optional value tone.
 *                The learner's sidebar card, where the column is narrow.
 *   - `columns`  label beside value from `sm` up. The admin's wide two-column card.
 *
 * Rows with no value are dropped, and the LAST rendered row carries no divider, so a hairline
 * never floats against the card's own edge.
 * ======================================================================== */

export interface DefinitionItem {
  key: string;
  label: string;
  value: ReactNode;
  /** `stacked` only. */
  icon?: string;
  /** A colour token for the value, e.g. a deadline urgency tint. */
  tone?: string;
  /**
   * What to render when `value` is empty, for THIS row only.
   *
   * Omitted, the row inherits the list's `emptyValue`. Set to `null` it OPTS OUT of the list's
   * fallback and the row is dropped — which is how "Salary: Not disclosed" and a silently absent
   * Experience row live in the same block (job-site spec 2.4).
   */
  emptyValue?: ReactNode;
}

export interface DefinitionListProps {
  items: DefinitionItem[];
  layout?: "stacked" | "columns";
  /**
   * How many columns of ROWS to lay the list out in, from `md` up. Two is the Naukri-shaped
   * "Role snapshot" block, whose form Indian students recognise. Default 1.
   */
  columns?: 1 | 2;
  /**
   * The default rendering for a row whose value is empty — "Not disclosed", in `J.ink4`.
   *
   * **The asymmetry is deliberate** (job-site spec 2.4). On a CARD a missing field is omitted:
   * no dash, no "Not specified", no empty slot, because a row of placeholders costs a line each
   * and teaches the eye nothing. In a label/value block the labels ARE the structure, so a
   * silently absent row makes the reader wonder whether we failed to load it. Rows opt in, per
   * row or per list — an unstated experience range is not "not disclosed", it is *absent*, and
   * printing a row for it would imply we asked.
   */
  emptyValue?: ReactNode;
  /** Rendered when every row was dropped. Omit to render nothing. */
  emptyText?: ReactNode;
  sx?: SxProps<Theme>;
}

const isBlank = (value: ReactNode) =>
  value === null || value === undefined || value === "" || value === false;

export function DefinitionList({
  items,
  layout = "stacked",
  columns = 1,
  emptyValue,
  emptyText,
  sx,
}: DefinitionListProps) {
  const shown = items
    .map((item) => {
      if (!isBlank(item.value)) return item;
      // `undefined` inherits the list default; an explicit `null` opts the row out of it. `??`
      // would collapse those two into one and make the opt-out unreachable.
      const fallback = item.emptyValue !== undefined ? item.emptyValue : emptyValue;
      if (isBlank(fallback)) return null;
      return { ...item, value: fallback, tone: J.ink4 };
    })
    .filter((item): item is DefinitionItem => item !== null);

  if (shown.length === 0) {
    return emptyText ? <Typography sx={TYPE.micro}>{emptyText}</Typography> : null;
  }

  const stacked = layout === "stacked";
  const twoUp = columns === 2;

  return (
    <Box
      component="dl"
      sx={[
        {
          m: 0,
          ...(twoUp
            ? {
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                columnGap: 3,
              }
            : stacked
              ? { display: "flex", flexDirection: "column" }
              : null),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {shown.map((item, index) => {
        // In one column the last row carries no divider, so a hairline never floats against the
        // card's own edge. In two columns BOTH trailing rows are last, and which those are
        // changes when the grid collapses at `md` — so the divider stays and the grid's own
        // padding does the work.
        const divider =
          !twoUp && index === shown.length - 1 ? "none" : `1px solid ${J.hairlineSoft}`;

        if (!stacked) {
          return (
            <Box
              key={item.key}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "minmax(120px, 40%) 1fr" },
                gap: { xs: 0.25, sm: 1.5 },
                py: 1.25,
                borderBottom: divider,
              }}
            >
              <Typography component="dt" sx={TYPE.label}>
                {item.label}
              </Typography>
              <Typography
                component="dd"
                sx={{ ...TYPE.bodyStrong, m: 0, minWidth: 0, color: item.tone ?? J.ink }}
              >
                {item.value}
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            key={item.key}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.25,
              py: 1.25,
              borderBottom: divider,
            }}
          >
            {item.icon && (
              <Box
                aria-hidden
                sx={{ color: J.ink3, flexShrink: 0, mt: "2px", display: "inline-flex" }}
              >
                <IconWrapper icon={item.icon} size={16} />
              </Box>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography component="dt" sx={{ ...TYPE.label, mb: 0.25 }}>
                {item.label}
              </Typography>
              <Typography
                component="dd"
                sx={{ ...TYPE.bodyStrong, m: 0, color: item.tone ?? J.ink }}
              >
                {item.value}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/* ==========================================================================
 * Notice
 *
 * The block-level "something happened that you should know about, and here is what to do"
 * banner: a restored draft, a scraped prefill that could not be mapped, a JD that did not
 * upload. It was written once inside the admin form and then wanted by two more screens, which
 * is how a second and third treatment start. One component, two tones.
 *
 * It is NOT the inline note that hangs under a single control — that is `ApplyNotice`, which is
 * a smaller scale bound to the apply state machine, and it stays where it is.
 * ======================================================================== */

export interface NoticeProps {
  /**
   * `quiet` is the safety-notice treatment: a hairline block on `J.surface2` with no signal
   * colour at all, so an honest explanation of an outbound hand-off does not read as an alarm.
   */
  tone: "azure" | "warn" | "quiet";
  icon: string;
  title: string;
  body: string;
  /** Trailing controls, on the banner's own line. */
  action?: ReactNode;
  /** Detail under the body — a `MicroRuleList`, say. */
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

const NOTICE_TONES: Record<NoticeProps["tone"], { fg: string; bg: string; bd: string; title: string }> = {
  azure: { fg: J.azureDeep, bg: J.azureSoft, bd: J.azureBorder, title: J.azureDeep },
  warn: { fg: J.warnFg, bg: J.warnBg, bd: J.warnBd, title: J.warnFg },
  quiet: { fg: J.ink3, bg: J.surface2, bd: J.hairline, title: J.ink },
};

export function Notice({ tone, icon, title, body, action, children, sx }: NoticeProps) {
  const { fg, bg, bd, title: titleColor } = NOTICE_TONES[tone];
  return (
    <Box
      role="status"
      sx={[
        {
          mb: 2,
          p: 1.75,
          borderRadius: R.card,
          border: `1px solid ${bd}`,
          bgcolor: bg,
          display: "flex",
          gap: 1.25,
          alignItems: "flex-start",
          flexWrap: "wrap",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box aria-hidden sx={{ color: fg, display: "inline-flex", mt: 0.25 }}>
        <IconWrapper icon={icon} size={20} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography sx={{ ...TYPE.h4, color: titleColor }}>{title}</Typography>
        <Typography sx={{ ...TYPE.small, mt: 0.25 }}>{body}</Typography>
        {children && <Box sx={{ mt: 1 }}>{children}</Box>}
      </Box>
      {action && <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>{action}</Box>}
    </Box>
  );
}
