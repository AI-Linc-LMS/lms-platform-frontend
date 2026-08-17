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
import {
  TutorSectionHeading,
  TutorStat,
  TutorSurface,
} from "@/components/ai-tutor/shared/surfaces";
import {
  aiTutorKeys,
  aiTutorService,
  type TutorDashboard,
  type TutorLevel,
  type TutorQuota,
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
        action={quota ? <MinutesPill quota={quota} /> : undefined}
      >
        <TopicComposer quota={quota} onStart={startSession} />
      </ModulePageHeader>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 4 }}>
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

        {/* Stats + notes. Stats always render; zeros are honest and the strip is dense. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: notes.length ? "1fr 1fr" : "1fr" },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          <Box>
            <TutorSectionHeading icon="solar:chart-2-bold-duotone" title="Your progress" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                gap: 1.5,
              }}
            >
              <TutorStat
                icon="solar:clock-circle-bold-duotone"
                label="Minutes tutored"
                value={stats?.minutes_tutored ?? 0}
              />
              <TutorStat
                icon="solar:book-2-bold-duotone"
                label="Sessions"
                value={stats?.sessions ?? 0}
              />
              <TutorStat
                icon="solar:question-square-bold-duotone"
                label="Questions"
                value={stats?.questions_answered ?? 0}
              />
              <TutorStat
                icon="solar:bookmark-bold-duotone"
                label="Notes saved"
                value={stats?.notes_saved ?? 0}
              />
            </Box>
          </Box>

          {notes.length > 0 ? (
            <Box>
              <TutorSectionHeading
                icon="solar:notes-bold-duotone"
                title="Things you kept"
              />
              <TutorSurface>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {notes.map((note, i) => (
                    <Box
                      key={note.id}
                      sx={{
                        py: 1.25,
                        borderTop: i === 0 ? "none" : "1px solid var(--border-default)",
                      }}
                    >
                      <Typography sx={{ fontSize: "0.88rem", fontWeight: 500 }}>
                        {note.concept}
                      </Typography>
                      {note.summary || note.answer ? (
                        <Typography
                          sx={{
                            fontSize: "0.85rem",
                            color: "var(--font-secondary)",
                            lineHeight: 1.45,
                          }}
                        >
                          {note.summary || note.answer}
                        </Typography>
                      ) : null}
                    </Box>
                  ))}
                </Box>
              </TutorSurface>
            </Box>
          ) : null}
        </Box>
      </Box>
    </PageShell>
  );
}

/**
 * Remaining minutes, compact enough to sit in the header's action slot.
 *
 * It was a full card beside the composer. In the header it stays visible without competing
 * with the primary action, and the number a learner actually looks for is the one that is
 * large.
 */
function MinutesPill({ quota }: { quota: TutorQuota }) {
  const low = quota.minutes_limit > 0 && quota.minutes_remaining <= 5;

  // Staff bypass the reservation, so their number never moves. Saying "30 of 30 min left"
  // looks exactly like a broken meter, so say what is actually true instead.
  if (quota.unmetered) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.75,
          py: 1,
          borderRadius: "12px",
          bgcolor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <Icon
          icon="solar:infinity-bold-duotone"
          width={20}
          style={{ color: "rgba(255,255,255,0.8)" }}
        />
        <Box sx={{ lineHeight: 1.1 }}>
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>
            Unlimited minutes
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", mt: 0.25 }}>
            Staff account, not metered
          </Typography>
        </Box>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.75,
        py: 1,
        borderRadius: "12px",
        bgcolor: "rgba(255,255,255,0.1)",
        border: "1px solid",
        borderColor: low ? "rgba(236,72,153,0.6)" : "rgba(255,255,255,0.2)",
      }}
    >
      <Icon
        icon="solar:clock-circle-bold-duotone"
        width={20}
        style={{ color: low ? "#f9a8d4" : "rgba(255,255,255,0.8)" }}
      />
      <Box sx={{ lineHeight: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: "1.3rem",
              fontWeight: 600,
              color: low ? "#fbcfe8" : "#ffffff",
              lineHeight: 1,
            }}
          >
            {quota.minutes_remaining}
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>
            of {quota.minutes_limit} min left
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", mt: 0.25 }}>
          Sessions up to {quota.max_session_minutes} min
        </Typography>
      </Box>
    </Box>
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
