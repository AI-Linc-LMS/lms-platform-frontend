"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  AdaptiveCourseJobLogEntry,
  AdaptiveCourseJobTreeModule,
  AdaptiveCourseSkill,
} from "@/lib/services/admin/admin-adaptive-course.service";

const DIFF: Record<string, string> = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };
const WORDS_PER_SEC = 9;

function prettySkill(s: string): string {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

interface Props {
  log: AdaptiveCourseJobLogEntry[];
  tree: AdaptiveCourseJobTreeModule[];
  skills: AdaptiveCourseSkill[];
  active: boolean;
}

/**
 * The "magic happening" view: a bento grid where the question currently being
 * generated is written word-by-word in a glowing hero card, freshly-finished
 * questions pop into tiles, and the course tree fills alongside. Accumulates by
 * MCQ id (so lines never re-type), and instantly drains any backlog to stay
 * honest with the real generation pace.
 */
export function LiveGenerationBento({ log, tree, skills, active }: Props) {
  const [shown, setShown] = useState<AdaptiveCourseJobLogEntry[]>([]);
  const [revealed, setRevealed] = useState(0); // count of fully-written items
  // Words shown of the hero item, keyed to the hero's key so a stale count
  // from the previous item never flashes onto the new one.
  const [words, setWords] = useState<{ key: string; n: number }>({ key: "", n: 0 });
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fresh = log.filter((e) => !seenRef.current.has(e.key));
    if (fresh.length === 0) return;
    fresh.forEach((e) => seenRef.current.add(e.key));
    setShown((prev) => [...prev, ...fresh]);
  }, [log]);

  useEffect(() => {
    const hero = shown[revealed];
    if (!hero) return;
    const wordArr = hero.text.split(/\s+/).filter(Boolean);
    const wordMs = 1000 / WORDS_PER_SEC;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      // Fell behind → jump to the newest so the hero always shows live work.
      if (shown.length - revealed > 4) {
        setRevealed(shown.length - 1);
        return;
      }
      const n = Math.min(wordArr.length, Math.floor((performance.now() - start) / wordMs));
      setWords({ key: hero.key, n });
      if (n < wordArr.length) raf = requestAnimationFrame(tick);
      else setTimeout(() => setRevealed((r) => r + 1), 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, revealed]);

  // Once we've typed everything we know about, *pin* the hero on the last item
  // (with the live cursor) instead of running past the end of `shown` - letting
  // `revealed` index past the array blanks the hero and wrongly shows the cold
  // "warming up" state while the job is still actively generating.
  const caughtUp = revealed >= shown.length;
  const heroIdx = Math.min(revealed, shown.length - 1);
  const hero = shown.length > 0 ? shown[heroIdx] : null;
  const recent = shown.slice(Math.max(0, heroIdx - 6), heroIdx).reverse();
  const heroWords = hero ? hero.text.split(/\s+/).filter(Boolean) : [];
  const heroWordCount =
    hero && words.key === hero.key ? words.n : caughtUp ? heroWords.length : 0;
  const done = !active && caughtUp;
  const waiting = active && caughtUp && Boolean(hero);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        gridAutoRows: "minmax(96px, auto)",
        gridAutoFlow: "dense",
        gap: 2,
      }}
    >
      {/* HERO - the question being written */}
      <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" }, gridRow: { md: "span 2" } }}>
        <HeroCard hero={hero} heroWords={heroWords} words={heroWordCount} done={done} waiting={waiting} />
      </Box>

      {/* TREE - filling in */}
      <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" }, gridRow: { md: "span 2" } }}>
        <TreeCard tree={tree} />
      </Box>

      {/* SKILLS - the sub-skills the AI is tagging questions with */}
      {skills.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <SkillsCard skills={skills} />
        </Box>
      )}

      {/* RECENT - freshly written items pop in */}
      <AnimatePresence initial={false}>
        {recent.map((e) => (
          <Box key={e.key} component={motion.div} layout
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}
          >
            <RecentCard entry={e} />
          </Box>
        ))}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes bento-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
      `}</style>
    </Box>
  );
}

function HeroCard({
  hero, heroWords, words, done, waiting,
}: {
  hero: AdaptiveCourseJobLogEntry | null;
  heroWords: string[];
  words: number;
  done: boolean;
  waiting: boolean;
}) {
  const isArticle = hero?.kind === "article";
  const isCoding = hero?.kind === "coding";
  const isVideo = hero?.kind === "video";
  const accent = isArticle ? "#a855f7" : isCoding ? "#ec4899" : isVideo ? "#6366f1" : hero ? DIFF[hero.difficulty] ?? "#6366f1" : "#6366f1";
  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        minHeight: 240,
        borderRadius: 4,
        p: { xs: 2.5, md: 3 },
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 80%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
      }}
    >
      {/* slim accent bar */}
      <Box aria-hidden sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: done ? "#10b981" : accent, opacity: 0.85 }} />

      {/* header chips */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75, flexWrap: "wrap" }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.35, borderRadius: 999,
          fontWeight: 800, fontSize: "0.64rem", letterSpacing: "0.1em",
          color: done ? "#10b981" : "#6366f1",
          bgcolor: done ? "color-mix(in srgb, #10b981 12%, transparent)" : "color-mix(in srgb, #6366f1 12%, transparent)" }}>
          <Icon icon={done ? "mdi:check" : isArticle ? "mdi:book-open-variant" : isCoding ? "mdi:robot-happy-outline" : isVideo ? "mdi:play-circle-outline" : "mdi:fountain-pen-tip"} width={12} />
          {done ? "COMPLETE" : isArticle ? "WRITING ARTICLE" : isCoding ? "WRITING CODING PROBLEM" : isVideo ? "BUILDING VIDEO COMPANION" : "WRITING NOW"}
        </Box>
        {hero && isArticle && hero.title && <Chip label={hero.title} color="#a855f7" subtle />}
        {hero && isCoding && hero.title && <Chip label={hero.title} color="#ec4899" subtle />}
        {hero && isVideo && hero.title && <Chip label={hero.title} color="#6366f1" subtle />}
        {hero && isCoding && <Chip label={hero.difficulty} color="#ec4899" subtle />}
        {hero && !isArticle && !isCoding && <Chip label={hero.difficulty} color={accent} subtle />}
        {hero && !isArticle && !isCoding && hero.skill && <Chip label={hero.skill} color="#6366f1" subtle />}
      </Box>

      {/* body */}
      {done ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 1 }}>
          <Icon icon="mdi:check-circle-outline" width={48} style={{ color: "#10b981" }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>All content generated</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>Every submodule has its adaptive content.</Typography>
        </Box>
      ) : hero ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.5 }}>
          <Typography component="div" sx={{ fontSize: { xs: "1.1rem", md: "1.35rem" }, fontWeight: 700, lineHeight: 1.55, color: "text.primary" }}>
            {heroWords.slice(0, words).map((w, i) => (
              <Box key={i} component={motion.span}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                sx={{ display: "inline-block", mr: "0.3em" }}
              >
                {w}
              </Box>
            ))}
            <Box component="span" aria-hidden sx={{
              display: "inline-block", width: "2px", height: "1.05em", verticalAlign: "text-bottom",
              ml: "0.05em", bgcolor: accent, animation: "bento-blink 0.9s steps(2) infinite",
            }} />
          </Typography>
          {waiting && (
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
              <Icon icon="mdi:loading" width={15} className="acb-spin" style={{ color: accent }} />
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Writing the next section…</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: "text.secondary" }}>
          <Icon icon="mdi:loading" width={20} className="acb-spin" style={{ color: "#6366f1" }} />
          <Typography sx={{ fontWeight: 700 }}>Warming up the engine…</Typography>
        </Box>
      )}
    </Box>
  );
}

type TreeRow =
  | { kind: "module"; key: string; weekno: number; title: string }
  | { kind: "sub"; key: string; title: string; ready: boolean; count: number };

function TreeCard({ tree }: { tree: AdaptiveCourseJobTreeModule[] }) {
  // Flatten to an ordered row list so the tree can paint in line-by-line.
  const rows = useMemo<TreeRow[]>(() => {
    const out: TreeRow[] = [];
    for (const mod of tree) {
      out.push({ kind: "module", key: `m${mod.id}`, weekno: mod.weekno, title: mod.title });
      for (const sub of mod.submodules) {
        out.push({
          kind: "sub",
          key: `s${sub.id}`,
          title: sub.title,
          ready: Boolean(sub.quiz_ready || sub.article_ready || sub.coding_ready || sub.video_ready),
          count: sub.question_count + (sub.coding_problem_count ?? 0) + (sub.video_count ?? 0),
        });
      }
    }
    return out;
  }, [tree]);

  // Reveal one row at a time (cascade), continuing as new rows arrive.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setRevealed((r) => Math.min(r + 1, rows.length));
    }, 110);
    return () => clearInterval(id);
  }, [rows.length]);

  const visible = rows.slice(0, revealed);

  return (
    <Box sx={{
      height: "100%", minHeight: 240, borderRadius: 5, p: { xs: 2.5, md: 3 }, overflow: "auto", maxHeight: 420,
      bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 70%, transparent)",
      border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 75%, transparent)",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
        <Icon icon="mdi:file-tree-outline" width={18} style={{ color: "#a855f7" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#a855f7" }}>
          Course tree · filling in
        </Typography>
      </Box>
      {rows.length === 0 && (
        <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>Planning the outline…</Typography>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
        {visible.map((row) => (
          <Box
            key={row.key}
            component={motion.div}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {row.kind === "module" ? (
              <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mt: 0.75, mb: 0.25 }}>
                W{row.weekno} · {row.title}
              </Typography>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, pl: 0.5 }}>
                <Icon icon={row.ready ? "mdi:check-circle" : "mdi:loading"} width={15}
                  className={row.ready ? "" : "acb-spin"} style={{ color: row.ready ? "#10b981" : "#a855f7" }} />
                <Typography sx={{ fontSize: "0.8rem", color: row.ready ? "text.primary" : "text.secondary",
                  flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.title}
                </Typography>
                {row.ready && row.count > 0 && (
                  <Typography sx={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 800, flexShrink: 0 }}>{row.count}</Typography>
                )}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function SkillsCard({ skills }: { skills: AdaptiveCourseSkill[] }) {
  const totalQ = skills.reduce((sum, s) => sum + s.question_count, 0);
  const totalA = skills.reduce((sum, s) => sum + (s.article_count || 0), 0);
  return (
    <Box sx={{
      borderRadius: 5, p: { xs: 2.5, md: 3 },
      bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 70%, transparent)",
      border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 75%, transparent)",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, flexWrap: "wrap" }}>
        <Icon icon="mdi:brain" width={18} style={{ color: "#a855f7" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#a855f7" }}>
          Skills this course builds
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 700 }}>
          · {skills.length} skill{skills.length === 1 ? "" : "s"} · {totalQ} questions{totalA > 0 ? ` · ${totalA} articles` : ""}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <AnimatePresence initial={false}>
          {skills.map((s) => (
            <Box key={s.skill} component={motion.div} layout
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.6, pl: 1.25, pr: 0.5, py: 0.55, borderRadius: 999,
                color: "white", fontWeight: 800, fontSize: "0.78rem",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 70%, #ec4899 100%)",
                boxShadow: "0 10px 22px -14px rgba(168, 85, 247, 0.7)",
              }}
            >
              {prettySkill(s.skill)}
              {s.question_count > 0 && (
                <Box component="span" title={`${s.question_count} quiz questions`} sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.2, px: 0.7, py: 0.1, borderRadius: 999,
                  fontSize: "0.68rem", fontWeight: 900, bgcolor: "rgba(255,255,255,0.25)",
                }}>
                  <Icon icon="mdi:help-circle-outline" width={11} />{s.question_count}
                </Box>
              )}
              {s.article_count > 0 && (
                <Box component="span" title={`${s.article_count} articles`} sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.2, px: 0.7, py: 0.1, borderRadius: 999,
                  fontSize: "0.68rem", fontWeight: 900, bgcolor: "rgba(255,255,255,0.25)",
                }}>
                  <Icon icon="mdi:book-open-variant" width={11} />{s.article_count}
                </Box>
              )}
            </Box>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

function RecentCard({ entry }: { entry: AdaptiveCourseJobLogEntry }) {
  const isArticle = entry.kind === "article";
  const isCoding = entry.kind === "coding";
  const isVideo = entry.kind === "video";
  const accent = isArticle ? "#a855f7" : isCoding ? "#ec4899" : isVideo ? "#6366f1" : DIFF[entry.difficulty] ?? "#6366f1";
  return (
    <Box sx={{
      height: "100%", borderRadius: 4, p: 1.75, position: "relative", overflow: "hidden",
      bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 78%, transparent)",
      border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
    }}>
      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: accent }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.6 }}>
        <Icon icon={isArticle ? "mdi:book-open-variant" : isCoding ? "mdi:robot-happy-outline" : isVideo ? "mdi:play-circle-outline" : "mdi:check"} width={13} style={{ color: isArticle ? "#a855f7" : isCoding ? "#ec4899" : isVideo ? "#6366f1" : "#10b981" }} />
        {isArticle ? (
          <Chip label="Article" color={accent} small />
        ) : isCoding ? (
          <Chip label="Coding" color={accent} small />
        ) : isVideo ? (
          <Chip label="Video" color={accent} small />
        ) : (
          <Chip label={entry.difficulty} color={accent} small />
        )}
        {(isArticle || isCoding || isVideo) && entry.title ? (
          <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {entry.title}</Typography>
        ) : entry.skill ? (
          <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 700 }}>· {entry.skill}</Typography>
        ) : null}
      </Box>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.4,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {entry.text}
      </Typography>
    </Box>
  );
}

function Chip({ label, color, subtle, small }: { label: string; color: string; subtle?: boolean; small?: boolean }) {
  return (
    <Box component="span" sx={{
      px: small ? 0.7 : 0.9, py: 0.2, borderRadius: 999,
      fontSize: small ? "0.6rem" : "0.66rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
      color: subtle ? color : "white",
      background: subtle ? `color-mix(in srgb, ${color} 14%, transparent)` : color,
    }}>
      {label}
    </Box>
  );
}
