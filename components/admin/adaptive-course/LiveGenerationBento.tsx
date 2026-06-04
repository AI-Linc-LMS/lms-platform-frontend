"use client";

import { useEffect, useRef, useState } from "react";
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
  const [revealed, setRevealed] = useState(0); // count of fully-written questions
  // Words shown of the hero question, keyed to the hero's id so a stale count
  // from the previous question never flashes onto the new one.
  const [words, setWords] = useState<{ id: number; n: number }>({ id: -1, n: 0 });
  const seenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const fresh = log.filter((e) => !seenRef.current.has(e.id));
    if (fresh.length === 0) return;
    fresh.forEach((e) => seenRef.current.add(e.id));
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
      setWords({ id: hero.id, n });
      if (n < wordArr.length) raf = requestAnimationFrame(tick);
      else setTimeout(() => setRevealed((r) => r + 1), 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, revealed]);

  const hero = shown[revealed] ?? null;
  const recent = shown.slice(Math.max(0, revealed - 6), revealed).reverse();
  const heroWords = hero ? hero.text.split(/\s+/).filter(Boolean) : [];
  const heroWordCount = hero && words.id === hero.id ? words.n : 0;
  const done = !active && !hero;

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
      {/* HERO — the question being written */}
      <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" }, gridRow: { md: "span 2" } }}>
        <HeroCard hero={hero} heroWords={heroWords} words={heroWordCount} done={done} />
      </Box>

      {/* TREE — filling in */}
      <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" }, gridRow: { md: "span 2" } }}>
        <TreeCard tree={tree} />
      </Box>

      {/* SKILLS — the sub-skills the AI is tagging questions with */}
      {skills.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <SkillsCard skills={skills} />
        </Box>
      )}

      {/* RECENT — freshly written questions pop in */}
      <AnimatePresence initial={false}>
        {recent.map((e) => (
          <Box key={e.id} component={motion.div} layout
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
  hero, heroWords, words, done,
}: {
  hero: AdaptiveCourseJobLogEntry | null;
  heroWords: string[];
  words: number;
  done: boolean;
}) {
  const accent = hero ? DIFF[hero.difficulty] ?? "#6366f1" : "#6366f1";
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
          <Icon icon={done ? "mdi:check" : "mdi:fountain-pen-tip"} width={12} />
          {done ? "COMPLETE" : "WRITING NOW"}
        </Box>
        {hero && <Chip label={hero.difficulty} color={accent} subtle />}
        {hero && hero.skill && <Chip label={hero.skill} color="#6366f1" subtle />}
      </Box>

      {/* body */}
      {done ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 1 }}>
          <Icon icon="mdi:check-circle-outline" width={48} style={{ color: "#10b981" }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>All content generated</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>Every submodule has its adaptive quiz.</Typography>
        </Box>
      ) : hero ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
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

function TreeCard({ tree }: { tree: AdaptiveCourseJobTreeModule[] }) {
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
      {tree.length === 0 && (
        <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>Planning the outline…</Typography>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {tree.map((mod) => (
          <Box key={mod.id}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.5 }}>W{mod.weekno} · {mod.title}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pl: 0.5 }}>
              {mod.submodules.map((sub) => (
                <Box key={sub.id} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Icon icon={sub.quiz_ready ? "mdi:check-circle" : "mdi:loading"} width={15}
                    className={sub.quiz_ready ? "" : "acb-spin"} style={{ color: sub.quiz_ready ? "#10b981" : "#a855f7" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: sub.quiz_ready ? "text.primary" : "text.secondary",
                    textDecoration: "none", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sub.title}
                  </Typography>
                  {sub.quiz_ready && (
                    <Typography sx={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 800, flexShrink: 0 }}>{sub.question_count}</Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function SkillsCard({ skills }: { skills: AdaptiveCourseSkill[] }) {
  const total = skills.reduce((sum, s) => sum + s.question_count, 0);
  return (
    <Box sx={{
      borderRadius: 5, p: { xs: 2.5, md: 3 },
      bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 70%, transparent)",
      border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 75%, transparent)",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, flexWrap: "wrap" }}>
        <Icon icon="mdi:brain" width={18} style={{ color: "#a855f7" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#a855f7" }}>
          Skills the quizzes measure
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 700 }}>
          · {skills.length} skill{skills.length === 1 ? "" : "s"} · {total} questions
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
              <Box component="span" sx={{
                px: 0.75, py: 0.1, borderRadius: 999, fontSize: "0.7rem", fontWeight: 900,
                bgcolor: "rgba(255,255,255,0.25)",
              }}>
                {s.question_count}
              </Box>
            </Box>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

function RecentCard({ entry }: { entry: AdaptiveCourseJobLogEntry }) {
  const accent = DIFF[entry.difficulty] ?? "#6366f1";
  return (
    <Box sx={{
      height: "100%", borderRadius: 4, p: 1.75, position: "relative", overflow: "hidden",
      bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 78%, transparent)",
      border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
    }}>
      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: accent }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.6 }}>
        <Icon icon="mdi:check" width={13} style={{ color: "#10b981" }} />
        <Chip label={entry.difficulty} color={accent} small />
        {entry.skill && <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 700 }}>· {entry.skill}</Typography>}
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
