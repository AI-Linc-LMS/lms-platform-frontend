"use client";

/**
 * Where this course leads: the jobs it opens, and the resume that gets the learner there.
 *
 * A learner who finishes a course has nowhere to go from it. The jobs board, the resume builder
 * and the course are three pages that do not know about each other, so the moment a course is
 * done is the moment the product goes quiet.
 *
 * **This rail makes no relevance claim**, and that is deliberate. "Jobs matching this course's
 * skills" was measured against production before any of this was built: word overlap matched a
 * German language course to four jobs on "assessment" and "review", and an Android course to
 * sixty-seven on "application" and "system"; whole-phrase overlap matched 208 of 210 courses to
 * nothing at all. The two vocabularies - content-generated course skills and recruiter-written
 * job skills - do not meet. So:
 *
 * * "Related to this course" appears only over jobs an admin explicitly tied to the course.
 * * Everything else is headed "open to you", which is what the jobs board would show anyway.
 *
 * If a real relevance signal ever exists, it belongs in the first list. Nothing here needs to
 * change to accommodate it.
 */

import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { PHONE } from "@/components/common/mobile/phone";
import type { CareerJobCard, CareerPanel } from "@/lib/types/adaptive-journey";

function JobCard({ job }: { job: CareerJobCard }) {
  const { push, prefetch } = useInstantNavigation();
  // /jobs-v2, not /jobs: the panel is built from jobs_v2.JobDescription, and /jobs-v2/[id] is
  // the detail route the sidebar links to. /jobs is the older list and has no detail page.
  const href = `/jobs-v2/${job.id}`;
  const meta = [job.location, job.workMode, job.employmentType, job.salary].filter(Boolean);
  return (
    <ButtonBase
      onClick={() => push(href)}
      onMouseEnter={() => prefetch(href)}
      aria-label={`${job.title} at ${job.company}`}
      sx={{
        display: "block",
        textAlign: "left",
        width: "100%",
        p: 1.5,
        borderRadius: 2.5,
        border: "1px solid #eef2f7",
        bgcolor: "#fff",
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": { borderColor: "#c7d2fe", boxShadow: "0 6px 18px -16px rgba(99,102,241,0.8)" },
        [PHONE]: { minHeight: 56, p: 1.5 },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box
          sx={{
            width: 34, height: 34, borderRadius: 2, flexShrink: 0,
            display: "grid", placeItems: "center", overflow: "hidden",
            bgcolor: "#eef2ff", color: "#6366f1",
          }}
        >
          {job.companyLogo ? (
            // A plain img: company logos are arbitrary remote URLs and next/image needs each
            // host configured, so one unlisted domain would throw instead of showing a logo.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogo} alt="" width={34} height={34} style={{ objectFit: "cover" }} />
          ) : (
            <Icon icon="mdi:briefcase-outline" width={18} />
          )}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", [PHONE]: { fontSize: "0.95rem" } }}>
            {job.title}
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b", [PHONE]: { fontSize: "0.82rem" } }}>
            {job.company}
          </Typography>
          {meta.length > 0 && (
            <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8", mt: 0.25, [PHONE]: { fontSize: "0.8rem" } }}>
              {meta.join(" · ")}
            </Typography>
          )}
        </Box>
      </Stack>
    </ButtonBase>
  );
}

function Section({ icon, title, note, children }: {
  icon: string; title: string; note?: string; children: React.ReactNode;
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
        <Icon icon={icon} width={16} color="#7c3aed" />
        <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: "#0f172a" }}>{title}</Typography>
        {note && (
          <Typography sx={{ fontSize: "0.76rem", color: "#64748b" }}>· {note}</Typography>
        )}
      </Stack>
      {children}
    </Box>
  );
}

