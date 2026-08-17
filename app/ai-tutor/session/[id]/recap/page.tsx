"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import {
  TutorSectionHeading,
  TutorSurface,
  TutorTintSurface,
} from "@/components/ai-tutor/shared/surfaces";
import { RecapFlashcards } from "@/components/ai-tutor/recap/RecapFlashcards";
import { RecapArtifacts } from "@/components/ai-tutor/recap/RecapArtifacts";
import { RecapTranscript } from "@/components/ai-tutor/recap/RecapTranscript";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { aiTutorKeys, aiTutorService } from "@/lib/services/ai-tutor.service";

/**
 * What the learner keeps.
 *
 * A voice lesson is ephemeral in a way a written one is not: there is nothing to scroll back
 * through and nothing on the dashboard tomorrow. This page is the artifact, which is why the
 * recap is generated on the standard model tier rather than the cheap one.
 *
 * The layout follows the order somebody actually wants after a lesson ends: how it went, what
 * to test yourself on, what was on screen, and only then the raw transcript. The first version
 * inverted that - the transcript rendered open and unbounded and dominated everything, the
 * flashcards the session had just generated were not shown at all, and there was no way back
 * to the module except the browser button.
 *
 * The recap is produced by a background task, so this page has to render usefully while that
 * is still running rather than showing a spinner over the whole thing.
 */

/** How many times to poll for a recap that is still being written before giving up. */
const POLL_LIMIT = 40;

const STATUS_TONE: Record<string, { icon: string; colour: string; label: string }> = {
  solid: { icon: "solar:check-circle-bold", colour: "#16a34a", label: "Solid" },
  shaky: { icon: "solar:minus-circle-bold", colour: "#d97706", label: "Needs another pass" },
  new: { icon: "solar:star-bold", colour: "var(--ai-violet)", label: "New today" },
};

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
      query.state.data?.recap_status === "pending" &&
      query.state.dataUpdateCount < POLL_LIMIT
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
        {/* ---------- How it went ----------
            Tinted, because it is the answer to "how did that go" and was previously
            indistinguishable from the five neutral cards under it. */}
        <TutorTintSurface tint="violet" sx={{ p: { xs: 2.5, md: 3 } }}>
          {isLoading ? (
            <Box sx={{ display: "grid", gap: 1 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    height: 14,
                    width: i === 2 ? "58%" : "100%",
                    borderRadius: 9999,
                    bgcolor: "var(--border-default)",
                    opacity: 0.7,
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
              That session was too short to write up. Start another and talk for a few minutes
              to get a recap.
            </Typography>
          ) : unwritten ? (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Icon
                icon="solar:danger-triangle-bold-duotone"
                width={18}
                style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: "0.95rem", color: "var(--font-secondary)", lineHeight: 1.6 }}>
                We could not write up this session. Everything below is still yours: the
                transcript, anything that went on the canvas, and any flashcards it saved.
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: { xs: "1rem", md: "1.05rem" }, lineHeight: 1.7 }}>
              {recap.summary}
            </Typography>
          )}
        </TutorTintSurface>

        {/* ---------- Concepts ---------- */}
        {concepts.length > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:lightbulb-bold-duotone"
              title="What you worked on"
            />
            <Box
              sx={{
                display: "grid",
                // auto-fit, not a fixed three columns. Four concepts in a 3-wide grid left a
                // conspicuous hole in the second row; this fills the width at any count.
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(auto-fit, minmax(248px, 1fr))",
                },
                gap: 1.5,
              }}
            >
              {concepts.map((concept) => {
                const tone = STATUS_TONE[concept.status] ?? STATUS_TONE.new;
                return (
                  <TutorSurface key={concept.name}>
                    <Box sx={{ display: "flex", gap: 0.85, alignItems: "center", mb: 0.85 }}>
                      <Icon icon={tone.icon} width={15} style={{ color: tone.colour }} />
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: tone.colour,
                          '[dir="rtl"] &': {
                            letterSpacing: "normal",
                            textTransform: "none",
                          },
                        }}
                      >
                        {tone.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.96rem", fontWeight: 500, mb: 0.35 }}>
                      {concept.name}
                    </Typography>
                    {concept.note ? (
                      <Typography
                        sx={{
                          fontSize: "0.87rem",
                          color: "var(--font-secondary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {concept.note}
                      </Typography>
                    ) : null}
                  </TutorSurface>
                );
              })}
            </Box>
          </Box>
        ) : null}

        {/* ---------- Test yourself ---------- */}
        {cardCount > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:cards-bold-duotone"
              title="Test yourself"
              meta="From this lesson"
            />
            <RecapFlashcards notes={notes} />
          </Box>
        ) : null}

        {/* ---------- What was on screen ---------- */}
        {artifacts.length > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:presentation-graph-bold-duotone"
              title="From the canvas"
              meta={`${artifacts.length} ${artifacts.length === 1 ? "card" : "cards"}`}
            />
            <RecapArtifacts artifacts={artifacts} />
          </Box>
        ) : null}

        {/* ---------- Quiz ---------- */}
        {quiz.length > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:question-square-bold-duotone"
              title="Questions you answered"
              meta={`${quizRight} of ${quiz.length} right`}
            />
            <TutorSurface padded={false}>
              {quiz.map((attempt, i) => (
                <Box
                  key={i}
                  sx={{
                    px: { xs: 2, md: 2.5 },
                    py: 1.5,
                    borderTop: i === 0 ? "none" : "1px solid var(--border-default)",
                    display: "flex",
                    gap: 1.25,
                    alignItems: "flex-start",
                  }}
                >
                  <Icon
                    icon={
                      attempt.is_correct
                        ? "solar:check-circle-bold"
                        : "solar:close-circle-bold"
                    }
                    width={17}
                    style={{
                      color: attempt.is_correct ? "#16a34a" : "#dc2626",
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5 }}>
                      {attempt.question?.question}
                    </Typography>
                    {/* What they picked. Without it, "wrong" is a score rather than
                        something you can learn from. */}
                    {attempt.selected?.length ? (
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          color: "var(--font-secondary)",
                          mt: 0.35,
                        }}
                      >
                        You picked {describePicked(attempt)}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              ))}
            </TutorSurface>
          </Box>
        ) : null}

        {/* ---------- Transcript ---------- */}
        <RecapTranscript turns={data?.transcript ?? []} />

        {/* ---------- Next ---------- */}
        {recap.next_topic?.title ? (
          <TutorTintSurface
            tint="deep"
            sx={{
              p: { xs: 2.5, md: 3 },
              // The strongest surface on the page, because it is the only one that asks for
              // an action. Deep tint means white text, so the copy below is on-dark.
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
                  sx={{
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.55,
                  }}
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

/**
 * What the learner actually chose, in words.
 *
 * A bare "You picked B" is useless a day later: the letter means nothing without the option list,
 * and this is the one place the recap is meant to be readable on its own.
 */
function describePicked(attempt: {
  selected?: string[];
  question?: { options?: { id: string; label: string }[] };
}): string {
  const options = attempt.question?.options ?? [];
  const labels = (attempt.selected ?? []).map((id) => {
    const match = options.find((o) => o.id === id);
    return match?.label ? `${id}. ${match.label}` : id;
  });
  return labels.join("; ");
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
        <Typography
          sx={{ fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.1, color: "#fff" }}
        >
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
