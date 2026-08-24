"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { formatCertificateDate, formatPoints } from "@/lib/certificates/format";
import type {
  CertificateRenderPayload,
  ClaimableCertificate,
  IssuedCertificate,
  LearnerCertificatesResponse,
  LearnerTierStatus,
} from "@/lib/certificates/types";
import {
  CertificatePreview,
  LockedCertificatePreview,
} from "./CertificatePreview";
import { useCertificateArtworkLabels } from "./CertificateArtwork";
import { CertificateDetailDialog } from "./CertificateDetailDialog";
import {
  certificateQueryKeys,
  claimCertificate,
  claimableKey,
  payloadForLockedTier,
  payloadFromIssued,
  useCertificateIssuer,
  useRecipientName,
} from "./useLearnerCertificates";

/**
 * Everything a learner holds and everything they do not, on one page.
 *
 * The organising rule, and the reason the two grids never show the same thing
 * twice: the LADDER grid owns every tier, earned or not, because the ladder only
 * reads as a ladder when its rungs sit together; the EARNED grid owns everything
 * the ladder did not claim, which is courses, assessments, and any tier
 * credential whose rung has since been deleted by an admin. That last case is
 * why the split is computed from the set of credential ids the ladder actually
 * rendered rather than from `source.kind` - filtering on the kind would make a
 * real credential disappear from the page the moment its tier row went away.
 */

export interface CertificateGalleryProps {
  data: LearnerCertificatesResponse;
  locale?: string;
  numberLocale?: string;
  /** Highlight ring on one tier card, driven by the rail above. */
  focusTierSlug?: string | null;
}

/** Wide enough that a 1000x707 certificate is still legible as a thumbnail.
 *  Below about 260px the recipient name stops being readable and the card stops
 *  doing the one job it has. */
const CARD_MIN = 280;

const GRID_SX = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: {
    xs: "1fr",
    sm: `repeat(auto-fill, minmax(${CARD_MIN}px, 1fr))`,
  },
} as const;

