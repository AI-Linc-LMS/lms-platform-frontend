"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { StatStrip } from "@/components/admin/assessment/shared/StatStrip";
import { useToast } from "@/components/common/Toast";
import interviewService, {
  type AdminQuestionDetail,
  type AdminSessionDetail,
} from "@/lib/services/interview.service";

/**
 * One attempt, for the examiner.
 *
 * This page shows what the student result page deliberately withholds: the rubric each
 * answer was marked against, the integrity evidence behind the verdict, the raw transcript,
 * and what the sitting cost. The reader here is the examiner, not the examined.
 */

const VERDICT_TONE: Record<string, string> = {
  clean: "var(--accent-green, #16a34a)",
  flagged: "var(--accent-amber, #d97706)",
  failed: "var(--accent-red, #dc2626)",
};

const longDate = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        p: { xs: 2, md: 2.5 },
      }}
    >
      <Typography
        sx={{
          fontSize: "0.74rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--font-tertiary)",
          mb: 1.5,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function QuestionPanel({ question }: { question: AdminQuestionDetail }) {
  const looksFor = (question.rubric?.looks_for as string[] | undefined) ?? [];
  const objective = question.response?.objective_result ?? {};
  return (
    <Box
      sx={{
        border: "1px solid var(--border-default)",
        borderRadius: "calc(var(--radius-card) - 6px)",
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "baseline" }}>
        <Typography sx={{ fontSize: "0.75rem", color: "var(--font-tertiary)", fontWeight: 600 }}>
          Q{question.position} · {question.kind}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography
          sx={{
            fontSize: "0.88rem",
            fontWeight: 600,
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--font-primary)",
          }}
        >
          {question.score ? `${question.score.score} / ${question.score.max_score}` : "unmarked"}
        </Typography>
      </Box>
      <Typography sx={{ mt: 0.5, fontWeight: 500, fontSize: "0.92rem", color: "var(--font-primary)" }}>
        {question.prompt}
      </Typography>

      {looksFor.length ? (
        <Typography sx={{ mt: 1, fontSize: "0.8rem", color: "var(--font-secondary)" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            Rubric looks for:{" "}
          </Box>
          {looksFor.join("; ")}
        </Typography>
      ) : null}

      {question.response?.transcript ? (
        <Typography
          sx={{
            mt: 1,
            fontSize: "0.85rem",
            color: "var(--font-secondary)",
            borderLeft: "2px solid var(--border-default)",
            pl: 1.5,
          }}
        >
          {question.response.transcript}
        </Typography>
      ) : question.released_at ? (
        <Typography sx={{ mt: 1, fontSize: "0.82rem", color: "var(--font-tertiary)" }}>
          Asked, no answer recorded.
        </Typography>
      ) : (
        <Typography sx={{ mt: 1, fontSize: "0.82rem", color: "var(--font-tertiary)" }}>
          Never released to the candidate.
        </Typography>
      )}

      {question.response?.code ? (
        <Box
          component="pre"
          sx={{
            mt: 1,
            m: 0,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "var(--code-bg, #0f172a)",
            color: "#e2e8f0",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.8rem",
            lineHeight: 1.55,
            overflowX: "auto",
            maxHeight: 260,
          }}
        >
          {question.response.code}
        </Box>
      ) : null}

      {"passed" in objective || "correct" in objective ? (
        <Typography sx={{ mt: 1, fontSize: "0.8rem", color: "var(--font-secondary)" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            Objective verdict:{" "}
          </Box>
          {"correct" in objective
            ? objective.correct
              ? "correct"
              : `wrong (picked ${String(objective.chosen || "?")})`
            : `${String(objective.passed)} / ${String(objective.total)} tests`}
        </Typography>
      ) : null}

      {question.score?.feedback ? (
        <Typography sx={{ mt: 1, fontSize: "0.82rem", color: "var(--font-secondary)" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            Feedback:{" "}
          </Box>
          {question.score.feedback}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function AdminInterviewSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const toast = useToast();
  const [detail, setDetail] = useState<AdminSessionDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [regrading, setRegrading] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const load = useCallback(() => {
    interviewService.admin
      .sessionDetail(sessionId)
      .then(setDetail)
      .catch(() => setFailed(true));
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const regrade = useCallback(async () => {
    setRegrading(true);
    try {
      const { state } = await interviewService.admin.regrade(sessionId);
      toast.showToast(
        state === "graded" ? "Re-graded." : `Re-grade finished in state: ${state}`,
        state === "graded" ? "success" : "info",
      );
      load();
    } catch {
      toast.showToast("Re-grade failed. The attempt may be voided.", "error");
    } finally {
      setRegrading(false);
    }
  }, [load, sessionId, toast]);

  if (failed) {
    return (
      <PageShell maxWidth={1000}>
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Typography sx={{ color: "var(--font-secondary)" }}>
            Could not load this attempt.
          </Typography>
        </Box>
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell maxWidth={1000}>
        <Box
          sx={{
            height: 420,
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            opacity: 0.7,
          }}
        />
      </PageShell>
    );
  }

  const grade = detail.grade;
  const stats = [
    {
      label: "Score",
      value:
        grade.state === "graded" && typeof grade.percentage === "number"
          ? `${Math.round(grade.percentage)}%`
          : grade.state,
      icon: "solar:medal-ribbons-star-bold-duotone",
    },
    {
      label: "Coverage",
      value:
        typeof grade.completeness === "number"
          ? `${Math.round(grade.completeness * 100)}%`
          : "—",
      icon: "solar:checklist-minimalistic-bold-duotone",
    },
    {
      label: "Duration",
      value: detail.billable_seconds
        ? `${Math.max(1, Math.round(detail.billable_seconds / 60))} min`
        : "—",
      icon: "solar:stopwatch-bold-duotone",
    },
    {
      label: "Integrity",
      value: detail.integrity,
      icon: "solar:shield-check-bold-duotone",
      tone: VERDICT_TONE[detail.integrity],
    },
    {
      label: "Cost",
      value: `$${detail.cost_usd.toFixed(2)}`,
      icon: "solar:dollar-minimalistic-bold-duotone",
    },
  ];

  return (
    <PageShell maxWidth={1000}>
      <ModulePageHeader
        eyebrow="Interview management"
        title={detail.student.name}
        description={`${detail.title || detail.topic} · ${longDate.format(new Date(detail.created_at))} · ${detail.student.email}`}
        accent="indigo"
        icon="solar:user-id-bold-duotone"
        action={
          <Button
            onClick={() => void regrade()}
            disabled={regrading || detail.status === "voided"}
            startIcon={
              regrading ? (
                <CircularProgress size={14} sx={{ color: "inherit" }} />
              ) : (
                <Icon icon="solar:refresh-bold" width={15} />
              )
            }
            sx={{
              textTransform: "none",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: 2,
              px: 2,
            }}
          >
            Re-grade
          </Button>
        }
      />

      <Box sx={{ mb: 3 }}>
        <StatStrip items={stats} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {detail.integrity_events.length ? (
          <Panel title="Integrity evidence">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {detail.integrity_events.map((event, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "baseline" }}>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      flexShrink: 0,
                      position: "relative",
                      top: -1,
                      bgcolor:
                        event.severity === "fail"
                          ? "var(--accent-red, #dc2626)"
                          : "var(--accent-amber, #d97706)",
                    }}
                  />
                  <Typography sx={{ fontSize: "0.86rem", color: "var(--font-primary)", fontWeight: 500 }}>
                    {event.kind.replace(/_/g, " ")}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      color: "var(--font-tertiary)",
                      fontFamily: "var(--font-mono, monospace)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {JSON.stringify(event.detail)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Panel>
        ) : null}

        <Panel title={`The paper, as marked (${detail.questions.length} questions)`}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {detail.questions.map((question) => (
              <QuestionPanel key={question.position} question={question} />
            ))}
          </Box>
        </Panel>

        {detail.turns.length ? (
          <Panel title={`Raw transcript (${detail.turns.length} turns)`}>
            <Button
              onClick={() => setTranscriptOpen((was) => !was)}
              sx={{ textTransform: "none", fontSize: "0.84rem", color: "var(--accent-purple)", px: 0 }}
            >
              {transcriptOpen ? "Hide" : "Show"} the conversation as recorded
            </Button>
            {transcriptOpen ? (
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  maxHeight: 420,
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                {detail.turns.map((turn) => (
                  <Box key={turn.seq}>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color:
                          turn.role === "candidate"
                            ? "var(--accent-purple)"
                            : "var(--font-tertiary)",
                      }}
                    >
                      {turn.role}
                    </Typography>
                    <Typography sx={{ fontSize: "0.86rem", lineHeight: 1.55, color: "var(--font-secondary)" }}>
                      {turn.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Panel>
        ) : null}
      </Box>
    </PageShell>
  );
}
