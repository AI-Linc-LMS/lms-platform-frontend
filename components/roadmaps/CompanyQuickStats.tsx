"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type {
  RoadmapCompany,
  RoadmapContentTotals,
} from "@/lib/services/roadmaps.service";
import { RM } from "./roadmapTokens";

/**
 * The quick-stats panel.
 *
 * Every row here is either authored per company (rounds, exam format, the negative-marking
 * rule) or computed from something real (the practice this map reaches, the learner's own
 * mastery). The panel this replaces carried a "Competitiveness" percentage that was a static
 * literal authored once per company; it is not reproduced, because a number a learner makes
 * decisions from has to be one we can stand behind.
 *
 * Hiring estimates render only with the date they were true on. The server omits the whole
 * object when it cannot supply a date, so there is no branch here that can leak an undated one.
 */
function Row({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Box
      sx={{
        border: "1px solid #e6e8ef",
        borderRadius: 2,
        px: 1.75,
        py: 1.4,
        bgcolor: "#fff",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.4 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          {label}
        </Typography>
        {hint && (
          <Tooltip title={hint} arrow enterTouchDelay={0}>
            <Box sx={{ display: "flex", color: "#cbd5e1", cursor: "help" }}>
              <Icon icon="solar:info-circle-linear" width={13} />
            </Box>
          </Tooltip>
        )}
      </Stack>
      <Typography
        sx={{
          fontSize: 14.5,
          fontWeight: 700,
          color: accent ?? RM.ink,
          lineHeight: 1.4,
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
  mastery,
}: {
  company: RoadmapCompany;
  content?: RoadmapContentTotals;
  /** 0..1, derived from the learner's own submissions. Undefined until progress loads. */
  mastery?: number;
}) {
  const practice = [
    content?.questions ? `${content.questions.toLocaleString()} questions` : null,
    content?.codingProblems ? `${content.codingProblems} coding problems` : null,
  ].filter(Boolean) as string[];

  const readiness = mastery == null ? null : Math.round(mastery * 100);

  return (
    <Stack spacing={1.25}>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "#7c3aed",
        }}
      >
        Quick stats
      </Typography>

      {company.rounds > 0 && <Row label="Total rounds" value={company.rounds} />}

      {company.examType && <Row label="Type of exam" value={company.examType} />}

      {company.negativeMarking && (
        <Row
          label="Negative marking"
          value={company.negativeMarking}
          hint="Taken from the published pattern. Confirm against your drive notification, since it varies by drive."
        />
      )}

      {practice.length > 0 && (
        <Row
          label="Practice available"
          value={practice.join(" · ")}
          hint="Counted from the content this roadmap actually reaches, not an estimate."
        />
      )}

      <Row
        label="Your readiness"
        value={readiness == null ? "..." : `${readiness}%`}
        accent={readiness != null && readiness > 0 ? "#059669" : undefined}
        hint="The share of steps you have genuinely passed, derived from your own submissions. Marking a step done by hand does not move it."
      />

      {company.estimates && (
        <Box
          sx={{
            border: "1px dashed #e2e8f0",
            borderRadius: 2,
            px: 1.75,
            py: 1.4,
            bgcolor: "#fbfbfd",
          }}
        >
          <Typography
            sx={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: "#94a3b8",
              mb: 0.6,
            }}
          >
            Market estimates
          </Typography>
          {company.estimates.applicants && (
            <Typography sx={{ fontSize: 13, color: "#334155" }}>
              Applicants: <b>{company.estimates.applicants}</b>
            </Typography>
          )}
          {company.estimates.openRoles && (
            <Typography sx={{ fontSize: 13, color: "#334155" }}>
              Open roles: <b>{company.estimates.openRoles}</b>
            </Typography>
          )}
          {/* The date is not decoration: it is what makes these figures honest to show. */}
          <Typography sx={{ mt: 0.6, fontSize: 11.5, color: "#94a3b8" }}>
            Estimates, as of{" "}
            {new Date(company.estimates.asOf).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
            {company.estimates.sourceUrl ? (
              <>
                {" · "}
                <Box
                  component="a"
                  href={company.estimates.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#7c3aed", textDecoration: "underline" }}
                >
                  source
                </Box>
              </>
            ) : null}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
