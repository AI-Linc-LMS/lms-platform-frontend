"use client";

import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import { Icon } from "@iconify/react";

import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import type { CodingProblem } from "@/lib/services/adaptive-coding.service";

/**
 * Structured, student-facing problem panel for the AI Coding Mentor.
 *
 * The backend already serves the full structured spec (input_format,
 * output_format, sample_input/output, constraints) — this renders each as its
 * own labelled section (matching the course-builder / mock-interview problem
 * layout) instead of the old flat problem_statement-only view, so examples and
 * constraints are clearly visible. Every section is conditional: a problem that
 * only has a statement still renders cleanly.
 */
export function AdaptiveCodingProblemPanel({ problem }: { problem: CodingProblem }) {
  const tags = (problem.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const skills = problem.target_skills ?? [];
  // De-dupe tags that merely repeat a skill chip (case-insensitive).
  const skillSet = new Set(skills.map((s) => s.toLowerCase()));
  const extraTags = tags.filter((t) => !skillSet.has(t.toLowerCase())).slice(0, 6);

  const hasExample = Boolean(problem.sample_input || problem.sample_output);

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        background: "var(--card-bg, #fff)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          background:
            "linear-gradient(135deg, color-mix(in srgb,#6366f1 8%,transparent), color-mix(in srgb,#ec4899 6%,transparent))",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.75 }}>
          <AIPill icon={<Icon icon="mdi:robot-happy-outline" width={12} />}>AI Coding Mentor</AIPill>
          <Box sx={{ flex: 1 }} />
          <DifficultyChip level={problem.difficulty_level} />
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: "1.3rem", lineHeight: 1.2 }}>
          {problem.title}
        </Typography>
        {(skills.length > 0 || extraTags.length > 0) && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.85 }}>
            {skills.slice(0, 5).map((s) => (
              <Chip key={`s-${s}`} tone="skill">
                {s}
              </Chip>
            ))}
            {extraTags.map((t) => (
              <Chip key={`t-${t}`} tone="tag">
                {t}
              </Chip>
            ))}
          </Box>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <RichText html={problem.problem_statement} sx={{ fontSize: "0.92rem" }} />

        {problem.input_format && (
          <Section icon="mdi:import" label="Input Format">
            <RichText html={problem.input_format} />
          </Section>
        )}

        {problem.output_format && (
          <Section icon="mdi:export" label="Output Format">
            <RichText html={problem.output_format} />
          </Section>
        )}

        {hasExample && (
          <Section icon="mdi:flask-outline" label="Example">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {problem.sample_input != null && problem.sample_input !== "" && (
                <Box>
                  <IoLabel>Input</IoLabel>
                  <MonoBlock>{problem.sample_input}</MonoBlock>
                </Box>
              )}
              <Box>
                <IoLabel>Output</IoLabel>
                <MonoBlock>{problem.sample_output || "—"}</MonoBlock>
              </Box>
            </Box>
          </Section>
        )}

        {problem.constraints && (
          <Section icon="mdi:ruler-square" label="Constraints">
            <RichText html={problem.constraints} sx={{ fontSize: "0.82rem", color: "text.secondary" }} />
          </Section>
        )}
      </Box>
    </Box>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        pt: 1.25,
        borderTop: "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
      }}
    >
      <Typography
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          fontSize: "0.7rem",
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#6366f1",
          mb: 0.75,
        }}
      >
        <Icon icon={icon} width={14} />
        {label}
      </Typography>
      {children}
    </Box>
  );
}

const RICH_TEXT_SX: SxProps<Theme> = {
  lineHeight: 1.6,
  "& p": { m: 0, mb: 1, "&:last-child": { mb: 0 } },
  "& ul, & ol": { m: 0, mb: 1, pl: 2.5 },
  "& li": { mb: 0.4 },
  "& code": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "0.85em",
    px: 0.5,
    py: 0.1,
    borderRadius: 0.5,
    background: "color-mix(in srgb, var(--border-default) 30%, transparent)",
  },
};

function RichText({ html, sx }: { html: string; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={{ ...RICH_TEXT_SX, fontSize: "0.86rem", ...sx } as SxProps<Theme>}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function MonoBlock({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.1,
        borderRadius: 1.5,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.78rem",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        background: "color-mix(in srgb, var(--border-default) 22%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default) 50%, transparent)",
      }}
    >
      {children}
    </Box>
  );
}

function IoLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        display: "block",
        fontSize: "0.66rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "text.secondary",
        mb: 0.35,
      }}
    >
      {children}
    </Typography>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "skill" | "tag" }) {
  const skill = tone === "skill";
  return (
    <Box
      sx={{
        px: 0.85,
        py: 0.2,
        borderRadius: 999,
        fontSize: "0.7rem",
        fontWeight: 700,
        color: skill ? "#6366f1" : "text.secondary",
        background: skill
          ? "color-mix(in srgb, #6366f1 10%, transparent)"
          : "color-mix(in srgb, var(--border-default) 35%, transparent)",
      }}
    >
      {children}
    </Box>
  );
}

export function DifficultyChip({ level }: { level: "Easy" | "Medium" | "Hard" }) {
  const color = level === "Easy" ? "#10b981" : level === "Medium" ? "#f59e0b" : "#ef4444";
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.3,
        borderRadius: 999,
        fontSize: "0.7rem",
        fontWeight: 800,
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {level}
    </Box>
  );
}

export default AdaptiveCodingProblemPanel;
