"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { TutorSurface, TutorTintSurface } from "@/components/ai-tutor/shared/surfaces";
import { RecapFlashcards } from "@/components/ai-tutor/recap/RecapFlashcards";
import { ChallengeLog } from "@/components/ai-tutor/recap/ChallengeLog";
import { ConceptConstellation } from "@/components/ai-tutor/recap/ConceptConstellation";
import { ConceptStream } from "@/components/ai-tutor/recap/ConceptStream";
import { TranscriptStream } from "@/components/ai-tutor/recap/TranscriptStream";
import { RecapGround, StreamLabel } from "@/components/ai-tutor/recap/atmosphere";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { aiTutorKeys, aiTutorService } from "@/lib/services/ai-tutor.service";
import { PHONE } from "@/components/common/mobile/phone";

/**
 * What the learner keeps.
 *
 * A voice lesson is ephemeral in a way a written one is not: there is nothing to scroll back
 * through and nothing on the dashboard tomorrow. This page is the artifact.
 *
 * It used to be a column of white bordered boxes - the summary, five concept cards, a flashcard
 * card, a thumbnail grid, a quiz list, a transcript - every section the same weight, so nothing
 * led and a lesson read as a form somebody had filled in about you.
 *
 * It is built around the STREAM now: the lesson had a shape, and the recap shows that shape.
 * What went on screen runs along a rail in the order it happened, one open at a time on a dark
 * stage, with the questions beside it. Everything else arranges around that, and nothing is a
 * card. The order still follows what somebody wants after a lesson ends: how it went, what was
 * on screen, what you were asked, what you should test yourself on, and only then the raw
 * transcript.
 *
 * The recap is produced by a background task, so this page has to render usefully while that is
 * still running rather than showing a spinner over the whole thing.
 */

/** How many times to poll for a recap that is still being written before giving up. */
const POLL_LIMIT = 40;

