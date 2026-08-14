"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type {
  RoadmapCompany,
  RoadmapContentTotals,
} from "@/lib/services/roadmaps.service";

/**
 * The company stat strip.
 *
 * Laid out HORIZONTALLY rather than as a right rail. As a rail it was a tall narrow column
 * beside a short hiring-process card, and the page was mostly empty below the fold; the values
 * here are all short (a count, a yes/no, a percentage), so they belong in a row that fills the
 * width instead of a column that cannot.
 *
 * Every cell is authored per company or computed from the learner's own work. The panel this
 * replaces carried a "Competitiveness" percentage that was a static literal, and it is not
 * reproduced: a number a learner makes decisions from has to be one we can stand behind.
 *
 * Hiring estimates render only with the date they were true on. The server omits the object
 * entirely when it cannot supply one, so no branch here can leak an undated figure.
 */
function Cell({
  label,
  value,
  hint,
  accent,
  span = 1,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
  span?: number;
}) {
  return (
    <Box
      sx={{
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        px: 1.75,
        py: 1.4,
        bgcolor: "var(--surface)",
        minWidth: 0,
        gridColumn: span > 1 ? { xs: "1 / -1", md: `span ${span}` } : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.4 }}>
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
          }}
        >
          {label}
        </Typography>
        {hint && (
          <Tooltip title={hint} arrow enterTouchDelay={0}>
            <Box sx={{ display: "flex", color: "var(--font-tertiary)", cursor: "help" }}>
              <Icon icon="solar:info-circle-linear" width={12} />
            </Box>
          </Tooltip>
        )}
      </Stack>
      <Typography
        sx={{
          fontSize: "0.92rem",
          fontWeight: 600,
          color: accent ?? "var(--font-primary)",
          lineHeight: 1.35,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function CompanyQuickStats({
  company,
  content,
}: {
  company: RoadmapCompany;
  content?: RoadmapContentTotals;
}) {
  const practice = [
    content?.questions ? `${content.questions.toLocaleString()} questions` : null,
    content?.codingProblems ? `${content.codingProblems} coding` : null,
  ].filter(Boolean) as string[];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0,1fr))",
          md: "repeat(4, minmax(0,1fr))",
          lg: "repeat(6, minmax(0,1fr))",
        },
      }}
    >
      {company.rounds > 0 && <Cell label="Rounds" value={company.rounds} />}

      {practice.length > 0 && (
        <Cell
          label="Practice"
          value={practice.join(" · ")}
          span={2}
          hint="Counted from the content this roadmap actually reaches, not an estimate."
        />
      )}

      {company.negativeMarking && (
        <Cell
          label="Negative marking"
          value={company.negativeMarking}
          span={company.negativeMarking.length > 24 ? 2 : 1}
          hint="Taken from the published pattern. Confirm against your drive notification, since it varies by drive."
        />
      )}

      {company.examType && <Cell label="Type of exam" value={company.examType} span={3} />}

      {company.estimates && (
        <Cell
          label="Market estimates"
          span={3}
          value={
            <Box component="span" sx={{ fontWeight: 500, fontSize: "0.86rem" }}>
              {company.estimates.applicants && (
                <>
                  {company.estimates.applicants} applicants
                  {company.estimates.openRoles ? " · " : ""}
                </>
              )}
              {company.estimates.openRoles && <>{company.estimates.openRoles} open roles</>}
              {/* The date is not decoration: it is what makes these honest to show. */}
              <Box
                component="span"
                sx={{ color: "var(--font-tertiary)", display: "block", fontSize: "0.72rem" }}
              >
                Estimates, as of{" "}
                {new Date(company.estimates.asOf).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </Box>
            </Box>
          }
        />
      )}
    </Box>
  );
}
