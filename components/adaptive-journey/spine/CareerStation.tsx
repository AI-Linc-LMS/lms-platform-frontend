"use client";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import NextLink from "next/link";

import { IconWrapper } from "@/components/common/IconWrapper";
import type { CareerMilestone } from "@/lib/types/adaptive-journey";

/**
 * A career station on the spine: update your resume, and the roles now open to you.
 *
 * The career rail says the same two things at the BOTTOM of the page, which is where a learner
 * looks last. These sit at a third, two thirds and the end of the course, so they arrive while
 * the learner is still in it.
 *
 * Two rules this component exists to keep:
 *
 * 1. **The jobs half is absent, not empty, when the tenant has no jobs.** Agileology holds zero
 *    JobDescription rows; a "roles open to you" card there is an empty box on every learner's
 *    rail for ever. The server omits `jobs` and this renders the resume half alone.
 * 2. **Nothing here claims a job MATCHES the course.** Matching on skills was measured over 210
 *    courses and does not work - the two vocabularies are structurally disjoint - so the only
 *    wording allowed is the server's own label. A test asserts "matched", "best fit" and
 *    "recommended for you" never render.
 *
 * A locked station still renders, greyed: a learner should be able to see what is coming.
 */

/**
 * A call to action that is a LINK when it can be followed and a dead button when it cannot.
 *
 * `<Button disabled component={NextLink} href=...>` still renders `<a href>`: MUI disables it
 * with `pointer-events: none`, which a mouse respects and a keyboard does not. A learner
 * tabbing the rail could open a station they have not reached. When locked there is simply no
 * anchor to follow.
 */
function StationCta({ locked, href, label }: { locked: boolean; href: string; label: string }) {
  if (locked) {
    return (
      <Button
        size="small"
        variant="outlined"
        disabled
        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
      >
        {label}
      </Button>
    );
  }
  return (
    <Button
      component={NextLink}
      href={href}
      size="small"
      variant="contained"
      sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
    >
      {label}
    </Button>
  );
}

export function CareerStation({ milestone }: { milestone: CareerMilestone }) {
  const { locked, atPercent, resume, jobs } = milestone;

  return (
    <Box
      data-testid="career-station"
      data-locked={locked ? "true" : "false"}
      data-at-percent={atPercent}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: locked ? "divider" : "rgba(124,58,237,0.28)",
        bgcolor: locked ? "transparent" : "rgba(124,58,237,0.04)",
        p: { xs: 1.75, sm: 2.25 },
        opacity: locked ? 0.72 : 1,
        // The grid collapses to one column on a phone. `minWidth: 0` on the children is what
        // stops a long job title giving the track a min-content floor wider than the screen.
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: jobs ? "1fr 1fr" : "1fr" },
        gap: { xs: 1.75, md: 2.5 },
        "& > *": { minWidth: 0 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
          <IconWrapper icon="mdi:file-account-outline" size={16} />
          <Typography
            sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
                  color: "text.secondary",
                  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" } }}
          >
            {atPercent}% · Resume
          </Typography>
          {locked && <Chip size="small" label="Coming up" sx={{ height: 18, fontSize: "0.62rem" }} />}
        </Stack>
        <Typography sx={{ fontWeight: 800, fontSize: "0.96rem", mb: 0.4 }}>
          {resume.title}
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 1.25 }}>
          {resume.body}
        </Typography>
        <StationCta locked={locked} href={resume.href} label={resume.cta} />
      </Box>

      {jobs && (
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <IconWrapper icon="mdi:briefcase-outline" size={16} />
            <Typography
              sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
                    color: "text.secondary",
                    '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" } }}
            >
              {/* The server's label, verbatim. It is a claim the data supports; anything
                  stronger is not. */}
              {jobs.label}
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 800, fontSize: "0.96rem", mb: 0.4 }}>
            {jobs.title}
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 1 }}>
            {jobs.body}
          </Typography>

          <Stack spacing={0.5} sx={{ mb: 1.25 }}>
            {[...jobs.related, ...jobs.open].slice(0, 3).map((job) => (
              <Typography
                key={job.id}
                data-testid="career-station-job"
                sx={{ fontSize: "0.82rem", fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {job.title}
                {job.company ? (
                  <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                    {" · "}{job.company}
                  </Box>
                ) : null}
              </Typography>
            ))}
          </Stack>

          <StationCta
            locked={locked}
            href={jobs.href}
            label={`${jobs.cta}${jobs.openCount > 0 ? ` (${jobs.openCount})` : ""}`}
          />
        </Box>
      )}
    </Box>
  );
}

export default CareerStation;
