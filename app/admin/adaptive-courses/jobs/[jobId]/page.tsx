"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  adminAdaptiveCourseService,
  type AdaptiveCourseJobDetail,
  type AdaptiveCourseJobLogEntry,
  type AdaptiveCourseJobStats,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { LiveGenerationBento } from "@/components/admin/adaptive-course/LiveGenerationBento";
import { statusLabel } from "../../page";

const POLL_INTERVAL_MS = 2000;
const ORDER = ["pending", "generating_outline", "creating_structure", "generating_content", "completed"];
const STEPS: Array<{ key: string; label: string; detail: string }> = [
  { key: "generating_outline", label: "Planning outline", detail: "Modules & submodules" },
  { key: "creating_structure", label: "Building structure", detail: "Course tree" },
  { key: "generating_content", label: "Generating content", detail: "Quizzes & articles per submodule" },
  { key: "completed", label: "Done", detail: "Every submodule has an adaptive quiz" },
];
const DIFF_COLOR: Record<string, string> = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };
type LogFilter = "all" | "Easy" | "Medium" | "Hard";

export default function AdaptiveCourseJobPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const jobId = String(params.jobId);
  const [job, setJob] = useState<AdaptiveCourseJobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showRawLog, setShowRawLog] = useState(false);

  const load = useCallback(async () => {
    try {
      setJob(await adminAdaptiveCourseService.getJob(jobId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load job.");
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminAdaptiveCourseService.getJob(jobId);
        if (!cancelled) setJob(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load job.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const isActive = job ? !["completed", "failed"].includes(job.status) : true;
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isActive, load]);

  const currentIdx = job ? ORDER.indexOf(job.status) : 0;
  // A job whose question count hasn't moved for a while while still "active" has
  // stalled — almost always an interrupted worker. We detect this on an interval
  // (wall-clock reads belong outside render), recording the last time progress
  // changed in a ref and flipping `stalled` from the timer callback only.
  const STALL_MS = 90_000;
  const [stalled, setStalled] = useState(false);
  const progressRef = useRef<{ p: number; at: number }>({ p: -1, at: 0 });

  useEffect(() => {
    if (!job) return;
    // Track overall items completed (advances for every content type), not just
    // questions — a video/article-only run generates zero questions but still
    // makes progress, and must not be flagged as stalled.
    const p = job.completed_content_items;
    if (p !== progressRef.current.p) {
      progressRef.current = { p, at: Date.now() };
    }
  }, [job]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      const { at } = progressRef.current;
      setStalled(at > 0 && Date.now() - at > STALL_MS);
    }, 5000);
    return () => clearInterval(id);
  }, [isActive]);

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => push("/admin/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Course Builder
        </ButtonBase>

        <AdaptiveSectionShell>
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {job && (
            <>
              <AdaptiveSectionHero
                chapter={job.status === "failed" ? "Generation failed" : "Building adaptive content"}
                title={job.title}
                subtitle={`${statusLabel(job.status)} · ${job.completed_content_items}/${job.total_content_items} submodules`}
                icon={job.status === "failed" ? "mdi:alert-circle-outline" : "mdi:robot-excited-outline"}
                accent={job.status === "failed" ? "pink" : "purple"}
                rightSlot={
                  job.status === "completed" && job.generated_course_id ? (
                    <ButtonBase
                      onClick={() => push(`/admin/adaptive-courses/${job.generated_course_id}`)}
                      sx={{
                        px: 3, py: 1.3, borderRadius: 999, fontWeight: 800, color: "white", gap: 0.6,
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      }}
                    >
                      <Icon icon="mdi:open-in-new" width={16} />
                      Open course
                    </ButtonBase>
                  ) : undefined
                }
              />

              <StatsRail stats={job.stats} status={job.status} percent={job.progress_percentage} stalled={stalled} />

              {stalled && isActive && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 3, display: "flex", gap: 1.25, alignItems: "flex-start",
                  bgcolor: "color-mix(in srgb, #f59e0b 10%, var(--card-bg))", border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)" }}>
                  <Icon icon="mdi:alert" width={20} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>Generation has stalled</Typography>
                    <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.5 }}>
                      No new content for over a minute while the job is still marked in-progress — the Celery worker was
                      likely restarted mid-run. The {job.completed_content_items} item{job.completed_content_items === 1 ? "" : "s"} already generated are saved.
                      Delete this draft course and re-generate to finish cleanly.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Compact step strip */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 3, mb: 2.5 }}>
                {STEPS.map((step) => {
                  const stepIdx = ORDER.indexOf(step.key);
                  const done = currentIdx > stepIdx || job.status === "completed";
                  const active = job.status === step.key;
                  return (
                    <Box key={step.key} sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.25, py: 0.6, borderRadius: 999,
                      bgcolor: active ? "color-mix(in srgb, #a855f7 14%, var(--card-bg))" : done ? "color-mix(in srgb, #10b981 12%, var(--card-bg))" : "color-mix(in srgb, var(--card-bg) 55%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)" }}>
                      <Icon icon={done ? "mdi:check-circle" : active ? "mdi:loading" : "mdi:circle-outline"} width={15}
                        className={active ? "acb-spin" : ""} style={{ color: done ? "#10b981" : active ? "#a855f7" : "#94a3b8" }} />
                      <Typography sx={{ fontWeight: 800, fontSize: "0.78rem" }}>{step.label}</Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* ✨ The magic — live word-by-word generation in bento cards */}
              <LiveGenerationBento log={job.log} tree={job.tree} skills={job.skills} active={isActive} />

              {job.error_log.length > 0 && (
                <Box sx={{ mt: 2.5, borderRadius: 3, p: 2, bgcolor: "color-mix(in srgb, #ef4444 8%, var(--card-bg))", border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)" }}>
                  <Typography sx={{ fontWeight: 800, color: "#ef4444", mb: 1, fontSize: "0.9rem" }}>Issues</Typography>
                  {job.error_log.map((entry, i) => (
                    <Typography key={i} sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 0.5 }}>
                      [{entry.type}] {entry.message}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Raw terminal log — kept for power users (difficulty filter + autoscroll) */}
              <Box sx={{ mt: 3 }}>
                <ButtonBase
                  onClick={() => setShowRawLog((v) => !v)}
                  sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontWeight: 800, fontSize: "0.8rem" }}
                >
                  <Icon icon="mdi:console" width={16} />
                  {showRawLog ? "Hide raw log" : "Show raw log"}
                  <Icon icon={showRawLog ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />
                </ButtonBase>
                {showRawLog && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.75, mb: 1 }}>
                      {(["all", "Easy", "Medium", "Hard"] as LogFilter[]).map((f) => {
                        const active = logFilter === f;
                        const color = f === "all" ? "#6366f1" : DIFF_COLOR[f];
                        return (
                          <ButtonBase key={f} onClick={() => setLogFilter(f)}
                            sx={{ px: 1.1, py: 0.35, borderRadius: 999, fontWeight: 800, fontSize: "0.68rem",
                              color: active ? "white" : color, bgcolor: active ? color : `color-mix(in srgb, ${color} 12%, transparent)` }}>
                            {f === "all" ? "All" : f}
                          </ButtonBase>
                        );
                      })}
                      <ButtonBase onClick={() => setAutoScroll((v) => !v)} title="Auto-scroll"
                        sx={{ px: 0.6, py: 0.35, borderRadius: 999, color: autoScroll ? "#6366f1" : "#94a3b8" }}>
                        <Icon icon={autoScroll ? "mdi:arrow-down-bold-circle" : "mdi:arrow-down-bold-circle-outline"} width={18} />
                      </ButtonBase>
                    </Box>
                    <GenerationLog entries={job.log} active={isActive} filter={logFilter} autoScroll={autoScroll} />
                  </Box>
                )}
              </Box>
            </>
          )}
        </AdaptiveSectionShell>
      </Container>
      <style jsx global>{`
        @keyframes acb-spin { to { transform: rotate(360deg); } }
        .acb-spin { animation: acb-spin 0.9s linear infinite; }
        @keyframes acb-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </MainLayout>
  );
}

function fmtElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function StatsRail({ stats, status, percent, stalled }: { stats: AdaptiveCourseJobStats; status: string; percent: number; stalled: boolean }) {
  const qPlanned = stats.questions_planned;
  const qDone = stats.questions_generated;
  // Quizzes give the finest live signal (per-question); when a run has no quiz,
  // fall back to overall submodule progress with a neutral label rather than
  // showing a misleading "Questions 0" bar.
  const hasQuiz = qPlanned > 0;
  const barTitle = hasQuiz ? "Questions" : "Progress";
  const barValue = hasQuiz
    ? `${qDone} / ~${qPlanned}`
    : `${stats.submodules_done} / ${stats.submodules_total}`;
  const qPct = hasQuiz ? Math.min(100, Math.round((qDone / qPlanned) * 100)) : percent;
  const live = !["completed", "failed"].includes(status);
  return (
    <Box>
      {/* Finest available live signal: per-question for quiz runs, else submodule % */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
          {barTitle}
          {live && stalled && (
            <Box component="span" sx={{ ml: 1, fontSize: "0.7rem", fontWeight: 800, color: "#f59e0b" }}>
              <Box component="span" sx={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", bgcolor: "#f59e0b", mr: 0.5 }} />
              STALLED
            </Box>
          )}
          {live && !stalled && (
            <Box component="span" sx={{ ml: 1, fontSize: "0.7rem", fontWeight: 800, color: "#10b981" }}>
              <Box component="span" sx={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", bgcolor: "#10b981", mr: 0.5, animation: "acb-pulse 1.2s ease-in-out infinite" }} />
              LIVE
            </Box>
          )}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#a855f7" }}>
          {barValue}
        </Typography>
      </Box>
      <Box sx={{ height: 8, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 60%, transparent)", overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${Math.max(2, qPct)}%`, background: "linear-gradient(90deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)", transition: "width 500ms ease" }} />
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(7, 1fr)" }, gap: 1.5, mt: 2 }}>
        <StatCard label="Submodules" value={`${stats.submodules_done} / ${stats.submodules_total}`} accent="#6366f1" icon="mdi:file-tree-outline" />
        <StatCard label="Questions" value={qPlanned > 0 ? `${qDone} / ~${qPlanned}` : `${qDone}`} accent="#a855f7" icon="mdi:help-box-multiple-outline" />
        <StatCard label="Articles" value={`${stats.articles_generated ?? 0}`} accent="#10b981" icon="mdi:book-open-variant" />
        <StatCard label="Coding" value={`${stats.coding_generated ?? 0}`} accent="#ec4899" icon="mdi:robot-happy-outline" />
        <StatCard label="Videos" value={`${stats.videos_generated ?? 0}`} accent="#6366f1" icon="mdi:play-circle-outline" />
        <StatCard label="Elapsed" value={fmtElapsed(stats.elapsed_seconds)} accent="#f59e0b" icon="mdi:timer-outline" />
        <DifficultyCard byDifficulty={stats.by_difficulty} />
      </Box>
    </Box>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: string }) {
  return (
    <Box sx={{ borderRadius: 3, p: 1.5, bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)", border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <Icon icon={icon} width={15} style={{ color: accent }} />
        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 900, fontSize: "1.15rem" }}>{value}</Typography>
    </Box>
  );
}

