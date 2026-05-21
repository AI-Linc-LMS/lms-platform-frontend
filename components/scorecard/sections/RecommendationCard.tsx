"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ChevronRight,
  X,
  Check,
  BookOpenCheck,
  Brain,
  Mic,
  Code2,
  Zap,
} from "lucide-react";
import { GlassCard, SectionHeader, EmptyState } from "@/components/scorecard/primitives";
import { fadeInUp, staggerContainer } from "@/lib/motion/scorecard-presets";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { AIRecommendation, RecommendationAction } from "@/lib/types/scorecard.types";

interface RecommendationCardProps {
  initialRecommendations: AIRecommendation[];
}

const ACTION_ICON: Record<RecommendationAction, React.ReactNode> = {
  revisit_module: <BookOpenCheck size={16} />,
  take_quiz: <Brain size={16} />,
  attempt_mock: <Mic size={16} />,
  coding_practice: <Code2 size={16} />,
  generic: <Zap size={16} />,
};

const ACTION_LABEL: Record<RecommendationAction, string> = {
  revisit_module: "Revisit module",
  take_quiz: "Take a quiz",
  attempt_mock: "Run mock",
  coding_practice: "Practice coding",
  generic: "Get started",
};

export function RecommendationCard({ initialRecommendations }: RecommendationCardProps) {
  const [recs, setRecs] = useState<AIRecommendation[]>(initialRecommendations);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const fresh = await scorecardService.refreshAIRecommendations();
      setRecs(fresh);
    } catch (e) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 429) {
        setError("Just refreshed — try again in a few minutes.");
      } else {
        setError("Couldn't refresh right now.");
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDismiss = useCallback(async (id: number) => {
    setRecs((prev) => prev.filter((r) => r.id !== id));
    try {
      await scorecardService.dismissAIRecommendation(id);
    } catch {
      /* swallow — UI already removed it; next refresh will reconcile */
    }
  }, []);

  const handleComplete = useCallback(async (id: number) => {
    setRecs((prev) => prev.filter((r) => r.id !== id));
    try {
      await scorecardService.completeAIRecommendation(id);
    } catch {
      /* swallow */
    }
  }, []);

  if (recs.length === 0 && !refreshing) {
    return (
      <GlassCard padding="lg" radius="lg">
        <SectionHeader
          eyebrow="AI Coach"
          title="What to do next"
          size="md"
          cta={
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid var(--sc-accent-primary)",
                background: "color-mix(in oklab, var(--sc-accent-primary) 12%, transparent)",
                color: "var(--sc-accent-primary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: refreshing ? "wait" : "pointer",
              }}
            >
              <Sparkles size={14} />
              Generate
            </button>
          }
        />
        <EmptyState
          icon={<Sparkles size={20} />}
          title="No recommendations yet"
          description="Tap Generate to get personalized next actions from your AI coach."
          size="sm"
        />
        {error ? <ErrorBanner message={error} /> : null}
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="lg" radius="lg">
      <SectionHeader
        eyebrow="AI Coach"
        title="What to do next"
        subtitle="Personalized actions based on your recent activity."
        size="md"
        cta={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid var(--sc-border-subtle)",
              background: "var(--sc-bg-elevated)",
              color: "var(--sc-text-secondary)",
              fontSize: 12,
              fontWeight: 600,
              cursor: refreshing ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "sc-flame-flicker" : undefined} />
            Refresh
          </button>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        <AnimatePresence mode="popLayout">
          {recs.map((rec) => (
            <motion.div
              key={rec.id}
              variants={fadeInUp}
              layout
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
            >
              <RecCard rec={rec} onDismiss={() => handleDismiss(rec.id)} onComplete={() => handleComplete(rec.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </GlassCard>
  );
}

function RecCard({ rec, onDismiss, onComplete }: { rec: AIRecommendation; onDismiss: () => void; onComplete: () => void }) {
  const icon = ACTION_ICON[rec.actionType] ?? ACTION_ICON.generic;
  return (
    <div
      style={{
        padding: 16,
        borderRadius: "var(--sc-radius-md)",
        border: "1px solid var(--sc-border-subtle)",
        background: "var(--sc-bg-elevated)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        boxShadow: "var(--sc-shadow-soft)",
        transition: "border-color 200ms ease, transform 200ms ease",
        height: "100%",
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss recommendation"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: 999,
          border: "none",
          background: "transparent",
          color: "var(--sc-text-muted)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={14} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "color-mix(in oklab, var(--sc-accent-primary) 14%, transparent)",
            color: "var(--sc-accent-primary)",
            flexShrink: 0,
          }}
          aria-hidden
        >
          {icon}
        </span>
        <span style={{ fontSize: 11, color: "var(--sc-text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {ACTION_LABEL[rec.actionType] ?? "Action"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sc-text-primary)", lineHeight: 1.35 }}>
          {rec.title}
        </span>
        <span style={{ fontSize: 12, color: "var(--sc-text-secondary)", lineHeight: 1.55 }}>{rec.body}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {rec.source === "llm" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--sc-text-muted)" }}>
            <Sparkles size={10} />
            AI-generated
          </span>
        ) : (
          <span style={{ fontSize: 10, color: "var(--sc-text-muted)" }}>Suggested</span>
        )}
        <button
          type="button"
          onClick={onComplete}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid color-mix(in oklab, var(--sc-accent-success) 40%, transparent)",
            background: "color-mix(in oklab, var(--sc-accent-success) 12%, transparent)",
            color: "var(--sc-accent-success)",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Check size={12} />
          Done
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        margin: "8px 0 16px",
        padding: "8px 12px",
        borderRadius: "var(--sc-radius-sm)",
        background: "color-mix(in oklab, var(--sc-accent-danger) 10%, transparent)",
        color: "var(--sc-accent-danger)",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}