export default function TutorRecapPage() {
  const params = useParams();
  const { push, prefetch } = useInstantNavigation();
  const queryClient = useQueryClient();
  const sessionId = String(params?.id ?? "");

  const { data, isLoading, isError } = useQuery({
    queryKey: aiTutorKeys.recap(sessionId),
    queryFn: () => aiTutorService.recap(sessionId),
    enabled: Boolean(sessionId),
    /**
     * The recap is written by a Celery task after the session ends, so poll briefly rather than
     * making the learner refresh.
     *
     * Bounded at POLL_LIMIT. An unbounded poll meant a recap task that died left the tab
     * requesting every four seconds indefinitely, which is a request every four seconds against
     * a backend served from four gunicorn slots, for a page nobody is watching any more.
     */
    refetchInterval: (query) =>
      query.state.data?.recap_status === "pending" && query.state.dataUpdateCount < POLL_LIMIT
        ? 4000
        : false,
  });

  // A poll failure is transient and must not throw away a recap we already have. `isError` alone
  // replaced the entire page with "We could not find that session" on one dropped request.
  const failedOutright = isError && !data;

  // Landing here means a session just ended, whichever route got us here (including a tab
  // restored from history). Marking the dashboard stale once is cheap and removes the "my
  // minutes did not change" class of report entirely.
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: aiTutorKeys.dashboard });
  }, [queryClient]);

  // Warm the module route, because "back to AI Tutor" is where most people go from here.
  useEffect(() => {
    prefetch("/ai-tutor");
  }, [prefetch]);

  if (failedOutright) {
    return (
      <PageShell>
        <ModulePageHeader
          eyebrow="Learn"
          title="Session recap"
          accent="purple"
          icon="solar:notebook-bookmark-bold-duotone"
        />
        <TutorSurface sx={{ textAlign: "center", py: 6 }}>
          <Typography sx={{ color: "var(--font-secondary)", mb: 2 }}>
            We could not find that session.
          </Typography>
          <Box component="button" type="button" onClick={() => push("/ai-tutor")} sx={secondaryBtn}>
            Back to AI Tutor
          </Box>
        </TutorSurface>
      </PageShell>
    );
  }

  const recap = data?.recap ?? {};
  const recapText = (recap.summary ?? "").trim();
  const concepts = recap.concepts ?? [];
  const notes = data?.notes ?? [];
  const artifacts = data?.artifacts ?? [];
  const quiz = data?.quiz ?? [];
  const transcript = data?.transcript ?? [];
  const pending = data?.recap_status === "pending";
  const skipped = data?.recap_status === "skipped";
  // Anything that is not pending, skipped or a written recap. Previously this rendered a tinted
  // card containing nothing at all, which reads as the page being broken rather than the recap.
  const unwritten = Boolean(data) && !pending && !skipped && !recapText;

  const cardCount = notes.filter((n) => n.prompt?.trim() && n.answer?.trim()).length;
  const quizRight = quiz.filter((q) => q.is_correct).length;

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Session recap"
        title={data?.session.topic ?? "Session recap"}
        description={
          data
            ? `${LEVEL_LABEL[data.session.level] ?? data.session.level} · ${formatWhen(data.session.ended_at ?? data.session.created_at)}`
            : "Loading your session"
        }
        accent="purple"
        icon="solar:notebook-bookmark-bold-duotone"
      >
        {/* The lesson in numbers, on the hero rather than as a card row below it. It is
            context for the title, not a section of its own. */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: { xs: 2, md: 3.5 },
          }}
        >
          <HeroStat
            icon="solar:clock-circle-bold-duotone"
            value={data ? `${data.session.minutes}` : "—"}
            label={data?.session.minutes === 1 ? "minute" : "minutes"}
          />
          <HeroStat
            icon="solar:lightbulb-bold-duotone"
            value={concepts.length || data?.session.concepts_covered?.length || 0}
            label="concepts"
          />
          {quiz.length ? (
            <HeroStat
              icon="solar:question-square-bold-duotone"
              value={`${quizRight}/${quiz.length}`}
              label="questions right"
            />
          ) : null}
          {cardCount ? (
            <HeroStat
              icon="solar:cards-bold-duotone"
              value={cardCount}
              label={cardCount === 1 ? "flashcard" : "flashcards"}
            />
          ) : null}

          <Box sx={{ flex: 1 }} />

          <Box
            component="button"
            type="button"
            onClick={() => push("/ai-tutor")}
            onMouseEnter={() => prefetch("/ai-tutor")}
            sx={heroBtn}
          >
            <Icon icon="mdi:arrow-left" width={17} />
            Back to AI Tutor
          </Box>
        </Box>
      </ModulePageHeader>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
        <RecapGround>
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
            {/* ---------- How it went ----------
                The first thing said, said plainly. Not boxed: it is the voice of the page, and
                a border around it made it one more panel among seven. */}
            <Box sx={{ maxWidth: "74ch" }}>
              {isLoading ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        height: 16,
                        width: i === 2 ? "58%" : "100%",
                        borderRadius: 9999,
                        bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, transparent)",
                      }}
                    />
                  ))}
                </Box>
              ) : pending ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Icon
                    icon="solar:refresh-bold-duotone"
                    width={18}
                    style={{ color: "var(--ai-violet)" }}
                  />
                  <Typography sx={{ fontSize: "0.95rem", color: "var(--font-secondary)" }}>
                    Writing up what you covered. This takes a few seconds.
                  </Typography>
                </Box>
              ) : skipped ? (
                <Typography sx={{ fontSize: "0.95rem", color: "var(--font-secondary)" }}>
                  That session was too short to write up. Start another and talk for a few
                  minutes to get a recap.
                </Typography>
              ) : unwritten ? (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Icon
                    icon="solar:danger-triangle-bold-duotone"
                    width={18}
                    style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }}
                  />
                  <Typography
                    sx={{ fontSize: "0.95rem", color: "var(--font-secondary)", lineHeight: 1.6 }}
                  >
                    We could not write up this session. Everything below is still yours: the
                    transcript, anything that went on the canvas, and any flashcards it saved.
                  </Typography>
                </Box>
              ) : (
                <Typography
                  sx={{
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                    lineHeight: 1.75,
                    fontWeight: 400,
                  }}
                >
                  {recap.summary}
                </Typography>
              )}
            </Box>

            {/* ---------- The lesson's shape, with the questions beside it ---------- */}
            {artifacts.length ? (
              <ConceptStream
                artifacts={artifacts}
                aside={quiz.length ? <ChallengeLog attempts={quiz} /> : undefined}
              />
            ) : quiz.length ? (
              <ChallengeLog attempts={quiz} />
            ) : null}

            <ConceptConstellation concepts={concepts} />
          </Box>
        </RecapGround>

        {/* ---------- Test yourself ----------
            Outside the ground: it is the one thing here you DO rather than read. */}
        {cardCount > 0 ? (
          <Box>
            <StreamLabel
              icon="solar:cards-bold-duotone"
              text="Test yourself"
              meta="From this lesson"
            />
            <RecapFlashcards notes={notes} />
          </Box>
        ) : null}

        <TranscriptStream turns={transcript} />

        {/* ---------- What to do next ---------- */}
        {recap.next_topic?.title ? (
          <TutorTintSurface
            tint="deep"
            sx={{
              p: { xs: 2.5, md: 3 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              gap: { xs: 2, md: 3 },
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  [PHONE]: { fontSize: "0.75rem" },
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.62)",
                  mb: 0.85,
                  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                }}
              >
                Learn this next
              </Typography>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 500, mb: 0.4 }}>
                {recap.next_topic.title}
              </Typography>
              {recap.next_topic.why ? (
                <Typography
                  sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}
                >
                  {recap.next_topic.why}
                </Typography>
              ) : null}
            </Box>
            <Box
              component="button"
              type="button"
              onMouseEnter={() => prefetch("/ai-tutor/session/new")}
              onFocus={() => prefetch("/ai-tutor/session/new")}
              onClick={() =>
                push(
                  `/ai-tutor/session/new?topic=${encodeURIComponent(recap.next_topic!.title)}&level=${data?.session.level ?? "beginner"}&minutes=20`
                )
              }
              sx={primaryBtn}
            >
              <Icon icon="solar:microphone-3-bold" width={18} />
              Start that session
            </Box>
          </TutorTintSurface>
        ) : null}
      </Box>
    </PageShell>
  );
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "New to this",
  intermediate: "Some idea",
  advanced: "Pretty confident",
};

