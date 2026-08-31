"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import RichHtml from "@/components/common/RichHtml";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import {
  deadlineLabel,
  formatCount,
  formatExperience,
  formatLocation,
  formatSalary,
  postedLabel,
  foldToken,
} from "@/lib/jobs-v2/format";
import {
  J,
  R,
  TYPE,
  JCard,
  JButton,
  CompanyLogo,
  MetaRow,
  SectionHeader,
  SkillChip,
  StatusPill,
  type MetaItem,
} from "@/components/jobs-v2/ui";
import { ApplyCta } from "./ApplyCta";
import { AttachedJdCard, JobDetailsPanel, RequirementsList, hasRequirements } from "./JobDetailsPanel";
import type { ApplyState } from "./useApply";

/** HTML, or plain text the shipped page rendered with `pre-wrap` and three dead `sx` rules. */
const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*>/i;

function Prose({ text }: { text: string }) {
  if (LOOKS_LIKE_HTML.test(text)) {
    // The app's existing sanitising renderer. The `& p / & ul, & ol / & li` rules that sat
    // dead in the shipped `sx` (on a `pre-wrap` Typography that can never contain an element)
    // live inside it, where they actually apply.
    return <RichHtml html={text} sx={{ ...TYPE.prose, "& :first-of-type": { mt: 0 } }} />;
  }
  return <Typography sx={{ ...TYPE.prose, whiteSpace: "pre-wrap" }}>{text}</Typography>;
}

export interface JobDetailViewProps {
  job: JobV2;
  apply: ApplyState;
  /** Where "View your application" points once the learner has applied. */
  appliedHref: string;
  /** Hidden in admin mode — behaviour unchanged. */
  showFavorite: boolean;
  favoriteBusy: boolean;
  onToggleFavorite: () => void;
}

