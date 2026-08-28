"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Metric, SectionHeading, Surface } from "@/components/roadmaps/surfaces";
import {
  CodingProblemBody,
  type CodingProblemData,
} from "@/components/mock-interview/coding/CodingProblemBody";
import interviewService, {
  type InterviewResult,
  type QuestionResult,
} from "@/lib/services/interview.service";

/**
 * The candidate's result: the mark, the words around the mark, and the review.
 *
 * The rule this page still exists to enforce: **a grade that failed is never shown as a
 * mark.** The server distinguishes `failed` from a genuine zero, and this page renders that
 * distinction rather than flattening it back into a number.
 *
 * Coding review reuses the exact CodingProblemBody the live room's modal renders, so the
 * problem a candidate reviews is pixel-identical to the one they attempted.
 */

const KIND_LABEL: Record<string, string> = {
  behavioural: "About you",
  conceptual: "Concept",
  coding: "Coding",
  mcq: "Multiple choice",
};

const longDate = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

function NarrativeList({
  icon,
  title,
  items,
  tone,
}: {
  icon: string;
  title: string;
  items: string[];
  tone: "good" | "warn" | "neutral";
}) {
  const color =
    tone === "good"
      ? "var(--accent-green, #16a34a)"
      : tone === "warn"
        ? "var(--accent-amber, #d97706)"
        : "var(--accent-purple)";
  return (
    <Surface sx={{ flex: 1, minWidth: 240 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <Icon icon={icon} width={17} color={color} />
        <Typography sx={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--font-primary)" }}>
          {title}
        </Typography>
      </Box>
      <Box component="ul" sx={{ m: 0, pl: 2.25, display: "flex", flexDirection: "column", gap: 0.75 }}>
        {items.map((item, i) => (
          <Typography
            component="li"
            key={i}
            sx={{ fontSize: "0.88rem", lineHeight: 1.55, color: "var(--font-secondary)" }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Surface>
  );
}

function McqReview({ mcq }: { mcq: NonNullable<QuestionResult["mcq"]> }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1.5 }}>
      {(["a", "b", "c", "d"] as const).map((id) => {
        const text = mcq.options[id];
        if (!text) return null;
        const correct = id === mcq.correct_option;
        const chosen = id === mcq.chosen;
        return (
          <Box
            key={id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              border: "1px solid",
              borderColor: correct
                ? "var(--accent-green, #16a34a)"
                : chosen
                  ? "var(--accent-red, #dc2626)"
                  : "var(--border-default)",
              bgcolor: correct
                ? "color-mix(in srgb, var(--accent-green, #16a34a) 7%, transparent)"
                : "transparent",
            }}
          >
            <Icon
              icon={
                correct
                  ? "solar:check-circle-bold"
                  : chosen
                    ? "solar:close-circle-bold"
                    : "solar:record-linear"
              }
              width={16}
              color={
                correct
                  ? "var(--accent-green, #16a34a)"
                  : chosen
                    ? "var(--accent-red, #dc2626)"
                    : "var(--font-tertiary)"
              }
            />
            <Typography sx={{ fontSize: "0.88rem", color: "var(--font-primary)", flex: 1 }}>
              {text}
            </Typography>
            {chosen && !correct ? (
              <Typography sx={{ fontSize: "0.75rem", color: "var(--accent-red, #dc2626)" }}>
                Your pick
              </Typography>
            ) : null}
            {correct ? (
              <Typography sx={{ fontSize: "0.75rem", color: "var(--accent-green, #16a34a)" }}>
                Correct
              </Typography>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

function CodingReview({ coding }: { coding: NonNullable<QuestionResult["coding"]> }) {
  const [showProblem, setShowProblem] = useState(false);
  const problem: CodingProblemData = {
    title: coding.title,
    statement: coding.statement,
    sample_input: coding.sample_input,
    sample_output: coding.sample_output,
    constraints: coding.constraints
      ? coding.constraints.split(/\n+/).map((line) => line.trim()).filter(Boolean)
      : undefined,
  };
  return (
    <Box sx={{ mt: 1.5 }}>
      {typeof coding.passed === "number" && typeof coding.total === "number" ? (
        <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", mb: 1 }}>
          {coding.passed} of {coding.total} test cases passed
          {coding.status ? ` · ${coding.status}` : ""}
        </Typography>
      ) : null}
      {coding.submission ? (
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.75,
            borderRadius: 2,
            bgcolor: "var(--code-bg, #0f172a)",
            color: "#e2e8f0",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.82rem",
            lineHeight: 1.6,
            overflowX: "auto",
            maxHeight: 320,
          }}
        >
          {coding.submission}
        </Box>
      ) : (
        <Typography sx={{ fontSize: "0.85rem", color: "var(--font-tertiary)" }}>
          No code was submitted.
        </Typography>
      )}
      <Button
        onClick={() => setShowProblem((was) => !was)}
        sx={{ mt: 1, textTransform: "none", fontSize: "0.82rem", color: "var(--accent-purple)" }}
      >
        {showProblem ? "Hide the problem" : "Show the problem"}
      </Button>
      {showProblem ? (
        <Box sx={{ mt: 1 }}>
          <CodingProblemBody problem={problem} />
        </Box>
      ) : null}
    </Box>
  );
}

function QuestionReview({ question }: { question: QuestionResult }) {
  return (
    <Surface>
      <Box sx={{ display: "flex", gap: 2, alignItems: "baseline" }}>
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--font-tertiary)",
            whiteSpace: "nowrap",
          }}
        >
          {KIND_LABEL[question.kind] ?? question.kind}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography
          sx={{
            fontSize: "0.9rem",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            color: question.answered ? "var(--font-primary)" : "var(--font-tertiary)",
            whiteSpace: "nowrap",
          }}
        >
          {question.answered ? `${question.score} / ${question.max_score}` : "Not answered"}
        </Typography>
      </Box>
      <Typography sx={{ mt: 0.75, fontWeight: 500, fontSize: "0.95rem", color: "var(--font-primary)" }}>
        {question.question}
      </Typography>

      {question.your_answer ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--font-tertiary)",
              mb: 0.5,
            }}
          >
            Your answer
          </Typography>
          <Typography
            sx={{
              fontSize: "0.88rem",
              lineHeight: 1.6,
              color: "var(--font-secondary)",
              borderLeft: "2px solid var(--border-default)",
              pl: 1.5,
            }}
          >
            {question.your_answer}
          </Typography>
        </Box>
      ) : null}

      {question.mcq ? <McqReview mcq={question.mcq} /> : null}
      {question.coding ? <CodingReview coding={question.coding} /> : null}

      {question.feedback ? (
        <Typography sx={{ mt: 1.5, fontSize: "0.88rem", lineHeight: 1.6, color: "var(--font-secondary)" }}>
          <Box component="span" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
            Feedback:{" "}
          </Box>
          {question.feedback}
        </Typography>
      ) : null}
    </Surface>
  );
}

export default function InterviewResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      try {
        const data = await interviewService.result(sessionId);
        if (cancelled) return;
        setResult(data);
        setLoading(false);
        // Grading runs right after the call ends, so "pending" is expected briefly.
        if (data.state === "pending" && attempts < 20) {
          attempts += 1;
          setTimeout(() => void poll(), 3000);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const state = result?.state ?? "pending";
  const unavailable = state === "pending" || state === "failed" || state === "void";
  const context = result?.context;
  const narrative = result?.narrative;
  const coverage = result?.coverage;

  const descriptionBits = context
    ? [
        context.topic,
        context.difficulty,
        longDate.format(new Date(context.created_at)),
        context.actual_minutes
          ? `${context.actual_minutes} min of ${context.planned_minutes} planned`
          : null,
      ].filter(Boolean)
    : [];

  return (
    <PageShell maxWidth={1100}>
      <ModulePageHeader
        eyebrow="Career"
        title={context?.title || "Interview result"}
        description={descriptionBits.join(" · ") || "How your interview went, question by question."}
        accent="indigo"
        icon="solar:diploma-verified-bold-duotone"
        action={
          <Button
            onClick={() => router.push("/interview")}
            sx={{ textTransform: "none", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 2, px: 2 }}
          >
            All interviews
          </Button>
        }
      />

      {loading ? (
        <Surface sx={{ height: 180, opacity: 0.7 }}>{null}</Surface>
      ) : unavailable ? (
        <Surface sx={{ textAlign: "center", py: 6 }}>
          <Icon
            icon={
              state === "void"
                ? "solar:shield-cross-bold-duotone"
                : "solar:hourglass-line-duotone"
            }
            width={40}
            height={40}
            color="var(--font-tertiary)"
          />
          <Typography sx={{ mt: 1.5, fontWeight: 600, color: "var(--font-primary)" }}>
            {state === "void"
              ? "This attempt was voided."
              : state === "failed"
                ? "We could not mark this interview."
                : "Your interview is being marked."}
          </Typography>
          <Typography sx={{ mt: 1, fontSize: "0.9rem", color: "var(--font-secondary)", maxWidth: 420, mx: "auto" }}>
            {/* Deliberately never a zero: a grade we could not compute is not a score of nothing. */}
            {state === "failed"
              ? "This is a problem on our side, not a reflection of how you did. It will be marked again shortly."
              : state === "void"
                ? "Something about this sitting could not be verified. Please contact your administrator."
                : "This usually takes a few seconds."}
          </Typography>
        </Surface>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: 2,
              mb: 3,
            }}
          >
            <Metric
              label="Score"
              value={`${result?.score ?? 0} / ${result?.max_score ?? 0}`}
              sub={
                typeof result?.percentage === "number"
                  ? `${Math.round(result.percentage)}%`
                  : undefined
              }
              icon="solar:medal-ribbons-star-bold-duotone"
            />
            <Metric
              label="Questions answered"
              value={coverage ? `${coverage.answered} / ${coverage.planned}` : "—"}
              sub={
                coverage && coverage.completeness < 1
                  ? "This sitting did not cover everything planned"
                  : undefined
              }
              icon="solar:checklist-minimalistic-bold-duotone"
            />
            <Metric
              label="Duration"
              value={context?.actual_minutes ? `${context.actual_minutes} min` : "—"}
              sub={context ? `${context.planned_minutes} min planned` : undefined}
              icon="solar:stopwatch-bold-duotone"
            />
          </Box>

          {narrative && (narrative.strengths?.length || narrative.gaps?.length || narrative.practise?.length) ? (
            <Box sx={{ mb: 3 }}>
              <SectionHeading
                icon="solar:chat-square-like-bold-duotone"
                title="What the interviewer noticed"
              />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {narrative.strengths?.length ? (
                  <NarrativeList
                    icon="solar:like-bold"
                    title="Strengths"
                    items={narrative.strengths}
                    tone="good"
                  />
                ) : null}
                {narrative.gaps?.length ? (
                  <NarrativeList
                    icon="solar:danger-triangle-bold"
                    title="Gaps"
                    items={narrative.gaps}
                    tone="warn"
                  />
                ) : null}
                {narrative.practise?.length ? (
                  <NarrativeList
                    icon="solar:target-bold"
                    title="Practise next"
                    items={narrative.practise}
                    tone="neutral"
                  />
                ) : null}
              </Box>
            </Box>
          ) : null}

          {/* The offer only appears when there is something specific to work on, so it
              never promises a follow-up with nothing to aim at. */}
          {result?.weak_areas?.length ? (
            <Surface
              sx={{
                mb: 3,
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
                borderColor: "var(--accent-purple)",
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "var(--accent-purple)",
                  bgcolor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
                }}
              >
                <Icon icon="solar:refresh-circle-bold-duotone" width={22} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                  Practise what cost you marks
                </Typography>
                <Typography sx={{ fontSize: "0.86rem", color: "var(--font-secondary)" }}>
                  A follow-up interview built around {result.weak_areas.slice(0, 3).join(", ")}
                  {result.weak_areas.length > 3 ? " and more" : ""}.
                </Typography>
              </Box>
              <Button
                variant="contained"
                disableElevation
                onClick={() => router.push(`/interview/room?followUp=${sessionId}`)}
                startIcon={<Icon icon="solar:microphone-3-bold" width={16} />}
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, px: 2.5 }}
              >
                Start follow-up
              </Button>
            </Surface>
          ) : null}

          <SectionHeading
            icon="solar:document-text-bold-duotone"
            title="Question by question"
            count={result?.questions?.length}
            noun="question"
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(result?.questions ?? []).map((question) => (
              <QuestionReview key={question.position} question={question} />
            ))}
          </Box>
        </>
      )}
    </PageShell>
  );
}
