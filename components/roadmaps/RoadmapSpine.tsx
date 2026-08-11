"use client";

import { Fragment } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type {
  RoadmapGraph,
  RoadmapNode,
  RoadmapProgress,
} from "@/lib/services/roadmaps.service";

/**
 * The map: a centre spine of primary steps with branch steps hanging off it, connected by
 * dotted rails. This is roadmap.sh's visual language, which works because it answers "where am
 * I and what comes next" at a glance.
 *
 * It is CSS, not a graph library. roadmap.sh hand-places absolute pixel coordinates on a fixed
 * canvas (1097px wide for /frontend), which is why their map is not responsive and why their
 * contributors cannot edit topology at all. Ours derives from (parent, order), so the same read
 * survives a phone, inherits RTL from `dir`, and needs no new dependency.
 *
 * Colour rule, taken from their renderer: node FILL carries progress state, so hierarchy is
 * carried by size and shade only. Text decoration doubles every state signal, so it survives
 * for colour-blind readers.
 */

type NodeState = "done" | "learning" | "skipped" | "pending";

const SPINE_STYLE: Record<NodeState, { bg: string; border: string; text: string; deco: string }> = {
  done: { bg: "#d1fae5", border: "#34d399", text: "#065f46", deco: "line-through" },
  learning: { bg: "#ddd6fe", border: "#a78bfa", text: "#4c1d95", deco: "underline" },
  skipped: { bg: "#e2e8f0", border: "#94a3b8", text: "#475569", deco: "line-through" },
  pending: { bg: "#fde68a", border: "#0f172a", text: "#0f172a", deco: "none" },
};

const BRANCH_STYLE: Record<NodeState, { bg: string; border: string; text: string; deco: string }> = {
  done: { bg: "#ecfdf5", border: "#6ee7b7", text: "#047857", deco: "line-through" },
  learning: { bg: "#f5f3ff", border: "#c4b5fd", text: "#5b21b6", deco: "underline" },
  skipped: { bg: "#f1f5f9", border: "#cbd5e1", text: "#64748b", deco: "line-through" },
  pending: { bg: "#fef3c7", border: "#0f172a", text: "#0f172a", deco: "none" },
};

const RAIL = "#2b78e4";

