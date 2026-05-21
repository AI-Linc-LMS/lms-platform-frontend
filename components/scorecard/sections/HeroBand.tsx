"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Moon, Sun, GraduationCap, ChevronLeft, Share2, Check, Copy } from "lucide-react";
import { GlassCard, RingMeter, StreakFlame, useScorecardTheme } from "@/components/scorecard/primitives";
import { fadeInUp } from "@/lib/motion/scorecard-presets";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { PerformanceLevel, StatusBadge, StudentOverview } from "@/lib/types/scorecard.types";

interface HeroBandProps {
  overview: StudentOverview;
  currentStreak?: number;
  longestStreak?: number;
  onBack?: () => void;
  pdfMode?: boolean;
}

const GRADE_TO_RING: Record<PerformanceLevel, "primary" | "gold"> = {
  "Interview-Ready": "gold",
  Advanced: "gold",
  Intermediate: "primary",
  Beginner: "primary",
};

const GRADE_TO_GLOW: Record<PerformanceLevel, "indigo" | "gold"> = {
  "Interview-Ready": "gold",
  Advanced: "gold",
  Intermediate: "indigo",
  Beginner: "indigo",
};

const STATUS_STYLE: Record<StatusBadge, { bg: string; fg: string; label: string }> = {
  Green: { bg: "color-mix(in oklab, var(--sc-accent-success) 16%, transparent)", fg: "var(--sc-accent-success)", label: "On Track" },
  Amber: { bg: "color-mix(in oklab, var(--sc-accent-warning) 16%, transparent)", fg: "var(--sc-accent-warning)", label: "Picking Up Pace" },
  Red: { bg: "color-mix(in oklab, var(--sc-accent-danger) 16%, transparent)", fg: "var(--sc-accent-danger)", label: "Needs Attention" },
};

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function HeroBand({ overview, currentStreak, longestStreak, onBack, pdfMode = false }: HeroBandProps) {
  const { mode, toggle } = useScorecardTheme();
  const status = STATUS_STYLE[overview.statusBadge] ?? STATUS_STYLE.Amber;
  const ringGradient = GRADE_TO_RING[overview.overallGrade] ?? "primary";
  const cardGlow = GRADE_TO_GLOW[overview.overallGrade] ?? "indigo";
  const streak = currentStreak ?? overview.activeDaysStreak ?? 0;
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (copying) return;
    setCopying(true);
    setShareError(null);
    try {
      let url = shareUrl;
      if (!url) {
        const created = await scorecardService.createShareLink();
        url = created.url;
        setShareUrl(url);
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setShareError("Couldn't create share link.");
    } finally {
      setCopying(false);
    }
  }, [shareUrl, copying]);

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <GlassCard padding="lg" radius="xl" glow={cardGlow}>
        <div className="sc-hero-grid">
          <style jsx>{`
            .sc-hero-grid {
              display: grid;
              grid-template-columns: auto 1fr auto;
              gap: 24px;
              align-items: center;
            }
            @media (max-width: 900px) {
              .sc-hero-grid {
                grid-template-columns: 1fr;
                gap: 20px;
              }
              .sc-hero-grid > :nth-child(2) {
                justify-content: flex-start !important;
              }
              .sc-hero-grid > :nth-child(3) {
                align-items: flex-start !important;
                flex-direction: row !important;
                justify-content: space-between !important;
                width: 100%;
              }
            }
          `}</style>
          {/* Avatar + identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 999,
                overflow: "hidden",
                border: "2px solid var(--sc-border-strong)",
                boxShadow: "var(--sc-shadow-soft)",
                background: "var(--sc-gradient-hero)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 32,
                fontFamily: '"SF Mono", ui-monospace, Menlo, monospace',
                position: "relative",
              }}
            >
              {overview.profilePicUrl ? (
                <Image
                  src={overview.profilePicUrl}
                  alt={overview.studentName || "Profile"}
                  fill
                  sizes="88px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                getInitials(overview.studentName)
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sc-accent-primary)" }}>
                Learning Scorecard
              </span>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--sc-text-primary)" }}>
                {overview.studentName || "Welcome back"}
              </h1>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip icon={<GraduationCap size={12} />} label={overview.programName || "—"} />
                <Chip label={`Cohort · ${overview.cohort || "—"}`} subtle />
                {overview.currentWeek > 0 ? <Chip label={`Week ${overview.currentWeek}`} subtle /> : null}
              </div>
            </div>
          </div>

          {/* Score ring + streak */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <RingMeter
              value={overview.overallPerformanceScore}
              max={100}
              size={140}
              strokeWidth={11}
              gradient={ringGradient}
              label={overview.overallGrade}
              sublabel={`${overview.completionPercentage || 0}% complete`}
            />
            {streak > 0 ? <StreakFlame days={streak} longest={longestStreak} size="md" /> : null}
          </div>

          {/* Status + controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                background: status.bg,
                color: status.fg,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: status.fg }} aria-hidden />
              {status.label}
            </div>
            {!pdfMode ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <IconButton onClick={toggle} aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}>
                  {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </IconButton>
                <IconButton onClick={handleShare} aria-label={copied ? "Link copied" : "Copy shareable link"}>
                  {copied ? <Check size={16} color="var(--sc-accent-success)" /> : copying ? <Copy size={16} /> : <Share2 size={16} />}
                </IconButton>
                {onBack ? (
                  <IconButton onClick={onBack} aria-label="Back to dashboard">
                    <ChevronLeft size={16} />
                  </IconButton>
                ) : null}
              </div>
            ) : null}
            {shareError ? (
              <span role="alert" style={{ fontSize: 11, color: "var(--sc-accent-danger)", marginTop: 4 }}>
                {shareError}
              </span>
            ) : null}
            {copied ? (
              <span role="status" style={{ fontSize: 11, color: "var(--sc-accent-success)", marginTop: 4 }}>
                Link copied!
              </span>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function Chip({ label, icon, subtle }: { label: string; icon?: React.ReactNode; subtle?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: subtle ? "var(--sc-text-muted)" : "var(--sc-text-primary)",
        background: subtle ? "var(--sc-bg-overlay)" : "color-mix(in oklab, var(--sc-accent-primary) 12%, transparent)",
        border: subtle ? "1px solid var(--sc-border-subtle)" : "1px solid color-mix(in oklab, var(--sc-accent-primary) 30%, transparent)",
      }}
    >
      {icon ? <span aria-hidden style={{ display: "inline-flex" }}>{icon}</span> : null}
      {label}
    </span>
  );
}

function IconButton({ children, onClick, "aria-label": ariaLabel }: { children: React.ReactNode; onClick?: () => void; "aria-label": string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="sc-icon-btn"
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        border: "1px solid var(--sc-border-subtle)",
        background: "var(--sc-bg-elevated)",
        color: "var(--sc-text-secondary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
      }}
    >
      <style jsx>{`
        .sc-icon-btn:hover {
          background: var(--sc-bg-overlay);
          border-color: var(--sc-border-strong);
        }
        .sc-icon-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--sc-accent-primary-glow);
          border-color: var(--sc-accent-primary);
        }
      `}</style>
      {children}
    </button>
  );
}
