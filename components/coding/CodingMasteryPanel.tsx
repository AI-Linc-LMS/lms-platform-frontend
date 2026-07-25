"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import {
  adaptiveCodingService,
  type CodingStudentModel,
} from "@/lib/services/adaptive-coding.service";

/**
 * The learner's durable, cross-session coding mastery - the coding analogue of
 * the quiz SkillMasteryHeatmap. Surfaces the Student Model that On-Submit keeps
 * updating, plus any still-open misconceptions to re-test. ``refreshKey`` lets
 * the host re-fetch after a graded submit moves mastery.
 */

const BAND_COLOR: Record<string, string> = {
  emerging: "#ef4444",
  developing: "#f59e0b",
  proficient: "#6366f1",
  mastered: "#10b981",
};

const GAP_LABELS: Record<string, string> = {
  aggregation_logic: "Aggregation logic",
  off_by_one: "Off-by-one",
  edge_empty_input: "Edge-case blindness",
  mutation_vs_return: "Mutation vs. return",
  stub_not_implemented: "Unimplemented stub",
  missing_base_case: "Missing base case",
};

function gapLabel(id: string): string {
  return GAP_LABELS[id] ?? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CodingMasteryPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [model, setModel] = useState<CodingStudentModel | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await adaptiveCodingService.getStudentModel();
        if (!cancelled) setModel(m);
      } catch {
        /* non-fatal - the panel just stays hidden */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Nothing to show until the learner has at least one tracked skill.
  if (!loaded || !model || model.skills.length === 0) return null;

  return (
    <Box
      sx={{
        borderRadius: 3, overflow: "hidden",
        border: "1px solid color-mix(in srgb, #a855f7 22%, transparent)",
        background: "var(--card-bg, #fff)",
      }}
    >
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.25, flexWrap: "wrap",
          background: "linear-gradient(135deg, color-mix(in srgb,#a855f7 10%,transparent), color-mix(in srgb,#6366f1 6%,transparent))",
        }}
      >
        <AIPill icon={<Icon icon="mdi:chart-donut" width={12} />}>Your coding mastery</AIPill>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", flex: 1, minWidth: 180 }}>
          Updates when you <strong>Submit</strong> - up on a pass, down on a fail. Hints nudge it down.
        </Typography>
      </Box>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {model.skills.map((s) => {
          const color = BAND_COLOR[s.band] ?? "#6366f1";
          return (
            <Box key={s.skill} sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, flex: 1, minWidth: 96 }}>{s.skill}</Typography>
              <Box sx={{ flex: 1.5, height: 8, borderRadius: 999, background: "color-mix(in srgb, var(--border-default) 45%, transparent)", overflow: "hidden", minWidth: 70 }}>
                <Box sx={{ height: "100%", width: `${Math.max(3, s.mastery)}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, white))`, borderRadius: 999, transition: "width 500ms ease" }} />
              </Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, fontFamily: "monospace", color, width: 40, textAlign: "right" }}>
                {s.mastery}%
              </Typography>
              <Box
                sx={{
                  px: 0.85, py: 0.2, borderRadius: 999, fontSize: "0.64rem", fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.04em", color, background: `color-mix(in srgb, ${color} 12%, transparent)`, minWidth: 78, textAlign: "center",
                }}
              >
                {s.band}
              </Box>
            </Box>
          );
        })}
      </Box>
      {model.open_misconceptions.length > 0 && (
        <Box sx={{ px: 2, pb: 2, mt: -0.5 }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
            To re-test
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {model.open_misconceptions.slice(0, 6).map((m, i) => (
              <Box
                key={`${m.tag}-${i}`}
                sx={{
                  px: 0.9, py: 0.3, borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
                  color: "#f59e0b", background: "color-mix(in srgb, #f59e0b 12%, transparent)",
                }}
              >
                {gapLabel(m.tag)}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CodingMasteryPanel;