function NodeBox({
  node,
  progress,
  variant,
  onOpen,
}: {
  node: RoadmapNode;
  progress?: RoadmapProgress["nodes"][number];
  variant: "spine" | "branch";
  onOpen: () => void;
}) {
  const state = (progress?.selfState ?? "pending") as NodeState;
  const palette = variant === "spine" ? SPINE_STYLE : BRANCH_STYLE;
  const s = palette[state];
  const verified = progress?.verifiedComplete;

  return (
    <Box
      component="button"
      onClick={onOpen}
      title={node.title}
      sx={{
        appearance: "none",
        font: "inherit",
        cursor: "pointer",
        position: "relative",
        zIndex: 1,
        width: "100%",
        textAlign: "center",
        px: variant === "spine" ? 2 : 1.5,
        py: variant === "spine" ? 1.15 : 0.85,
        borderRadius: 1.5,
        bgcolor: s.bg,
        border: `1.7px solid ${s.border}`,
        boxShadow: variant === "spine" ? "2px 2px 0 rgba(15,23,42,.9)" : "1.5px 1.5px 0 rgba(15,23,42,.55)",
        transition: "transform .12s ease, filter .12s ease",
        "&:hover": { transform: "translateY(-1px)", filter: "brightness(0.97)" },
        "&:focus-visible": { outline: "2px solid #7c3aed", outlineOffset: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.6}>
        <Typography
          component="span"
          sx={{
            fontSize: variant === "spine" ? 14 : 12.5,
            fontWeight: variant === "spine" ? 700 : 500,
            color: s.text,
            textDecoration: s.deco,
            lineHeight: 1.35,
          }}
        >
          {node.title}
        </Typography>
        {verified && (
          <Icon icon="solar:verified-check-bold" width={15} color="#059669" aria-label="Verified" />
        )}
      </Stack>
      {!node.isRequired && variant === "spine" && (
        <Chip
          label="Optional"
          size="small"
          sx={{ mt: 0.5, height: 16, fontSize: 9.5, bgcolor: "#ffffffaa", color: "#475569" }}
        />
      )}
    </Box>
  );
}

/** One spine step plus its branches, laid out around a vertical rail. */
function SpineRow({
  node,
  branches,
  progress,
  side,
  onOpenNode,
}: {
  node: RoadmapNode;
  branches: RoadmapNode[];
  progress?: RoadmapProgress;
  side: "left" | "right";
  onOpenNode: (n: RoadmapNode) => void;
}) {
  const branchCol = (
    <Box
      sx={{
        display: branches.length ? "grid" : "none",
        gap: 0.75,
        alignContent: "center",
        // Dotted connector from the rail out to the branch stack, mirroring roadmap.sh's
        // topic-to-subtopic dashes.
        position: "relative",
        "&::before": branches.length
          ? {
              content: '""',
              position: "absolute",
              top: "50%",
              [side === "left" ? "right" : "left"]: -24,
              width: 24,
              borderTop: `2px dotted ${RAIL}`,
            }
          : undefined,
      }}
    >
      {branches.map((b) => (
        <NodeBox
          key={b.id}
          node={b}
          variant="branch"
          progress={progress?.nodes?.[b.id]}
          onOpen={() => onOpenNode(b)}
        />
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "grid",
        alignItems: "center",
        columnGap: 3,
        // Desktop: branches sit either side of a centre rail. Mobile: one column, branches
        // indented under their spine step, because a two-sided canvas is unreadable at 380px.
        gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 260px minmax(0,1fr)" },
        rowGap: { xs: 1, md: 0 },
        py: { xs: 1, md: 1.5 },
        position: "relative",
      }}
    >
      {/* The rail itself: a real continuous line behind the centre column. Drawn from
          structure rather than authored as decoration, so it can never desynchronise from the
          order the data actually declares. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          insetInlineStart: { xs: 13, md: "50%" },
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: RAIL,
          transform: { md: "translateX(-50%)" },
          zIndex: 0,
        }}
      />

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        {side === "left" ? branchCol : null}
      </Box>

      <Box sx={{ position: "relative", zIndex: 1, ml: { xs: 4, md: 0 } }}>
        <NodeBox
          node={node}
          variant="spine"
          progress={progress?.nodes?.[node.id]}
          onOpen={() => onOpenNode(node)}
        />
      </Box>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        {side === "right" ? branchCol : null}
      </Box>

      {/* Mobile branch stack. */}
      <Box
        sx={{
          display: { xs: branches.length ? "grid" : "none", md: "none" },
          gap: 0.6,
          ml: 6,
        }}
      >
        {branches.map((b) => (
          <NodeBox
            key={b.id}
            node={b}
            variant="branch"
            progress={progress?.nodes?.[b.id]}
            onOpen={() => onOpenNode(b)}
          />
        ))}
      </Box>
    </Box>
  );
}

export function RoadmapSpine({
  graph,
  progress,
  onOpenNode,
}: {
  graph: RoadmapGraph;
  progress?: RoadmapProgress;
  onOpenNode: (node: RoadmapNode) => void;
}) {
  const sections = graph.nodes
    .filter((n) => n.kind === "milestone")
    .sort((a, b) => a.order - b.order);
  const childrenOf = (id: number) =>
    graph.nodes.filter((n) => n.parentId === id).sort((a, b) => a.order - b.order);

  // Which side each spine step's branches sit on, resolved BEFORE render rather than by
  // incrementing a counter inside the JSX. Alternating across the whole map (not per section)
  // is what keeps the canvas visually balanced when a section has an odd number of steps.
  const sideByNodeId = new Map<number, "left" | "right">();
  sections
    .flatMap((s) => childrenOf(s.id))
    .forEach((n, i) => sideByNodeId.set(n.id, i % 2 === 0 ? "right" : "left"));

  return (
    <Box sx={{ position: "relative", pb: 4 }}>
      {graph.legends.length > 0 && (
        <Box
          sx={{
            mb: 3,
            mx: "auto",
            maxWidth: 340,
            border: "1.7px solid #0f172a",
            borderRadius: 1.5,
            p: 1.5,
            bgcolor: "#fff",
          }}
        >
          {graph.legends.map((lg) => (
            <Stack key={lg.id} direction="row" alignItems="center" spacing={1} sx={{ py: 0.25 }}>
              <Box
                sx={{
                  width: 15, height: 15, borderRadius: "50%", bgcolor: lg.color,
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}
              >
                <Icon icon="mdi:check" width={11} color="#fff" />
              </Box>
              <Typography sx={{ fontSize: 12.5, color: "#0f172a" }}>{lg.label}</Typography>
            </Stack>
          ))}
        </Box>
      )}

      {sections.map((section) => {
        const spineNodes = childrenOf(section.id);
        return (
          <Fragment key={section.id}>
            <Box sx={{ position: "relative", py: 2, textAlign: { xs: "start", md: "center" } }}>
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  insetInlineStart: { xs: 13, md: "50%" },
                  top: 0,
                  bottom: 0,
                  width: 3,
                  bgcolor: RAIL,
                  transform: { md: "translateX(-50%)" },
                  zIndex: 0,
                }}
              />
              <Typography
                component="h2"
                sx={{
                  position: "relative",
                  zIndex: 1,
                  display: "inline-block",
                  bgcolor: "#fbfbfd",
                  px: 2,
                  ml: { xs: 4, md: 0 },
                  fontSize: 21,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {section.title}
              </Typography>
            </Box>

            {spineNodes.map((node) => (
              <SpineRow
                key={node.id}
                node={node}
                branches={childrenOf(node.id)}
                progress={progress}
                side={sideByNodeId.get(node.id) ?? "right"}
                onOpenNode={onOpenNode}
              />
            ))}
          </Fragment>
        );
      })}
    </Box>
  );
}