function DifficultyCard({ byDifficulty }: { byDifficulty: Record<string, number> }) {
  const order: Array<keyof typeof DIFF_COLOR> = ["Easy", "Medium", "Hard"];
  return (
    <Box sx={{ borderRadius: 3, p: 1.5, bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)", border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)" }}>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.6 }}>
        By difficulty
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {order.map((d) => (
          <Box key={d} sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: DIFF_COLOR[d] }} />
            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem" }}>{byDifficulty[d] ?? 0}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Terminal-style feed that types out each generated MCQ question as it lands —
 * the "AI is writing it" effect. Accumulates by MCQ id so lines never re-type
 * or vanish when the polled window shifts. The difficulty filter is applied at
 * render time so the typewriter keeps advancing through the full stream.
 */
function GenerationLog({
  entries,
  active,
  filter,
  autoScroll,
}: {
  entries: AdaptiveCourseJobLogEntry[];
  active: boolean;
  filter: LogFilter;
  autoScroll: boolean;
}) {
  const [shown, setShown] = useState<AdaptiveCourseJobLogEntry[]>([]);
  const [finished, setFinished] = useState(0);
  // Typed text keyed to the entry key so a stale partial never lands on a new line.
  const [typed, setTyped] = useState<{ key: string; text: string }>({ key: "", text: "" });
  const seenRef = useRef<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fresh = entries.filter((e) => !seenRef.current.has(e.key));
    if (fresh.length === 0) return;
    fresh.forEach((e) => seenRef.current.add(e.key));
    setShown((prev) => [...prev, ...fresh]);
  }, [entries]);

  useEffect(() => {
    const current = shown[finished];
    if (!current) return;
    const target = current.text;
    const charMs = 1000 / 90;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      // If the feed has fallen behind (generated faster than we type), instantly
      // mark the backlog done and only animate the newest line — keeps the log
      // honest so it stops the moment generation stops.
      if (shown.length - finished > 3) {
        setFinished(shown.length - 1);
        return;
      }
      const n = Math.min(target.length, Math.floor((performance.now() - start) / charMs));
      setTyped({ key: current.key, text: target.slice(0, n) });
      if (n < target.length) raf = requestAnimationFrame(tick);
      else setTimeout(() => setFinished((f) => f + 1), 110);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, finished]);

  useEffect(() => {
    if (autoScroll) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [typed, finished, autoScroll]);

  const matches = (e: AdaptiveCourseJobLogEntry) => filter === "all" || e.difficulty === filter;
  const doneLines = shown.slice(0, finished).filter(matches);
  const current = shown[finished];
  const currentText = current && typed.key === current.key ? typed.text : "";
  const totalShown = doneLines.length + (current && matches(current) ? 1 : 0);

  return (
    <Box
      ref={scrollRef}
      sx={{
        borderRadius: 3, p: 2, minHeight: 300, maxHeight: 480, overflowY: "auto",
        bgcolor: "#0b1020", border: "1px solid color-mix(in srgb, #6366f1 30%, transparent)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.78rem", lineHeight: 1.6,
      }}
    >
      {totalShown === 0 && (
        <Typography sx={{ color: "#64748b", fontFamily: "inherit", fontSize: "inherit" }}>
          {active ? "Waiting for the engine to start writing…" : "Nothing to show for this filter."}
        </Typography>
      )}
      {doneLines.map((e) => (
        <LogLine key={e.key} entry={e} text={e.text} done />
      ))}
      {current && matches(current) && <LogLine entry={current} text={currentText} />}
    </Box>
  );
}

