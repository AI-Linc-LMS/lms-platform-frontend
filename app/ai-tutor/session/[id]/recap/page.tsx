"use client";

import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import {
  TutorSectionHeading,
  TutorSurface,
} from "@/components/ai-tutor/shared/surfaces";
import { aiTutorKeys, aiTutorService } from "@/lib/services/ai-tutor.service";

/**
 * What the learner keeps.
 *
 * A voice lesson is ephemeral in a way a written one is not: there is nothing to scroll
 * back through and nothing on the dashboard tomorrow. This page is the artifact, which is
 * why the recap is generated on the standard model tier rather than the cheap one.
 *
 * The recap is produced by a background task, so this page has to render usefully while
 * that is still running rather than showing a spinner over the whole thing.
 */

const STATUS_TONE: Record<string, { icon: string; colour: string; label: string }> = {
  solid: { icon: "solar:check-circle-bold", colour: "#16a34a", label: "Solid" },
  shaky: { icon: "solar:minus-circle-bold", colour: "#d97706", label: "Shaky" },
  new: { icon: "solar:star-bold", colour: "var(--ai-violet)", label: "New" },
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
    // The recap is written by a Celery task after the session ends, so poll briefly
    // rather than making the learner refresh.
    refetchInterval: (query) =>
      query.state.data?.recap_status === "pending" ? 4000 : false,
  });

  // Landing here means a session just ended, whichever route got us here (including a tab
  // restored from history). Marking the dashboard stale once is cheap and removes the "my
  // minutes did not change" class of report entirely.
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: aiTutorKeys.dashboard });
  }, [queryClient]);

  if (isError) {
    return (
      <PageShell>
        <ModulePageHeader
          eyebrow="Learn"
          title="Session recap"
          accent="purple"
          icon="solar:notebook-bookmark-bold-duotone"
        />
        <TutorSurface sx={{ textAlign: "center", py: 6 }}>
          <Typography sx={{ color: "var(--font-secondary)" }}>
            We could not find that session.
          </Typography>
        </TutorSurface>
      </PageShell>
    );
  }

  const recap = data?.recap ?? {};
  const concepts = recap.concepts ?? [];
  const pending = data?.recap_status === "pending";
  const skipped = data?.recap_status === "skipped";

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Learn"
        title={data?.session.topic ?? "Session recap"}
        description={
          data
            ? `${data.session.minutes} minutes · ${data.session.level}`
            : "Loading your session"
        }
        accent="purple"
        icon="solar:notebook-bookmark-bold-duotone"
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
        {/* Summary */}
        <TutorSurface sx={{ p: { xs: 2.5, md: 3 } }}>
          {isLoading ? (
            <Typography sx={{ color: "var(--font-secondary)" }}>Loading…</Typography>
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
          ) : (
            <Typography sx={{ fontSize: "1rem", lineHeight: 1.65 }}>
              {recap.summary}
            </Typography>
          )}
        </TutorSurface>

        {/* Concepts */}
        {concepts.length > 0 ? (
          <Box>
            <TutorSectionHeading
              icon="solar:lightbulb-bold-duotone"
              title="What you worked on"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {concepts.map((concept) => {
                const tone = STATUS_TONE[concept.status] ?? STATUS_TONE.new;
                return (
                  <TutorSurface key={concept.name}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.75 }}>
                      <Icon icon={tone.icon} width={16} style={{ color: tone.colour }} />
                      <Typography
                        sx={{ fontSize: "0.88rem", fontWeight: 500, color: tone.colour }}
                      >
                        {tone.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500, mb: 0.25 }}>
                      {concept.name}
                    </Typography>
                    {concept.note ? (
                      <Typography
                        sx={{
                          fontSize: "0.87rem",
                          color: "var(--font-secondary)",
                          lineHeight: 1.45,
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

        {/* Quiz results */}
        {data?.quiz?.length ? (
          <Box>
            <TutorSectionHeading
              icon="solar:question-square-bold-duotone"
              title="Questions you answered"
              meta={`${data.quiz.filter((q) => q.is_correct).length} of ${data.quiz.length} right`}
            />
            <TutorSurface>
              {data.quiz.map((attempt, i) => (
                <Box
                  key={i}
                  sx={{
                    py: 1.25,
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
                  <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                    {attempt.question?.question}
                  </Typography>
                </Box>
              ))}
            </TutorSurface>
          </Box>
        ) : null}

        {/* Transcript */}
        {data?.transcript?.length ? (
          <Box>
            <TutorSectionHeading
              icon="solar:chat-square-bold-duotone"
              title="Transcript"
              meta={`${data.transcript.length} turns`}
            />
            <TutorSurface sx={{ maxHeight: 420, overflowY: "auto" }}>
              {data.transcript.map((turn, i) => (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color:
                        turn.role === "tutor" ? "var(--ai-violet)" : "var(--font-secondary)",
                      mb: 0.25,
                    }}
                  >
                    {turn.role === "tutor" ? "Tutor" : "You"}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.9rem", lineHeight: 1.55, color: "var(--font-secondary)" }}
                  >
                    {turn.text}
                  </Typography>
                </Box>
              ))}
            </TutorSurface>
          </Box>
        ) : null}

        {/* Next */}
        {recap.next_topic?.title ? (
          <TutorSurface sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography
              sx={{
                fontSize: "0.76rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--font-secondary)",
                mb: 1,
              }}
            >
              What to learn next
            </Typography>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 500, mb: 0.5 }}>
              {recap.next_topic.title}
            </Typography>
            {recap.next_topic.why ? (
              <Typography
                sx={{ fontSize: "0.88rem", color: "var(--font-secondary)", mb: 2 }}
              >
                {recap.next_topic.why}
              </Typography>
            ) : null}
            <Box
              component="button"
              type="button"
              onMouseEnter={() => prefetch("/ai-tutor/session/new")}
              onClick={() =>
                push(
                  `/ai-tutor/session/new?topic=${encodeURIComponent(recap.next_topic!.title)}&level=${data?.session.level ?? "beginner"}&minutes=20`
                )
              }
              sx={{
                px: 2.25,
                py: 1,
                borderRadius: "8px",
                border: "none",
                fontFamily: "inherit",
                fontSize: "0.88rem",
                fontWeight: 500,
                color: "#fff",
                bgcolor: "var(--ai-violet)",
                cursor: "pointer",
              }}
            >
              Start that session
            </Box>
          </TutorSurface>
        ) : null}
      </Box>
    </PageShell>
  );
}
