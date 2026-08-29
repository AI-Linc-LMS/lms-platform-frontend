"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { InterviewComposer } from "@/components/interview/InterviewComposer";
import { SectionHeading, Surface, cardInteraction } from "@/components/roadmaps/surfaces";
import { InterviewStat } from "@/components/interview/InterviewStat";
import interviewService, {
  type AvailableInterview,
  type InterviewHistory,
  type SessionRow,
} from "@/lib/services/interview.service";

/**
 * The interview hub: what you can sit, and how the ones you sat went.
 *
 * One composition, no zero-state fork. A first-time candidate sees the header, the available
 * list and nothing else; the stats strip and the history section render only once there is
 * history to show, because panels self-hide rather than the page changing shape
 * (the dashboard's zero-state fork was retired for exactly this reason).
 *
 * Both loads come up together: the page fires its two requests in parallel and each section
 * renders from its own data with an empty-guard on the DATA, never on isLoading. History is
 * one request including the stats, so the hub never shimmers through four sequential fetches.
 */

/** One tone per difficulty, so a list of interviews scans by weight rather than by reading. */
const DIFFICULTY_TONE: Record<string, string> = {
  Easy: "var(--accent-green, #16a34a)",
  Medium: "var(--accent-amber, #d97706)",
  Hard: "var(--accent-red, #dc2626)",
};

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function minutesBetween(start: string, end: string | null): number | null {
  if (!end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? Math.max(1, Math.round(ms / 60000)) : null;
}

/**
 * The grade as words a candidate should read, never a number invented for a state that has
 * no number. A failed grade says "we could not mark this" in plain text; rendering it as a
 * mark is the exact bug this module was rebuilt to remove.
 */
function gradeLabel(row: SessionRow): { text: string; tone: "good" | "quiet" | "bad" } {
  if (row.status === "voided") return { text: "Voided", tone: "bad" };
  const grade = row.grade;
  if (grade.state === "graded" && typeof grade.percentage === "number") {
    return { text: `${Math.round(grade.percentage)}%`, tone: "good" };
  }
  if (grade.state === "failed") return { text: "Marking hit a problem", tone: "quiet" };
  if (row.status === "abandoned") return { text: "Not completed", tone: "quiet" };
  return { text: "Being marked", tone: "quiet" };
}

const TONE_COLOR = {
  good: "var(--font-primary)",
  quiet: "var(--font-secondary)",
  bad: "var(--accent-red, #dc2626)",
} as const;

function AvailableCard({ item }: { item: AvailableInterview }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const start = useCallback(() => {
    // The room does the actual session POST; navigation itself is instant. The pressed
    // state exists so the click is acknowledged on the same paint regardless.
    setStarting(true);
    router.push(`/interview/room?template=${item.id}`);
  }, [item.id, router]);

  return (
    <Surface
      sx={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pl: 2.5,
        ...cardInteraction,
      }}
    >
      {/* A rail rather than a top strip: the stat cards above already use the strip, and two
          of them stacked reads as noise. */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: DIFFICULTY_TONE[item.difficulty] ?? "var(--accent-purple)",
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 999,
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: DIFFICULTY_TONE[item.difficulty] ?? "var(--accent-purple)",
            bgcolor: `color-mix(in srgb, ${DIFFICULTY_TONE[item.difficulty] ?? "var(--accent-purple)"} 12%, transparent)`,
          }}
        >
          {item.difficulty || "Interview"}
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography
          sx={{
            fontSize: "0.76rem",
            color: "var(--font-tertiary)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Icon icon="solar:clock-circle-linear" width={13} />~{item.duration_minutes} min
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "1.02rem",
          lineHeight: 1.3,
          color: "var(--font-primary)",
        }}
      >
        {item.title}
      </Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)" }}>
        {item.topic}
        {item.subtopic ? ` · ${item.subtopic}` : ""}
      </Typography>
      {item.description ? (
        <Typography
          sx={{
            fontSize: "0.85rem",
            color: "var(--font-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.description}
        </Typography>
      ) : null}
      <Box sx={{ mt: "auto", pt: 1 }}>
        <Button
          onClick={start}
          disabled={starting}
          variant="contained"
          disableElevation
          startIcon={
            starting ? (
              <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : (
              <Icon icon="solar:microphone-3-bold" width={15} />
            )
          }
          sx={{
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 600,
            fontSize: "0.85rem",
            px: 2,
          }}
        >
          {starting ? "Opening the room" : "Start interview"}
        </Button>
      </Box>
    </Surface>
  );
}

function HistoryRow({ row }: { row: SessionRow }) {
  const router = useRouter();
  const grade = gradeLabel(row);
  const minutes = minutesBetween(row.created_at, row.ended_at);
  const viewable = row.grade.state === "graded" || row.grade.state === "failed";

  return (
    <Box
      component={viewable ? "button" : "div"}
      onClick={viewable ? () => router.push(`/interview/result/${row.session_id}`) : undefined}
      sx={{
        all: "unset",
        boxSizing: "border-box",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1.5,
        borderRadius: "calc(var(--radius-card) - 6px)",
        cursor: viewable ? "pointer" : "default",
        transition: "background-color 150ms ease",
        "&:hover": viewable ? { bgcolor: "var(--hover-bg, rgba(0,0,0,0.03))" } : undefined,
        "&:focus-visible": {
          boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--accent-purple)",
        },
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: "0.92rem",
            color: "var(--font-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.title || row.topic || "Interview"}
        </Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
          {dateFormat.format(new Date(row.created_at))}
          {minutes ? ` · ${minutes} min` : ""}
          {row.integrity === "flagged" ? " · flagged for review" : ""}
        </Typography>
      </Box>
      <Box
        component="span"
        sx={{
          px: 1.1,
          py: 0.35,
          borderRadius: 999,
          fontSize: "0.8rem",
          fontWeight: grade.tone === "good" ? 700 : 500,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          color: TONE_COLOR[grade.tone],
          bgcolor:
            grade.tone === "quiet"
              ? "transparent"
              : `color-mix(in srgb, ${TONE_COLOR[grade.tone]} 12%, transparent)`,
        }}
      >
        {grade.text}
      </Box>
      {viewable ? (
        <Icon icon="solar:alt-arrow-right-linear" width={16} color="var(--font-tertiary)" />
      ) : null}
    </Box>
  );
}

export default function InterviewHubPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<AvailableInterview[] | null>(null);
  const [history, setHistory] = useState<InterviewHistory | null>(null);
  const [failed, setFailed] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    // Warm the room route while the candidate is still reading the list.
    router.prefetch("/interview/room");
    void Promise.allSettled([interviewService.available(), interviewService.history()]).then(
      ([availableResult, historyResult]) => {
        if (availableResult.status === "fulfilled") setAvailable(availableResult.value);
        if (historyResult.status === "fulfilled") setHistory(historyResult.value);
        if (availableResult.status === "rejected" && historyResult.status === "rejected") {
          setFailed(true);
        }
      },
    );
  }, [router]);

  const stats = history?.stats;
  const sessions = history?.sessions ?? [];
  const loading = available === null && history === null && !failed;

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Career"
        title="Mock Interview"
        description="A spoken interview with an AI interviewer. It asks, listens and follows up like a person: you can interrupt it, and it will wait while you think. Your answers are marked against a fixed rubric, so every attempt is scored the same way."
        accent="indigo"
        icon="solar:user-speak-rounded-bold-duotone"
      >
        <InterviewComposer />
      </ModulePageHeader>

      {/* Stats: self-hide until there is at least one attempt. A row of zeros is not data. */}
      {stats && stats.attempts > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3.5,
          }}
        >
          <InterviewStat
            label="Interviews taken"
            value={stats.attempts}
            sub={stats.graded < stats.attempts ? `${stats.graded} marked` : "all marked"}
            icon="solar:microphone-3-bold-duotone"
            accent="var(--accent-purple)"
          />
          <InterviewStat
            label="Average score"
            value={
              stats.average_percentage !== null ? `${Math.round(stats.average_percentage)}%` : "—"
            }
            sub={
              stats.graded === 0
                ? "nothing marked yet"
                : `across ${stats.graded} interview${stats.graded === 1 ? "" : "s"}`
            }
            percent={stats.average_percentage}
            icon="solar:chart-2-bold-duotone"
            accent="var(--accent-blue, #3b82f6)"
          />
          <InterviewStat
            label="Best score"
            value={stats.best_percentage !== null ? `${Math.round(stats.best_percentage)}%` : "—"}
            sub={stats.best_percentage !== null ? "your strongest sitting" : "no marks yet"}
            percent={stats.best_percentage}
            icon="solar:cup-star-bold-duotone"
            accent="var(--accent-green, #16a34a)"
          />
          <InterviewStat
            label="Waiting for you"
            value={available?.length ?? 0}
            sub={
              (available?.length ?? 0) > 0
                ? "assigned by your course"
                : "practise anything above"
            }
            icon="solar:inbox-in-bold-duotone"
            accent="var(--accent-amber, #d97706)"
          />
        </Box>
      ) : null}

      {failed ? (
        <Surface sx={{ textAlign: "center", py: 5 }}>
          <Icon icon="solar:wi-fi-router-broken" width={34} color="var(--font-tertiary)" />
          <Typography sx={{ mt: 1.5, fontWeight: 500, color: "var(--font-primary)" }}>
            We could not load your interviews.
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: "0.88rem", color: "var(--font-secondary)" }}>
            Check your connection and refresh the page.
          </Typography>
        </Surface>
      ) : null}

      {/* Available interviews. The empty state is honest, not promotional. */}
      {available !== null ? (
        <Box sx={{ mb: 4 }}>
          <SectionHeading
            icon="solar:play-circle-bold-duotone"
            title="Available interviews"
            count={available.length}
            noun="interview"
          />
          {available.length === 0 ? (
            <Surface sx={{ textAlign: "center", py: 5 }}>
              <Icon
                icon="solar:microphone-3-line-duotone"
                width={34}
                color="var(--font-tertiary)"
              />
              <Typography sx={{ mt: 1.5, fontWeight: 500, color: "var(--font-primary)" }}>
                Nothing waiting right now.
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: "0.88rem", color: "var(--font-secondary)" }}>
                Interviews appear here when your course or cohort assigns one, and come back
                after a dropped attempt.
              </Typography>
            </Surface>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                  xl: "repeat(4, 1fr)",
                },
                gap: 2,
              }}
            >
              {available.map((item) => (
                <AvailableCard key={item.id} item={item} />
              ))}
            </Box>
          )}
        </Box>
      ) : null}

      {/* Past interviews: self-hides entirely for a first-timer. */}
      {sessions.length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <SectionHeading
            icon="solar:history-bold-duotone"
            title="Past interviews"
            count={sessions.length}
            noun="attempt"
          />
          <Surface padded={false} sx={{ py: 0.5 }}>
            {sessions.map((row) => (
              <HistoryRow key={row.session_id} row={row} />
            ))}
          </Surface>
        </Box>
      ) : null}

      {/* Initial skeleton at final heights so nothing reflows when data lands. */}
      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[220, 132].map((height, i) => (
            <Box
              key={i}
              sx={{
                height,
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border-default)",
                background:
                  "linear-gradient(100deg, var(--card-bg) 40%, var(--hover-bg, rgba(0,0,0,0.03)) 50%, var(--card-bg) 60%)",
                backgroundSize: "200% 100%",
                animation: "interviewShimmer 1.4s ease-in-out infinite",
                "@keyframes interviewShimmer": {
                  "0%": { backgroundPosition: "200% 0" },
                  "100%": { backgroundPosition: "-200% 0" },
                },
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            />
          ))}
        </Box>
      ) : null}
    </PageShell>
  );
}
