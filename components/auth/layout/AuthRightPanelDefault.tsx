"use client";

import { Box, Skeleton, Typography } from "@mui/material";
import type { LoginHeroBrandingUi } from "@/lib/theme/authHeroBranding";
import { AUTH, FONT, RADIUS, TYPE } from "./authTokens";

interface AuthRightPanelDefaultProps {
  clientInfoLoading: boolean;
  sloganText: string;
  logoUrl: string;
  brandName: string;
  loginImgUrl?: string | null;
  heroBranding?: LoginHeroBrandingUi;
  useCustomSlogan?: boolean;
  supportingText?: string;
}

/**
 * Owned atmosphere: a dot lattice fading from the top-left, plus a violet bloom with a pink
 * counterweight.
 *
 * These exist because the panel used to rely on the tenant's hero image for all of its texture,
 * which fails in both directions: a low-resolution upload turns into visible compression blocks
 * at low opacity, and a tenant with no hero at all gets a flat gradient. Neither layer depends
 * on tenant content, so the panel is finished before any asset arrives.
 */
function PanelTexture() {
  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,0.15) 0.8px, transparent 0.9px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(120% 95% at 12% 8%, #000 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(120% 95% at 12% 8%, #000 0%, transparent 72%)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(60% 44% at 82% 16%, rgba(168,85,247,0.24) 0%, transparent 70%), radial-gradient(52% 40% at 6% 62%, rgba(236,72,153,0.15) 0%, transparent 72%)",
        }}
      />
    </>
  );
}

/**
 * The dark brand surface.
 *
 * The uploaded LOGO is the masthead at the top; the tenant's name closes the panel quietly at the
 * foot. A tenant who uploaded a mark expects to see it first, and the top-left of a page is where
 * a masthead belongs.
 *
 * A previous revision had these the other way round — name leading as type, logo demoted to the
 * footer — on the reasoning that type always looks intentional while an arbitrary upload might
 * not. The tradeoff it was avoiding is real, so two things carry over: there is still no white
 * chip behind the logo (it existed only to rescue logos with a baked-in white background, and
 * penalised every good logo to protect against the bad ones), and the gradient accent rule still
 * sits under the masthead, which is the one element that looks deliberate regardless of what a
 * tenant uploaded.
 *
 * When there is NO logo, the name takes the masthead and the footer stays empty rather than
 * printing the same words twice on one panel.
 */
