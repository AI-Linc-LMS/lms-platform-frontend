"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import type { PracticeItem, PracticeKind } from "@/lib/services/adaptive-course.service";

/**
 * Says where a practice set's content came from.
 *
 * Practice draws from the Verified Content Library first and only asks a model to write what
 * the library could not supply, so one set is often part reused and part new. Presenting all
 * of it as "generated" understates the reused half; presenting all of it as "from the bank"
 * would be false. So the badge reports the actual split.
 *
 * Deliberately NOT `AIPill`. That component is the house marker for AI-generated content and
 * owns the indigo-violet-pink gradient; dressing verified library content in it would say the
 * opposite of what this badge exists to say. The AI case below does use that palette, which is
 * the point - the two sources should not look alike.
 *
 * Renders nothing when `source` is absent. A server that predates the library returns no
 * provenance at all, and silence is the only honest output then - guessing "AI" would be a
 * claim the page cannot support.
 */

const UNIT: Record<PracticeKind, [string, string]> = {
  quiz: ["question", "questions"],
  coding: ["problem", "problems"],
  article: ["explainer", "explainers"],
};

function plural(n: number, kind: PracticeKind): string {
  const [one, many] = UNIT[kind];
  return `${n} ${n === 1 ? one : many}`;
}

/** The sentence a learner reads. Exported for tests and for reuse in the detail surfaces. */
export function describeSource(item: Pick<PracticeItem, "kind" | "source" | "from_bank" | "from_ai">): string | null {
  const { source, kind } = item;
  if (!source) return null;
  const bank = item.from_bank ?? 0;
  const ai = item.from_ai ?? 0;
  if (source === "bank") return "From the question bank";
  if (source === "ai") return "Written for you";
  // mixed - the counts are the whole point, so lead with them.
  if (bank && ai) return `${plural(bank, kind)} from the bank · ${ai} newly written`;
  // "mixed" with a zero on one side should not happen, but a badge is not the place to argue
  // with the server. Fall back to whichever side is non-zero.
  if (bank) return "From the question bank";
  if (ai) return "Written for you";
  return null;
}

const PALETTE = {
  // Teal: verified, already-reviewed material. Distinct from the violet the product uses
  // everywhere for "a model made this".
  bank: { fg: "#0f766e", bg: "color-mix(in srgb, #14b8a6 12%, transparent)", border: "color-mix(in srgb, #14b8a6 34%, transparent)", icon: "mdi:book-check-outline" },
  ai: { fg: "#7c3aed", bg: "color-mix(in srgb, #a855f7 12%, transparent)", border: "color-mix(in srgb, #a855f7 32%, transparent)", icon: "mdi:auto-fix" },
  mixed: { fg: "#475569", bg: "color-mix(in srgb, #64748b 10%, transparent)", border: "color-mix(in srgb, #64748b 28%, transparent)", icon: "mdi:layers-outline" },
} as const;

export function PracticeSourceBadge({
  item,
}: {
  item: Pick<PracticeItem, "kind" | "source" | "from_bank" | "from_ai" | "related_topic">;
}) {
  const label = describeSource(item);
  if (!label || !item.source) return null;
  const tone = PALETTE[item.source];

  return (
    <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.9,
          py: 0.25,
          borderRadius: 999,
          color: tone.fg,
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          // The label can be a full sentence on a mixed set, so it must be allowed to wrap
          // inside a card rather than widen the grid track past the container.
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        <Icon icon={tone.icon} width={12} style={{ flexShrink: 0 }} />
        <Typography
          component="span"
          sx={{
            fontSize: "0.64rem",
            [PHONE]: { fontSize: "0.72rem" },
            fontWeight: 800,
            letterSpacing: "0.04em",
            lineHeight: 1.3,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {label}
        </Typography>
      </Box>

      {item.related_topic && (
        // The library had nothing on this exact lesson, so the set was filled from the wider
        // module. Saying so is the difference between "practice for this topic" and "practice
        // for something nearby", which a learner revising one lesson needs to know.
        <Typography
          component="span"
          sx={{
            fontSize: "0.64rem",
            [PHONE]: { fontSize: "0.72rem" },
            fontWeight: 700,
            color: "#94a3b8",
          }}
        >
          · related topic
        </Typography>
      )}
    </Stack>
  );
}

export default PracticeSourceBadge;
