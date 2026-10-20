"use client";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import NextLink from "next/link";

import { IconWrapper } from "@/components/common/IconWrapper";
import type { CareerMilestone } from "@/lib/types/adaptive-journey";
import { nodeInk } from "./nodeVisuals";

/**
 * A career station on the spine: update your resume, and the roles now open to you.
 *
 * The career rail says the same two things at the BOTTOM of the page, which is where a learner
 * looks last. These sit at a third, two thirds and the end of the course, so they arrive while
 * the learner is still in it.
 *
 * **Painted dark, like the calibration card.** A resume nudge and a list of open roles are not
 * steps of the course; they are the course pointing outside itself. They take the treatment the
 * calibration card already uses at the top of the page - a near-black base under the same
 * hatching, a gradient toward the half's own hue, a hairline white border and white ink - so
 * the station reads as an event on the rail rather than two more rows. Each half keeps its own
 * dark hue (teal for the resume, navy for the roles) so the two are still told apart.
 *
 * Two rules this component exists to keep:
 *
 * 1. **The jobs half is absent, not empty, when the tenant has no jobs.** A "roles open to you"
 *    card on a tenant holding no jobs is an empty box on every learner's rail for ever. The
 *    server omits `jobs` and this renders the resume half alone.
 * 2. **Nothing here claims a job MATCHES the course.** Matching on skills was measured over 210
 *    courses and does not work - the two vocabularies are structurally disjoint - so the only
 *    wording allowed is the server's own label. A test asserts "matched", "best fit" and
 *    "recommended for you" never render.
 *
 * A locked station still renders, dimmed: a learner should be able to see what is coming.
 */

const RESUME = nodeInk("resume");
const JOBS = nodeInk("jobs");

/**
 * A call to action that is a LINK when it can be followed and a dead button when it cannot.
 *
 * `<Button disabled component={NextLink} href=...>` still renders `<a href>`: MUI disables it
 * with `pointer-events: none`, which a mouse respects and a keyboard does not. A learner
 * tabbing the rail could open a station they have not reached. When locked there is simply no
 * anchor to follow.
 */
function StationCta({ locked, href, label }: { locked: boolean; href: string; label: string }) {
  const base = { textTransform: "none", borderRadius: 2, fontWeight: 700 } as const;
  if (locked) {
    return (
      <Button
        size="small"
        variant="outlined"
        disabled
        sx={{
          ...base,
          // MUI greys a disabled button against a light theme; on this ground that is invisible.
          "&.Mui-disabled": {
            color: "rgba(255,255,255,0.45)",
            borderColor: "rgba(255,255,255,0.18)",
          },
        }}
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
      sx={{
        ...base,
        // The calibration card's own CTA: white on the dark ground, not the theme's violet.
        bgcolor: "#ffffff",
        color: "#0f172a",
        boxShadow: "0 10px 24px -14px rgba(255,255,255,0.5)",
        "&:hover": { bgcolor: "#f1f5f9" },
      }}
    >
      {label}
    </Button>
  );
}

/** One half of the station. Both halves are dark; only the hue and the contents differ. */
function Half({
  tone, locked, children,
}: {
  tone: ReturnType<typeof nodeInk>;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        backgroundColor: tone.baseColor,
        backgroundImage: tone.background,
        borderLeft: "4px solid",
        borderLeftColor: locked ? "rgba(255,255,255,0.22)" : tone.accent,
        color: tone.ink.title,
        p: { xs: 1.75, sm: 2.25 },
      }}
    >
      {children}
    </Box>
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
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 40px -22px rgba(15,23,42,0.7)",
        opacity: locked ? 0.72 : 1,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: jobs ? "1fr 1fr" : "1fr" },
        // `minWidth: 0` or a long job title gives the track a min-content floor wider than the
        // screen and the whole page starts sliding sideways.
        "& > *": { minWidth: 0 },
      }}
    >
      <Half tone={RESUME} locked={locked}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
          <IconWrapper icon="mdi:file-account-outline" size={16} />
          <Typography
            sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
                  color: locked ? RESUME.ink.dim : RESUME.accent,
                  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" } }}
          >
            {atPercent}% · Resume
          </Typography>
          {locked && (
            <Chip
              size="small"
              label="Coming up"
              sx={{ height: 18, fontSize: "0.62rem", color: RESUME.ink.title,
                    bgcolor: "rgba(255,255,255,0.14)" }}
            />
          )}
        </Stack>
        <Typography sx={{ fontWeight: 800, fontSize: "0.96rem", mb: 0.4, color: RESUME.ink.title }}>
          {resume.title}
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: RESUME.ink.body, mb: 1.25 }}>
          {resume.body}
        </Typography>
        <StationCta locked={locked} href={resume.href} label={resume.cta} />
      </Half>

      {jobs && (
        <Half tone={JOBS} locked={locked}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <IconWrapper icon="mdi:briefcase-outline" size={16} />
            <Typography
              sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
                    color: locked ? JOBS.ink.dim : JOBS.accent,
                    '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" } }}
            >
              {/* The server's label, verbatim. It is a claim the data supports; anything
                  stronger is not. */}
              {jobs.label}
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 800, fontSize: "0.96rem", mb: 0.4, color: JOBS.ink.title }}>
            {jobs.title}
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: JOBS.ink.body, mb: 1 }}>
            {jobs.body}
          </Typography>

          <Stack spacing={0.5} sx={{ mb: 1.25 }}>
            {[...jobs.related, ...jobs.open].slice(0, 3).map((job) => (
              <Typography
                key={job.id}
                data-testid="career-station-job"
                sx={{ fontSize: "0.82rem", fontWeight: 600, color: JOBS.ink.title,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {job.title}
                {job.company ? (
                  <Box component="span" sx={{ color: JOBS.ink.body, fontWeight: 400 }}>
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
        </Half>
      )}
    </Box>
  );
}

export default CareerStation;
