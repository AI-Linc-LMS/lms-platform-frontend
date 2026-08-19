"use client";

import { use, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { MainLayout } from "@/components/layout/MainLayout";
import interviewService, { type InterviewResult } from "@/lib/services/interview.service";

/**
 * The candidate's result.
 *
 * The rule this page exists to enforce: **a grade that failed is never shown as a mark.**
 * The old module returned a fully-formed dict of zeros when its grader could not reach the
 * model, and fourteen real candidates were shown a fabricated zero as their result. Here the
 * server distinguishes `failed` from a genuine zero, and this page renders that distinction
 * rather than flattening it back into a number.
 *
 * Coverage is shown alongside the score for the same reason: a mark from an interview that
 * covered half its questions means something different from the same mark at full coverage,
 * and hiding that would make the two look identical.
 */
export default function InterviewResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
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
        // Grading runs after the call ends, so "pending" is expected briefly. Give up after a
        // bounded number of tries rather than polling a dead session forever.
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

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 4 }}>
          <Typography>Loading your result...</Typography>
        </Box>
      </MainLayout>
    );
  }

  const state = result?.state ?? "pending";
  const unavailable = state === "pending" || state === "failed" || state === "void";

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <Typography sx={{ fontSize: "1.6rem", fontWeight: 600, mb: 3 }}>
          Interview result
        </Typography>

        {unavailable ? (
          <Box
            sx={{
              border: "1px solid var(--border-color, #e5e7eb)",
              borderRadius: "12px",
              p: 4,
              textAlign: "center",
            }}
          >
            <Icon
              icon={
                state === "void"
                  ? "solar:shield-cross-bold-duotone"
                  : "solar:hourglass-line-duotone"
              }
              width={40}
              height={40}
            />
            <Typography sx={{ mt: 1.5, fontWeight: 500 }}>
              {state === "void"
                ? "This attempt was voided."
                : state === "failed"
                  ? "We could not mark this interview."
                  : "Your interview is being marked."}
            </Typography>
            <Typography sx={{ mt: 1, fontSize: "0.9rem", color: "var(--font-secondary, #6b7280)" }}>
              {/* Deliberately not a zero. A grade we could not compute is not a score of nothing. */}
              {state === "failed"
                ? "This is a problem on our side, not a reflection of how you did. It will be marked again shortly."
                : state === "void"
                  ? "Please contact your administrator."
                  : "This usually takes a few seconds."}
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                border: "1px solid var(--border-color, #e5e7eb)",
                borderRadius: "12px",
                p: 4,
                mb: 3,
              }}
            >
              <Typography sx={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--font-secondary, #6b7280)" }}>
                Score
              </Typography>
              <Typography sx={{ fontSize: "2.4rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {result?.score ?? 0}
                <Typography component="span" sx={{ fontSize: "1.2rem", color: "var(--font-secondary, #6b7280)" }}>
                  {" "}/ {result?.max_score ?? 0}
                </Typography>
              </Typography>
              {result?.coverage ? (
                <Typography sx={{ mt: 1, fontSize: "0.88rem", color: "var(--font-secondary, #6b7280)" }}>
                  {result.coverage.answered} of {result.coverage.planned} questions answered
                  {result.coverage.completeness < 1
                    ? " — this interview did not cover everything it planned to, so read the score in that light."
                    : ""}
                </Typography>
              ) : null}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {(result?.questions ?? []).map((q) => (
                <Box
                  key={q.position}
                  sx={{
                    border: "1px solid var(--border-color, #e5e7eb)",
                    borderRadius: "12px",
                    p: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2, alignItems: "baseline", mb: 1 }}>
                    <Typography sx={{ fontWeight: 500, flex: 1 }}>{q.question}</Typography>
                    <Typography sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {q.answered ? `${q.score} / ${q.max_score}` : "Not answered"}
                    </Typography>
                  </Box>
                  {q.feedback ? (
                    <Typography sx={{ fontSize: "0.9rem", color: "var(--font-secondary, #6b7280)" }}>
                      {q.feedback}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </MainLayout>
  );
}
