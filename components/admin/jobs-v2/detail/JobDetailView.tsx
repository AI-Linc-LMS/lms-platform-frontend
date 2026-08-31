"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobApplicationV2, JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { deadlineLabel, formatCount, formatDate, formatSalary } from "@/lib/jobs-v2/format";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import {
  CompanyLogo,
  DefinitionList,
  EmptyState,
  ErrorState,
  HairlineStrip,
  J,
  JButton,
  JCard,
  JConfirm,
  JobDetailSkeleton,
  JobsScope,
  MetaRow,
  Notice,
  R,
  SectionHeader,
  SkillChip,
  StatusPill,
  StatusSelect,
  TYPE,
  focusRing,
  type MetaItem,
  type StripItem,
} from "@/components/jobs-v2/ui";
import { AudiencePanel } from "./AudiencePanel";
import { EligibilityPanel, type DefinitionRow } from "./EligibilityPanel";

/** Case-folded de-duplication. The two skill lists are separate, but they can overlap. */
function dedupeSkills(job: JobV2): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const skill of [...(job.mandatory_skills ?? []), ...(job.key_skills ?? [])]) {
    const value = String(skill ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function JobDetailView({ jobId }: { jobId: number }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const seq = useSeq();

  const [job, setJob] = useState<JobV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [applications, setApplications] = useState<JobApplicationV2[] | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const jdWarningShown = useRef(false);
  /**
   * STATE, not a ref. The flag was being read into a ref and never rendered, so an admin who
   * chose "Continue without it" after a failed JD upload landed here with no sign the PDF was
   * missing — the one thing spec 5.12 asks this screen to say.
   */
  const [jdUploadFailed, setJdUploadFailed] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId || Number.isNaN(jobId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const token = seq.next();
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const data = await adminJobsV2Service.getJob(jobId, config.clientId);
      if (!seq.isCurrent(token)) return;
      setJob(data);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      const message = (err as Error)?.message ?? (t("jobsV2.error.body") as string);
      // Not found and error are SEPARATE branches. The shipped page toasted and pushed the
      // admin back to the list, discarding their context and offering no retry.
      if (/not found|does not exist|404/i.test(message)) setNotFound(true);
      else setLoadError(message);
    } finally {
      if (seq.isCurrent(token)) setLoading(false);
    }
  }, [jobId, seq, t]);

  /**
   * The pipeline counts on the strip. This is a SECOND, optional fetch: if it fails the strip
   * says so in a hint rather than turning the whole page into an error, because the job itself
   * loaded fine.
   */
  const loadApplications = useCallback(async () => {
    if (!jobId || Number.isNaN(jobId)) return;
    setApplicationsError(null);
    try {
      const data = await adminJobsV2Service.getJobApplications(jobId, config.clientId);
      setApplications(data.results ?? []);
    } catch (err) {
      setApplicationsError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
    }
  }, [jobId, t]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  // A JD upload that failed after the job was created hands the route this flag.
  useEffect(() => {
    if (jdWarningShown.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("jd_upload") === "failed") {
      jdWarningShown.current = true;
      setJdUploadFailed(true);
    }
  }, []);

  const handleStatusChange = useCallback(
    async (next: string) => {
      if (!job) return;
      const previous = job.status;
      // Optimistic on THIS control only. `loadJob()` with `setLoading(true)` after every flip
      // collapsed the entire page back to skeletons.
      setJob({ ...job, status: next as JobV2["status"] });
      setStatusBusy(true);
      setStatusError(null);
      try {
        const updated = await adminJobsV2Service.updateJob(
          job.id,
          { status: next as JobV2["status"] },
          config.clientId,
        );
        setJob((current) => (current ? { ...current, status: updated.status ?? next as JobV2["status"] } : current));
      } catch (err) {
        setJob((current) => (current ? { ...current, status: previous } : current));
        setStatusError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
      } finally {
        setStatusBusy(false);
      }
    },
    [job, t],
  );

  const handleDelete = useCallback(async () => {
    if (!job) return;
    setDeleting(true);
    try {
      await adminJobsV2Service.deleteJob(job.id, config.clientId);
      showToast(t("jobsV2.detail.deleted", "Job deleted") as string, "success");
      setDeleteOpen(false);
      router.push("/admin/jobs-v2");
    } catch (err) {
      setDeleting(false);
      setDeleteOpen(false);
      showToast((err as Error)?.message ?? (t("jobsV2.error.body") as string), "error");
    }
  }, [job, router, showToast, t]);

  const counts = useMemo(() => {
    if (!applications) return null;
    return {
      total: applications.length,
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      selected: applications.filter((a) => a.status === "selected").length,
    };
  }, [applications]);

  const deadline = job ? deadlineLabel(job.application_deadline) : null;

  const strip = useMemo<StripItem[]>(() => {
    if (!job) return [];
    const unknown = "—";
    const countHint = applicationsError
      ? (t("jobsV2.detail.countsUnavailable", "Could not be counted") as string)
      : undefined;
    return [
      {
        key: "applicants",
        label: t("jobsV2.detail.applicants", "Applicants"),
        value: formatCount(counts?.total ?? job.applications_count ?? 0),
        onClick: () => router.push(`/admin/jobs-v2/${job.id}/applications`),
      },
      {
        key: "shortlisted",
        label: t("jobsV2.appStatus.shortlisted"),
        value: counts ? formatCount(counts.shortlisted) : unknown,
        hint: countHint,
      },
      {
        key: "selected",
        label: t("jobsV2.appStatus.selected"),
        value: counts ? formatCount(counts.selected) : unknown,
        hint: countHint,
      },
      {
        key: "favourites",
        label: t("jobsV2.detail.favourites", "Favourites"),
        value: formatCount(job.favorites_count ?? 0),
      },
      {
        key: "closes",
        label: t("jobsV2.detail.daysToClose", "Days to close"),
        value: deadline ? formatCount(Math.max(deadline.daysLeft, 0)) : unknown,
        hint: deadline
          ? deadline.text
          : (t("jobsV2.detail.noDeadline", "No closing date") as string),
        tone:
          deadline?.urgency === "urgent" || deadline?.urgency === "past"
            ? J.dangerFg
            : deadline?.urgency === "soon"
              ? J.warnFg
              : undefined,
      },
    ];
  }, [applicationsError, counts, deadline, job, router, t]);

  const meta = useMemo<MetaItem[]>(() => {
    if (!job) return [];
    const items: MetaItem[] = [];
    if (job.location) items.push({ key: "location", icon: "mdi:map-marker-outline", label: job.location });
    if (job.job_type) items.push({ key: "jobType", icon: "mdi:briefcase-outline", label: job.job_type });
    if (job.years_of_experience) {
      items.push({ key: "experience", icon: "mdi:timer-sand", label: job.years_of_experience });
    }
    const salary = formatSalary(job.salary);
    if (salary) items.push({ key: "salary", icon: "mdi:currency-inr", label: salary });
    if (job.number_of_openings != null) {
      items.push({
        icon: "mdi:account-multiple-outline",
        label: t("jobsV2.detail.openings", "{{count}} opening(s)", {
          count: job.number_of_openings,
        }),
      });
    }
    if (job.created_at) {
      items.push({
        key: "posted",
        icon: "mdi:calendar-outline",
        label: t("jobsV2.detail.created", "Created {{date}}", {
          date: formatDate(job.created_at),
        }),
      });
    }
    return items;
  }, [job, t]);

  const skills = job ? dedupeSkills(job) : [];

  const classification = useMemo<DefinitionRow[]>(() => {
    if (!job) return [];
    return [
      { key: "industry", label: t("jobsV2.form.industry", "Industry"), value: job.industry_type ?? null },
      { key: "department", label: t("jobsV2.form.department", "Department"), value: job.department ?? null },
      {
        key: "role_category",
        label: t("jobsV2.form.roleCategory", "Role category"),
        value: job.role_category ?? null,
      },
      { key: "education", label: t("jobsV2.form.educationLevel", "Education"), value: job.education ?? null },
      {
        key: "employment",
        label: t("jobsV2.form.employmentType", "Employment type"),
        value: job.employment_type ?? null,
      },
    ];
  }, [job, t]);

  const isIncomplete =
    Boolean(job) &&
    !job?.job_description?.trim() &&
    !job?.role_process?.trim() &&
    !job?.company_info?.trim() &&
    skills.length === 0;

  /* ---- states ----------------------------------------------------------- */
  if (loading) {
    return (
      <PageShell>
        <JobsScope surface="admin">
          <ModulePageHeader
            eyebrow={t("jobsV2.detail.adminEyebrow", "Job") as string}
            title={t("jobsV2.loading.job")}
            accent="azure"
            icon="mdi:briefcase-outline"
          />
          <JobDetailSkeleton />
        </JobsScope>
      </PageShell>
    );
  }

  if (notFound || (!job && !loadError)) {
    return (
      <PageShell>
        <JobsScope surface="admin">
          <ModulePageHeader
            eyebrow={t("jobsV2.detail.adminEyebrow", "Job") as string}
            title={t("jobsV2.detail.notFoundTitle", "Job not found")}
            accent="azure"
            icon="mdi:briefcase-off-outline"
          />
          <EmptyState
            variant="page"
            icon="mdi:briefcase-off-outline"
            title={t("jobsV2.detail.notFoundTitle", "Job not found")}
            body={t(
              "jobsV2.detail.notFoundBody",
              "It may have been deleted, or it belongs to another account.",
            )}
            primaryAction={
              <JButton variant="primary" href="/admin/jobs-v2" startIcon="mdi:arrow-left">
                {t("jobsV2.admin.backToJobs", "Back to jobs")}
              </JButton>
            }
          />
        </JobsScope>
      </PageShell>
    );
  }

  if (loadError || !job) {
    return (
      <PageShell>
        <JobsScope surface="admin">
          <ModulePageHeader
            eyebrow={t("jobsV2.detail.adminEyebrow", "Job") as string}
            title={t("jobsV2.error.jobTitle")}
            accent="azure"
            icon="mdi:briefcase-outline"
          />
          {/* Retry IN PLACE. The shipped page toasted and navigated away. */}
          <ErrorState
            variant="page"
            error={loadError}
            title={t("jobsV2.error.jobTitle")}
            onRetry={() => void loadJob()}
            secondaryAction={
              <JButton variant="secondary" href="/admin/jobs-v2">
                {t("jobsV2.admin.backToJobs", "Back to jobs")}
              </JButton>
            }
          />
        </JobsScope>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <JobsScope surface="admin">
        <ModulePageHeader
          eyebrow={t("jobsV2.detail.adminEyebrow", "Job") as string}
          title={job.job_title}
          description={[job.company_name, job.location].filter(Boolean).join(" · ")}
          accent="azure"
          icon="mdi:briefcase-outline"
          action={
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <HeaderActionButton
                icon="mdi:account-group"
                onClick={() => router.push(`/admin/jobs-v2/${job.id}/applications`)}
              >
                {t("jobsV2.detail.applicationsCta", "Applications ({{count}})", {
                  count: counts?.total ?? job.applications_count ?? 0,
                })}
              </HeaderActionButton>
              <HeaderActionButton
                variant="ghost"
                icon="mdi:pencil"
                onClick={() => router.push(`/admin/jobs-v2/${job.id}/edit`)}
              >
                {t("jobsV2.detail.edit", "Edit")}
              </HeaderActionButton>
            </Box>
          }
        >
          {/* No `mt` here: ModulePageHeader already spaces its own children, and the extra
              margin made the jobs hero taller than every sibling module's. */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <CompanyLogo src={job.company_logo} name={job.company_name} size={56} />
            <Box sx={{ minWidth: 0 }}>
              <MetaRow items={meta} onDark unordered />
              <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
                <StatusPill kind="job" value={job.status ?? "active"} />
                <StatusPill kind="visibility" value={job.is_published ? "published" : "draft"} />
                {job.source === "scraped" && (
                  <StatusPill
                    kind="scraped"
                    value="imported"
                    size="sm"
                    label={t("jobsV2.detail.scraped", "Scraped")}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </ModulePageHeader>

        {/* Breadcrumb strip — the hand-built row of <Button>s separated by literal "/" is gone. */}
        <Box
          component="nav"
          aria-label={t("jobsV2.detail.breadcrumb", "Breadcrumb")}
          sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 2, flexWrap: "wrap" }}
        >
          <JButton variant="quiet" size="sm" href="/admin/jobs-v2" startIcon="mdi:arrow-left">
            {t("jobsV2.admin.jobs", "Jobs")}
          </JButton>
          <Typography aria-hidden sx={{ ...TYPE.micro, color: J.ink4 }}>
            /
          </Typography>
          <Typography sx={{ ...TYPE.micro, color: J.ink2, minWidth: 0 }} title={job.job_title}>
            {job.job_title}
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Box
              component="button"
              type="button"
              aria-label={t("jobsV2.detail.moreActions", "More actions")}
              aria-haspopup="menu"
              onClick={(event: React.MouseEvent<HTMLElement>) =>
                setMenuAnchor(event.currentTarget)
              }
              sx={{
                display: "grid",
                placeItems: "center",
                width: 40,
                height: 40,
                borderRadius: R.ctl,
                border: `1px solid ${J.hairline}`,
                bgcolor: J.surface,
                color: J.ink2,
                cursor: "pointer",
                "&:hover": { borderColor: J.azureBorder, bgcolor: J.surface2 },
                ...focusRing,
              }}
            >
              <IconWrapper icon="mdi:dots-vertical" size={20} />
            </Box>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: R.card,
                    border: `1px solid ${J.hairline}`,
                    bgcolor: J.surface,
                    backgroundImage: "none",
                  },
                },
              }}
            >
              {job.jd_file_url && (
                <MenuItem
                  component="a"
                  href={job.jd_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuAnchor(null)}
                  sx={{ ...TYPE.body, color: J.ink, gap: 1 }}
                >
                  <IconWrapper icon="mdi:file-document-outline" size={18} />
                  {t("jobsV2.detail.viewJd", "Open the attached JD")}
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setDeleteOpen(true);
                }}
                sx={{ ...TYPE.body, color: J.dangerFg, gap: 1 }}
              >
                <IconWrapper icon="mdi:delete-outline" size={18} />
                {t("jobsV2.detail.delete", "Delete this job")}
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <HairlineStrip
          items={strip}
          ariaLabel={t("jobsV2.detail.stripLabel", "Job at a glance") as string}
          sx={{ mb: 3 }}
        />

        {isIncomplete && (
          <EmptyState
            variant="panel"
            icon="mdi:text-box-remove-outline"
            title={t("jobsV2.detail.incompleteTitle", "This posting is missing its description")}
            body={t(
              "jobsV2.detail.incompleteBody",
              "There is no description, no selection process, no company blurb and no skills, so a learner sees an empty page.",
            )}
            primaryAction={
              <JButton
                variant="primary"
                startIcon="mdi:pencil"
                href={`/admin/jobs-v2/${job.id}/edit`}
              >
                {t("jobsV2.detail.finishIt", "Finish it")}
              </JButton>
            }
            sx={{ mb: 3 }}
          />
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* ---- left: the prose ------------------------------------------ */}
          <Box>
            <SectionHeader
              icon="mdi:text-box-outline"
              title={t("jobsV2.detail.aboutRole", "About this role")}
              level="sub"
            />
            <JCard sx={{ mb: 2 }}>
              {job.job_description?.trim() ? (
                <Typography sx={{ ...TYPE.prose, whiteSpace: "pre-wrap" }}>
                  {job.job_description}
                </Typography>
              ) : (
                <Typography sx={TYPE.micro}>
                  {t("jobsV2.detail.noDescription", "No description recorded.")}
                </Typography>
              )}
            </JCard>

            {job.role_process?.trim() && (
              <>
                <SectionHeader
                  icon="mdi:format-list-checks"
                  title={t("jobsV2.detail.selectionProcess", "Selection process")}
                  level="sub"
                />
                <JCard sx={{ mb: 2 }}>
                  <Typography sx={{ ...TYPE.prose, whiteSpace: "pre-wrap" }}>
                    {job.role_process}
                  </Typography>
                </JCard>
              </>
            )}

            {job.company_info?.trim() && (
              <>
                <SectionHeader
                  icon="mdi:information-outline"
                  title={t("jobsV2.detail.aboutCompany", "About the company")}
                  level="sub"
                />
                <JCard sx={{ mb: 2 }}>
                  <Typography sx={{ ...TYPE.prose, whiteSpace: "pre-wrap" }}>
                    {job.company_info}
                  </Typography>
                </JCard>
              </>
            )}
          </Box>

          {/* ---- right: the controls and the facts ------------------------- */}
          <Box>
            <SectionHeader
              icon="mdi:publish"
              title={t("jobsV2.detail.publishing", "Publishing")}
              level="sub"
            />
            <JCard sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* A real control with a real label, among controls — not a fourth read-only
                    chip in the hero carrying a stray floating InputLabel. */}
                <StatusSelect
                  id="detail-job-status"
                  kind="job"
                  label={t("jobsV2.form.jobStatus", "Job status")}
                  value={job.status ?? "active"}
                  onChange={handleStatusChange}
                  busy={statusBusy}
                  error={statusError}
                />
                <Box>
                  <Typography sx={{ ...TYPE.label, mb: 0.75 }}>
                    {t("jobsV2.form.visibility", "Visibility")}
                  </Typography>
                  <StatusPill
                    kind="visibility"
                    value={job.is_published ? "published" : "draft"}
                  />
                  <Typography sx={{ ...TYPE.micro, mt: 0.75 }}>
                    {t(
                      "jobsV2.detail.visibilityHint",
                      "Change visibility from the edit form, so the audience is confirmed with it.",
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ ...TYPE.label, mb: 0.5 }}>
                    {t("jobsV2.form.closingDate", "Closing date")}
                  </Typography>
                  <Typography
                    sx={{
                      ...TYPE.bodyStrong,
                      color:
                        deadline?.urgency === "urgent" || deadline?.urgency === "past"
                          ? J.dangerFg
                          : deadline?.urgency === "soon"
                            ? J.warnFg
                            : J.ink,
                    }}
                  >
                    {deadline?.text ?? t("jobsV2.detail.noDeadline", "No closing date")}
                  </Typography>
                </Box>
              </Box>
            </JCard>

            <SectionHeader
              icon="mdi:account-filter-outline"
              title={t("jobsV2.audience.heading", "Who can see this job")}
              level="sub"
            />
            <AudiencePanel job={job} />

            <SectionHeader
              icon="mdi:account-check-outline"
              title={t("jobsV2.detail.eligibility", "Eligibility")}
              level="sub"
            />
            <EligibilityPanel job={job} />

            <SectionHeader
              icon="mdi:tag-multiple-outline"
              title={t("jobsV2.detail.skills", "Key skills")}
              level="sub"
            />
            <JCard sx={{ mb: 2 }}>
              {skills.length === 0 ? (
                <Typography sx={TYPE.micro}>
                  {t("jobsV2.detail.noSkills", "No skills recorded.")}
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {skills.map((skill) => (
                    <SkillChip key={skill}>{skill}</SkillChip>
                  ))}
                </Box>
              )}
            </JCard>

            <SectionHeader
              icon="mdi:shape-outline"
              title={t("jobsV2.detail.classification", "Classification")}
              level="sub"
            />
            <JCard sx={{ mb: 2 }}>
              <DefinitionList
                layout="columns"
                items={classification}
                emptyText={t("jobsV2.detail.nothingRecorded", "Nothing recorded here yet.")}
              />
            </JCard>

            {(job.jd_file_url || job.apply_link || jdUploadFailed) && (
              <>
                <SectionHeader
                  icon="mdi:link-variant"
                  title={t("jobsV2.detail.links", "Attachments and links")}
                  level="sub"
                />
                <JCard sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {jdUploadFailed && !job.jd_file_url && (
                      <Notice
                        tone="warn"
                        icon="mdi:file-alert-outline"
                        title={t(
                          "jobsV2.detail.jdFailedTitle",
                          "The job was created; the JD upload failed",
                        )}
                        body={t(
                          "jobsV2.detail.jdFailedBody",
                          "Everything else saved. Attach the PDF from the edit form whenever you are ready.",
                        )}
                        action={
                          <JButton
                            variant="quiet"
                            size="sm"
                            href={`/admin/jobs-v2/${job.id}/edit`}
                            startIcon="mdi:upload-outline"
                          >
                            {t("jobsV2.detail.jdFailedRetry", "Attach the JD")}
                          </JButton>
                        }
                        sx={{ mb: 0, borderRadius: R.inner }}
                      />
                    )}
                    {job.jd_file_url && (
                      <Box>
                        <Typography sx={{ ...TYPE.label, mb: 0.5 }}>
                          {t("jobsV2.detail.attachedJd", "Attached JD")}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          {/* J.ink3, never the app's error red: a decorative red PDF glyph
                              reads as a failed attachment. */}
                          <Box aria-hidden sx={{ color: J.ink3, display: "inline-flex" }}>
                            <IconWrapper icon="mdi:file-pdf-box" size={20} />
                          </Box>
                          <JButton
                            variant="quiet"
                            href={job.jd_file_url}
                            external
                            endIcon="mdi:open-in-new"
                          >
                            {t("jobsV2.detail.openJd", "Open the PDF")}
                          </JButton>
                        </Box>
                      </Box>
                    )}
                    {job.apply_link && (
                      <Box>
                        <Typography sx={{ ...TYPE.label, mb: 0.5 }}>
                          {t("jobsV2.detail.externalApply", "External apply link")}
                        </Typography>
                        <JButton
                          variant="quiet"
                          href={job.apply_link}
                          external
                          endIcon="mdi:open-in-new"
                          sx={{ maxWidth: "100%", "& span": { wordBreak: "break-all" } }}
                        >
                          {job.apply_link}
                        </JButton>
                      </Box>
                    )}
                  </Box>
                </JCard>
              </>
            )}
          </Box>
        </Box>

        <JConfirm
          open={deleteOpen}
          tone="danger"
          icon="mdi:delete-alert-outline"
          title={t("jobsV2.detail.deleteTitle", "Delete this job?")}
          body={job.job_title}
          consequences={[
            t("jobsV2.detail.deleteConsequenceApplicants", "{{count}} applicant record(s) go with it", {
              count: counts?.total ?? job.applications_count ?? 0,
            }),
            t(
              "jobsV2.detail.deleteConsequenceStudents",
              "It disappears from every student's board immediately",
            ),
            t("jobsV2.bulk.consequenceIrreversible"),
          ]}
          confirmLabel={t("jobsV2.detail.delete", "Delete this job")}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteOpen(false)}
          busy={deleting}
        />
      </JobsScope>
    </PageShell>
  );
}