export function CertificateGallery({
  data,
  locale = "en-GB",
  numberLocale = "en-US",
  focusTierSlug,
}: CertificateGalleryProps) {
  const theme = useTheme();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const labels = useCertificateArtworkLabels();
  const issuer = useCertificateIssuer();
  const recipientName = useRecipientName(data.issued);

  const [open, setOpen] = useState<{
    credentialId: string;
    payload: CertificateRenderPayload | null;
  } | null>(null);

  const tiers = useMemo(
    () => [...(data.tiers ?? [])].sort((a, b) => a.rank - b.rank),
    [data.tiers],
  );
  // Memoised because `?? []` mints a fresh array on every render, which would
  // otherwise re-run every derivation below it on every keystroke elsewhere on
  // the page - and each of those redraws a grid of full certificates.
  const issued = useMemo(() => data.issued ?? [], [data.issued]);
  const pointsTotal = data.points_total ?? 0;

  const issuedById = useMemo(() => {
    const map = new Map<string, IssuedCertificate>();
    for (const cert of issued) map.set(cert.credential_id, cert);
    return map;
  }, [issued]);

  /** Credential ids the ladder is already drawing, so the earned grid skips them. */
  const ladderCredentialIds = useMemo(() => {
    const ids = new Set<string>();
    for (const tier of tiers) {
      if (tier.credential_id && issuedById.has(tier.credential_id)) {
        ids.add(tier.credential_id);
      }
    }
    return ids;
  }, [tiers, issuedById]);

  const earned = useMemo(
    () => issued.filter((cert) => !ladderCredentialIds.has(cert.credential_id)),
    [issued, ladderCredentialIds],
  );

  const tierLabels = useMemo(
    () => ({
      bandLabel: t("certificatesUpload.tierBandLabel", "POINTS MILESTONE"),
      title: t("certificatesUpload.tierDocTitle", "Certificate of Achievement"),
      tagline: t(
        "certificatesUpload.tierTagline",
        "for steady progress and points earned on the platform",
      ),
      pointsLabel: t("certificatesUpload.tierPointsLabel", "Points"),
    }),
    [t],
  );

  const claimables = data.claimable ?? [];

  const claim = useMutation({
    mutationFn: async (row: ClaimableCertificate) => {
      const run = claimCertificate(row);
      if (!run) {
        throw new Error(
          t(
            "certificatesUpload.claimUnsupported",
            "This certificate cannot be claimed from here yet.",
          ),
        );
      }
      return run();
    },
    onSuccess: (result) => {
      // Refetch rather than patch the cache: a claim can also flip a tier to
      // achieved and empty the claimable list, and reconstructing all of that
      // client side is how the two grids start disagreeing with the server.
      queryClient.invalidateQueries({ queryKey: certificateQueryKeys.learner });
      showToast(
        t("certificatesUpload.claimDone", "Certificate claimed. It is yours now."),
        "success",
      );
      setOpen({
        credentialId: result.credential_id,
        payload: result.certificate
          ? payloadFromIssued(result.certificate, issuer)
          : null,
      });
    },
    onError: (error: unknown) => {
      showToast(
        error instanceof Error
          ? error.message
          : t("certificatesUpload.claimFailed", "Could not claim this certificate."),
        "error",
      );
    },
  });

  const claimingKey = claim.isPending && claim.variables ? claimableKey(claim.variables) : null;

  return (
    <Stack spacing={4}>
      {claimables.length > 0 && (
        <Section
          icon="mdi:gift-outline"
          title={t("certificatesUpload.claimTitle", "Ready to claim")}
          subtitle={t(
            "certificatesUpload.claimSubtitle",
            "You have met the requirements. Claim these to add them to your collection.",
          )}
        >
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(auto-fill, minmax(340px, 1fr))",
              },
            }}
          >
            {claimables.map((row) => {
              const key = claimableKey(row);
              const busy = claimingKey === key;
              return (
                <Stack
                  key={key}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      color: theme.palette.warning.contrastText,
                      backgroundImage: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                    }}
                  >
                    <IconWrapper icon="mdi:certificate" size={22} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        color: theme.palette.text.primary,
                        lineHeight: 1.25,
                      }}
                    >
                      {row.label}
                    </Typography>
                    {row.title && (
                      <Typography
                        sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}
                      >
                        {row.title}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    disabled={busy || claim.isPending}
                    onClick={() => claim.mutate(row)}
                    startIcon={
                      busy ? <CircularProgress size={14} color="inherit" /> : undefined
                    }
                    sx={{
                      borderRadius: 999,
                      fontWeight: 800,
                      textTransform: "none",
                      flexShrink: 0,
                    }}
                  >
                    {t("certificatesUpload.claimCta", "Claim")}
                  </Button>
                </Stack>
              );
            })}
          </Box>
        </Section>
      )}

      <Section
        icon="mdi:certificate"
        title={t("certificatesUpload.earnedTitle", "Your certificates")}
        subtitle={t(
          "certificatesUpload.earnedSubtitle",
          "Credentials you earned on courses and assessments. Every one has a public verification page.",
        )}
      >
        {earned.length === 0 ? (
          <EmptyEarned />
        ) : (
          <Box sx={GRID_SX}>
            {earned.map((cert) => {
              const payload = payloadFromIssued(cert, issuer);
              return (
                <CertificateCard
                  key={cert.credential_id}
                  caption={cert.subtitle?.trim() || cert.source?.label || cert.title}
                  meta={formatCertificateDate(cert.issued_at, locale)}
                  revoked={cert.status === "revoked"}
                  revokedLabel={t("certificatesUpload.artRevoked", "Revoked")}
                  viewLabel={t("certificatesUpload.viewCertificate", "View certificate")}
                  onOpen={() =>
                    setOpen({ credentialId: cert.credential_id, payload })
                  }
                >
                  <CertificatePreview
                    payload={payload}
                    labels={labels}
                    locale={locale}
                    radius={10}
                    elevated={false}
                  />
                </CertificateCard>
              );
            })}
          </Box>
        )}
      </Section>

      {tiers.length > 0 && (
        <Section
          icon="mdi:stairs-up"
          title={t("certificatesUpload.ladderTitle", "The points ladder")}
          subtitle={t(
            "certificatesUpload.ladderSubtitle",
            "Every milestone certificate, including the ones still ahead of you. Points come from your courses and from the community.",
          )}
        >
          <Box sx={GRID_SX}>
            {tiers.map((tier) => {
              const cert = tier.credential_id ? issuedById.get(tier.credential_id) : undefined;
              if (cert) {
                const payload = payloadFromIssued(cert, issuer);
                return (
                  <CertificateCard
                    key={tier.slug}
                    anchorId={`tier-${tier.slug}`}
                    caption={tier.name}
                    meta={formatCertificateDate(cert.issued_at, locale)}
                    focused={focusTierSlug === tier.slug}
                    revoked={cert.status === "revoked"}
                    revokedLabel={t("certificatesUpload.artRevoked", "Revoked")}
                    viewLabel={t("certificatesUpload.viewCertificate", "View certificate")}
                    onOpen={() =>
                      setOpen({ credentialId: cert.credential_id, payload })
                    }
                  >
                    <CertificatePreview
                      payload={payload}
                      labels={labels}
                      locale={locale}
                      radius={10}
                      elevated={false}
                    />
                  </CertificateCard>
                );
              }

              return (
                <TierTeaser
                  key={tier.slug}
                  tier={tier}
                  focused={focusTierSlug === tier.slug}
                  caption={tier.name}
                  meta={t("certificatesUpload.ladderRequires", "{{points}} points", {
                    points: formatPoints(tier.points, numberLocale),
                  })}
                >
                  <LockedCertificatePreview
                    payload={payloadForLockedTier(
                      tier,
                      issuer,
                      recipientName,
                      tierLabels,
                      numberLocale,
                    )}
                    labels={labels}
                    locale={locale}
                    radius={10}
                    pointsCurrent={pointsTotal}
                    pointsRequired={tier.points}
                    numberLocale={numberLocale}
                    /* A tier can be achieved and still have no credential: the
                       learner crossed the threshold but has not pulled it yet.
                       The derived chip would read "0 points to unlock" there,
                       which tells them nothing about what to do next. */
                    unlockLabel={
                      tier.achieved
                        ? t("certificatesUpload.ladderReadyToClaim", "Ready to claim")
                        : undefined
                    }
                  />
                </TierTeaser>
              );
            })}
          </Box>
        </Section>
      )}

      <CertificateDetailDialog
        open={open != null}
        onClose={() => setOpen(null)}
        credentialId={open?.credentialId ?? null}
        fallbackPayload={open?.payload ?? null}
        locale={locale}
      />
    </Stack>
  );
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box component="section">
      <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: theme.palette.warning.contrastText,
            backgroundImage: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
          }}
        >
          <IconWrapper icon={icon} size={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h2"
            sx={{
              fontWeight: 900,
              fontSize: "1.05rem",
              letterSpacing: "-0.3px",
              lineHeight: 1.2,
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontSize: "0.8rem",
                color: theme.palette.text.secondary,
                mt: 0.25,
                maxWidth: 720,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

/**
 * A certificate thumbnail that opens the detail dialog.
 *
 * The card is a single ButtonBase rather than a div with a nested "View" button,
 * because the certificate image is the obvious click target and a learner who
 * clicks the artwork and gets nothing concludes the page is broken. The visible
 * "View certificate" line is an affordance, not the hit area.
 */
function CertificateCard({
  children,
  caption,
  meta,
  onOpen,
  focused,
  revoked,
  revokedLabel,
  viewLabel,
  anchorId,
}: {
  children: React.ReactNode;
  caption: string;
  meta?: string;
  onOpen: () => void;
  focused?: boolean;
  revoked?: boolean;
  revokedLabel: string;
  viewLabel: string;
  /** Scroll target for the milestone rail above. */
  anchorId?: string;
}) {
  const theme = useTheme();
  return (
    <ButtonBase
      id={anchorId}
      onClick={onOpen}
      sx={{
        display: "block",
        scrollMarginTop: "104px",
        width: "100%",
        textAlign: "start",
        p: 1.25,
        borderRadius: 4,
        border: `1px solid ${
          focused ? theme.palette.warning.main : theme.palette.divider
        }`,
        bgcolor: theme.palette.background.paper,
        transition: "transform .18s, box-shadow .18s, border-color .18s",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: alpha(theme.palette.warning.main, 0.6),
          boxShadow: `0 18px 38px -22px ${alpha(theme.palette.common.black, 0.6)}`,
        },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.warning.main}`,
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        {children}
        {revoked && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineEnd: 8,
              px: 1,
              py: 0.25,
              borderRadius: 999,
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: theme.palette.error.contrastText,
              bgcolor: theme.palette.error.main,
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {revokedLabel}
          </Box>
        )}
      </Box>
      <Box sx={{ px: 0.75, pt: 1.25, pb: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "0.88rem",
            lineHeight: 1.3,
            color: theme.palette.text.primary,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 0.5 }}
        >
          {meta && (
            <Typography
              sx={{ fontSize: "0.72rem", fontWeight: 600, color: theme.palette.text.secondary }}
            >
              {meta}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={0.25}
            alignItems="center"
            sx={{ color: theme.palette.warning.dark, flexShrink: 0 }}
          >
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800 }}>{viewLabel}</Typography>
            <IconWrapper icon="mdi:chevron-right" size={16} />
          </Stack>
        </Stack>
      </Box>
    </ButtonBase>
  );
}

/** A rung the learner has not reached. Inert on purpose: there is no credential
 *  behind it to open, and a card that looks clickable and does nothing is worse
 *  than one that plainly is not. */
function TierTeaser({
  children,
  caption,
  meta,
  focused,
  tier,
}: {
  children: React.ReactNode;
  caption: string;
  meta: string;
  focused?: boolean;
  tier: LearnerTierStatus;
}) {
  const theme = useTheme();
  return (
    <Box
      id={`tier-${tier.slug}`}
      sx={{
        p: 1.25,
        borderRadius: 4,
        border: `1px ${focused ? "solid" : "dashed"} ${
          focused ? theme.palette.warning.main : theme.palette.divider
        }`,
        bgcolor: alpha(theme.palette.text.primary, 0.02),
        scrollMarginTop: "104px",
      }}
    >
      {children}
      <Box sx={{ px: 0.75, pt: 1.25, pb: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "0.88rem",
            lineHeight: 1.3,
            color: theme.palette.text.secondary,
          }}
        >
          {caption}
        </Typography>
        <Typography
          sx={{ fontSize: "0.72rem", fontWeight: 600, color: theme.palette.text.disabled, mt: 0.5 }}
        >
          {meta}
        </Typography>
      </Box>
    </Box>
  );
}

function EmptyEarned() {
  const theme = useTheme();
  const { t } = useTranslation("common");
  return (
    <Box
      sx={{
        p: { xs: 3, sm: 5 },
        borderRadius: 4,
        border: `1px dashed ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.text.primary, 0.02),
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          mx: "auto",
          display: "grid",
          placeItems: "center",
          color: theme.palette.warning.dark,
          bgcolor: alpha(theme.palette.warning.main, 0.14),
        }}
      >
        <IconWrapper icon="mdi:certificate-outline" size={26} />
      </Box>
      <Typography
        sx={{ mt: 1.5, fontWeight: 800, fontSize: "0.95rem", color: theme.palette.text.primary }}
      >
        {t("certificatesUpload.earnedEmptyTitle", "No certificates yet")}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: "0.82rem",
          color: theme.palette.text.secondary,
          maxWidth: 460,
          mx: "auto",
        }}
      >
        {t(
          "certificatesUpload.earnedEmptyBody",
          "Finish a course or an assessment and your first credential appears here. The blurred certificates below are the milestones waiting for you.",
        )}
      </Typography>
    </Box>
  );
}

/** Skeletons rather than a spinner: the page is a grid of fixed-ratio cards, so
 *  the shimmer can occupy the exact shape the content will, and nothing jumps
 *  when the data lands. */
export function CertificateGallerySkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Stack spacing={4}>
      <Skeleton variant="rounded" sx={{ height: 148, borderRadius: 4 }} />
      <Box>
        <Skeleton variant="text" sx={{ width: 200, fontSize: "1.05rem" }} />
        <Skeleton variant="text" sx={{ width: 340, fontSize: "0.8rem", mb: 2 }} />
        <Box sx={GRID_SX}>
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              sx={{ width: "100%", aspectRatio: "1000 / 707", borderRadius: 4 }}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