/** "Today", "Yesterday", or a date. A bare ISO string tells a learner nothing. */
function formatWhen(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const now = new Date();
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()) /
      86_400_000
  );
  const time = then.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Yesterday at ${time}`;
  return then.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: then.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Icon
        icon={icon}
        width={20}
        height={20}
        style={{ color: "rgba(255,255,255,0.7)", flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.1, color: "#fff" }}>
          {value}
        </Typography>
        <Typography
          sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.62)", whiteSpace: "nowrap" }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

/** On the dark hero: white is the strongest contrast, and keeps the violet budget for below. */
const heroBtn = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  minHeight: 40,
  [PHONE]: { minHeight: 44 },
  px: 2,
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.28)",
  bgcolor: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: "0.88rem",
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "border-color 160ms ease, background-color 160ms ease",
  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.16)" },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px rgba(13,7,32,0.9), 0 0 0 4px #ffffff",
  },
} as const;

const primaryBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.85,
  minHeight: 48,
  px: 3,
  flexShrink: 0,
  borderRadius: "10px",
  border: "none",
  fontFamily: "inherit",
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "#2b1a63",
  bgcolor: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "filter 160ms ease",
  "&:hover": { filter: "brightness(0.95)" },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px rgba(13,7,32,0.9), 0 0 0 4px #ffffff",
  },
} as const;

const secondaryBtn = {
  px: 2.25,
  minHeight: 42,
  [PHONE]: { minHeight: 44 },
  borderRadius: "8px",
  border: "1px solid var(--border-default)",
  bgcolor: "var(--card-bg)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "var(--font-primary)",
  cursor: "pointer",
  transition: "border-color 160ms ease",
  "&:hover": { borderColor: "var(--ai-violet)" },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--ai-violet)",
  },
} as const;