function LogLine({ entry, text, done }: { entry: AdaptiveCourseJobLogEntry; text: string; done?: boolean }) {
  const isArticle = entry.kind === "article";
  const isCoding = entry.kind === "coding";
  const isVideo = entry.kind === "video";
  const dColor = isArticle ? "#a855f7" : isCoding ? "#ec4899" : isVideo ? "#6366f1" : DIFF_COLOR[entry.difficulty] ?? "#94a3b8";
  const tag = isArticle
    ? `article·${entry.title || ""}`.slice(0, 28)
    : isCoding
      ? `coding·${entry.difficulty}`
      : isVideo
        ? `video·${entry.title || ""}`.slice(0, 28)
        : `${entry.skill || "general"}·${entry.difficulty}`;
  return (
    <Box sx={{ mb: 0.75, display: "flex", gap: 0.75, alignItems: "flex-start" }}>
      <Box component="span" sx={{ color: done ? "#10b981" : "#a855f7", flexShrink: 0 }}>
        {done ? "✓" : "✎"}
      </Box>
      <Box component="span" sx={{ color: dColor, flexShrink: 0, fontSize: "0.7rem", pt: "1px", fontWeight: 700 }}>
        [{tag}]
      </Box>
      <Box component="span" sx={{ color: "#e2e8f0", wordBreak: "break-word" }}>
        {text}
        {!done && (
          <Box component="span" aria-hidden sx={{ display: "inline-block", width: "0.5em", ml: 0.3, borderRight: "1.5px solid #a855f7", animation: "acb-blink 0.9s steps(2) infinite" }} />
        )}
      </Box>
      <style jsx global>{`
        @keyframes acb-blink { 0%, 49% { border-right-color: #a855f7; } 50%, 100% { border-right-color: transparent; } }
      `}</style>
    </Box>
  );
}
