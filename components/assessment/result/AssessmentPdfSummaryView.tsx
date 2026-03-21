"use client";

import React, { forwardRef, useMemo } from "react";
import { AssessmentResult } from "@/lib/services/assessment.service";
import { buildAssessmentFeedbackPoints } from "@/lib/utils/assessment-feedback.utils";
import {
  formatWeakSkillsForReport,
  normalizeTopSkillDisplayNames,
} from "@/lib/utils/assessment-skill-labels.utils";
import {
  formatAccuracyReportPercent,
  formatPercentileReport,
  formatPlacementReportPercent,
  formatScoreAttainmentPercent,
  formatScoreVersusMax,
  getPerformanceTier,
  getSubmissionBadgeKind,
  humanizeAssessmentStatus,
  PERFORMANCE_TONE_HEX,
  SUBMISSION_BADGE_HEX,
} from "@/lib/utils/assessment-performance-summary.utils";

const SKY = "#0284c7";
const SKY_DEEP = "#0369a1";
const INK = "#0f172a";
const MUTED = "#64748b";
const TRACK = "#e2e8f0";
const FILL = "#0284c7";

function pct(n: number, total: number): number {
  if (!total || !Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round((n / total) * 100)));
}

function capitalizeFirstChar(s: string): string {
  if (!s || s === "—") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function BarRow({ label, value }: { label: string; value: number }) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: SKY_DEEP }}>{v}%</span>
      </div>
      <div
        style={{
          height: 8,
          background: TRACK,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            background: FILL,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

function HeaderDecoration() {
  return (
    <div
      style={{
        position: "relative",
        width: 120,
        height: 72,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(5, 1fr)",
          gap: 5,
          opacity: 0.35,
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#d1d5db",
              alignSelf: "center",
              justifySelf: "center",
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: 8,
          top: 8,
          width: 48,
          height: 48,
          border: `2px solid ${SKY}`,
          borderRadius: "50%",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 28,
          top: 20,
          width: 36,
          height: 36,
          border: `2px solid ${SKY}`,
          borderRadius: "50%",
          opacity: 0.3,
        }}
      />
    </div>
  );
}

const AssessmentPdfSummaryView = forwardRef<
  HTMLDivElement,
  { data: AssessmentResult }
>(function AssessmentPdfSummaryView({ data }, ref) {
  const stats = data.stats;
  const total = stats.total_questions || 1;
  const correct = stats.correct_answers;
  const incorrect = stats.incorrect_answers;
  const unattempted = total - stats.attempted_questions;

  const topThree = useMemo(
    () => normalizeTopSkillDisplayNames(stats.top_skills, 3),
    [stats.top_skills]
  );

  const topicBars = useMemo(() => {
    const entries = Object.entries(stats.topic_wise_stats ?? {});
    return entries
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 4)
      .map(([name, v]) => ({ name, accuracy: v.accuracy_percent }));
  }, [stats.topic_wise_stats]);

  const performanceTier = useMemo(() => getPerformanceTier(stats), [stats]);
  const submissionBadge = useMemo(
    () => SUBMISSION_BADGE_HEX[getSubmissionBadgeKind(data.status)],
    [data.status]
  );

  const feedbackPoints = useMemo(() => buildAssessmentFeedbackPoints(data), [data]);

  const weakSkillLines = useMemo(
    () => formatWeakSkillsForReport(stats.low_skills, 6),
    [stats.low_skills]
  );

  const year = new Date().getFullYear();

  return (
    <div
      ref={ref}
      style={{
        width: "794px",
        boxSizing: "border-box",
        background: "#ffffff",
        padding: "0 48px 36px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: INK,
      }}
    >
      <div
        style={{
          height: 4,
          background: SKY,
          margin: "0 -48px 28px",
          width: "calc(100% + 96px)",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              width: 88,
              height: 4,
              background: SKY,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: SKY_DEEP,
              marginBottom: 6,
            }}
          >
            PERFORMANCE REPORT
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            Assessment performance
          </h1>
        </div>
        <HeaderDecoration />
      </div>

      <div style={{ marginBottom: 14 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
          }}
        >
          {data.assessment_name}
        </span>
        <div style={{ fontSize: 12, fontWeight: 500, color: MUTED, marginTop: 6 }}>
          ID{" "}
          {String(data.assessment_id).length > 48
            ? `${String(data.assessment_id).slice(0, 46)}…`
            : data.assessment_id}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          marginBottom: 30,
        }}
      >
        <p
          style={{
            flex: 1,
            margin: 0,
            minWidth: 0,
            fontSize: 13,
            lineHeight: 1.65,
            color: "#334155",
          }}
        >
          This report summarizes outcomes for{" "}
          <strong style={{ color: INK, fontWeight: 700 }}>&quot;{data.assessment_name}&quot;</strong>
          . Overall accuracy is{" "}
          <strong style={{ color: INK, fontWeight: 700 }}>
            {formatAccuracyReportPercent(stats.accuracy_percent ?? 0)}
          </strong>{" "}
         based on attempted items and topic-level performance.
        </p>

        <div
          style={{
            width: 228,
            flexShrink: 0,
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            padding: "16px 16px 14px",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: MUTED,
              marginBottom: 6,
            }}
          >
            YOUR SCORE
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: INK,
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            {formatScoreVersusMax(stats.score ?? 0, stats.maximum_marks ?? 0)}
          </div>
          <div
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: 6,
              marginBottom: 12,
              color: PERFORMANCE_TONE_HEX[performanceTier.tone].text,
              background: PERFORMANCE_TONE_HEX[performanceTier.tone].bg,
              border: `1px solid ${PERFORMANCE_TONE_HEX[performanceTier.tone].border}`,
            }}
          >
            {performanceTier.label}
          </div>
          <div style={{ fontSize: 12, color: "#334155" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                gap: 8,
              }}
            >
              <span style={{ color: MUTED }}>Score attainment</span>
              <strong style={{ color: INK }}>{formatScoreAttainmentPercent(stats)}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                gap: 8,
              }}
            >
              <span style={{ color: MUTED }}>Accuracy</span>
              <strong style={{ color: INK }}>
                {(stats.accuracy_percent ?? 0).toFixed(1)}%
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                gap: 8,
              }}
            >
              <span style={{ color: MUTED }}>Percentile</span>
              <strong style={{ color: INK }}>
                {formatPercentileReport(stats.percentile ?? 0)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: MUTED, fontSize: 11 }}>Status</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 5,
                  color: submissionBadge.text,
                  background: submissionBadge.bg,
                  border: `1px solid ${submissionBadge.border}`,
                }}
              >
                {humanizeAssessmentStatus(data.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ display: "flex", width: "100%", marginBottom: 34, gap: 0 }}>
        <div
          style={{
            flex: 1,
            background: `linear-gradient(180deg, ${SKY} 0%, ${SKY} 78%, ${SKY_DEEP} 78%, ${SKY_DEEP} 100%)`,
            color: "#fff",
            padding: "26px 24px",
            minHeight: 176,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.95 }}>
              Questions attempted
            </div>
            <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.05, marginTop: 8 }}>
              {stats.attempted_questions}
            </div>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.45, opacity: 0.92, color: "#e0f2fe" }}>
            Out of {stats.total_questions} total items · {data.status}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: `linear-gradient(180deg, ${INK} 0%, ${INK} 78%, #1e293b 78%, #1e293b 100%)`,
            color: "#fff",
            padding: "26px 24px",
            minHeight: 176,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.95 }}>
              Top three focus areas
            </div>
            <ul
              style={{
                margin: "12px 0 0",
                padding: 0,
                listStyle: "none",
                fontSize: 17,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {topThree.map((name, i) => (
                <li key={i}>{capitalizeFirstChar(name)}</li>
              ))}
            </ul>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.45, opacity: 0.85 }}>
            Strongest skills by performance in this attempt (when provided by the assessment).
          </div>
        </div>
      </div>

      {/* Three columns */}
      <div style={{ display: "flex", gap: 28, width: "100%", marginBottom: 36 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 12,
              fontWeight: 700,
              paddingBottom: 8,
              borderBottom: `2px solid ${SKY}`,
            }}
          >
            Answer breakdown
          </h2>
          <BarRow label="Correct" value={pct(correct, total)} />
          <BarRow label="Incorrect" value={pct(incorrect, total)} />
          <BarRow label="Unattempted" value={pct(unattempted, total)} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>
            Score &amp; readiness
          </h2>
          <BarRow
            label="Score / max"
            value={pct(stats.score, stats.maximum_marks || 1)}
          />
          <BarRow label="Accuracy" value={Math.round(stats.accuracy_percent)} />
          <BarRow label="Placement readiness" value={Math.round(stats.placement_readiness)} />
          <BarRow label="Percentile" value={Math.min(100, Math.round(stats.percentile))} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 12,
              fontWeight: 700,
              paddingBottom: 8,
              borderBottom: `2px solid ${SKY}`,
            }}
          >
            Topic accuracy
          </h2>
          {topicBars.length > 0 ? (
            topicBars.map((t) => <BarRow key={t.name} label={t.name} value={t.accuracy} />)
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>No topic breakdown.</p>
          )}
        </div>
      </div>

      {/* Time row */}
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            fontWeight: 700,
            paddingBottom: 8,
            borderBottom: `2px solid ${SKY}`,
            display: "inline-block",
            width: "100%",
          }}
        >
          Time usage
        </h2>
        <BarRow label="Time used (vs allotted)" value={Math.min(100, stats.percentage_time_taken)} />
        <p style={{ margin: "8px 0 0", fontSize: 11, color: MUTED }}>
          {stats.time_taken_minutes} / {stats.total_time_minutes} minutes
        </p>
      </div>

      {feedbackPoints.length > 0 && (
        <div
          style={{
            marginBottom: 20,
            padding: "18px 20px 18px 16px",
            background: "#eff6ff",
            borderLeft: `4px solid ${SKY}`,
            borderRadius: 2,
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: INK }}>Feedback</h2>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              lineHeight: 1.6,
              color: "#334155",
            }}
          >
            {feedbackPoints.map((point: string, i: number) => (
              <li key={i} style={{ marginBottom: 10 }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        style={{
          marginBottom: 28,
          padding: "18px 20px 18px 16px",
          background: "#fff7ed",
          borderLeft: "4px solid #fbbf24",
          borderRadius: 2,
        }}
      >
        <h2 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: INK }}>
          Skills needing attention
        </h2>
        {weakSkillLines.length > 0 ? (
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              lineHeight: 1.6,
              color: "#334155",
            }}
          >
            {weakSkillLines.map((line: string, i: number) => (
              <li key={i} style={{ marginBottom: 10 }}>
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
            None flagged for this attempt.
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 18,
          borderTop: "1px solid #cbd5e1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 4, background: SKY, borderRadius: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Page 1 of 1</span>
        </div>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          © Confidential assessment report
        </span>
      </div>
    </div>
  );
});

export default AssessmentPdfSummaryView;
