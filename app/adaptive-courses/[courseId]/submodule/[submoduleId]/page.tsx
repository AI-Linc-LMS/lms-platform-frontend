"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Button, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type AdaptiveCourseSubModule,
  type PointsBreakdownItem,
  type PointsKind,
  type SubmodulePointsBreakdown,
} from "@/lib/services/adaptive-course.service";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdditionalPractice } from "@/components/adaptive-journey/AdditionalPractice";
import { PointsInfo } from "@/components/common/PointsInfo";
import { AdaptiveSubmoduleSkeleton } from "@/components/courses/CourseSkeletons";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

type FlowKind = "video" | "article" | "quiz" | "coding";
type StepStatus = "done" | "current" | "upcoming";

interface FlowItem {
  kind: FlowKind;
  key: string;
  /** Matches the points-breakdown content_key (`kind:id`) so each row can show its points. */
  contentKey: string;
  title: string;
  chips: { icon: string; text: string }[];
  onClick: () => void;
  /** Destination URL — used to prefetch the route on hover for instant open. */
  href: string;
  completed: boolean;
  /** Where "Review" goes once completed (e.g. past quiz results); falls back to onClick. */
  onReview?: () => void;
  reviewHref?: string;
}

// "% correct"-style factor only means something for graded/timed content; articles are flat.
const KIND_CORRECTNESS: Partial<Record<PointsKind, string>> = {
  quiz: "correct", coding: "tests passed", video: "watched",
};

const VERB: Record<FlowKind, string> = { video: "watch", article: "read", quiz: "quiz", coding: "practice" };
const KIND_ORDER: FlowKind[] = ["video", "article", "quiz", "coding"];

/** Per-content-type identity — same palette family as the course timeline nodes. */
const FLOW_META: Record<FlowKind, { label: string; icon: string; action: string; actionIcon: string; color: string; bg: string }> = {
  video: { label: "WATCH", icon: "mdi:play-circle", action: "Watch", actionIcon: "mdi:play", color: "#0ea5e9", bg: "#e0f2fe" },
  article: { label: "READ", icon: "mdi:book-open-page-variant", action: "Read", actionIcon: "mdi:book-open-page-variant-outline", color: "#a855f7", bg: "#f5f3ff" },
  quiz: { label: "QUIZ", icon: "mdi:tune-vertical", action: "Start", actionIcon: "mdi:play", color: "#6366f1", bg: "#eef2ff" },
  coding: { label: "PRACTICE", icon: "mdi:code-tags", action: "Solve", actionIcon: "mdi:code-tags", color: "#ec4899", bg: "#fdf2f8" },
};

function buildItems(
  sm: AdaptiveCourseSubModule,
  courseId: number,
  submoduleId: number,
  nav: (href: string) => void,
): FlowItem[] {
  const items: FlowItem[] = [];
  (sm.video_companions ?? []).forEach((vc) => {
    const href = `/adaptive-courses/${courseId}/submodule/${submoduleId}/video/${vc.id}`;
    items.push({
      kind: "video", key: `v${vc.id}`, contentKey: `video:${vc.id}`, title: vc.title, completed: !!vc.completed,
      chips: [
        ...(vc.duration_seconds > 0 ? [{ icon: "mdi:clock-outline", text: `~${Math.round(vc.duration_seconds / 60)} min` }] : []),
        ...(vc.check_in_count > 0 ? [{ icon: "mdi:lightning-bolt", text: `${vc.check_in_count} check-ins` }] : []),
      ],
      href, onClick: () => nav(href),
    });
  });
  sm.articles.forEach((a) => {
    const href = `/adaptive-courses/${courseId}/submodule/${submoduleId}/article/${a.article_id}`;
    items.push({
      kind: "article", key: `a${a.article_id}`, contentKey: `article:${a.article_id}`, title: a.title, completed: !!a.completed,
      chips: [
        { icon: "mdi:clock-outline", text: `~${a.reading_time_minutes} min` },
        { icon: "mdi:tune-vertical", text: `${a.default_tier} · adapts` },
      ],
      href, onClick: () => nav(href),
    });
  });
  sm.quizzes.forEach((q) => {
    const href = `/adaptive-quizzes/start?configId=${q.config_id}`;
    const reviewHref = q.last_session_id ? `/adaptive-quizzes/session/${q.last_session_id}/results` : undefined;
    items.push({
      kind: "quiz", key: `q${q.config_id}`, contentKey: `quiz:${q.config_id}`, title: q.quiz_title, completed: !!q.completed,
      chips: [
        { icon: "mdi:database-outline", text: `${q.mcq_count}-item bank` },
        { icon: "mdi:arrow-decision-outline", text: `serves ${q.min_questions}–${q.max_questions}` },
        ...q.target_skills.slice(0, 2).map((s) => ({ icon: "mdi:tag-outline", text: s })),
      ],
      href, onClick: () => nav(href),
      // Completed → open the last attempt's results instead of restarting.
      reviewHref, onReview: reviewHref ? () => nav(reviewHref) : undefined,
    });
  });
  (sm.coding_sets ?? []).forEach((set) =>
    set.problems.forEach((p) => {
      const href = `/adaptive-courses/${courseId}/submodule/${submoduleId}/coding/${p.problem_id}?configId=${set.config_id}`;
      items.push({
        kind: "coding", key: `c${p.problem_id}`, contentKey: `coding:${p.problem_id}`, title: p.title, completed: !!p.completed,
        chips: [
          { icon: "mdi:speedometer", text: p.difficulty_level },
          ...p.target_skills.slice(0, 2).map((s) => ({ icon: "mdi:tag-outline", text: s })),
        ],
        href, onClick: () => nav(href),
      });
    }),
  );
  return items;
}

