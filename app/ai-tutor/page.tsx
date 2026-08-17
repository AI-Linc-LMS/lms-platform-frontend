"use client";

import { useMemo, useState } from "react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { TopicComposer } from "@/components/ai-tutor/dashboard/TopicComposer";
import { NotesPanel } from "@/components/ai-tutor/dashboard/NotesPanel";
import { MinutesPanel } from "@/components/ai-tutor/dashboard/MinutesPanel";
import { ProgressPanel } from "@/components/ai-tutor/dashboard/ProgressPanel";
import { CapabilityPanel } from "@/components/ai-tutor/dashboard/CapabilityPanel";
import {
  TutorSectionHeading,
  TutorSurface,
  TutorTintSurface,
} from "@/components/ai-tutor/shared/surfaces";
import {
  aiTutorKeys,
  aiTutorService,
  type TutorDashboard,
  type TutorLevel,
} from "@/lib/services/ai-tutor.service";

/**
 * The AI Tutor dashboard.
 *
 * The design requirement this page exists to satisfy is that it must never look empty,
 * including for a learner opening it for the first time. The approach is not to invent
 * filler but to give every panel an honest fallback and let the ones with nothing to say
 * hide themselves.
 *
 * Deliberately ONE composition rather than a separate zero-state page. The student
 * dashboard learned that lesson the hard way: it used to fork into a different, railless
 * layout for learners with no courses, and the fork turned out to be redundant because
 * panels already self-hide.
 *
 * Everything comes from a single `/dashboard/` call. Six round trips would each compete for
 * the four request slots the whole platform is served from.
 *
 * The layout is the student dashboard's: content column plus a fixed-width right rail, which
 * is the shape the rest of the product uses and the reason this page previously read as a
 * different application. The first version was one full-width column of neutral cards, so the
 * module's colour stopped at the bottom of the header and everything below it was white on
 * white. The rail carries violet-tinted panels instead, tinted toward the SAME violet the
 * header uses rather than a second hue.
 *
 * The rail is also what makes "never looks empty" true. `CapabilityPanel` never hides, so an
 * account with no sessions, no notes and no suggestions still gets a full-height rail.
 */

const TRACK_ICON_FALLBACK = "solar:notebook-bookmark-bold-duotone";