export function CareerRail({
  career,
  courseTitle,
  alwaysShow = false,
}: {
  career?: CareerPanel;
  courseTitle: string;
  /** On its own tab the rail IS the page, so it explains itself instead of disappearing.
   *  Inline on the journey it stays quiet until it has something to say. */
  alwaysShow?: boolean;
}) {
  const { push, prefetch } = useInstantNavigation();

  // A board served before this shipped has no career key at all.
  if (!career) return null;

  const hasRelated = career.related.length > 0;
  // Nothing to say yet: no tagged job, and the fortnight gate is still shut. Inline that means
  // rendering nothing - "come back in 9 days" is not useful to anyone - but a learner who has
  // clicked the Jobs tab asked, and an empty page with no explanation is worse than the wait.
  if (!hasRelated && !career.unlocked && !alwaysShow) return null;

  const daysLeft =
    career.daysSinceStart != null
      ? Math.max(0, career.unlocksAfterDays - career.daysSinceStart)
      : null;

  return (
    <Box
      sx={{
        mt: 2.5, p: { xs: 2, md: 2.5 }, borderRadius: 4,
        border: "1px solid #e9e6f7", bgcolor: "#fff",
        backgroundImage: "radial-gradient(120% 120% at 100% 0%, #faf5ff 0%, #ffffff 45%)",
        boxShadow: "0 12px 30px -26px rgba(99,102,241,0.5)",
        [PHONE]: { p: 1.75 },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" }}>
          <Icon icon="mdi:rocket-launch-outline" width={19} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
            Where this takes you
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>
            {career.unlocked
              ? "You have been at this a fortnight. Here is what to do with it."
              : "Roles your instructor has tied to this course."}
          </Typography>
        </Box>
      </Stack>

      {hasRelated && (
        <Section
          icon="mdi:link-variant"
          title="Related to this course"
          note="chosen by your instructor"
        >
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {career.related.map((j) => <JobCard key={j.id} job={j} />)}
          </Box>
        </Section>
      )}

      {career.unlocked && career.open.length > 0 && (
        <Section
          icon="mdi:briefcase-search-outline"
          // Server-authored. When the server narrowed the list to the families this course
          // leads to, it says so ("Roles this course leads to"); when it could not read the
          // course well enough to narrow anything, it stays "Open to you". Composing this
          // sentence here would let it drift from the predicate that built the list - which is
          // exactly how a rail ends up claiming a relevance it does not have.
          title={career.openFilter?.label ?? "Open to you"}
          note={career.openCount > career.open.length
            ? `${career.openCount} roles open right now`
            : undefined}
        >
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {career.open.map((j) => <JobCard key={j.id} job={j} />)}
          </Box>
          <ButtonBase
            onClick={() => push("/jobs-v2")}
            onMouseEnter={() => prefetch("/jobs-v2")}
            sx={{
              mt: 1.25, px: 2, py: 0.85, borderRadius: 2, fontWeight: 800, fontSize: "0.8rem",
              color: "#6d28d9", border: "1px solid #ddd6fe", bgcolor: "#f5f3ff", gap: 0.5,
              [PHONE]: { minHeight: 44, width: "100%", fontSize: "0.9rem" },
            }}
          >
            <Icon icon="mdi:briefcase-search-outline" width={16} />
            Explore all jobs
          </ButtonBase>
        </Section>
      )}

      {!career.unlocked && !hasRelated && (
        <Section icon="mdi:briefcase-clock-outline" title="Opening soon">
          <Typography sx={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
            {daysLeft != null
              ? `Roles open up here after a fortnight on the course — ${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go.`
              : "Roles open up here once you are a fortnight into the course."}
          </Typography>
        </Section>
      )}

      {career.unlocked && career.open.length === 0 && !hasRelated && (
        <Section icon="mdi:briefcase-search-outline" title="Open to you">
          <Typography sx={{ fontSize: "0.82rem", color: "#64748b" }}>
            No roles are open to you right now. The jobs board will show them as they are
            posted.
          </Typography>
        </Section>
      )}

      {career.resumeNudge && (
        <Section icon="mdi:file-account-outline" title="Your resume">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #eef2f7", bgcolor: "#fff" }}
          >
            <Typography sx={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
              Add what {courseTitle} taught you to your resume, and check how it scores before
              you apply.
            </Typography>
            <ButtonBase
              onClick={() => push("/resume")}
              onMouseEnter={() => prefetch("/resume")}
              sx={{
                flexShrink: 0, px: 2, py: 0.85, borderRadius: 2, fontWeight: 800,
                fontSize: "0.8rem", color: "white",
                background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                [PHONE]: { minHeight: 44, width: "100%", fontSize: "0.9rem" },
              }}
            >
              Open resume builder →
            </ButtonBase>
          </Stack>
        </Section>
      )}

      {!career.unlocked && daysLeft != null && hasRelated && (
        <Typography sx={{ mt: 1.5, fontSize: "0.76rem", color: "#94a3b8" }}>
          More roles and a resume check open up in {daysLeft} {daysLeft === 1 ? "day" : "days"}.
        </Typography>
      )}
    </Box>
  );
}