export function JobDetailView({
  job,
  apply,
  appliedHref,
  showFavorite,
  favoriteBusy,
  onToggleFavorite,
}: JobDetailViewProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * "Back to jobs" returns you to page 4 of your filtered search rather than an unfiltered
   * page 1 — but only when there is somewhere to go back to. A deep link opened in a fresh tab
   * has no history entry, and `router.back()` would strand the learner on a blank tab.
   */
  const goBack = useCallback(() => {
    const idx =
      typeof window === "undefined" ? undefined : (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) router.back();
    else router.push("/jobs-v2");
  }, [router]);

  /**
   * Prev/next through the result set the board handed us. The board writes `?ids=` when it
   * navigates; without it there is no set to walk and the controls do not render.
   */
  const siblings = useMemo(() => {
    const raw = searchParams?.get("ids");
    if (!raw) return null;
    const ids = raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    const index = ids.indexOf(job.id);
    if (index === -1) return null;
    const href = (id: number) => `/jobs-v2/${id}?ids=${encodeURIComponent(raw)}`;
    return {
      index,
      total: ids.length,
      prev: index > 0 ? href(ids[index - 1]) : null,
      next: index < ids.length - 1 ? href(ids[index + 1]) : null,
    };
  }, [searchParams, job.id]);

  const location = formatLocation(job.location);
  const experience = formatExperience(job.years_of_experience);
  const salary = formatSalary(job.salary);
  const posted = postedLabel(job.created_at);
  const deadline = deadlineLabel(job.application_deadline);

  const meta: MetaItem[] = [];
  if (location) meta.push({ key: "location", icon: "mdi:map-marker-outline", label: location, title: location });
  if (job.job_type) meta.push({ key: "jobType", icon: "mdi:briefcase-outline", label: job.job_type });
  if (experience) meta.push({ key: "experience", icon: "mdi:timer-sand", label: experience });
  if (salary) meta.push({ key: "salary", icon: "mdi:cash-multiple", label: salary });
  // `postedLabel` returns null for an undated row: the chip is OMITTED rather than fabricating
  // "Recently" about a date the API never sent.
  if (posted) meta.push({ key: "posted", icon: "mdi:calendar-outline", label: posted });
  if (deadline) meta.push({ key: "deadline", icon: "mdi:calendar-clock-outline", label: deadline.text });

  /**
   * Skills render ONCE. The page concatenated `mandatory_skills` and `key_skills`, which the
   * admin edit form makes identical, so every skill appeared twice.
   */
  const skills = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of [...(job.mandatory_skills ?? []), ...(job.key_skills ?? [])]) {
      const value = String(raw ?? "").trim();
      if (!value) continue;
      const token = foldToken(value);
      if (seen.has(token)) continue;
      seen.add(token);
      out.push(value);
    }
    return out;
  }, [job.mandatory_skills, job.key_skills]);

  const deadlineTone =
    deadline?.urgency === "urgent" || deadline?.urgency === "past"
      ? { fg: J.dangerFg, bg: J.dangerBg, bd: J.dangerBd }
      : { fg: J.warnFg, bg: J.warnBg, bd: J.warnBd };

  // Both counts are on the payload today and neither is surfaced anywhere.
  const socialProof = [
    job.applications_count != null
      ? t("jobsV2.detail.applicantCount", {
          defaultValue: "{{value}} applicants",
          value: formatCount(job.applications_count),
        })
      : null,
    job.favorites_count != null
      ? t("jobsV2.detail.savedCount", {
          defaultValue: "{{value}} saved",
          value: formatCount(job.favorites_count),
        })
      : null,
  ].filter(Boolean) as string[];

  const applyCard = (
    <JCard accent="azure" data-tour-id="jobs-apply-card">
      <Typography component="h2" sx={{ ...TYPE.h3, mb: 0.5 }}>
        {apply.mode === "applied"
          ? t("jobsV2.detail.applyCardApplied", { defaultValue: "You applied to this role" })
          : t("jobsV2.detail.applyCardTitle", { defaultValue: "Apply for this position" })}
      </Typography>
      <Typography sx={{ ...TYPE.small, mb: 1.75 }}>
        {apply.mode === "external"
          ? t("jobsV2.detail.applyCardExternal", {
              defaultValue: "This employer takes applications on their own site. We record it here for you.",
            })
          : apply.mode === "applied"
            ? t("jobsV2.detail.applyCardAppliedBody", { defaultValue: "Track its progress from your applications." })
            : t("jobsV2.detail.applyCardInternal", {
                defaultValue: "A short form: pick a resume, answer the employer's questions, review, send.",
              })}
      </Typography>

      {/* A deadline three days out no longer looks identical to one three months out. */}
      {deadline && deadline.urgency !== "none" && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mb: 1.5,
            px: 1,
            minHeight: 24,
            borderRadius: R.pill,
            border: `1px solid ${deadlineTone.bd}`,
            bgcolor: deadlineTone.bg,
            ...TYPE.label,
            // TYPE.label carries the muted ink; the urgency tint has to win.
            color: deadlineTone.fg,
            fontSize: "0.6875rem",
          }}
        >
          <IconWrapper icon="mdi:calendar-clock-outline" size={14} />
          {deadline.text}
        </Box>
      )}

      {/* Spec 5.4: the applied state is a StatusPill plus a secondary "View your application",
          not a green button wearing the disabled attribute. */}
      {apply.mode === "applied" && (
        <Box sx={{ mb: 1.5 }}>
          <StatusPill kind="application" value="applied" />
        </Box>
      )}

      <ApplyCta apply={apply} placement="panel" appliedHref={appliedHref} />

      {socialProof.length > 0 && (
        <Typography sx={{ ...TYPE.micro, mt: 1.25 }}>{socialProof.join(" · ")}</Typography>
      )}
    </JCard>
  );

  return (
    <>
      <ModulePageHeader
        eyebrow={t("jobsV2.detail.eyebrow", { defaultValue: "01 · CAREER · ROLE" })}
        title={job.job_title}
        description={[job.company_name, location].filter(Boolean).join(" · ")}
        accent="azure"
        icon="mdi:briefcase-outline"
        action={
          <>
            {showFavorite && (
              <Tooltip
                title={
                  job.is_favourited
                    ? t("jobsV2.detail.unsave", { defaultValue: "Remove from saved" })
                    : t("jobsV2.detail.save", { defaultValue: "Save this job" })
                }
                arrow
              >
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <HeaderActionButton
                    variant="ghost"
                    icon={job.is_favourited ? "mdi:heart" : "mdi:heart-outline"}
                    onClick={onToggleFavorite}
                    disabled={favoriteBusy}
                  >
                    {job.is_favourited
                      ? t("jobsV2.detail.saved", { defaultValue: "Saved" })
                      : t("jobsV2.detail.save", { defaultValue: "Save" })}
                  </HeaderActionButton>
                </Box>
              </Tooltip>
            )}
            <ApplyCta apply={apply} placement="header" appliedHref={appliedHref} />
          </>
        }
      >
        {/* The identity row, on the hero rather than in a second header below it. */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 2 }}>
          <CompanyLogo src={job.company_logo} name={job.company_name} size={56} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...TYPE.h4, color: J.onDark }}>{job.company_name}</Typography>
            <MetaRow items={meta} onDark dense sx={{ mt: 0.75 }} />
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            {job.status && <StatusPill kind="job" value={job.status} size="sm" />}
            {job.eligible_to_apply === false && (
              <StatusPill
                kind="application"
                value="__ineligible__"
                size="sm"
                label={t("jobsV2.notEligible")}
              />
            )}
          </Stack>
        </Stack>
      </ModulePageHeader>

      {/* ---- breadcrumb strip ------------------------------------------- */}
      <Box
        component="nav"
        aria-label={t("jobsV2.detail.breadcrumb", { defaultValue: "Breadcrumb" })}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          mb: 2,
          minWidth: 0,
        }}
      >
        <JButton variant="quiet" size="sm" startIcon="mdi:arrow-left" onClick={goBack}>
          {t("jobsV2.backToJobs")}
        </JButton>
        <Box aria-hidden sx={{ color: J.ink4 }}>
          /
        </Box>
        <Typography
          sx={{
            ...TYPE.small,
            color: J.ink2,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={job.job_title}
        >
          {job.job_title}
        </Typography>

        {siblings && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, marginInlineStart: "auto" }}>
            <Typography sx={{ ...TYPE.micro, fontFeatureSettings: '"tnum" 1' }}>
              {t("jobsV2.detail.resultPosition", {
                defaultValue: "{{index}} of {{total}}",
                index: siblings.index + 1,
                total: siblings.total,
              })}
            </Typography>
            <JButton
              variant="ghost"
              size="sm"
              href={siblings.prev ?? undefined}
              disabled={!siblings.prev}
              aria-label={t("jobsV2.detail.previousJob", { defaultValue: "Previous job" })}
              startIcon="mdi:chevron-left"
            >
              {t("jobsV2.detail.previous", { defaultValue: "Previous" })}
            </JButton>
            <JButton
              variant="ghost"
              size="sm"
              href={siblings.next ?? undefined}
              disabled={!siblings.next}
              aria-label={t("jobsV2.detail.nextJob", { defaultValue: "Next job" })}
              endIcon="mdi:chevron-right"
            >
              {t("jobsV2.detail.next", { defaultValue: "Next" })}
            </JButton>
          </Box>
        )}
      </Box>

      {/* ---- body: splits at md, not lg. The 900-1200px apply dead zone is gone. ---- */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
          // Clearance for the fixed mobile apply bar. MainLayout already reserves the 72px
          // the bottom navigation occupies, so this only has to clear the bar itself.
          pb: { xs: 10, md: 0 },
        }}
      >
        {/* ---- left ---------------------------------------------------- */}
        <Box sx={{ minWidth: 0 }}>
          {job.job_description ? (
            <>
              <SectionHeader
                icon="mdi:text-box-outline"
                title={t("jobsV2.detail.aboutRole", { defaultValue: "About this role" })}
              />
              <JCard sx={{ mb: 3 }}>
                <Prose text={job.job_description} />
              </JCard>
            </>
          ) : null}

          {job.role_process && (
            <>
              <SectionHeader
                icon="mdi:format-list-numbered"
                title={t("jobsV2.detail.selectionProcess", { defaultValue: "Selection process" })}
              />
              <JCard sx={{ mb: 3 }}>
                <Prose text={job.role_process} />
              </JCard>
            </>
          )}

          <RequirementsSection job={job} />

          {skills.length > 0 && (
            <>
              <SectionHeader
                icon="mdi:tag-multiple-outline"
                title={t("jobsV2.detail.keySkills", { defaultValue: "Key skills" })}
              />
              <JCard sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {skills.map((skill) => (
                    <SkillChip key={skill}>{skill}</SkillChip>
                  ))}
                </Box>
              </JCard>
            </>
          )}

          {job.company_info && (
            <>
              <SectionHeader
                icon="mdi:office-building-outline"
                title={t("jobsV2.detail.aboutCompany", { defaultValue: "About {{company}}", company: job.company_name })}
              />
              <JCard sx={{ mb: 3 }}>
                <Prose text={job.company_info} />
              </JCard>
            </>
          )}

          {!job.job_description && !job.role_process && !job.company_info && skills.length === 0 && (
            <JCard dashed sx={{ textAlign: "center", py: 4 }}>
              <Typography sx={TYPE.h3}>
                {t("jobsV2.detail.sparseTitle", { defaultValue: "This posting has no description yet" })}
              </Typography>
              <Typography sx={{ ...TYPE.body, mt: 0.75, maxWidth: "46ch", mx: "auto" }}>
                {t("jobsV2.detail.sparseBody", {
                  defaultValue:
                    "The employer has not added the details for this role. Everything we do know is in the panel beside this one.",
                })}
              </Typography>
            </JCard>
          )}
        </Box>

        {/* ---- right --------------------------------------------------- */}
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: { md: "sticky" },
            top: { md: 88 },
          }}
        >
          {applyCard}
          <JobDetailsPanel job={job} />
          {job.jd_file_url && <AttachedJdCard url={job.jd_file_url} />}
        </Box>
      </Box>

      {/* ---- the mobile apply bar --------------------------------------
          `position: fixed`, not `sticky`: MainLayout gives every ancestor `overflow: auto`,
          which makes them the sticky containing block, so a sticky bar very likely never pins
          at all. Fixed plus the safe-area inset is deterministic. */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          insetInline: 0,
          // ABOVE the app's mobile bottom navigation (fixed, 72px, zIndex 1000). Sitting at
          // `bottom: 0` would put the apply button underneath it.
          bottom: "calc(72px + env(safe-area-inset-bottom))",
          zIndex: 5,
          px: 2,
          py: 1.5,
          bgcolor: J.surface,
          borderTop: `1px solid ${J.hairline}`,
          boxShadow: "var(--j-shadow-sticky)",
        }}
      >
        <ApplyCta apply={apply} placement="bar" appliedHref={appliedHref} />
      </Box>
    </>
  );
}

function RequirementsSection({ job }: { job: JobV2 }) {
  const { t } = useTranslation("common");
  if (!hasRequirements(job)) return null;
  return (
    <>
      <SectionHeader
        icon="mdi:clipboard-check-outline"
        title={t("jobsV2.detail.requirements", { defaultValue: "Requirements" })}
        description={t("jobsV2.detail.requirementsHint", {
          defaultValue: "What the employer checks before shortlisting",
        })}
      />
      <JCard sx={{ mb: 3 }}>
        <RequirementsList job={job} />
      </JCard>
    </>
  );
}
