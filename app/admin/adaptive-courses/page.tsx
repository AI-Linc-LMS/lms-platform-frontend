"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PriceTag } from "@/components/common/PriceTag";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ManualCourseDialog } from "@/components/admin/adaptive-course/ManualCourseDialog";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import { Reveal } from "@/components/scorecard/shared";
import { ViewToggle, type ListView } from "@/components/common/list";
import {
  AssessmentFilterBar,
  AssessmentSectionHero,
  AiPromptField,
  SegmentedTabs,
  StatStrip,
  type SegmentedTab,
  type StatItem,
} from "@/components/admin/assessment/shared";
import {
  adminAdaptiveCourseService,
  type AdaptiveCourseJob,
  type AdminAdaptiveCourseListItem,
} from "@/lib/services/admin/admin-adaptive-course.service";

const POLL_INTERVAL_MS = 10000;
const ACTIVE_STATUSES = new Set(["pending", "generating_outline", "creating_structure", "generating_content"]);

export default function AdminAdaptiveCoursesPage() {
  const { push, prefetch } = useInstantNavigation();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<AdminAdaptiveCourseListItem[]>([]);
  const [jobs, setJobs] = useState<AdaptiveCourseJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminAdaptiveCourseListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ListView>("cards");
  const [brief, setBrief] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CourseTab>("all");

  const load = useCallback(async () => {
    try {
      const [courseList, jobList] = await Promise.all([
        adminAdaptiveCourseService.listCourses(),
        adminAdaptiveCourseService.listJobs(),
      ]);
      setCourses(courseList);
      setJobs(jobList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load adaptive courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll while any job is mid-generation so the list + progress stay live.
  const hasActiveJob = useMemo(() => jobs.some((j) => ACTIVE_STATUSES.has(j.status)), [jobs]);
  useEffect(() => {
    if (!hasActiveJob) return;
    const id = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasActiveJob, load]);

  const statItems: StatItem[] = useMemo(() => {
    const published = courses.filter((c) => c.is_published).length;
    let quizzes = 0;
    let coding = 0;
    let articles = 0;
    for (const c of courses) {
      quizzes += c.quiz_count;
      coding += c.coding_count ?? 0;
      articles += c.article_count ?? 0;
    }
    return [
      { label: "Courses", value: courses.length, icon: "mdi:book-multiple-outline", tone: "#6366f1" },
      { label: "Published", value: published, icon: "mdi:earth", tone: "#10b981" },
      { label: "Drafts", value: courses.length - published, icon: "mdi:file-document-edit-outline", tone: "#94a3b8" },
      { label: "Articles", value: articles, icon: "mdi:book-open-variant", tone: "#a855f7" },
      { label: "Adaptive quizzes", value: quizzes, icon: "mdi:tune-vertical", tone: "#ec4899" },
      { label: "Coding mentors", value: coding, icon: "mdi:robot-happy-outline", tone: "#0ea5e9" },
    ];
  }, [courses]);

  const courseTabs: SegmentedTab<CourseTab>[] = useMemo(() => {
    const published = courses.filter((c) => c.is_published).length;
    return [
      { value: "all", label: "All", count: courses.length },
      { value: "published", label: "Published", icon: "mdi:earth", count: published },
      { value: "drafts", label: "Drafts", icon: "mdi:file-document-edit-outline", count: courses.length - published },
    ];
  }, [courses]);

  const stats = useMemo(() => {
    const published = courses.filter((c) => c.is_published).length;
    let quizzes = 0;
    let coding = 0;
    for (const c of courses) {
      quizzes += c.quiz_count;
      coding += c.coding_count ?? 0;
    }
    return { total: courses.length, published, drafts: courses.length - published, quizzes, coding };
  }, [courses]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminAdaptiveCourseService.deleteCourse(pendingDelete.id);
      setCourses((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      showToast(`"${pendingDelete.title}" deleted.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't delete.", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  async function handlePublishToggle(course: AdminAdaptiveCourseListItem) {
    try {
      const res = await adminAdaptiveCourseService.publishCourse(course.id);
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, is_published: res.is_published } : c)),
      );
      showToast(res.is_published ? "Course published." : "Course unpublished.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update.", "error");
    }
  }

  const activeJobs = jobs.filter((j) => ACTIVE_STATUSES.has(j.status));

  const visibleCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (tab === "published" && !c.is_published) return false;
      if (tab === "drafts" && c.is_published) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
    });
  }, [courses, tab, search]);
  // Requests waiting on a super admin. Without a strip of their own these vanish: they are not
  // "active" (nothing is running) and there is no course yet, so an admin who just submitted one
  // sees an unchanged page and submits again.
  const awaitingJobs = jobs.filter((j) => j.status === "awaiting_approval");
  const rejectedJobs = jobs.filter((j) => j.status === "rejected");

  return (
    <PageShell>
      <AssessmentSectionHero
        chapter="CONTENT"
        title="Adaptive Course Builder"
        subtitle="Generate a course from a brief, or build one by hand from the verified bank."
        accent="violet"
        icon=""
        rightSlot={
          // One header action, like the assessment hub: the AI path lives in the band below,
          // so the button here is the manual one rather than two competing primaries.
          <HeaderActionButton icon="mdi:pencil-ruler" variant="ghost" onClick={() => setManualOpen(true)}>
            Build manually
          </HeaderActionButton>
        }
      />

      {/* AI composer band — same shape as the assessment hub. It files a REQUEST rather than
          starting a build, and says so: a full course is a large amount of generation and the
          model quota is shared, so a super admin approves the brief first. */}
      <Box
        sx={{
          mb: 3,
          position: "relative",
          overflow: "hidden",
          borderRadius: "22px",
          p: { xs: 3, md: 4 },
          color: "#fff",
          background:
            "linear-gradient(115deg, #2b1244 0%, #3d1663 45%, #6b1a52 82%, #7d2058 100%)",
          boxShadow: "0 28px 56px -28px rgba(61, 22, 99, 0.55)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.75,
                px: 1.25, py: 0.5, borderRadius: 999,
                background: "var(--gradient-ai)",
                fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", mb: 1.5,
              }}
            >
              <Icon icon="mdi:auto-fix" width={14} /> AI COURSE COMPOSER
            </Box>
            <Typography
              sx={{
                fontFamily: "var(--font-jakarta)", fontWeight: 800,
                fontSize: { xs: "1.5rem", md: "2rem" }, lineHeight: 1.15, mb: 1,
              }}
            >
              Describe it. We&apos;ll build the whole course.
            </Typography>
            <Typography sx={{ opacity: 0.9, maxWidth: 620, mb: 2.5 }}>
              Type a plain-English brief. The engine plans the weeks, writes the articles, and
              puts an adaptive quiz on every topic. A super admin approves the brief first —
              nothing is generated, and nothing is charged, until then.
            </Typography>
            <AiPromptField
              value={brief}
              onChange={setBrief}
              onSubmit={() =>
                push(
                  `/admin/adaptive-courses/generate?brief=${encodeURIComponent(brief.trim())}`,
                )
              }
              submitLabel="Continue"
              placeholder="e.g. 8-week Python course for absolute beginners, quiz + article per topic…"
              examples={[
                "8-week Python for absolute beginners · article + quiz per topic",
                "6-week SQL for analysts · heavy on practice problems",
                "4-week Excel refresher · short articles, no coding",
              ]}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em",
                opacity: 0.75, mb: 1.5,
              }}
            >
              OR START ANOTHER WAY
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {[
                { icon: "mdi:pencil-ruler", label: "Build manually", hint: "No AI, no waiting", onClick: () => setManualOpen(true) },
                { icon: "mdi:file-delimited-outline", label: "From a CSV plan", hint: "You supply the outline", onClick: () => push("/admin/adaptive-courses/generate?mode=csv") },
              ].map((b) => (
                <ButtonBase
                  key={b.label}
                  onClick={b.onClick}
                  sx={{
                    justifyContent: "flex-start", gap: 1.5, px: 2, py: 1.75,
                    borderRadius: 3, color: "#fff", textAlign: "left",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    "&:hover": { background: "rgba(255,255,255,0.14)" },
                  }}
                >
                  <Icon icon={b.icon} width={20} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>{b.label}</Typography>
                    <Typography sx={{ fontSize: "0.74rem", opacity: 0.75 }}>{b.hint}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Icon icon="mdi:chevron-right" width={18} />
                </ButtonBase>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {courses.length > 0 && (
        <Box data-tour-id="adaptive-courses-stats" sx={{ mb: 3 }}>
          <StatStrip items={statItems} />
        </Box>
      )}

          {(awaitingJobs.length > 0 || rejectedJobs.length > 0) && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
              {awaitingJobs.map((job) => (
                <Box
                  key={job.job_id}
                  sx={{
                    borderRadius: 4, p: 2.25,
                    bgcolor: "color-mix(in srgb, #f59e0b 8%, var(--card-bg))",
                    border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
                    display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
                  }}
                >
                  <Icon icon="mdi:clock-outline" width={20} style={{ color: "#f59e0b" }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 800 }}>{job.title}</Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                      Waiting for approval. A full course is a large amount of AI generation, so
                      one of our super admins reviews the brief before it is built. Nothing is
                      generated — and nothing is charged — until then.
                    </Typography>
                  </Box>
                </Box>
              ))}
              {rejectedJobs.map((job) => (
                <Box
                  key={job.job_id}
                  sx={{
                    borderRadius: 4, p: 2.25,
                    bgcolor: "color-mix(in srgb, #ef4444 7%, var(--card-bg))",
                    border: "1px solid color-mix(in srgb, #ef4444 32%, transparent)",
                    display: "flex", alignItems: "flex-start", gap: 1.5,
                  }}
                >
                  <Icon icon="mdi:close-circle-outline" width={20} style={{ color: "#ef4444" }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>{job.title} — not approved</Typography>
                    {/* The reviewer's reason, verbatim. A bare "rejected" just gets resubmitted. */}
                    <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                      {job.review_note || "No reason was given."}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Active generation jobs */}
          {activeJobs.length > 0 && (
            <Box data-tour-id="adaptive-courses-jobs" sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
              {activeJobs.map((job) => (
                <ButtonBase
                  key={job.job_id}
                  onMouseEnter={() => prefetch(`/admin/adaptive-courses/jobs/${job.job_id}`)}
                  onClick={() => push(`/admin/adaptive-courses/jobs/${job.job_id}`)}
                  sx={{
                    textAlign: "left",
                    display: "block",
                    borderRadius: 4,
                    p: 2.25,
                    bgcolor: "color-mix(in srgb, #6366f1 8%, var(--card-bg))",
                    border: "1px solid color-mix(in srgb, #6366f1 35%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Typography sx={{ fontWeight: 800 }}>
                      {job.title}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "#6366f1" }}>
                      {job.progress_percentage}%
                    </Typography>
                  </Box>
                  <ProgressBar pct={job.progress_percentage} />
                  <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mt: 0.75 }}>
                    {statusLabel(job.status)} · {job.completed_content_items}/{job.total_content_items} items
                  </Typography>
                </ButtonBase>
              ))}
            </Box>
          )}

          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading…
            </Typography>
          )}
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && courses.length === 0 && activeJobs.length === 0 && (
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                textAlign: "center",
                bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
              }}
            >
              <Icon icon="mdi:robot-outline" width={48} style={{ color: "#a855f7" }} />
              <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>
                No adaptive courses yet.
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 560, mx: "auto", lineHeight: 1.5 }}>
                Click <strong>Build manually</strong> to start from an empty course and add each
                module, topic and item by hand, pulling questions from the verified bank. Or click{" "}
                <strong>Generate adaptive course</strong> - describe the course, and the engine builds the
                module tree with an adaptive quiz per submodule.
              </Typography>
            </Box>
          )}

          {!loading && courses.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <SegmentedTabs<CourseTab> tabs={courseTabs} value={tab} onChange={setTab} />
                <Box data-tour-id="adaptive-courses-view">
                  <ViewToggle value={viewMode} onChange={setViewMode} />
                </Box>
              </Box>
              <AssessmentFilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by title or description…"
              />
            </Box>
          )}

          {!loading && courses.length > 0 && visibleCourses.length === 0 && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              No courses match {search.trim() ? `"${search.trim()}"` : "this filter"}.
            </Typography>
          )}

          {!loading && visibleCourses.length > 0 && viewMode === "cards" && (
            <Box
              data-tour-id="adaptive-courses-list"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              {visibleCourses.map((course, idx) => (
                <Reveal key={course.id} delay={Math.min(idx, 8) * 0.05}>
                  <CourseCard
                    course={course}
                    onOpen={() => push(`/admin/adaptive-courses/${course.id}`)}
                    onTogglePublish={() => void handlePublishToggle(course)}
                    onDelete={() => setPendingDelete(course)}
                  />
                </Reveal>
              ))}
            </Box>
          )}

          {!loading && visibleCourses.length > 0 && viewMode === "list" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {visibleCourses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  onOpen={() => push(`/admin/adaptive-courses/${course.id}`)}
                  onPrefetch={() => prefetch(`/admin/adaptive-courses/${course.id}`)}
                />
              ))}
            </Box>
          )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete adaptive course"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed from the library. Learner attempts on its quizzes stay intact - only the course goes away.`
            : ""
        }
        confirmText={deleting ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    
      <ManualCourseDialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onCreated={(courseId) => {
          setManualOpen(false);
          // Straight into the new course rather than back to the list: an empty course on a list
          // of populated ones is indistinguishable from a failed create.
          push(`/admin/adaptive-courses/${courseId}`);
        }}
      />
    </PageShell>
  );
}

function CourseCard({
  course,
  onOpen,
  onTogglePublish,
  onDelete,
}: {
  course: AdminAdaptiveCourseListItem;
  onOpen: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        p: 2.5,
        bgcolor: "color-mix(in srgb, var(--card-bg) 75%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
        {/* Two pills of the same family — status and price read together at a glance. */}
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.3,
              borderRadius: 999,
              fontSize: "0.66rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: course.is_published ? "#10b981" : "#94a3b8",
              bgcolor: course.is_published
                ? "color-mix(in srgb, #10b981 14%, transparent)"
                : "color-mix(in srgb, #94a3b8 16%, transparent)",
            }}
          >
            {course.is_published ? "Published" : "Draft"}
          </Box>
          <PriceTag
            isPaid={course.is_paid}
            price={course.price}
            currency={course.currency}
            withAmount
          />
        </Box>
        <ButtonBase onClick={onDelete} sx={{ p: 0.5, borderRadius: 2, color: "#ef4444" }}>
          <Icon icon="mdi:trash-can-outline" width={18} />
        </ButtonBase>
      </Box>

      {course.card_image_url && (
        <Box sx={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 2.5, overflow: "hidden", mb: 1.5, bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.card_image_url}
            alt={course.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: course.card_image_hidden ? 0.45 : 1 }}
          />
          {course.card_image_hidden && (
            <Box sx={{ position: "absolute", top: 6, left: 6, px: 0.9, py: 0.2, borderRadius: 999, fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "white", bgcolor: "rgba(15,23,42,0.72)", display: "flex", alignItems: "center", gap: 0.4 }}>
              <Icon icon="mdi:eye-off-outline" width={11} /> Hidden
            </Box>
          )}
        </Box>
      )}

      <ButtonBase onClick={onOpen} sx={{ textAlign: "left", display: "block", flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.3 }}>
          {course.title}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
          <Metric icon="mdi:view-module-outline" value={course.module_count} label="modules" />
          <Metric icon="mdi:file-tree-outline" value={course.submodule_count} label="submodules" />
          <Metric icon="mdi:book-open-variant" value={course.article_count} label="articles" />
          <Metric icon="mdi:tune-vertical" value={course.quiz_count} label="quizzes" />
          <Metric icon="mdi:robot-happy-outline" value={course.coding_count ?? 0} label="coding" />
          {(course.video_count ?? 0) > 0 && (
            <Metric icon="mdi:play-circle-outline" value={course.video_count ?? 0} label="videos" />
          )}
        </Box>
      </ButtonBase>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <ButtonBase
          onClick={onTogglePublish}
          sx={{
            flex: 1,
            py: 0.9,
            borderRadius: 999,
            fontWeight: 800,
            fontSize: "0.82rem",
            color: course.is_published ? "text.primary" : "white",
            background: course.is_published
              ? "color-mix(in srgb, var(--card-bg) 60%, transparent)"
              : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            border: course.is_published
              ? "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)"
              : "1px solid transparent",
          }}
        >
          {course.is_published ? "Unpublish" : "Publish"}
        </ButtonBase>
        <ButtonBase
          onClick={onOpen}
          sx={{
            flex: 1,
            py: 0.9,
            borderRadius: 999,
            fontWeight: 800,
            fontSize: "0.82rem",
            color: "#6366f1",
            border: "1px solid color-mix(in srgb, #6366f1 40%, transparent)",
          }}
        >
          Open
        </ButtonBase>
      </Box>
    </Box>
  );
}

function CourseRow({
  course,
  onOpen,
  onPrefetch,
}: {
  course: AdminAdaptiveCourseListItem;
  onOpen: () => void;
  onPrefetch: () => void;
}) {
  return (
    <Box
      onMouseEnter={onPrefetch}
      onClick={onOpen}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "all .15s",
        "&:hover": {
          borderColor: "#a855f7",
          boxShadow: "0 6px 16px -8px rgba(124,58,237,0.35)",
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
        }}
      >
        <Icon icon="mdi:robot-excited-outline" width={24} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {course.title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          {/* A real pill, not another "·" segment — price is a different kind of fact from a count. */}
          <PriceTag isPaid={course.is_paid} price={course.price} currency={course.currency} withAmount />
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {course.is_published ? "Published" : "Draft"} · {course.submodule_count} submodules · {course.article_count} articles
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={2.5} sx={{ display: { xs: "none", md: "flex" }, flexShrink: 0 }}>
        <RowStat value={course.module_count} label="modules" />
        <RowStat value={course.quiz_count} label="quizzes" />
        <RowStat value={course.coding_count ?? 0} label="coding" />
      </Stack>

      <Icon icon="mdi:chevron-right" width={22} style={{ color: "var(--font-tertiary)", flexShrink: 0 }} />
    </Box>
  );
}

function RowStat({ value, label }: { value: number; label: string }) {
  return (
    <Stack alignItems="center" spacing={0}>
      <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--font-primary)", lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography sx={{ color: "var(--font-tertiary)", fontSize: "0.68rem" }}>
        {label}
      </Typography>
    </Stack>
  );
}

function Metric({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Icon icon={icon} width={15} style={{ color: "#6366f1" }} />
      <Typography component="span" sx={{ fontWeight: 800, fontSize: "0.82rem" }}>
        {value}
      </Typography>
      <Typography component="span" sx={{ color: "text.secondary", fontSize: "0.76rem" }}>
        {label}
      </Typography>
    </Box>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <Box sx={{ mt: 1, height: 6, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 60%, transparent)", overflow: "hidden" }}>
      <Box
        sx={{
          height: "100%",
          width: `${Math.min(100, Math.max(2, pct))}%`,
          borderRadius: 999,
          background: "linear-gradient(90deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
          transition: "width 400ms ease",
        }}
      />
    </Box>
  );
}

export function statusLabel(status: string): string {
  switch (status) {
    case "awaiting_approval":
      return "Waiting for approval";
    case "rejected":
      return "Not approved";
    case "pending":
      return "Queued";
    case "generating_outline":
      return "Planning outline";
    case "creating_structure":
      return "Building structure";
    case "generating_content":
      return "Generating content";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

/** Tabs mirror the assessment hub: the whole set, then the two states that matter. */
type CourseTab = "all" | "published" | "drafts";
