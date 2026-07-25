"use client";

import { useEffect, useMemo, useState } from "react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveQuizService,
  type AdaptiveAttemptSummary,
} from "@/lib/services/adaptive-quiz.service";
import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  AdaptiveQuizCard,
  type AdaptiveQuizCardData,
} from "@/components/adaptive-quiz/AdaptiveQuizCard";
import { RecentAttemptsRow } from "@/components/adaptive-quiz/RecentAttemptsRow";

type Filter = "all" | "personal" | "public" | "archived";

export default function AdaptiveQuizListPage() {
  const { push } = useInstantNavigation();
  const featureOn = useIsAdaptiveQuizEnabled();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdaptiveQuizCardData[]>([]);
  const [attempts, setAttempts] = useState<AdaptiveAttemptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!featureOn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        // Fire both calls in parallel - the attempts row needs the same auth +
        // tenant context as the listing and there's no reason to wait for one
        // to finish the other.
        const [list, mine] = await Promise.all([
          adaptiveQuizService.listQuizzes() as Promise<AdaptiveQuizCardData[]>,
          adaptiveQuizService.listMyAttempts().catch(() => []),
        ]);
        if (!cancelled) {
          setItems(list);
          setAttempts(mine);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load adaptive quizzes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [featureOn]);

  const stats = useMemo(() => {
    // Active = anything visible by default (every public + every non-archived
    // personal). Archived = personal re-quizzes the student has already
    // completed - they don't clutter the main view but stay reachable via the
    // dedicated filter so past results are one click away.
    const activePersonal = items.filter((i) => i.is_personal && !i.is_archived);
    const archivedPersonal = items.filter((i) => i.is_personal && i.is_archived);
    const publicItems = items.filter((i) => !i.is_personal);
    const activeItems = [...publicItems, ...activePersonal];
    const skillSet = new Set<string>();
    for (const it of activeItems) for (const s of it.target_skills) if (s) skillSet.add(s);
    return {
      active: activeItems.length,
      personal: activePersonal.length,
      public: publicItems.length,
      archived: archivedPersonal.length,
      skills: skillSet.size,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "personal") return items.filter((i) => i.is_personal && !i.is_archived);
    if (filter === "public") return items.filter((i) => !i.is_personal);
    if (filter === "archived") return items.filter((i) => i.is_archived);
    // "All" hides archived re-quizzes so the library stays focused on what
    // the student should take next.
    return items.filter((i) => !i.is_archived);
  }, [items, filter]);

  if (!featureOn) {
    return (
      <MainLayout>
        <Container sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Adaptive quiz isn&apos;t enabled for this organisation.
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            Ask your administrator to switch on the &quot;Adaptive Quiz&quot; feature.
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Library · Adaptive Engine"
            title="Adaptive Quizzes"
            subtitle="Each quiz adapts to you in real time - difficulty shifts as your confidence does, and results come with named misconceptions plus a 15-minute remediation path."
            icon="mdi:robot-happy-outline"
            accent="purple"
          />

          {stats.active + stats.archived > 0 && (
            <KpiRail
              items={[
                { value: stats.active, label: "Quizzes available", accent: "#6366f1" },
                { value: attempts.length, label: "Your attempts", accent: "#10b981" },
                { value: stats.skills, label: "Skills tracked", accent: "#a855f7" },
                { value: stats.archived, label: "Archived re-quizzes", accent: "#ec4899" },
              ]}
            />
          )}

          {/* Past attempts - the missing back-door to results pages */}
          <RecentAttemptsRow attempts={attempts} />

          {/* Filter row - hidden until there's something to filter (more than
              one category present). Shows when the student has personal re-quizzes
              OR completed (archived) ones, so they can navigate between them. */}
          {(stats.personal + stats.archived > 0) && (stats.public > 0 || stats.personal > 0 || stats.archived > 0) && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
              {(
                [
                  { key: "all", label: "All", count: stats.active, accent: "#6366f1" },
                  ...(stats.public > 0 ? [{ key: "public" as Filter, label: "Public", count: stats.public, accent: "#a855f7" }] : []),
                  ...(stats.personal > 0 ? [{ key: "personal" as Filter, label: "Active re-quizzes", count: stats.personal, accent: "#f59e0b" }] : []),
                  ...(stats.archived > 0 ? [{ key: "archived" as Filter, label: "Archived", count: stats.archived, accent: "#ec4899" }] : []),
                ] as Array<{ key: Filter; label: string; count: number; accent: string }>
              ).map((b) => {
                const active = filter === b.key;
                return (
                  <ButtonBase
                    key={b.key}
                    onClick={() => setFilter(b.key)}
                    sx={{
                      px: 1.75,
                      py: 0.85,
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      color: active ? "white" : "text.primary",
                      background: active
                        ? `linear-gradient(135deg, ${b.accent} 0%, color-mix(in srgb, ${b.accent} 50%, #ec4899) 100%)`
                        : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                      border: active ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      transition: "transform 120ms ease",
                      "&:hover": { transform: "translateY(-1px)" },
                    }}
                  >
                    {b.label}
                    <Box
                      component="span"
                      sx={{
                        px: 0.6,
                        py: 0.1,
                        borderRadius: 999,
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        bgcolor: active ? "color-mix(in srgb, white 22%, transparent)" : "color-mix(in srgb, currentColor 10%, transparent)",
                        color: "inherit",
                      }}
                    >
                      {b.count}
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>
          )}

          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading adaptive quizzes…
            </Typography>
          )}

          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && items.length === 0 && <EmptyState />}

          {!loading && filteredItems.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              {filteredItems.map((item, idx) => (
                <Reveal key={item.config_id} delay={Math.min(idx, 8) * 0.06}>
                  <AdaptiveQuizCard
                    data={item}
                    onStart={() => {
                      // Personal re-quizzes have an existing session - never go
                      // through /start which would mint a duplicate. Archived
                      // routes to its results; active routes to the live page.
                      if (item.is_personal && item.latest_session_id) {
                        const target = item.is_archived
                          ? `/adaptive-quizzes/session/${item.latest_session_id}/results`
                          : `/adaptive-quizzes/session/${item.latest_session_id}`;
                        push(target);
                        return;
                      }
                      push(`/adaptive-quizzes/start?configId=${item.config_id}`);
                    }}
                  />
                </Reveal>
              ))}
            </Box>
          )}

          {!loading && items.length > 0 && filteredItems.length === 0 && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
              No quizzes match this filter.
            </Typography>
          )}
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}

function EmptyState() {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 4,
        textAlign: "center",
        bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
        border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
      }}
    >
      <Icon icon="mdi:robot-confused-outline" width={48} style={{ color: "#a855f7" }} />
      <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>
        No adaptive quizzes yet.
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 520, mx: "auto", lineHeight: 1.5 }}>
        Your instructor hasn&apos;t published an adaptive quiz on this account yet.
        Check back soon - once one is ready, it&apos;ll appear here.
      </Typography>
    </Box>
  );
}