export default function AiTutorPage() {
  // Never `await` an API before navigating. push() runs inside a transition so the click is
  // acknowledged on the same frame and the route's loading.tsx paints immediately, while
  // prefetch() on hover means the chunk is already warm by the time the click lands.
  const { push, prefetch } = useInstantNavigation();
  const { showToast } = useToast();
  const [activeTrack, setActiveTrack] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<TutorDashboard>({
    queryKey: aiTutorKeys.dashboard,
    queryFn: aiTutorService.dashboard,
    staleTime: 60_000,
  });

  const tracks = useMemo(() => {
    const seen: string[] = [];
    for (const topic of data?.catalogue ?? []) {
      if (!seen.includes(topic.track)) seen.push(topic.track);
    }
    return seen;
  }, [data?.catalogue]);

  const visibleTopics = useMemo(() => {
    const all = data?.catalogue ?? [];
    return activeTrack ? all.filter((t) => t.track === activeTrack) : all;
  }, [data?.catalogue, activeTrack]);

  const sessionHref = (input: {
    topic: string;
    level: TutorLevel;
    minutes: number;
    topic_slug?: string;
    topic_source?: string;
  }) => {
    const params = new URLSearchParams({
      topic: input.topic,
      level: input.level,
      minutes: String(input.minutes),
    });
    if (input.topic_slug) params.set("slug", input.topic_slug);
    if (input.topic_source) params.set("source", input.topic_source);
    return `/ai-tutor/session/new?${params.toString()}`;
  };

  // The session row and the credential are created on the room page, inside the same handler
  // that asks for the microphone: iOS requires audio playback to begin in a real user gesture,
  // and splitting the two across a navigation loses it. So this only navigates.
  const startSession = (input: {
    topic: string;
    level: TutorLevel;
    minutes: number;
    topic_slug?: string;
    topic_source?: string;
  }) => push(sessionHref(input));

  if (isError) {
    return (
      <PageShell>
        <ModulePageHeader
          eyebrow="Learn"
          title="AI Tutor"
          description="Say what you want to learn and talk it through."
          accent="purple"
          icon="solar:chat-round-line-bold-duotone"
        />
        <TutorSurface sx={{ textAlign: "center", py: 6 }}>
          <Typography sx={{ fontSize: "0.95rem", color: "var(--font-secondary)" }}>
            We could not load your tutor just now. Please refresh in a moment.
          </Typography>
        </TutorSurface>
      </PageShell>
    );
  }

  const stats = data?.stats;
  const quota = data?.quota;
  const recent = data?.recent_sessions ?? [];
  const suggestions = data?.suggestions ?? [];
  const notes = data?.notes ?? [];

  return (
    <PageShell>
      {/* One header. The composer lives INSIDE it rather than in a card below, so the page
          has a single entry point instead of two stacked dark blocks. */}
      <ModulePageHeader
        eyebrow="Learn"
        title="AI Tutor"
        description="Say what you want to learn and talk it through with a tutor that listens, shows you things and asks you questions."
        accent="purple"
        icon="solar:chat-round-line-bold-duotone"
      >
        <TopicComposer quota={quota} onStart={startSession} />
      </ModulePageHeader>

      {/* Content column plus rail, matching components/dashboard/v2/DashboardV2.tsx. The rail
          is a fixed 360px rather than a fraction: the panels in it are read at a glance and a
          rail that grows with the viewport turns them into stretched banners. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
          gap: { xs: 3, lg: 2.5 },
          alignItems: "start",
          pb: 4,
        }}
      >
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3.5 }}>
        {/* Self-hides for a learner with no history. */}
        {recent.length > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:history-bold-duotone"
              title="Pick up where you left off"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {recent.map((session) => (
                <TutorSurface
                  key={session.id}
                  interactive
                  onMouseEnter={() => prefetch(`/ai-tutor/session/${session.id}/recap`)}
                  onFocus={() => prefetch(`/ai-tutor/session/${session.id}/recap`)}
                  onClick={() => push(`/ai-tutor/session/${session.id}/recap`)}
                >
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 500, mb: 0.5 }}>
                    {session.topic}
                  </Typography>
                  <Typography sx={{ fontSize: "0.88rem", color: "var(--font-secondary)" }}>
                    {session.minutes} min · {session.level}
                    {session.plan_total
                      ? ` · ${Math.min(session.plan_index, session.plan_total)}/${session.plan_total} covered`
                      : ""}
                  </Typography>
                </TutorSurface>
              ))}
            </Box>
          </Box>
        ) : null}

        {/* Falls back through courses, then weak spots, then roadmap next-steps. */}
        {suggestions.length > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:target-bold-duotone"
              title="Because of what you're studying"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {suggestions.map((suggestion) => (
                <TutorSurface
                  key={`${suggestion.source}-${suggestion.title}`}
                  interactive
                  onMouseEnter={() => prefetch("/ai-tutor/session/new")}
                  onClick={() =>
                    startSession({
                      topic: suggestion.title,
                      level: suggestion.level,
                      minutes: quota?.max_session_minutes ?? 20,
                      topic_source: suggestion.source,
                    })
                  }
                >
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 500, mb: 0.5 }}>
                    {suggestion.title}
                  </Typography>
                  <Typography sx={{ fontSize: "0.88rem", color: "var(--font-secondary)" }}>
                    {suggestion.reason}
                  </Typography>
                </TutorSurface>
              ))}
            </Box>
          </Box>
        ) : null}

        {/* The seeded catalogue. Always present, which is what holds the page together.
            While the query resolves it renders placeholder cards at the SAME height, so the
            page never reflows as data lands. A layout that grows under the cursor reads as
            lag even when the request was quick. */}
        {isLoading ? (
          <Box>
            <TutorSectionHeading icon="solar:widget-4-bold-duotone" title="Browse by track" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                  xl: "repeat(4, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <TutorSurface key={i} sx={{ minHeight: 92 }}>
                  <Box
                    sx={{
                      width: "62%",
                      height: 13,
                      borderRadius: "6px",
                      bgcolor: "var(--surface, #f1f5f9)",
                      mb: 1.25,
                    }}
                  />
                  <Box
                    sx={{
                      width: "100%",
                      height: 11,
                      borderRadius: "6px",
                      bgcolor: "var(--surface, #f1f5f9)",
                      mb: 0.75,
                    }}
                  />
                  <Box
                    sx={{
                      width: "78%",
                      height: 11,
                      borderRadius: "6px",
                      bgcolor: "var(--surface, #f1f5f9)",
                    }}
                  />
                </TutorSurface>
              ))}
            </Box>
          </Box>
        ) : null}

        {visibleTopics.length > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:widget-4-bold-duotone"
              title="Browse by track"
              meta={`${data?.catalogue.length ?? 0} topics`}
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setActiveTrack(null)}
                sx={trackChipSx(activeTrack === null)}
              >
                All
              </Box>
              {tracks.map((track) => (
                <Box
                  key={track}
                  component="button"
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  sx={trackChipSx(activeTrack === track)}
                >
                  {track}
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                  xl: "repeat(4, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {visibleTopics.map((topic) => (
                <TutorSurface
                  key={topic.slug}
                  interactive
                  onMouseEnter={() => prefetch("/ai-tutor/session/new")}
                  onClick={() =>
                    startSession({
                      topic: topic.title,
                      level: topic.default_level,
                      minutes: Math.min(
                        topic.suggested_minutes,
                        quota?.max_session_minutes ?? 20
                      ),
                      topic_slug: topic.slug,
                      topic_source: "catalogue",
                    })
                  }
                >
                  <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                    <Icon
                      icon={topic.icon || TRACK_ICON_FALLBACK}
                      width={20}
                      height={20}
                      style={{ color: "var(--font-secondary)", flexShrink: 0, marginTop: 2 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.92rem", fontWeight: 500, mb: 0.25 }}>
                        {topic.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.88rem",
                          color: "var(--font-secondary)",
                          lineHeight: 1.45,
                        }}
                      >
                        {topic.blurb}
                      </Typography>
                    </Box>
                  </Box>
                </TutorSurface>
              ))}
            </Box>
          </Box>
        ) : null}

        {/* An honest floor for the content column. Everything above self-hides, so a brand
            new learner would otherwise see the composer and then nothing until the rail. */}
        {/* `data` rather than `!isLoading`: on a failed fetch isLoading is also false, and this
            would tell a learner with a full history that they have never had a lesson. */}
        {data && !recent.length && !suggestions.length ? (
          <TutorTintSurface tint="violet" sx={{ textAlign: "center", py: { xs: 3.5, md: 5 } }}>
            <Icon
              icon="solar:microphone-3-bold-duotone"
              width={34}
              style={{ color: "var(--ai-violet)" }}
            />
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 500, mt: 1.25 }}>
              You have not had a lesson yet
            </Typography>
            <Typography
              sx={{
                fontSize: "0.9rem",
                color: "var(--font-secondary)",
                mt: 0.5,
                maxWidth: 420,
                mx: "auto",
                lineHeight: 1.55,
              }}
            >
              Type anything you are stuck on above, or pick a topic. Your sessions, notes and
              flashcards will collect here.
            </Typography>
          </TutorTintSurface>
        ) : null}
      </Box>

        {/* ---------- The rail ---------- */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}>
          <MinutesPanel quota={quota} />
          <CapabilityPanel codingEnabled={quota?.coding_enabled !== false} />
          <ProgressPanel stats={stats} />
          {notes.length > 0 ? (
            <Box>
              <TutorSectionHeading icon="solar:notes-bold-duotone" title="Things you kept" />
              <NotesPanel notes={notes} />
            </Box>
          ) : null}
        </Box>
      </Box>
    </PageShell>
  );
}

function trackChipSx(active: boolean) {
  return {
    px: 1.5,
    py: 0.6,
    borderRadius: 9999,
    fontFamily: "inherit",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid",
    borderColor: active ? "var(--ai-violet)" : "var(--border-default)",
    bgcolor: active
      ? "color-mix(in srgb, var(--ai-violet) 8%, transparent)"
      : "transparent",
    color: active ? "var(--ai-violet)" : "var(--font-secondary)",
  } as const;
}
