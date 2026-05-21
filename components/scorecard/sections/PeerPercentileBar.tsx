"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { GlassCard, SectionHeader, EmptyState } from "@/components/scorecard/primitives";
import { fadeInUp } from "@/lib/motion/scorecard-presets";
import type { PeerPercentile } from "@/lib/types/scorecard.types";

interface PeerPercentileBarProps {
  data?: PeerPercentile;
}

export function PeerPercentileBar({ data }: PeerPercentileBarProps) {
  if (!data) return null;
  if (!data.available) {
    return (
      <EmptyState
        icon={<Users size={20} />}
        title="Cohort too small for ranking"
        description={data.reason ?? "We need at least 5 active learners in your cohort before showing percentile."}
      />
    );
  }

  const percentile = data.percentile ?? 0;
  const distribution = data.distribution ?? [];
  const maxBand = distribution.reduce((m, d) => Math.max(m, d.count), 1);

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <GlassCard padding="lg" radius="lg">
        <SectionHeader
          eyebrow="Cohort"
          title={`You're ahead of ${Math.round(percentile)}% of your cohort`}
          subtitle={`Rank ${data.rank} of ${data.cohortSize}${data.cohortSampled && data.cohortSampled < data.cohortSize ? ` (sampled ${data.cohortSampled})` : ""}.`}
          size="md"
        />

        {/* Distribution bell + you-are-here marker */}
        <div style={{ position: "relative", marginTop: 8 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${distribution.length || 5}, 1fr)`,
              gap: 6,
              height: 96,
              alignItems: "end",
              padding: "0 8px",
            }}
          >
            {distribution.map((band, i) => {
              const heightPct = (band.count / maxBand) * 100;
              const isOwn = belongsToBand(percentile, i, distribution.length);
              return (
                <div key={band.band} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPct}%`,
                      minHeight: 6,
                      borderRadius: "6px 6px 2px 2px",
                      background: isOwn ? "var(--sc-gradient-hero)" : "color-mix(in oklab, var(--sc-accent-primary) 22%, var(--sc-bg-overlay))",
                      border: isOwn ? "1px solid var(--sc-accent-primary)" : "none",
                      boxShadow: isOwn ? "0 0 16px var(--sc-accent-primary-glow)" : "none",
                      transition: "all 220ms ease",
                    }}
                    title={`${band.band} — ${band.count} learners`}
                  />
                  <span style={{ fontSize: 10, color: isOwn ? "var(--sc-accent-primary)" : "var(--sc-text-muted)", fontWeight: isOwn ? 700 : 500 }}>
                    {band.band}
                  </span>
                </div>
              );
            })}
          </div>

          {/* You-are-here pin */}
          <div
            style={{
              position: "absolute",
              left: `${Math.min(98, Math.max(2, percentile))}%`,
              top: -8,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                background: "var(--sc-accent-primary)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
                boxShadow: "var(--sc-shadow-soft)",
              }}
            >
              You · {Math.round(percentile)}%
            </span>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid var(--sc-accent-primary)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, color: "var(--sc-text-muted)", fontSize: 11 }}>
          <span>Score: {data.ownScore ?? 0}</span>
          <span>Cohort size · {data.cohortSize}</span>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function belongsToBand(percentile: number, bandIdx: number, totalBands: number): boolean {
  const width = 100 / Math.max(1, totalBands);
  const start = bandIdx * width;
  const end = start + width;
  return percentile >= start && percentile <= end;
}
