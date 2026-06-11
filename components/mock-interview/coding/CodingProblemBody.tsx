"use client";

import { Box, Paper, Typography } from "@mui/material";
import { memo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Canonical coding-problem shape. Older interviews stored only the first five fields; the
 * richer fields (title, constraints, examples, complexity, formats) are optional and added
 * by the enriched generator. Everything degrades gracefully so legacy problems still render.
 */
export interface CodingProblemData {
  statement: string;
  starter_code?: string;
  language?: string;
  sample_input?: string;
  sample_output?: string;
  title?: string;
  constraints?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  time_complexity_expectation?: string;
  space_complexity_expectation?: string;
  input_format?: string;
  output_format?: string;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--font-secondary)",
        mt: 2,
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}

function MonoBlock({ children }: { children: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
        fontSize: "0.8rem",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border-default)",
        borderRadius: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: "var(--font-primary-dark)",
      }}
    >
      {children}
    </Paper>
  );
}

/**
 * Renders a coding problem statement as proper Markdown (headings, bold, lists, inline +
 * fenced code), followed by structured Constraints, Examples (input / output / explanation),
 * and an expected-complexity line. Replaces the old plain pre-wrap text that swallowed all
 * formatting and showed at most a single sample I/O pair. Used by both the live coding modal
 * and the result-page structured-question viewer so they look identical.
 */
function CodingProblemBodyComponent({ problem }: { problem: CodingProblemData }) {
  const examples =
    problem.examples && problem.examples.length > 0
      ? problem.examples
      : problem.sample_input || problem.sample_output
        ? [{ input: problem.sample_input || "", output: problem.sample_output || "" }]
        : [];
  const constraints = problem.constraints ?? [];
  const complexity = [
    problem.time_complexity_expectation
      ? `Time: ${problem.time_complexity_expectation}`
      : null,
    problem.space_complexity_expectation
      ? `Space: ${problem.space_complexity_expectation}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Box>
      {problem.title && (
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: "var(--font-primary-dark)", mb: 0.5 }}
        >
          {problem.title}
        </Typography>
      )}

      <SectionLabel>Problem</SectionLabel>
      <Box
        sx={{
          color: "var(--font-primary-dark)",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          "& p": { my: 0.75 },
          "& ul, & ol": { my: 0.75, pl: 2.5 },
          "& li": { mb: 0.4 },
          "& h1, & h2, & h3, & h4": { fontWeight: 700, mt: 1.25, mb: 0.5, fontSize: "0.95rem" },
          "& strong": { fontWeight: 700 },
          "& code": {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
            fontSize: "0.8rem",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "4px",
            px: "4px",
            py: "1px",
          },
          "& pre": {
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            p: 1.25,
            overflowX: "auto",
            my: 1,
          },
          "& pre code": {
            border: "none",
            background: "transparent",
            p: 0,
          },
          "& table": { borderCollapse: "collapse", my: 1 },
          "& th, & td": {
            border: "1px solid var(--border-default)",
            px: 1,
            py: 0.5,
            fontSize: "0.8rem",
          },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {problem.statement || ""}
        </ReactMarkdown>
      </Box>

      {(problem.input_format || problem.output_format) && (
        <>
          <SectionLabel>Format</SectionLabel>
          {problem.input_format && (
            <Typography variant="body2" sx={{ color: "var(--font-primary-dark)", mb: 0.5 }}>
              <strong>Input:</strong> {problem.input_format}
            </Typography>
          )}
          {problem.output_format && (
            <Typography variant="body2" sx={{ color: "var(--font-primary-dark)" }}>
              <strong>Output:</strong> {problem.output_format}
            </Typography>
          )}
        </>
      )}

      {constraints.length > 0 && (
        <>
          <SectionLabel>Constraints</SectionLabel>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {constraints.map((c, i) => (
              <Box
                component="li"
                key={i}
                sx={{
                  color: "var(--font-primary-dark)",
                  fontSize: "0.82rem",
                  mb: 0.4,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
                }}
              >
                {c}
              </Box>
            ))}
          </Box>
        </>
      )}

      {examples.map((ex, i) => (
        <Box key={i}>
          <SectionLabel>
            {examples.length > 1 ? `Example ${i + 1}` : "Example"}
          </SectionLabel>
          {(ex.input || ex.input === "") && (
            <>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "var(--font-secondary)", mb: 0.25 }}
              >
                Input
              </Typography>
              <MonoBlock>{ex.input || "—"}</MonoBlock>
            </>
          )}
          <Typography
            variant="caption"
            sx={{ display: "block", color: "var(--font-secondary)", mt: 0.75, mb: 0.25 }}
          >
            Output
          </Typography>
          <MonoBlock>{ex.output || "—"}</MonoBlock>
          {ex.explanation && (
            <Typography
              variant="body2"
              sx={{ color: "var(--font-secondary)", mt: 0.5, fontStyle: "italic" }}
            >
              {ex.explanation}
            </Typography>
          )}
        </Box>
      ))}

      {complexity && (
        <>
          <SectionLabel>Expected complexity</SectionLabel>
          <Typography variant="body2" sx={{ color: "var(--font-primary-dark)" }}>
            {complexity}
          </Typography>
        </>
      )}
    </Box>
  );
}

export const CodingProblemBody = memo(CodingProblemBodyComponent);
CodingProblemBody.displayName = "CodingProblemBody";
