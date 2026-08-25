"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificates/types";
import { formatPoints } from "@/lib/certificates/format";
import { CERT_BAR_GRADIENT } from "@/lib/certificates/ui-tokens";
import { CertificateArtwork, type CertificateArtworkProps } from "./CertificateArtwork";

/**
 * Display wrapper for the certificate artwork.
 *
 * THE WHOLE POINT OF THIS FILE, and the reason it is worth its own component:
 * the artwork is a fixed 1000x707 canvas and is displayed at anything from a
 * 240px gallery thumbnail to a 900px detail view. Scaling it with a CSS
 * transform on an OUTER wrapper - and forwarding the ref straight through to the
 * untransformed inner node - means a learner who exports from a 240px thumbnail
 * still gets a full-resolution 2500px PNG.
 *
 * That is not a nicety. The obvious alternative, rendering the artwork itself at
 * the display size, quietly makes export resolution a function of how wide the
 * card happened to be, so the same button produces a crisp certificate on a
 * desktop detail page and a blurry one from a phone gallery. html-to-image
 * measures `clientWidth`, which a transform does not touch, so the ref MUST
 * point at the inner node: hand it the outer wrapper instead and the capture
 * comes out at the scaled-down size with the transform baked in.
 */

export interface CertificatePreviewProps extends CertificateArtworkProps {
  /**
   * Display width in px. Omit it and the preview measures its own container and
   * fills it, which is what every card layout wants.
   */
  width?: number;
  /** Corner radius on the display copy. The exported node stays square-cornered
   *  because a rounded corner in a PDF prints as a white notch. */
  radius?: number;
  /** Drop shadow on the display copy. Same reasoning: never on the inner node. */
  elevated?: boolean;
  /** Applied to the outer, scaled wrapper - not to the canvas. */
  wrapperStyle?: CSSProperties;
  wrapperClassName?: string;
}

export const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  function CertificatePreview(
    { width, radius = 12, elevated = true, wrapperStyle, wrapperClassName, ...artwork },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [measured, setMeasured] = useState<number | null>(null);

    useEffect(() => {
      // An explicit width needs no observation at all.
      if (width != null) return;
      const el = hostRef.current;
      if (!el) return;
      // ResizeObserver rather than a window resize listener: these previews sit
      // inside grids and drawers that change width without the window doing so.
      // It also fires once on observe(), which is what supplies the very first
      // measurement, so nothing here has to set state synchronously.
      const ro = new ResizeObserver((entries) => {
        const next = entries[0]?.contentRect.width;
        if (next) setMeasured((prev) => (prev === next ? prev : next));
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [width]);

    const scale =
      (width ?? measured ?? CERTIFICATE_CANVAS_WIDTH) / CERTIFICATE_CANVAS_WIDTH;

    return (
      <div
        ref={hostRef}
        className={wrapperClassName}
        style={{
          width: width ?? "100%",
          // Reserve the right height before measurement so the surrounding grid
          // does not reflow once the scale resolves.
          aspectRatio: `${CERTIFICATE_CANVAS_WIDTH} / ${CERTIFICATE_CANVAS_HEIGHT}`,
          overflow: "hidden",
          borderRadius: radius,
          boxShadow: elevated ? "0 18px 44px rgba(16, 24, 40, 0.18)" : undefined,
          ...wrapperStyle,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: CERTIFICATE_CANVAS_WIDTH,
            height: CERTIFICATE_CANVAS_HEIGHT,
          }}
        >
          <CertificateArtwork ref={ref} {...artwork} />
        </div>
      </div>
    );
  },
);

/* ------------------------------------------------------------------ *
 * Locked variant
 * ------------------------------------------------------------------ */

export interface LockedCertificatePreviewProps
  extends Omit<CertificatePreviewProps, "elevated"> {
  /** The learner's current points total. */
  pointsCurrent: number;
  /** The threshold this certificate unlocks at. */
  pointsRequired: number;
  /** Overrides the derived "N points to unlock" chip copy. */
  unlockLabel?: string;
  /** BCP-47 tag for the points formatting. Defaults to the artwork locale. */
  numberLocale?: string;
}

/**
 * The real artwork, blurred and desaturated behind a scrim, with the points
 * still owing and a progress bar.
 *
 * Showing the ACTUAL certificate rather than a grey placeholder is the entire
 * motivational mechanism of the points ladder: a learner who can almost read
 * their own name on a Grand Gold certificate has a reason to finish the module.
 * A locked placeholder card gives them nothing to want.
 *
 * The overlay carries `exclude-from-certificate-export` so that if any caller
 * ever wires an export button to a locked preview, the export pipeline's filter
 * drops the scrim rather than burning "12,000 points to unlock" into a PNG.
 */
export function LockedCertificatePreview({
  pointsCurrent,
  pointsRequired,
  unlockLabel,
  numberLocale = "en-US",
  radius = 12,
  ...previewProps
}: LockedCertificatePreviewProps) {
  const { t } = useTranslation("common");

  const remaining = Math.max(0, Math.round(pointsRequired - pointsCurrent));
  // Clamp both ends: a negative current (never seen, but the total is summed
  // from two independent wallets) would render a bar running backwards, and an
  // over-threshold learner looking at a stale locked card should see a full bar
  // rather than 140%.
  const progress =
    pointsRequired > 0
      ? Math.max(0, Math.min(100, (pointsCurrent / pointsRequired) * 100))
      : 0;

  const chipCopy =
    unlockLabel ??
    t("certificatesUpload.lockedPointsToUnlock", "{{points}} points to unlock", {
      points: formatPoints(remaining, numberLocale),
    });

  const progressCopy = t(
    "certificatesUpload.lockedProgress",
    "{{current}} of {{required}} points",
    {
      current: formatPoints(pointsCurrent, numberLocale),
      required: formatPoints(pointsRequired, numberLocale),
    },
  );

  return (
    <Box sx={{ position: "relative", width: previewProps.width ?? "100%" }}>
      <Box
        aria-hidden
        sx={{
          // The blur lives on this wrapper, not on the artwork, so the artwork
          // node itself stays pristine and exportable if it is ever unlocked
          // without a remount.
          filter: "blur(5px) saturate(0.45)",
          borderRadius: `${radius}px`,
          overflow: "hidden",
        }}
      >
        <CertificatePreview {...previewProps} radius={radius} elevated={false} />
      </Box>

      <Box
        className="exclude-from-certificate-export"
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: `${radius}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          px: 3,
          textAlign: "center",
          // A literal white scrim. The previous version derived it from
          // palette.background.paper to survive a dark theme, but palette.mode is
          // never set to "dark" anywhere in this app and background.paper is
          // tenant-overridable, so the derivation only ever produced an
          // unpredictable tint of the same white.
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.82) 100%)",
          backdropFilter: "blur(1px)",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            // The circle stays: over artwork this reads as a lock badge, not as
            // a section tile.
            bgcolor: "#f5f3ff",
            color: "#7c3aed",
            border: "1px solid #ede9fe",
          }}
        >
          <IconWrapper icon="mdi:lock-outline" size={22} />
        </Box>

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 13, sm: 15 },
            color: "#0f172a",
            letterSpacing: 0.2,
          }}
        >
          {chipCopy}
        </Typography>

        <Box sx={{ width: "min(78%, 320px)" }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              borderRadius: 999,
              bgcolor: "#eef2f7",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                backgroundImage: CERT_BAR_GRADIENT,
              },
            }}
          />
          <Typography
            sx={{
              mt: 0.75,
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            {progressCopy}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