export default function AdaptiveCourseSubmodulePage() {
  const { push, prefetch } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const [submodule, setSubmodule] = useState<AdaptiveCourseSubModule | null>(null);
  const [points, setPoints] = useState<SubmodulePointsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null);  // server-enforced journey lock reason

  useEffect(() => {
    if (!Number.isFinite(courseId) || !Number.isFinite(submoduleId)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCourseService.getSubmodule(courseId, submoduleId);
        if (!cancelled) setSubmodule(data);
      } catch (e) {
        if (cancelled) return;
        const resp = (e as { response?: { status?: number; data?: { locked?: boolean; detail?: string } } })?.response;
        if (resp?.status === 403 && resp?.data?.locked) {
          setLocked(resp.data.detail || "Complete the calibration assessment first.");
        } else {
          setError(e instanceof Error ? e.message : "Failed to load submodule.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, submoduleId]);

  // Per-content points (best-effort) — surfaced inline on each learning-path row.
  useEffect(() => {
    if (!Number.isFinite(courseId) || !Number.isFinite(submoduleId)) return;
    let cancelled = false;
    adaptiveCourseService.getSubmodulePoints(courseId, submoduleId)
      .then((d) => { if (!cancelled) setPoints(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [courseId, submoduleId]);

  const pointsByKey = useMemo(
    () => new Map((points?.items ?? []).map((i) => [i.content_key, i])),
    [points],
  );

  const items = useMemo(
    () => (submodule ? buildItems(submodule, courseId, submoduleId, push) : []),
    [submodule, courseId, submoduleId, push],
  );

  const meta = useMemo(() => {
    if (!submodule) return { counts: {} as Record<FlowKind, number>, estMin: 0 };
    const counts: Record<FlowKind, number> = { video: 0, article: 0, quiz: 0, coding: 0 };
    items.forEach((i) => { counts[i.kind] += 1; });
    let estMin = 0;
    (submodule.video_companions ?? []).forEach((v) => { estMin += Math.round((v.duration_seconds || 0) / 60); });
    submodule.articles.forEach((a) => { estMin += a.reading_time_minutes || 0; });
    submodule.quizzes.forEach((q) => { estMin += Math.round(((q.min_questions + q.max_questions) / 2) * 0.75); });
    (submodule.coding_sets ?? []).forEach((s) => s.problems.forEach(() => { estMin += 15; }));
    return { counts, estMin };
  }, [submodule, items]);

  // Progress: first incomplete step = "current"; everything before it that's done = "done".
  const doneCount = items.filter((i) => i.completed).length;
  const firstIncomplete = items.findIndex((i) => !i.completed);
  const allDone = items.length > 0 && firstIncomplete < 0;
  const resumeIdx = allDone ? 0 : firstIncomplete;

  const metaPills: { icon: string; label: string }[] = submodule
    ? [
        { icon: "mdi:map-marker-path", label: `${items.length} step${items.length === 1 ? "" : "s"}` },
        ...(doneCount ? [{ icon: "mdi:check-circle-outline", label: `${doneCount}/${items.length} done` }] : []),
        ...(meta.counts.video ? [{ icon: "mdi:play-circle-outline", label: `${meta.counts.video} video${meta.counts.video > 1 ? "s" : ""}` }] : []),
        ...(meta.counts.article ? [{ icon: "mdi:book-open-variant", label: `${meta.counts.article} article${meta.counts.article > 1 ? "s" : ""}` }] : []),
        ...(meta.counts.quiz ? [{ icon: "mdi:tune-variant", label: `${meta.counts.quiz} quiz${meta.counts.quiz > 1 ? "zes" : ""}` }] : []),
        ...(meta.counts.coding ? [{ icon: "mdi:code-tags", label: `${meta.counts.coding} coding` }] : []),
        ...(meta.estMin ? [{ icon: "mdi:clock-outline", label: `~${meta.estMin} min` }] : []),
      ]
    : [];

  // Dynamic path subtitle — reflects the steps + progress + the actual content sequence.
  const flowVerbs = KIND_ORDER.filter((k) => (meta.counts[k] ?? 0) > 0).map((k) => VERB[k]);
  const pathSubtitle =
    `${items.length} step${items.length === 1 ? "" : "s"}` +
    (doneCount ? ` · ${doneCount} done` : "") +
    (flowVerbs.length ? ` · ${flowVerbs.join(" → ")}` : "");

  const ctaLabel = allDone ? "Review topic" : doneCount > 0 ? "Continue learning" : "Start learning";

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        {loading && <AdaptiveSubmoduleSkeleton />}
        {error && (
          <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 6 }}>{error}</Typography>
        )}
        {locked && (
          <Box sx={{ textAlign: "center", py: 8, px: 2, maxWidth: 520, mx: "auto" }}>
            <Box sx={{ width: 56, height: 56, mx: "auto", mb: 1.5, borderRadius: "50%", display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
              <Icon icon="mdi:lock-outline" width={28} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>This step is locked</Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.75, lineHeight: 1.5 }}>{locked}</Typography>
            <ButtonBase
              onMouseEnter={() => prefetch(`/adaptive-courses/${courseId}`)}
              onClick={() => push(`/adaptive-courses/${courseId}`)}
              sx={{ mt: 2.5, px: 2.5, py: 1, borderRadius: 999, fontWeight: 800, color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
            >
              Go to course
            </ButtonBase>
          </Box>
        )}

        {submodule && (
          <>
            {/* Gradient hero — matches the course page */}
            <Box sx={{ borderRadius: 5, p: { xs: 2.5, md: 3.5 }, mb: 2.5, color: "white", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #c026d3 100%)", boxShadow: "0 24px 60px -28px rgba(124,58,237,0.6)" }}>
              <ButtonBase onMouseEnter={() => prefetch(`/adaptive-courses/${courseId}`)} onClick={() => push(`/adaptive-courses/${courseId}`)} sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", mb: 1, gap: 0.5 }}>
                <Icon icon="mdi:arrow-left" width={14} /> Back to course
              </ButtonBase>
              <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
                <Box sx={{ px: 1, py: 0.4, borderRadius: 999, fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.5, color: "white", bgcolor: "rgba(255,255,255,0.18)" }}>TOPIC</Box>
                {allDone && (
                  <Stack direction="row" spacing={0.4} alignItems="center" sx={{ px: 1, py: 0.4, borderRadius: 999, fontSize: "0.66rem", fontWeight: 800, color: "white", bgcolor: "rgba(34,197,94,0.32)" }}>
                    <Icon icon="mdi:check-circle" width={13} /> COMPLETED
                  </Stack>
                )}
              </Stack>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2rem" }, lineHeight: 1.15 }}>{submodule.title}</Typography>
              {submodule.description && (
                <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.82)", mt: 1, maxWidth: { xs: "100%", md: 1100 }, lineHeight: 1.5 }}>{submodule.description}</Typography>
              )}
              <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 1.75 }}>
                {metaPills.map((m) => (
                  <Stack key={m.label} direction="row" spacing={0.5} alignItems="center" sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>
                    <Icon icon={m.icon} width={15} />
                    {m.label}
                  </Stack>
                ))}
              </Stack>
              {items.length > 0 && (
                <Button onClick={() => items[resumeIdx].onClick()} variant="contained"
                  endIcon={<Icon icon="mdi:arrow-right" width={18} />}
                  sx={{ mt: 2.25, px: 2.5, py: 1, borderRadius: 2, fontWeight: 800, fontSize: "0.85rem", color: "#7c3aed", bgcolor: "white", textTransform: "none", "&:hover": { bgcolor: "#f5f3ff" } }}>
                  {ctaLabel}
                </Button>
              )}
            </Box>

            {items.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center", borderRadius: 4, border: "1px dashed var(--border-default, #ececf1)" }}>
                <Icon icon="mdi:inbox-outline" width={40} style={{ opacity: 0.4 }} />
                <Typography sx={{ color: "text.secondary", mt: 1 }}>No content in this topic yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ minWidth: 0 }}>
                {/* Section header with gradient badge + the topic points total */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.75, gap: 1, flexWrap: "wrap" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", boxShadow: "0 8px 18px -10px rgba(124,58,237,0.6)" }}>
                      <Icon icon="mdi:map-marker-path" width={19} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>Your learning path</Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>{pathSubtitle}</Typography>
                    </Box>
                  </Stack>
                  {points && (
                    <Stack direction="row" spacing={0.6} alignItems="center" sx={{ pl: 1.25, pr: 0.5, py: 0.5, borderRadius: 999, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
                      <Icon icon="mdi:trophy" width={15} color="#f59e0b" />
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#9a3412" }}>
                        {points.topic.earned}<Box component="span" sx={{ color: "#c2853a", fontWeight: 700 }}> / {points.topic.on_offer} pts</Box>
                      </Typography>
                      <PointsInfo size={14} color="#c2853a" />
                    </Stack>
                  )}
                </Stack>

                <Box>
                  {items.map((it, idx) => (
                    <PathRow
                      key={it.key}
                      item={it}
                      step={idx + 1}
                      last={idx === items.length - 1}
                      status={it.completed ? "done" : idx === firstIncomplete ? "current" : "upcoming"}
                      points={pointsByKey.get(it.contentKey)}
                      onPrefetch={() => prefetch(it.completed && it.reviewHref ? it.reviewHref : it.href)}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Additional Practice — learner-generated extra content (no points) */}
            <AdditionalPractice courseId={courseId} submoduleId={submoduleId} />
          </>
        )}
      </Box>
    </MainLayout>
  );
}

function FactorChip({ text, tone = "muted" }: { text: string; tone?: "muted" | "warn" | "good" }) {
  const s =
    tone === "good" ? { color: "#15803d", bgcolor: "#dcfce7" }
    : tone === "warn" ? { color: "#b45309", bgcolor: "#fef3c7" }
    : { color: "#475569", bgcolor: "#f1f5f9" };
  return <Box component="span" sx={{ px: 0.75, py: 0.2, borderRadius: 999, fontSize: "0.64rem", fontWeight: 700, ...s }}>{text}</Box>;
}

/** Inline "how these points were earned" chips — base → time → accuracy → late → weight = earned. */
function PointsFactors({ item }: { item: PointsBreakdownItem }) {
  const b = item.breakdown;
  if (!b) return null;
  const factors: { text: string; tone?: "muted" | "warn" | "good" }[] = [{ text: `${b.base} base` }];
  if (b.after_decay < b.base) factors.push({ text: `time −${Math.round(b.base - b.after_decay)}`, tone: "warn" });
  const accLabel = KIND_CORRECTNESS[item.kind];
  if (accLabel) factors.push({ text: `${Math.round(b.correctness_factor * 100)}% ${accLabel}` });
  if (b.late_penalty_mult < 1) factors.push({ text: `late −${Math.round((1 - b.late_penalty_mult) * 100)}%`, tone: "warn" });
  if (b.weight > 1) factors.push({ text: `×${b.weight} weight` });
  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap alignItems="center" sx={{ gap: 0.5, mt: 0.85 }}>
      {factors.map((f, i) => (
        <Box key={i} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
          {i > 0 && <Icon icon="mdi:chevron-right" width={11} color="#cbd5e1" />}
          <FactorChip text={f.text} tone={f.tone} />
        </Box>
      ))}
      <Icon icon="mdi:equal" width={11} color="#cbd5e1" style={{ marginLeft: 1 }} />
      <FactorChip text={`${item.earned} pts`} tone="good" />
    </Stack>
  );
}

function PathRow({ item, step, last, status, points, onPrefetch }: { item: FlowItem; step: number; last: boolean; status: StepStatus; points?: PointsBreakdownItem; onPrefetch?: () => void }) {
  const m = FLOW_META[item.kind];
  const done = status === "done";
  const current = status === "current";
  // When done, "Review" (and tapping the card) opens past results where available,
  // instead of restarting the activity.
  const reviewAction = item.onReview ?? item.onClick;
  const cardAction = done ? reviewAction : item.onClick;

  // Status marker — mirrors the course timeline: green check (done), indigo ring
  // (current), light numbered (upcoming).
  const marker = done ? (
    <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#22c55e", color: "white", flexShrink: 0, zIndex: 1 }}>
      <Icon icon="mdi:check" width={16} />
    </Box>
  ) : current ? (
    <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#6366f1", color: "white", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0, zIndex: 1, boxShadow: "0 0 0 4px rgba(99,102,241,0.18)" }}>
      {step}
    </Box>
  ) : (
    <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#e2e8f0", color: "#64748b", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0, zIndex: 1 }}>
      {step}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", gap: 1.75, alignItems: "stretch" }}>
      {/* timeline rail — marker vertically centred on the card, continuous line behind */}
      <Box sx={{ position: "relative", width: 28, flexShrink: 0 }}>
        {!last && <Box sx={{ position: "absolute", left: "50%", top: 0, bottom: -12, width: "2px", bgcolor: "#eef2f7", transform: "translateX(-50%)" }} />}
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "grid", placeItems: "center", bgcolor: "#fff", borderRadius: "50%", p: "3px" }}>
          {marker}
        </Box>
      </Box>

      <Box
        onMouseEnter={onPrefetch}
        onClick={cardAction}
        sx={{
          flex: 1, mb: 1.5, p: 2, borderRadius: 3, border: "1px solid",
          borderLeft: "4px solid", borderLeftColor: m.color,
          borderColor: current ? "#c7d2fe" : "#eef2f7",
          bgcolor: current ? "#fbfbff" : "#fff",
          boxShadow: current ? `0 4px 14px -14px ${m.color}` : "0 1px 2px rgba(16,24,40,0.04)",
          cursor: "pointer",
          transition: "border-color .15s, box-shadow .15s",
          "&:hover": { borderColor: "#cbd5e1" },
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: m.color, bgcolor: m.bg }}>
            <Icon icon={m.icon} width={20} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.6, color: m.color }}>{m.label}</Typography>
              {done && (
                <Stack direction="row" spacing={0.3} alignItems="center" sx={{ px: 0.75, py: 0.2, borderRadius: 999, bgcolor: "#dcfce7" }}>
                  <Icon icon="mdi:check" width={11} color="#15803d" />
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: "#15803d" }}>Completed</Typography>
                </Stack>
              )}
              {current && (
                <Stack direction="row" spacing={0.3} alignItems="center" sx={{ px: 0.75, py: 0.2, borderRadius: 999, bgcolor: "#eef2ff" }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#6366f1" }} />
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: "#4f46e5" }}>Current step</Typography>
                </Stack>
              )}
            </Stack>
            <Typography sx={{ fontWeight: 700, fontSize: "0.98rem", color: "#0f172a", lineHeight: 1.3, mt: 0.25 }}>{item.title}</Typography>
            {item.chips.length > 0 && (
              <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75, mt: 0.75 }}>
                {item.chips.map((c, i) => (
                  <Stack key={i} direction="row" spacing={0.4} alignItems="center" sx={{ px: 1, py: 0.35, borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, color: "#475569", bgcolor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                    <Icon icon={c.icon} width={13} />
                    {c.text}
                  </Stack>
                ))}
              </Stack>
            )}
            {done && points && <PointsFactors item={points} />}
          </Box>
          {points && (
            <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 46 }}>
              {done ? (
                <>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#15803d", lineHeight: 1 }}>
                    {points.earned}<Box component="span" sx={{ color: "#94a3b8", fontWeight: 600 }}>/{points.on_offer}</Box>
                  </Typography>
                  <Typography sx={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700 }}>earned</Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#475569", lineHeight: 1 }}>
                    {points.on_offer}<Box component="span" sx={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600 }}> pts</Box>
                  </Typography>
                  <Typography sx={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700 }}>on offer</Typography>
                </>
              )}
            </Box>
          )}
          {done ? (
            <ButtonBase
              onClick={(e) => { e.stopPropagation(); reviewAction(); }}
              sx={{ flexShrink: 0, px: 2, py: 0.9, borderRadius: 999, fontWeight: 800, color: "#475569", fontSize: "0.82rem", gap: 0.5, border: "1px solid #cbd5e1", bgcolor: "transparent" }}
            >
              <Icon icon={item.onReview ? "mdi:eye-outline" : "mdi:refresh"} width={15} />
              Review
            </ButtonBase>
          ) : (
            <ButtonBase
              onClick={(e) => { e.stopPropagation(); item.onClick(); }}
              sx={{ flexShrink: 0, px: 2.25, py: 1, borderRadius: 999, fontWeight: 800, color: "white", fontSize: "0.85rem", gap: 0.5, background: `linear-gradient(135deg, ${m.color} 0%, #a855f7 130%)`, boxShadow: `0 12px 26px -16px ${m.color}` }}
            >
              <Icon icon={m.actionIcon} width={16} />
              {current ? `${m.action} now` : m.action}
            </ButtonBase>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
