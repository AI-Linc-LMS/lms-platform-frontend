"use client";

import React, { forwardRef, useMemo } from "react";
import { AssessmentResult } from "@/lib/services/assessment.service";
import { buildAssessmentFeedbackPoints } from "@/lib/utils/assessment-feedback.utils";
import {
  getWeakSkillDisplayRows,
  normalizeTopSkillDisplayNames,
  type WeakSkillDisplayRow,
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

const SKY = "var(--primary-400)";
const SKY_DEEP = "var(--primary-600)";
const INK = "var(--primary-900)";
const MUTED = "var(--font-secondary)";
const TRACK = "var(--border-light)";
const FILL = "var(--primary-400)";

function pct(n: number, total: number): number {
  if (!total || !Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round((n / total) * 100)));
}

function capitalizeFirstChar(s: string): string {
  if (!s || s === "—") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function WeakSkillCard({ row }: { row: WeakSkillDisplayRow }) {
  const label = capitalizeFirstChar(row.label);
  const acc = row.accuracyPercent ?? 0;
  const hasCounts =
    row.correct != null && row.total != null && (row.total as number) > 0;
  const hasAccuracy = row.accuracyPercent != null;

  const badgeBg =
    !hasAccuracy || acc >= 50 ? "color-mix(in srgb, var(--warning-500) 18%, transparent)" : acc >= 25 ? "color-mix(in srgb, var(--accent-orange) 14%, transparent)" : "color-mix(in srgb, var(--error-500) 12%, transparent)";
  const badgeColor =
    !hasAccuracy || acc >= 50 ? "color-mix(in srgb, var(--accent-orange) 92%, var(--font-dark))" : acc >= 25 ? "color-mix(in srgb, var(--accent-orange) 78%, var(--font-dark))" : "var(--error-600)";
  const barTrack = "color-mix(in srgb, var(--accent-orange) 14%, transparent)";
  const barFill =
    acc >= 50
      ? "linear-gradient(90deg,var(--warning-500),var(--accent-yellow))"
      : acc >= 25
        ? "linear-gradient(90deg,var(--accent-orange),var(--accent-orange))"
        : "linear-gradient(90deg,var(--error-600),color-mix(in srgb, var(--error-500) 65%, white))";

  return (
    <div
      style={{
        background: "var(--font-light)",
        borderRadius: 10,
        padding: "14px 16px 12px",
        border: "1px solid color-mix(in srgb, var(--accent-orange) 22%, transparent)",
        boxShadow: "0 2px 8px color-mix(in srgb, var(--primary-900) 6%, transparent)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.35,
            letterSpacing: "-0.02em",
          }}
        >
          {label}
        </span>
        {hasAccuracy && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "5px 11px",
              borderRadius: 999,
              background: badgeBg,
              color: badgeColor,
              flexShrink: 0,
              letterSpacing: "0.02em",
            }}
          >
            {acc}%
          </span>
        )}
      </div>
      {hasAccuracy ? (
        <div
          style={{
            height: 7,
            background: barTrack,
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: `${Math.min(100, acc)}%`,
              height: "100%",
              borderRadius: 6,
              background: barFill,
              minWidth: acc > 0 ? 4 : 0,
              transition: "width 0.2s ease",
            }}
          />
        </div>
      ) : (
        <p style={{ margin: "0 0 10px", fontSize: 11, color: MUTED, lineHeight: 1.45 }}>
          No numeric breakdown for this skill in the report data.
        </p>
      )}
      {hasCounts ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>
            <strong style={{ color: "var(--font-muted)", fontWeight: 600 }}>
              {row.correct}/{row.total}
            </strong>{" "}
            correct
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--ats-warning-muted)",
            }}
          >
            Practice priority
          </span>
        </div>
      ) : null}
    </div>
  );
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

  const weakSkillRows = useMemo(
    () => getWeakSkillDisplayRows(stats.low_skills, 6),
    [stats.low_skills]
  );

  const year = new Date().getFullYear();

  return (
    <div
      ref={ref}
      style={{
        width: "794px",
        boxSizing: "border-box",
        background: "var(--font-light)",
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

      {/* Header: titles left, YOUR SCORE card top-right (aligned with performance heading) */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
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

        <div
          style={{
            width: 228,
            flexShrink: 0,
            borderRadius: 10,
            border: "1px solid var(--border-light)",
            background: "var(--surface)",
            padding: "16px 16px 14px",
            boxShadow: "0 4px 14px color-mix(in srgb, var(--primary-900) 8%, transparent)",
            alignSelf: "flex-start",
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
          <div style={{ fontSize: 12, color: "var(--neutral-600)" }}>
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

      <div style={{ marginBottom: 18 }}>
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

      <p
        style={{
          margin: "0 0 30px",
          fontSize: 13,
          lineHeight: 1.65,
          color: "var(--neutral-600)",
        }}
      >
        This report summarizes outcomes for{" "}
        <strong style={{ color: INK, fontWeight: 700 }}>&quot;{data.assessment_name}&quot;</strong>
        . Overall accuracy is{" "}
        <strong style={{ color: INK, fontWeight: 700 }}>
          {formatAccuracyReportPercent(stats.accuracy_percent ?? 0)}
        </strong>{" "}
        with placement readiness at{" "}
        <strong style={{ color: INK, fontWeight: 700 }}>
          {formatPlacementReportPercent(stats.placement_readiness ?? 0)}
        </strong>
        , based on attempted items and topic-level performance.
      </p>

      {/* Hero */}
      <div style={{ display: "flex", width: "100%", marginBottom: 34, gap: 0 }}>
        <div
          style={{
            flex: 1,
            background: `linear-gradient(180deg, ${SKY} 0%, ${SKY} 78%, ${SKY_DEEP} 78%, ${SKY_DEEP} 100%)`,
            color: "var(--font-light)",
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
          <div style={{ fontSize: 11, lineHeight: 1.45, opacity: 0.92, color: "color-mix(in srgb, var(--accent-blue-light) 22%, transparent)" }}>
            Out of {stats.total_questions} total items · {data.status}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: `linear-gradient(180deg, ${INK} 0%, ${INK} 78%, var(--neutral-700) 78%, var(--neutral-700) 100%)`,
            color: "var(--font-light)",
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

      <div
        style={{
          marginBottom: 24,
          padding: "20px 20px 20px 16px",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--warning-100) 95%, var(--card-bg)) 0%, color-mix(in srgb, var(--warning-100) 90%, var(--card-bg)) 55%, color-mix(in srgb, var(--accent-orange) 14%, transparent) 100%)",
          borderLeft: "4px solid var(--warning-500)",
          borderRadius: 10,
          boxShadow: "0 4px 20px color-mix(in srgb, var(--warning-500) 10%, transparent)",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: 15,
              fontWeight: 800,
              color: INK,
              letterSpacing: "-0.02em",
            }}
          >
            Skills needing attention
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
            Focus your next study blocks on these areas — accuracy reflects this attempt only.
          </p>
        </div>
        {weakSkillRows.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {weakSkillRows.map((row, i) => (
              <WeakSkillCard key={`${row.label}-${i}`} row={row} />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
            None flagged for this attempt.
          </p>
        )}
      </div>

      {feedbackPoints.length > 0 && (
        <div
          style={{
            marginBottom: 28,
            padding: "20px 20px 20px 16px",
            background: "linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--surface-blue-light) 90%, var(--card-bg)) 100%)",
            borderLeft: `4px solid ${SKY}`,
            borderRadius: 10,
            boxShadow: "0 4px 20px color-mix(in srgb, var(--primary-400) 10%, transparent)",
          }}
        >
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: 15,
              fontWeight: 800,
              color: INK,
              letterSpacing: "-0.02em",
            }}
          >
            Feedback
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
            Summary guidance based on your results and pacing.
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              fontSize: 12,
              lineHeight: 1.65,
              color: "var(--neutral-600)",
            }}
          >
            {feedbackPoints.map((point: string, i: number) => (
              <li
                key={i}
                style={{
                  marginBottom: i === feedbackPoints.length - 1 ? 0 : 12,
                  paddingLeft: 14,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "0.45em",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: SKY,
                  }}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
});

export default AssessmentPdfSummaryView;
