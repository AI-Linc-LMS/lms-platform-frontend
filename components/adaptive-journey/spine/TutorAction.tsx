"use client";

/**
 * "Teach me this" on a module of a course.
 *
 * The AI Tutor and the course had no connection at all before this: `TutorSession` recorded
 * content only as a free-text topic, and no course surface in the product linked to the
 * tutor. A learner stuck on week three had to leave the course, find the tutor, and type the
 * module's name in from memory — and the lesson they got was built from that title rather
 * than from the material they were stuck on.
 *
 * Rendered quietly, beside Continue rather than instead of it. The course is the lesson; the
 * tutor is the help. If this ever reads as the primary action, the hierarchy is wrong.
 */

import { ButtonBase, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useIsAiVoiceTutorEnabled } from "@/lib/contexts/ClientInfoContext";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";
import { tutorHrefForModule } from "../tutorHref";

export function TutorAction({ node, level }: { node: JourneyNodeView; level?: string }) {
  const enabled = useIsAiVoiceTutorEnabled();
  const { push, prefetch } = useInstantNavigation();
  const href = tutorHrefForModule(node, level);

  // Three ways this renders nothing, and all of them are silence rather than a disabled
  // control: a tenant without the tutor, a node with no module behind it, and an untitled
  // module. A greyed-out button would be an advert for a feature they cannot buy from here.
  if (!enabled || !href) return null;

  return (
    <Tooltip title="Have the AI Tutor walk you through this module">
      <ButtonBase
        // Stops at this button. It sits inside the module card, whose own click opens the
        // module - and the card's handler runs after this one, so without this the learner
        // was taken to the module they were trying to get the tutor to explain.
        onClick={(e) => {
          e.stopPropagation();
          push(href);
        }}
        onMouseEnter={() => prefetch(href)}
        onFocus={() => prefetch(href)}
        aria-label={`Learn ${node.title} with the AI Tutor`}
        sx={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.6,
          px: 1.5,
          py: 0.85,
          borderRadius: 2,
          fontWeight: 700,
          fontSize: "0.78rem",
          color: "var(--ai-violet, #7c3aed)",
          border: "1px solid color-mix(in srgb, var(--ai-violet, #7c3aed) 28%, transparent)",
          bgcolor: "color-mix(in srgb, var(--ai-violet, #7c3aed) 6%, transparent)",
          transition: "border-color .18s, background-color .18s",
          "&:hover": {
            borderColor: "var(--ai-violet, #7c3aed)",
            bgcolor: "color-mix(in srgb, var(--ai-violet, #7c3aed) 11%, transparent)",
          },
          "&:focus-visible": {
            outline: "2px solid var(--ai-violet, #7c3aed)",
            outlineOffset: 2,
          },
          [PHONE]: { minHeight: 44, fontSize: "0.85rem", borderRadius: 2.5, px: 1.75 },
        }}
      >
        <Icon icon="mdi:school-outline" width={16} />
        Learn with AI Tutor
      </ButtonBase>
    </Tooltip>
  );
}
