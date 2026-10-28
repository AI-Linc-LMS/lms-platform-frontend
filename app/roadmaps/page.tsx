"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { usePayment } from "@/hooks/usePayment";
import { PaymentType } from "@/lib/services/payment.service";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { RoadmapIndex } from "@/components/roadmaps/RoadmapIndex";
import { Surface } from "@/components/roadmaps/surfaces";
import { CreateCourseBar } from "@/components/roadmaps/CreateCourseBar";
import { ForgeProgressDialog } from "@/components/roadmaps/ForgeProgressDialog";
import {
  ForgeUnavailableError,
  forgeService,
  roadmapKeys,
  roadmapsService,
  type ForgeJob,
  type RoadmapCard as Card,
} from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * The roadmap catalog.
 *
 * Built on the assessment-management language: CSS custom-property tokens (so it inherits
 * tenant theming), a segmented tab track for the taxonomy, and hairline surfaces. Depth comes
 * from the surface ladder, never from drop shadows, and no card lifts or blurs a backdrop on
 * hover -- see `components/roadmaps/surfaces.tsx` for the two rules.
 *
 * Categories are TABS rather than a left rail. The rail cost 220px of the widest content on
 * the page to render six words, and it competed with the sidebar immediately beside it.
 *
 * Companies sit in their own section at the END. They answer a different question ("who am I
 * interviewing with") than the rest of the catalog ("what do I want to learn"), so they are
 * kept separate rather than filed under a category; but the catalog is a learning surface
 * first, so the skills come before the recruiters.
 *
 * There is no stat row. "9 roadmaps / 9 companies / 468 steps" restated what the page below
 * already shows and pushed the actual content down a screen.
 */
export default function RoadmapsPage() {
  const { push, prefetch } = useInstantNavigation();

  const { data, isLoading, isError } = useQuery({
    queryKey: roadmapKeys.catalog,
    queryFn: roadmapsService.catalog,
    staleTime: 5 * 60 * 1000,
  });

  const bySlug = useMemo(
    () => Object.fromEntries((data?.roadmaps ?? []).map((r) => [r.slug, r])),
    [data]
  );

  const categories = data?.categories ?? [];
  // Always the "all" view: the taxonomy tabs are gone, so every section is on one page.
  const active = categories.find((c) => c.slug === "all") ?? categories[0];

  const all = data?.roadmaps ?? [];


  /** What to rebuild after a payment settles. */
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [job, setJob] = useState<ForgeJob | null>(null);
  const [building, setBuilding] = useState(false);
  /**
   * The whole refusal, not just its sentence.
   *
   * A build past the free allowance is a 402 carrying a price, and the sentence alone cannot be
   * paid: this bar used to render the text and stop there, so the one refusal a learner can
   * actually act on was the one that looked most like a dead end. The roadmap drawer has offered
   * checkout since the paywall shipped; this is the same offer on the other way in.
   */
  const [refusal, setRefusal] = useState<ForgeUnavailableError | null>(null);
  /** A payment that is settling, which is NOT a failure and must not read as one. */
  const [notice, setNotice] = useState<string | null>(null);
  const { t } = useTranslation();
  const { handlePayment, busyKey } = usePayment();
  const PAY_KEY = "roadmap-build-prompt";

  const createFromPrompt = async (prompt: string) => {
    setRefusal(null);
    setNotice(null);
    setLastPrompt(prompt);
    setBuilding(true);
    try {
      setJob(await forgeService.create({ prompt }));
    } catch (err) {
      // A 422 is the expected "we have nothing for that" answer, not a crash: it carries a
      // sentence written for the learner, so show it rather than a generic failure.
      setRefusal(
        err instanceof ForgeUnavailableError
          ? err
          : new ForgeUnavailableError(
              "Something went wrong starting that build.",
              "unknown",
              { status: 0 }
            )
      );
    } finally {
      setBuilding(false);
    }
  };

  /**
   * Buy one build credit, then build the prompt that was refused.
   *
   * `type_id` is the QUANTITY for this payment type: a credit floats until it is spent on a
   * topic, so there is no row to point at. A payment that is still settling leaves the refusal
   * cleared and a notice up, because pressing build again once it lands is the right move and
   * telling them it failed would be wrong.
   */
  const payForABuild = () => {
    if (!lastPrompt) return;
    setNotice(null);
    void handlePayment({
      typeId: "1",
      paymentType: PaymentType.ROADMAP,
      description: t("roadmapPaywall.orderDescription"),
      busyKey: PAY_KEY,
      onOutcome: (outcome) => {
        if (outcome.kind === "verified") {
          setRefusal(null);
          void createFromPrompt(lastPrompt);
        } else if (outcome.kind === "settling") {
          setRefusal(null);
          setNotice(outcome.message);
        } else if (outcome.kind === "failed") {
          setNotice(outcome.message);
        }
      },
    });
  };


  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Learn"
        title="Roadmaps"
        description="Pick a path and follow it. Every step is a verified topic you can practise and be scored on."
        accent="purple"
        icon="solar:map-point-wave-bold-duotone"
        guideKey="roadmaps"
      />

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 }, pb: { xs: "180px", md: "132px" } }}>
        {isLoading && (
          <Typography sx={{ mt: 4, color: "var(--font-tertiary)" }}>
            Loading roadmaps...
          </Typography>
        )}

        {isError && (
          <Typography sx={{ mt: 4, color: "var(--accent-red)" }}>
            We could not load the roadmaps. Please try again.
          </Typography>
        )}

        {!isLoading && !isError && all.length === 0 && (
          <Surface sx={{ mt: 2.5 }}>
            <Stack alignItems="center" spacing={1.5} sx={{ py: 6, textAlign: "center" }}>
              <Icon
                icon="solar:map-point-wave-linear"
                width={40}
                color="var(--font-tertiary)"
              />
              <Typography sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                No roadmaps yet
              </Typography>
              <Typography
                sx={{ fontSize: "0.85rem", color: "var(--font-tertiary)", maxWidth: 380 }}
              >
                Your institution has not published any roadmaps. Once they do, they will appear
                here.
              </Typography>
            </Stack>
          </Surface>
        )}

        {/* Every path on one screen. Sections keep the editorial grouping; the entries
            themselves are single rows, so the whole catalogue is visible without scrolling. */}
        {!isLoading &&
          active?.sections.map((section) => {
            const entries = section.roadmaps
              .map((slug) => bySlug[slug])
              .filter(Boolean) as Card[];
            if (!entries.length) return null;
            const isCompanySection = entries.every((r) => r.kind === "company");
            return (
              <RoadmapIndex
                key={section.title}
                title={section.title}
                icon={
                  isCompanySection
                    ? "solar:buildings-2-linear"
                    : "solar:layers-minimalistic-linear"
                }
                roadmaps={entries}
                onOpen={(slug) => push(`/roadmaps/${slug}`)}
                onHover={(slug) => prefetch(`/roadmaps/${slug}`)}
              />
            );
          })}

        {(refusal || notice) && (
          <Stack spacing={1.25} alignItems="center" sx={{ mt: 2 }}>
            <Typography
              data-testid="prompt-forge-refusal"
              sx={{
                fontSize: "0.88rem",
                color: refusal ? "var(--accent-red)" : "var(--font-secondary)",
                textAlign: "center",
              }}
            >
              {refusal?.message || notice}
            </Typography>
            {/* Offered only when the server quoted an amount. A tenant that has priced nothing
                answers `not_for_sale`, and a checkout over a null price is a dead end. */}
            {refusal?.paymentRequired && (
              <Box
                component="button"
                onClick={payForABuild}
                disabled={busyKey === PAY_KEY}
                data-testid="prompt-forge-pay"
                sx={{
                  appearance: "none",
                  border: "none",
                  cursor: busyKey === PAY_KEY ? "default" : "pointer",
                  font: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2.5,
                  py: 1.1,
                  minHeight: 44,
                  borderRadius: 999,
                  bgcolor:
                    busyKey === PAY_KEY
                      ? "color-mix(in srgb, var(--accent-purple) 30%, #1e1b4b)"
                      : "color-mix(in srgb, var(--accent-purple) 65%, #1e1b4b)",
                  color: "#fff",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                }}
              >
                <Icon
                  icon={
                    busyKey === PAY_KEY ? "svg-spinners:180-ring-with-bg" : "solar:card-linear"
                  }
                  width={17}
                />
                {busyKey === PAY_KEY
                  ? t("roadmapPaywall.opening")
                  : t("roadmapPaywall.payCta", {
                      price: `${refusal.currency} ${refusal.price}`,
                    })}
              </Box>
            )}
          </Stack>
        )}

        {!isLoading && all.length > 0 && (
          <CreateCourseBar
            roadmaps={all}
            busy={building}
            onSubmit={createFromPrompt}
            onPickRoadmap={(slug) => push(`/roadmaps/${slug}`)}
          />
        )}
      </Container>

      <ForgeProgressDialog job={job} open={Boolean(job)} onClose={() => setJob(null)} />
    </PageShell>
  );
}