export function AuthRightPanelDefault({
  clientInfoLoading,
  sloganText,
  logoUrl,
  brandName,
  loginImgUrl,
  supportingText,
}: AuthRightPanelDefaultProps) {
  const heroSrc = loginImgUrl?.trim() || "";
  const displayName = brandName || "AI Linc";

  return (
    <Box
      sx={{
        flex: { xs: 0, md: "0 0 48%" },
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        px: 7,
        py: 7,
        backgroundColor: AUTH.night,
        backgroundImage: `radial-gradient(120% 120% at 8% 108%, ${AUTH.violet}59 0%, ${AUTH.violetDeep}33 38%, transparent 68%), linear-gradient(160deg, ${AUTH.night2} 0%, ${AUTH.night} 62%)`,
      }}
    >
      {heroSrc ? (
        <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* Plain <img>, NOT next/image: tenant assets are arbitrary admin-supplied URLs, often
              SVG or on hosts the optimizer 400s on, and it silently dropped them for many
              clients. The hero now sits UNDER the owned texture rather than instead of it, so a
              low-resolution upload can no longer be the only thing carrying the panel. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: 0.18,
              filter: "blur(2px) saturate(0.85)",
              transform: "scale(1.06)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(160deg, ${AUTH.night2}d9 0%, ${AUTH.night}f2 70%)`,
            }}
          />
        </Box>
      ) : null}

      <PanelTexture />

      {/* The uploaded logo leads. A tenant who has taken the trouble to upload a mark expects to
          see it first, and the top of the panel is where a masthead belongs.

          No white chip behind it: that only ever existed to rescue logos with a baked-in white
          background, and it penalised every good logo to protect against the bad ones. Sized
          generously here (44px) because this is now the masthead, not a signature.

          The accent rule stays underneath either way — it is what ties this corner to the
          headline below, and it is the one element that does not depend on what was uploaded. */}
      <Box sx={{ position: "relative", zIndex: 2 }}>
        {clientInfoLoading ? (
          <Skeleton variant="rounded" width={150} height={38} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
        ) : (
          <>
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={brandName || "Logo"}
                style={{ maxHeight: 44, maxWidth: 210, objectFit: "contain", display: "block" }}
              />
            ) : (
              /* No logo uploaded: the name takes the masthead rather than leaving a hole, which
                 is also exactly what every tenant saw before they uploaded anything. */
              <Typography
                component="p"
                sx={{
                  ...TYPE.section,
                  fontFamily: FONT,
                  color: "#ffffff",
                  '[dir="rtl"] &': { letterSpacing: "normal" },
                }}
              >
                {displayName}
              </Typography>
            )}
            <Box
              aria-hidden
              sx={{
                width: 34,
                height: 2,
                mt: 1.25,
                borderRadius: "2px",
                background: `linear-gradient(90deg, ${AUTH.violet}, ${AUTH.pink})`,
              }}
            />
          </>
        )}
      </Box>

      <Box sx={{ position: "relative", zIndex: 2, maxWidth: 460 }}>
        {clientInfoLoading ? (
          <>
            <Skeleton
              variant="text"
              width="90%"
              height={52}
              sx={{ bgcolor: "rgba(255,255,255,0.10)" }}
            />
            <Skeleton
              variant="text"
              width="70%"
              height={52}
              sx={{ bgcolor: "rgba(255,255,255,0.10)" }}
            />
          </>
        ) : (
          <Typography
            component="p"
            sx={{
              ...TYPE.display,
              fontFamily: FONT,
              color: "#ffffff",
              // Arabic joins cursively; negative tracking breaks the joins.
              '[dir="rtl"] &': { letterSpacing: "normal" },
            }}
          >
            {sloganText}
          </Typography>
        )}

        {supportingText ? (
          <Typography
            component="p"
            sx={{
              ...TYPE.body,
              fontFamily: FONT,
              color: "rgba(255,255,255,0.68)",
              mt: 2.5,
              maxWidth: 400,
            }}
          >
            {supportingText}
          </Typography>
        ) : null}
      </Box>

      {/* The tenant NAME closes the panel, where the logo used to sit. Set quietly — at the foot
          of a page it reads as an attribution rather than a second masthead competing with the
          one at the top.

          Suppressed when there is no logo, because in that case the name is already the masthead
          and printing it twice on one panel just looks like a mistake. */}
      <Box sx={{ position: "relative", zIndex: 2, minHeight: 28, display: "flex", alignItems: "center" }}>
        {clientInfoLoading ? (
          <Skeleton variant="text" width={150} height={22} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
        ) : logoUrl && displayName ? (
          <Typography
            component="p"
            sx={{
              fontFamily: FONT,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.78)",
              '[dir="rtl"] &': { letterSpacing: "normal" },
            }}
          >
            {displayName}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

/**
 * Compact dark bar for phones, where the panel above is not rendered.
 *
 * Mirrors the desktop panel: the uploaded logo leads, and the name trails it small. Without this
 * a tenant's users saw zero branding on mobile, because the brand panel is display:none below md.
 */
export function AuthMobileBrandBar({
  logoUrl,
  brandName,
  clientInfoLoading,
}: {
  logoUrl: string;
  brandName: string;
  clientInfoLoading: boolean;
}) {
  const displayName = brandName || "AI Linc";

  return (
    <Box
      sx={{
        px: 3,
        py: 2.5,
        minHeight: 76,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        backgroundColor: AUTH.night,
        backgroundImage: `radial-gradient(120% 200% at 4% 120%, ${AUTH.violet}4d 0%, transparent 62%), linear-gradient(160deg, ${AUTH.night2} 0%, ${AUTH.night} 70%)`,
      }}
    >
      {clientInfoLoading ? (
        <Skeleton variant="rounded" width={110} height={26} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
      ) : (
        <Box sx={{ minWidth: 0 }}>
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={brandName || "Logo"}
              style={{ maxHeight: 30, maxWidth: 150, objectFit: "contain", display: "block" }}
            />
          ) : (
            /* No logo: the name takes the lead here too, rather than leaving the bar empty. */
            <Typography
              component="p"
              sx={{
                ...TYPE.body,
                fontFamily: FONT,
                fontWeight: 600,
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </Typography>
          )}
          <Box
            aria-hidden
            sx={{
              width: 26,
              height: 2,
              mt: 0.75,
              borderRadius: `${RADIUS}px`,
              background: `linear-gradient(90deg, ${AUTH.violet}, ${AUTH.pink})`,
            }}
          />
        </Box>
      )}

      {/* The name trails, and only when the logo already took the lead — otherwise it would
          print twice in a 76px bar. */}
      {!clientInfoLoading && logoUrl && displayName ? (
        <Typography
          component="p"
          sx={{
            fontFamily: FONT,
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
            flex: "none",
            maxWidth: "45%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </Typography>
      ) : null}
    </Box>
  );
}
