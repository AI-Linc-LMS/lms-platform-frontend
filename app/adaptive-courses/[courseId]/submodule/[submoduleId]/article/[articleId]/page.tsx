"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Dialog, IconButton, Popover, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { notifyContentCompleted } from "@/lib/streak/streakCelebration";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { AIBeacon } from "@/components/adaptive-quiz/shared/AIBeacon";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import { AdaptiveArticleBody, type ArticleHeading } from "@/components/adaptive-quiz/article/AdaptiveArticleBody";
import { useArticleNarration } from "@/lib/hooks/useArticleNarration";
import {
  adaptiveCourseService,
  READING_TIERS,
  type AdaptiveArticleDetail,
  type ExplainResult,
  type ReadingTier,
} from "@/lib/services/adaptive-course.service";

const TIER_BLURB: Record<ReadingTier, string> = {
  Beginner: "ELI5",
  Intermediate: "Default",
  Advanced: "Deeper",
  Expert: "Whitepaper",
};

type ExplainState = {
  anchor: HTMLElement;
  term: string;
  loading: boolean;
  result: ExplainResult | null;
  view: "explanation" | "even_simpler" | "show_diagram" | "real_example";
} | null;

export default function AdaptiveArticleReaderPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const { showToast } = useToast();
  const courseId = Number(params.courseId);
  const submoduleId = Number(params.submoduleId);
  const articleId = Number(params.articleId);

  const [article, setArticle] = useState<AdaptiveArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<ReadingTier>("Intermediate");
  const [html, setHtml] = useState("");
  const [readingTime, setReadingTime] = useState(0);
  const [tierLoading, setTierLoading] = useState(false);
  const [pendingTier, setPendingTier] = useState<ReadingTier | null>(null);
  const [explain, setExplain] = useState<ExplainState>(null);
  const [summary, setSummary] = useState<{ open: boolean; loading: boolean; html: string; bullets: string[] }>({
    open: false, loading: false, html: "", bullets: [],
  });
  const [headings, setHeadings] = useState<ArticleHeading[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [tocOpen, setTocOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const bodyWrapRef = useRef<HTMLDivElement | null>(null);
  // Reading marks the article complete on the server (on load), but we defer the streak
  // celebration until the learner LEAVES the article - so it pops on the page they go to,
  // not the moment they open it.
  const completedRef = useRef(false);
  // Professional onyx narration (replaces robotic browser speechSynthesis).
  const narration = useArticleNarration(html);

  useEffect(() => {
    if (!Number.isFinite(articleId)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCourseService.getArticle(articleId);
        if (cancelled) return;
        setArticle(data);
        setTier(data.rendered_tier || data.default_tier);
        setHtml(data.content_html);
        setReadingTime(data.reading_time_minutes);
        // Reading an article counts as course activity: awards points + keeps the
        // daily streak alive (idempotent server-side per student+article). The streak
        // celebration is fired on unmount (see below) so it shows after the learner reads.
        void adaptiveCourseService
          .completeArticle(articleId)
          .then(() => { completedRef.current = true; })
          .catch(() => {});
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load article.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [articleId]);

  // Fire the streak celebration when the learner leaves the article (navigates back or
  // anywhere else) - not the instant it opens.
  useEffect(() => {
    return () => {
      if (completedRef.current) notifyContentCompleted();
    };
  }, []);

  // Scroll-spy: highlight the table-of-contents entry nearest the top.
  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHeading((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-84px 0px -68% 0px", threshold: 0 },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  // Reading-progress bar. Capture-phase scroll so it works whichever ancestor scrolls.
  useEffect(() => {
    const onScroll = () => {
      const el = bodyWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [article, html]);

  const goToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function switchTier(next: ReadingTier) {
    if (next === tier || tierLoading) return;
    setPendingTier(next);
    setTierLoading(true);
    try {
      const res = await adaptiveCourseService.renderArticleTier(articleId, next);
      setTier(res.tier);
      setHtml(res.content_html);
      setReadingTime(res.reading_time_minutes);
      setArticle((a) => (a ? { ...a, available_tiers: Array.from(new Set([...a.available_tiers, res.tier])) } : a));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't render that level.", "error");
    } finally {
      setTierLoading(false);
      setPendingTier(null);
    }
  }

  function rescue(direction: "simplify" | "deeper" | "eli5") {
    if (direction === "eli5") return void switchTier("Beginner");
    const i = READING_TIERS.indexOf(tier);
    const next = direction === "simplify" ? READING_TIERS[Math.max(0, i - 1)] : READING_TIERS[Math.min(READING_TIERS.length - 1, i + 1)];
    void switchTier(next);
  }

  async function openExplain(term: string, anchor: HTMLElement, context: string) {
    setExplain({ anchor, term, loading: true, result: null, view: "explanation" });
    try {
      const result = await adaptiveCourseService.explainTerm(articleId, { term, context, tier });
      setExplain((s) => (s && s.term === term ? { ...s, loading: false, result } : s));
    } catch {
      setExplain((s) => (s ? { ...s, loading: false } : s));
      showToast("Couldn't explain that right now.", "error");
    }
  }

  async function handleSummarise() {
    setSummary({ open: true, loading: true, html: "", bullets: [] });
    try {
      const res = await adaptiveCourseService.summarise(articleId, { tier });
      setSummary({ open: true, loading: false, html: res.summary_html, bullets: res.bullets });
    } catch (e) {
      setSummary({ open: false, loading: false, html: "", bullets: [] });
      showToast(e instanceof Error ? e.message : "Couldn't summarise.", "error");
    }
  }

  const glossaryEntries = useMemo(() => Object.entries(article?.glossary ?? {}), [article]);
  const tierIndex = READING_TIERS.indexOf(tier);

  return (
    <MainLayout fullWidthContent>
      {/* Reading-progress bar */}
      <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 1300, pointerEvents: "none" }}>
        <Box sx={{ height: "100%", width: `${Math.round(progress * 100)}%`,
          background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)", transition: "width 0.1s linear" }} />
      </Box>
      <Box sx={{ maxWidth: 1760, mx: "auto", py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => push(`/adaptive-courses/${courseId}/submodule/${submoduleId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to submodule
        </ButtonBase>

        <AdaptiveSectionShell>
          {loading && <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>Loading…</Typography>}
          {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}

          {article && (
            <>
              <AdaptiveSectionHero
                chapter="Adaptive Article"
                title={article.title}
                subtitle={article.summary}
                icon="mdi:book-open-variant"
                accent="purple"
              />

              {/* Reading level strip */}
              <Box sx={{ borderRadius: 4, p: { xs: 2, md: 2.5 }, mb: 2.5,
                background: "linear-gradient(120deg, color-mix(in srgb, #6366f1 10%, var(--card-bg)) 0%, color-mix(in srgb, #ec4899 8%, var(--card-bg)) 100%)",
                border: "1px solid color-mix(in srgb, #a855f7 20%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  <AIBeacon size={34} />
                  <Box>
                    <AIPill variant="soft" icon={<Icon icon="mdi:tune-vertical" width={13} />}>
                      Reading level · matched to you
                    </AIPill>
                    <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.5 }}>
                      Rendered at <b style={{ color: "#a855f7" }}>{tier}</b> · ~{readingTime} min
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", borderRadius: 999, p: 0.4, bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)", border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)" }}>
                  {READING_TIERS.map((t) => {
                    const active = t === tier;
                    return (
                      <ButtonBase key={t} onClick={() => void switchTier(t)} disabled={tierLoading}
                        sx={{ px: 1.5, py: 0.7, borderRadius: 999, display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1,
                          color: active ? "white" : "text.primary",
                          background: active ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "transparent",
                          "&:disabled": { opacity: 0.6 } }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.8rem" }}>{t}</Typography>
                        <Typography sx={{ fontSize: "0.62rem", opacity: 0.8 }}>{TIER_BLURB[t]}</Typography>
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Box>

              {/* Skills you'll build */}
              {article.concepts.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "#a855f7", fontWeight: 800, fontSize: "0.78rem" }}>
                    <Icon icon="mdi:brain" width={15} />
                    Skills you&apos;ll build:
                  </Box>
                  {article.concepts.map((c) => (
                    <Box key={c} component="span" sx={{
                      px: 1, py: 0.35, borderRadius: 999, fontSize: "0.76rem", fontWeight: 700,
                      color: "#6366f1", bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
                      border: "1px solid color-mix(in srgb, #6366f1 30%, transparent)",
                    }}>
                      {c}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Toolbar */}
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <ToolbarBtn icon="mdi:text-box-outline" label="Summarise so far" onClick={() => void handleSummarise()} />
                <ToolbarBtn
                  icon={narration.playing ? "mdi:stop" : narration.loading ? "mdi:loading" : "mdi:volume-high"}
                  label={narration.playing ? "Stop" : narration.loading ? "Preparing voice…" : "Read aloud"}
                  onClick={narration.toggle}
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: `${tocOpen ? "232px" : "40px"} minmax(0, 1fr) 320px` }, gap: { xs: 2, lg: 3 }, alignItems: "start", transition: "grid-template-columns 0.28s cubic-bezier(0.16,1,0.3,1)" }}>
                {/* Table of contents (left rail) - collapsible to give the reading column more room */}
                <TocRail headings={headings} activeId={activeHeading} onJump={goToHeading} open={tocOpen} onToggle={() => setTocOpen((v) => !v)} />

                {/* Body */}
                <Box ref={bodyWrapRef} sx={{ position: "relative", borderRadius: 4, p: { xs: 2, md: 3.5 }, bgcolor: "color-mix(in srgb, var(--card-bg) 75%, transparent)", border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)", minHeight: 240 }}>
                  {tierLoading ? (
                    <ConjureLoader tier={pendingTier ?? tier} />
                  ) : (
                    <AdaptiveArticleBody html={html} explainTerms={article.explain_terms} onExplain={openExplain} onHeadings={setHeadings} reveal />
                  )}
                </Box>

                {/* Right rail */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, position: { lg: "sticky" }, top: { lg: 24 },
                  maxHeight: { lg: "calc(100vh - 48px)" }, overflowY: { lg: "auto" }, pr: { lg: 0.5 } }}>
                  <Box sx={{ ...railSx, p: 0, overflow: "hidden",
                    background: "linear-gradient(160deg, color-mix(in srgb, #6366f1 12%, var(--card-bg)) 0%, color-mix(in srgb, #ec4899 9%, var(--card-bg)) 100%)",
                    border: "1px solid color-mix(in srgb, #a855f7 22%, transparent)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, pt: 1.75, pb: 1.25 }}>
                      <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 999,
                        background: "linear-gradient(135deg, #6366f1, #a855f7)", flexShrink: 0 }}>
                        <Icon icon="mdi:lifebuoy" width={17} style={{ color: "white" }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", lineHeight: 1.2 }}>Not landing right?</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Re-pitch it instantly</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, px: 1.5, pb: 1.5 }}>
                      <RescueBtn icon="mdi:arrow-down-bold-circle-outline" title="Too complex - simplify"
                        sub={tierIndex > 0 ? `Drop to ${READING_TIERS[tierIndex - 1]}` : "Already at the simplest"}
                        accent="#22c55e" disabled={tierIndex === 0 || tierLoading} onClick={() => rescue("simplify")} />
                      <RescueBtn icon="mdi:arrow-up-bold-circle-outline" title="Too simple - go deeper"
                        sub={tierIndex < READING_TIERS.length - 1 ? `Climb to ${READING_TIERS[tierIndex + 1]}` : "Already at the deepest"}
                        accent="#6366f1" disabled={tierIndex === READING_TIERS.length - 1 || tierLoading} onClick={() => rescue("deeper")} />
                      <RescueBtn icon="mdi:emoticon-happy-outline" title="Explain like I'm 5"
                        sub={tier === "Beginner" ? "You're already here" : "Jump to Beginner"}
                        accent="#ec4899" disabled={tier === "Beginner" || tierLoading} onClick={() => rescue("eli5")} />
                    </Box>
                  </Box>

                  {glossaryEntries.length > 0 && (
                    <Box sx={railSx}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                        <RailLabel icon="mdi:book-alphabet" text="Auto-glossary" noMargin />
                        <AIPill variant="soft">{glossaryEntries.length} terms</AIPill>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                        {glossaryEntries.map(([term, def]) => (
                          <Box key={term}>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.84rem" }}>{term}</Typography>
                            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.45 }}>{def}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          )}
        </AdaptiveSectionShell>
      </Box>

      {/* Explain-this popover */}
      <Popover
        open={Boolean(explain)}
        anchorEl={explain?.anchor ?? null}
        onClose={() => setExplain(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: {
          mt: 0.75,
          width: explain?.view === "show_diagram" ? 540 : 420,
          maxWidth: "calc(100vw - 32px)",
          display: "flex", flexDirection: "column",
          maxHeight: "min(70vh, 560px)",
          borderRadius: 3, bgcolor: "var(--card-bg)",
          border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
          boxShadow: "0 24px 50px -16px rgba(15,23,42,0.3)",
          overflow: "hidden",
        } } }}
      >
        {explain && (
          <>
            {/* Sticky header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2, pt: 1.75, pb: 1.25, flexShrink: 0,
              borderBottom: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)" }}>
              <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 999,
                background: "linear-gradient(135deg, #6366f1, #a855f7)", flexShrink: 0 }}>
                <Icon icon={EXPLAIN_VIEW_META[explain.view].icon} width={14} style={{ color: "white" }} />
              </Box>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#a855f7", minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {EXPLAIN_VIEW_META[explain.view].label} · {explain.term}
              </Typography>
            </Box>

            {/* Scrollable content */}
            <Box sx={{ px: 2, py: 1.5, overflowY: "auto", flex: 1, minHeight: 0 }}>
              {explain.loading ? (
                <GeneratingShimmer label="Thinking…" />
              ) : explain.result ? (
                <ExplainContent key={explain.view} view={explain.view} result={explain.result} />
              ) : (
                <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{"Couldn't load explanation."}</Typography>
              )}
            </Box>

            {/* Sticky follow-up actions */}
            {explain.result && !explain.loading && (
              <Box sx={{ display: "flex", gap: 0.75, px: 2, py: 1.25, flexWrap: "wrap", flexShrink: 0,
                borderTop: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
                bgcolor: "color-mix(in srgb, var(--card-bg) 80%, transparent)" }}>
                {([
                  ["explanation", "Explanation"],
                  ["even_simpler", "Even simpler"],
                  ["show_diagram", "Diagram"],
                  ["real_example", "Real example"],
                ] as const).map(([key, label]) => {
                  const has = key === "explanation" || Boolean(explain.result?.followups[key]?.trim());
                  return (
                    <ButtonBase key={key} disabled={!has}
                      onClick={() => setExplain((s) => (s ? { ...s, view: key } : s))}
                      sx={{ px: 1.25, py: 0.5, borderRadius: 999, fontSize: "0.72rem", fontWeight: 800, gap: 0.4,
                        color: explain.view === key ? "white" : has ? "#6366f1" : "text.disabled",
                        background: explain.view === key ? "linear-gradient(135deg, #6366f1, #a855f7)" : "color-mix(in srgb, #6366f1 12%, transparent)",
                        "&:disabled": { opacity: 0.45, background: "color-mix(in srgb, var(--border-default) 30%, transparent)" } }}>
                      <Icon icon={EXPLAIN_VIEW_META[key].icon} width={13} />
                      {label}
                    </ButtonBase>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Popover>

      {/* Summarise dialog - centered, polished recap of the article so far */}
      <Dialog
        open={summary.open}
        onClose={() => setSummary((s) => ({ ...s, open: false }))}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, overflow: "hidden", bgcolor: "var(--card-bg)", border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)", boxShadow: "0 28px 70px -30px rgba(124,58,237,0.55)" } } }}
      >
        {/* Gradient header */}
        <Box sx={{ position: "relative", px: 3, py: 2.25, color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <AIBeacon size={26} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", lineHeight: 1.15 }}>Summary so far</Typography>
              <Typography sx={{ fontSize: "0.74rem", opacity: 0.9 }}>The key ideas, condensed · {tier} level</Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setSummary((s) => ({ ...s, open: false }))}
            aria-label="Close"
            sx={{ position: "absolute", top: 10, right: 10, color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}
          >
            <Icon icon="mdi:close" width={18} />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, maxHeight: "60vh", overflowY: "auto" }}>
          {summary.loading ? (
            <GeneratingShimmer label="Summarising what you've read…" />
          ) : (
            <Box sx={{ fontSize: "0.9rem" }}>
              {/* word-by-word reveal of the recap */}
              <AdaptiveArticleBody html={summary.html} explainTerms={[]} onExplain={() => {}} reveal />
              {summary.bullets.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85, mt: 2 }}>
                  <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary" }}>Key takeaways</Typography>
                  {summary.bullets.map((b, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start", p: 1.1, borderRadius: 2.5,
                      bgcolor: "color-mix(in srgb, #a855f7 7%, transparent)",
                      border: "1px solid color-mix(in srgb, #a855f7 16%, transparent)",
                      opacity: 0, animation: "acb-fade-in 0.4s ease forwards", animationDelay: `${0.4 + i * 0.3}s` }}>
                      <Icon icon="mdi:check-circle" width={17} style={{ color: "#a855f7", flexShrink: 0, marginTop: 1 }} />
                      <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.45 }}>{b}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              <style jsx global>{`@keyframes acb-fade-in { to { opacity: 1; } }`}</style>
            </Box>
          )}
        </Box>
      </Dialog>
    </MainLayout>
  );
}

const EXPLAIN_VIEW_META: Record<NonNullable<ExplainState>["view"], { label: string; icon: string; generating: string }> = {
  explanation: { label: "Explain", icon: "mdi:lightbulb-on-outline", generating: "Thinking…" },
  even_simpler: { label: "Even simpler", icon: "mdi:emoticon-happy-outline", generating: "Simplifying it…" },
  show_diagram: { label: "Diagram", icon: "mdi:chart-box-outline", generating: "Drawing the diagram…" },
  real_example: { label: "Real-world example", icon: "mdi:earth", generating: "Finding a real-world example…" },
};

/** Animated "AI is working" state - shimmer lines + pulsing label, so the user
 *  always sees that something is being generated. */
function GeneratingShimmer({ label }: { label: string }) {
  return (
    <Box sx={{ py: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <AIBeacon size={22} />
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#a855f7",
          animation: "acb-pulse 1.4s ease-in-out infinite" }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
        {[92, 100, 78].map((w, i) => (
          <Box key={i} sx={{ height: 9, width: `${w}%`, borderRadius: 999,
            background: "linear-gradient(90deg, color-mix(in srgb, #6366f1 18%, transparent) 25%, color-mix(in srgb, #a855f7 32%, transparent) 50%, color-mix(in srgb, #6366f1 18%, transparent) 75%)",
            backgroundSize: "200% 100%", animation: "acb-shimmer 1.3s ease-in-out infinite", animationDelay: `${i * 0.12}s` }} />
        ))}
      </Box>
      <style jsx global>{`
        @keyframes acb-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes acb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </Box>
  );
}

/** Reveals plain text word-by-word (staggered fade) for the "magic" feel. */
function RevealText({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\s+)/), [text]);
  const total = parts.filter((p) => p.trim()).length || 1;
  const dur = Math.min(2.4, Math.max(0.7, total * 0.028));
  let wi = 0;
  return (
    <Typography component="div" sx={{ fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--font-secondary)" }}>
      {parts.map((p, i) => {
        if (!p.trim()) return p;
        const delay = (wi++ / total) * dur;
        return (
          <Box component="span" key={i} sx={{ opacity: 0, animation: "acb-fade-in 0.42s ease forwards", animationDelay: `${delay}s` }}>
            {p}
          </Box>
        );
      })}
      <style jsx global>{`@keyframes acb-fade-in { to { opacity: 1; } }`}</style>
    </Typography>
  );
}

/** Renders a generated diagram: ASCII/structured text in a framed, scrollable
 *  monospace canvas that "draws in". */
function DiagramView({ text }: { text: string }) {
  // Strip any markdown code fences the model may wrap the diagram in.
  const clean = useMemo(
    () => text.replace(/^\s*```[a-zA-Z]*\n?/, "").replace(/\n?```\s*$/, "").replace(/\s+$/, ""),
    [text],
  );
  return (
    <Box sx={{ animation: "acb-draw-in 0.6s ease forwards" }}>
      <Box component="pre" sx={{
        m: 0, p: 1.75, borderRadius: 2.5,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.78rem", lineHeight: 1.5, color: "var(--font-primary)",
        whiteSpace: "pre", overflowX: "auto",
        maxHeight: "42vh", overflowY: "auto",
        background: "linear-gradient(135deg, color-mix(in srgb, #6366f1 8%, var(--card-bg)) 0%, color-mix(in srgb, #a855f7 8%, var(--card-bg)) 100%)",
        border: "1px solid color-mix(in srgb, #a855f7 28%, transparent)",
      }}>
        {clean}
      </Box>
      <style jsx global>{`@keyframes acb-draw-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
    </Box>
  );
}

/** Switches explain views with a brief "generating" beat (so follow-ups feel
 *  alive) before revealing the content. */
function ExplainContent({ view, result }: { view: NonNullable<ExplainState>["view"]; result: ExplainResult }) {
  const text = view === "explanation" ? result.explanation : result.followups[view];
  const [ready, setReady] = useState(view === "explanation");
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), 520);
    return () => clearTimeout(t);
  }, [ready]);

  if (!text || !text.trim()) {
    return <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{"Nothing to show for this one."}</Typography>;
  }
  if (!ready) return <GeneratingShimmer label={EXPLAIN_VIEW_META[view].generating} />;
  if (view === "show_diagram") return <DiagramView text={text} />;
  return <RevealText text={text} />;
}

/** The "magic" tier-switch state: the page dissolves into a shimmering skeleton
 *  being woven, then the real content reveals word-by-word once it lands. */
function ConjureLoader({ tier }: { tier: ReadingTier }) {
  const widths = [97, 88, 100, 73, 93, 81, 99, 67, 90, 78];
  return (
    <Box sx={{ animation: "acb-conjure-in 0.4s ease forwards" }}>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.85, mb: 2.5, color: "#a855f7", fontWeight: 800, fontSize: "0.88rem" }}>
        <Icon icon="mdi:auto-fix" width={19} className="acb-wand" />
        <Box component="span" sx={{ animation: "acb-pulse 1.5s ease-in-out infinite" }}>
          Conjuring your <b>{tier}</b> read…
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.4 }}>
        {widths.map((w, i) => (
          <Box key={i} sx={{
            height: 12, width: `${w}%`, borderRadius: 999,
            background: "linear-gradient(90deg, color-mix(in srgb,#6366f1 14%,transparent) 20%, color-mix(in srgb,#a855f7 30%,transparent) 50%, color-mix(in srgb,#ec4899 14%,transparent) 80%)",
            backgroundSize: "220% 100%",
            animation: "acb-shimmer 1.25s ease-in-out infinite, acb-conjure-in 0.5s ease forwards",
            animationDelay: `${i * 0.08}s`,
            opacity: 0,
          }} />
        ))}
      </Box>
      <style jsx global>{`
        @keyframes acb-shimmer { 0% { background-position: 220% 0; } 100% { background-position: -220% 0; } }
        @keyframes acb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes acb-wand { 0%, 100% { transform: rotate(-10deg) scale(1); } 50% { transform: rotate(12deg) scale(1.18); } }
        @keyframes acb-conjure-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .acb-wand { animation: acb-wand 1.05s ease-in-out infinite; transform-origin: 60% 60%; }
      `}</style>
    </Box>
  );
}

const railSx = {
  borderRadius: 4,
  p: 2,
  bgcolor: "color-mix(in srgb, var(--card-bg) 75%, transparent)",
  border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
} as const;

function RailLabel({ icon, text, noMargin }: { icon: string; text: string; noMargin?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: noMargin ? 0 : 1.25 }}>
      <Icon icon={icon} width={16} style={{ color: "#a855f7" }} />
      <Typography sx={{ fontWeight: 800, fontSize: "0.74rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#a855f7" }}>{text}</Typography>
    </Box>
  );
}

/** Sticky table-of-contents rail (left), built from the article's headings with
 *  scroll-spy. Collapsible (horizontal toggle) so the reading column can take the
 *  freed width. Hidden below lg, where the reading column goes full width. */
function TocRail({ headings, activeId, onJump, open, onToggle }: { headings: ArticleHeading[]; activeId: string; onJump: (id: string) => void; open: boolean; onToggle: () => void }) {
  if (!headings.length) return <Box sx={{ display: { xs: "none", lg: "block" } }} />;
  // Collapsed: a slim sticky pill that re-opens the contents and reclaims the column width.
  if (!open) {
    return (
      <Box sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 24 }}>
        <IconButton
          onClick={onToggle}
          title="Show contents"
          aria-label="Show contents"
          sx={{
            width: 36, height: 36, borderRadius: 2.5, color: "#a855f7",
            bgcolor: "color-mix(in srgb, #a855f7 10%, transparent)",
            border: "1px solid color-mix(in srgb, #a855f7 28%, transparent)",
            "&:hover": { bgcolor: "color-mix(in srgb, #a855f7 18%, transparent)" },
          }}
        >
          <Icon icon="mdi:format-list-bulleted" width={18} />
        </IconButton>
      </Box>
    );
  }
  return (
    <Box sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 24, maxHeight: "calc(100vh - 48px)", overflowY: "auto" }}>
      {headings.length > 0 && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, pr: 0.5 }}>
            <RailLabel icon="mdi:format-list-bulleted" text="On this page" />
            <IconButton
              onClick={onToggle}
              title="Hide contents"
              aria-label="Hide contents"
              size="small"
              sx={{ color: "text.secondary", mt: -1, "&:hover": { color: "#a855f7" } }}
            >
              <Icon icon="mdi:chevron-left" width={18} />
            </IconButton>
          </Box>
          <Box component="nav" sx={{ display: "flex", flexDirection: "column", borderLeft: "2px solid color-mix(in srgb, var(--border-default) 70%, transparent)" }}>
            {headings.map((h) => {
              const active = h.id === activeId;
              return (
                <ButtonBase
                  key={h.id}
                  onClick={() => onJump(h.id)}
                  sx={{
                    justifyContent: "flex-start", textAlign: "left",
                    pl: h.level === 3 ? 2.5 : 1.25, pr: 1, py: 0.6, ml: "-2px",
                    borderLeft: "2px solid", borderColor: active ? "#a855f7" : "transparent",
                    color: active ? "#a855f7" : "text.secondary",
                    fontWeight: active ? 800 : 600, fontSize: "0.8rem", lineHeight: 1.3,
                    transition: "color 0.15s ease, border-color 0.15s ease",
                    "&:hover": { color: "#a855f7" },
                  }}
                >
                  {h.text}
                </ButtonBase>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}

function RescueBtn({ icon, title, sub, accent, disabled, onClick }: { icon: string; title: string; sub: string; accent: string; disabled?: boolean; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} disabled={disabled} sx={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 1.1, p: 1.1, borderRadius: 2.5,
      bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
      border: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
      transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
      "&:hover": { transform: "translateY(-1px)", borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`, boxShadow: `0 6px 18px -10px ${accent}` },
      "&:disabled": { opacity: 0.45, transform: "none", boxShadow: "none" } }}>
      <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 2, flexShrink: 0,
        color: accent, bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)` }}>
        <Icon icon={icon} width={18} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.81rem", lineHeight: 1.2 }}>{title}</Typography>
        <Typography sx={{ fontSize: "0.71rem", color: "text.secondary" }}>{sub}</Typography>
      </Box>
    </ButtonBase>
  );
}

function ToolbarBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} sx={{ px: 1.75, py: 0.85, borderRadius: 999, fontWeight: 800, fontSize: "0.82rem", gap: 0.5, color: "text.primary",
      bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)", border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
      "&:hover": { borderColor: "color-mix(in srgb, #6366f1 50%, transparent)" } }}>
      <Icon icon={icon} width={16} />
      {label}
    </ButtonBase>
  );
}
