"use client";

/**
 * The AI Tutor, scoped to this course.
 *
 * Pick a module and the tutor teaches THAT module - the lesson is seeded from its own articles,
 * which is what `TutorSession.submodule` exists for. A learner who has had a session on a
 * module sees how long it ran, because that is a reading about them rather than a label.
 *
 * Nothing here scores a learner's grasp of a concept. The platform does not measure that, and
 * a confident-looking bar for it would be a drawing.
 */

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyBoard, JourneyNodeView } from "@/lib/types/adaptive-journey";
import { TutorAction } from "../spine/TutorAction";

function ModuleRow({ node, moduleNo, fieldTier }: { node: JourneyNodeView; moduleNo: number; fieldTier?: string | null }) {
  const t = node.tutor;
  const taught = t?.state === "done";
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.25}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
      sx={{ px: 2, py: 1.5, borderTop: "1px solid #f1f5f9", [PHONE]: { px: 1.5 } }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 32, height: 32, borderRadius: 2, flexShrink: 0, display: "grid",
            placeItems: "center", fontWeight: 800, fontSize: "0.8rem",
            color: taught ? "#15803d" : "#6d28d9", bgcolor: taught ? "#f0fdf4" : "#f5f3ff",
          }}
        >
          {taught ? <Icon icon="mdi:check" width={17} /> : String(moduleNo).padStart(2, "0")}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
            {node.title}
          </Typography>
          <Typography sx={{ fontSize: "0.76rem", color: "#94a3b8" }}>
            {taught
              ? t!.minutes > 0
                ? `${t!.minutes} min with the tutor`
                : `${t!.sessions} session${t!.sessions > 1 ? "s" : ""} with the tutor`
              : node.status === "locked"
                ? "Unlocks with the module"
                : "Not taught yet"}
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ flexShrink: 0 }}>
        <TutorAction node={node} level={fieldTier ?? undefined} />
      </Box>
    </Stack>
  );
}

export function TutorPanel({ board }: { board: JourneyBoard }) {
  const modules = board.weeks.flatMap((w) => w.nodes.filter((n) => n.type === "topic" && n.ref.submoduleId));
  const taught = modules.filter((m) => m.tutor?.state === "done");
  const minutes = taught.reduce((acc, m) => acc + (m.tutor?.minutes ?? 0), 0);

  return (
    <Box>
      <Box
        sx={{
          p: { xs: 2.5, md: 3 }, borderRadius: 4, mb: 2.5, color: "white",
          // ONE backgroundImage, with both gradients layered, and an explicit colour under
          // them. Written as `background:` followed by `backgroundImage:` the second silently
          // REPLACED the first - `background` is a shorthand that sets background-image - so
          // the dark panel vanished and the white heading sat on a near-white page.
          backgroundColor: "#1b0f38",
          backgroundImage: "radial-gradient(90% 120% at 100% 0%, rgba(192,38,211,0.3) 0%, transparent 60%), linear-gradient(135deg, #1b0f38 0%, #2d1659 55%, #46146b 100%)",
          [PHONE]: { p: 2 },
        }}
      >
        <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.9, color: "#d8b4fe", '[dir="rtl"] &': { letterSpacing: "normal" } }}>
          AI TUTOR
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.3rem", md: "1.6rem" }, mt: 0.5 }}>
          A tutor for every module of this course
        </Typography>
        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.74)", mt: 0.75, lineHeight: 1.5, maxWidth: 640 }}>
          Each lesson is built from that module&apos;s own material, so the tutor teaches what
          you are actually studying rather than a guess from its title.
        </Typography>
        {taught.length > 0 && (
          <Typography sx={{ fontSize: "0.82rem", color: "#d8b4fe", mt: 1.5, fontWeight: 700 }}>
            {taught.length} module{taught.length > 1 ? "s" : ""} taught
            {minutes > 0 ? ` · ${minutes} min so far` : ""}
          </Typography>
        )}
      </Box>

      <Box sx={{ borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff", overflow: "hidden" }}>
        <Typography sx={{ px: 2, pt: 1.75, pb: 1, fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.8, color: "#94a3b8", '[dir="rtl"] &': { letterSpacing: "normal" } }}>
          PICK A MODULE
        </Typography>
        {modules.map((m, i) => (
          <ModuleRow key={m.id} node={m} moduleNo={i + 1} fieldTier={board.course.fieldTier} />
        ))}
      </Box>
    </Box>
  );
}
