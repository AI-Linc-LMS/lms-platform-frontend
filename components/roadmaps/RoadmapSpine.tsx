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
 * The map: a centre spine of primary steps with branch steps hanging off it on curved
 * connectors, and arrowheads showing which way to travel.
 *
 * CSS + inline SVG, no graph library. roadmap.sh hand-places absolute pixel coordinates on a
 * fixed 1097px canvas, which is exactly why theirs is not responsive and why their contributors
 * cannot edit topology. Ours derives from (parent, order), so the two-sided canvas collapses to
 * one indented column under md, and RTL comes free from `dir`.
 *
 * Palette is the PLATFORM's (violet #7c3aed, ink #0f172a, canvas #fbfbfd), not roadmap.sh's
 * yellow-and-blue. Their yellow is a brand asset of theirs and read as a foreign object here.
 * The mechanic worth keeping from them is the rule, not the hue: node FILL carries progress
 * state, so hierarchy is carried by size and weight only, and every state also changes text
 * decoration so it survives for colour-blind readers.
 */

type NodeState = "done" | "learning" | "skipped" | "pending";

const INK = "#0f172a";
const VIOLET = "#7c3aed";
const RAIL = "#c7bdf2";
const RAIL_STRONG = "#7c3aed";

const SPINE_STYLE: Record<NodeState, { bg: string; border: string; text: string; deco: string }> = {
  // Untouched = the platform violet, so the path you have not walked reads as the brand.
  pending: { bg: "#ede9fe", border: VIOLET, text: "#4c1d95", deco: "none" },
  learning: { bg: "#fce7f3", border: "#ec4899", text: "#9d174d", deco: "underline" },
  done: { bg: "#d1fae5", border: "#059669", text: "#065f46", deco: "line-through" },
  skipped: { bg: "#f1f5f9", border: "#94a3b8", text: "#64748b", deco: "line-through" },
};

const BRANCH_STYLE: Record<NodeState, { bg: string; border: string; text: string; deco: string }> = {
  pending: { bg: "#faf8ff", border: "#ddd6fe", text: INK, deco: "none" },
  learning: { bg: "#fdf2f8", border: "#fbcfe8", text: "#9d174d", deco: "underline" },
  done: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", deco: "line-through" },
  skipped: { bg: "#f8fafc", border: "#e2e8f0", text: "#94a3b8", deco: "line-through" },
};

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
  const s = (variant === "spine" ? SPINE_STYLE : BRANCH_STYLE)[state];
  const verified = progress?.verifiedComplete;

  return (
    <Box
      component="button"
      onClick={onOpen}
      sx={{
        appearance: "none",
        font: "inherit",
        cursor: "pointer",
        position: "relative",
        zIndex: 2,
        width: "100%",
        textAlign: variant === "spine" ? "center" : "start",
        px: variant === "spine" ? 2.25 : 1.5,
        py: variant === "spine" ? 1.3 : 0.85,
        borderRadius: 2,
        bgcolor: s.bg,
        border: `1.5px solid ${s.border}`,
        boxShadow:
          variant === "spine"
            ? "0 4px 14px rgba(124,58,237,.16)"
            : "0 1px 3px rgba(15,23,42,.05)",
        transition: "transform .14s ease, box-shadow .14s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            variant === "spine"
              ? "0 8px 22px rgba(124,58,237,.26)"
              : "0 4px 12px rgba(15,23,42,.10)",
        },
        "&:focus-visible": { outline: `2px solid ${VIOLET}`, outlineOffset: 3 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={variant === "spine" ? "center" : "flex-start"}
        spacing={0.7}
      >
        <Typography
          component="span"
          sx={{
            fontSize: variant === "spine" ? 14.5 : 12.75,
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
          sx={{ mt: 0.6, height: 17, fontSize: 9.5, bgcolor: "#ffffffcc", color: "#64748b" }}
        />
      )}
    </Box>
  );
}

/** A curved connector from the rail out to the branch stack, with an arrowhead. */
function CurvedConnector({ side, id }: { side: "left" | "right"; id: string }) {
  // Drawn right-to-left when the branches sit on the left, so the arrow always points AT the
  // branches -- the direction the reader travels.
  const d = side === "right" ? "M0,40 C24,40 24,8 46,8" : "M46,40 C22,40 22,8 0,8";
  return (
    <Box
      aria-hidden
      sx={{ display: { xs: "none", md: "block" }, width: 48, height: 48, flexShrink: 0 }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <defs>
          <marker
            id={`arrow-${id}`}
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L6,3.5 L0,7 z" fill={RAIL_STRONG} />
          </marker>
        </defs>
        <path
          d={d}
          stroke={RAIL_STRONG}
          strokeWidth="1.8"
          strokeDasharray="4 4"
          strokeLinecap="round"
          markerEnd={`url(#arrow-${id})`}
        />
      </svg>
    </Box>
  );
}

/** The rail segment between two spine steps, carrying a downward arrow. */
function RailArrow() {
  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        justifyContent: { xs: "flex-start", md: "center" },
        pl: { xs: "6px", md: 0 },
        py: 0.5,
      }}
    >
      <svg width="16" height="34" viewBox="0 0 16 34" fill="none">
        <path d="M8,0 L8,26" stroke={RAIL} strokeWidth="3" strokeLinecap="round" />
        <path d="M3,24 L8,32 L13,24" stroke={RAIL_STRONG} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </Box>
  );
}

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
  const branchStack = (
    <Stack spacing={0.7} sx={{ width: "100%", maxWidth: 260 }}>
      {branches.map((b) => (
        <NodeBox
          key={b.id}
          node={b}
          variant="branch"
          progress={progress?.nodes?.[b.id]}
          onOpen={() => onOpenNode(b)}
        />
      ))}
    </Stack>
  );

  return (
    <Box
      sx={{
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" },
        justifyItems: { md: "center" },
        rowGap: { xs: 1, md: 0 },
      }}
    >
      {/* Left cell */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "flex-end",
          alignItems: "center",
          width: "100%",
          gap: 0,
        }}
      >
        {side === "left" && branches.length > 0 && (
          <>
            {branchStack}
            <CurvedConnector side="left" id={`l${node.id}`} />
          </>
        )}
      </Box>

      {/* Centre: the spine step */}
      <Box sx={{ width: { xs: "100%", md: 264 }, ml: { xs: 3.5, md: 0 } }}>
        <NodeBox
          node={node}
          variant="spine"
          progress={progress?.nodes?.[node.id]}
          onOpen={() => onOpenNode(node)}
        />
      </Box>

      {/* Right cell */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "flex-start",
          alignItems: "center",
          width: "100%",
        }}
      >
        {side === "right" && branches.length > 0 && (
          <>
            <CurvedConnector side="right" id={`r${node.id}`} />
            {branchStack}
          </>
        )}
      </Box>

      {/* Mobile: branches indented under their step, since a two-sided canvas is unreadable
          at 380px and a pannable one competes with page scroll. */}
      <Box sx={{ display: { xs: "block", md: "none" }, ml: 5.5, mt: 0.5 }}>
        {branches.length > 0 && (
          <Stack spacing={0.6}>
            {branches.map((b) => (
              <NodeBox
                key={b.id}
                node={b}
                variant="branch"
                progress={progress?.nodes?.[b.id]}
                onOpen={() => onOpenNode(b)}
              />
            ))}
          </Stack>
        )}
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

  // Resolved before render rather than by mutating a counter inside JSX (which
  // react-hooks/immutability rejects). Alternating across the WHOLE map, not per section, keeps
  // the canvas balanced when a section has an odd number of steps.
  const sideByNodeId = new Map<number, "left" | "right">();
  sections
    .flatMap((s) => childrenOf(s.id))
    .forEach((n, i) => sideByNodeId.set(n.id, i % 2 === 0 ? "right" : "left"));

  return (
    <Box sx={{ position: "relative", pb: 5 }}>
      {graph.legends.length > 0 && (
        <Stack
          direction="row"
          spacing={2.5}
          justifyContent="center"
          flexWrap="wrap"
          useFlexGap
          sx={{
            mb: 3, mx: "auto", width: "fit-content",
            border: "1px solid #e6e8ef", borderRadius: 2, px: 2, py: 1, bgcolor: "#fff",
          }}
        >
          {graph.legends.map((lg) => (
            <Stack key={lg.id} direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: lg.color }} />
              <Typography sx={{ fontSize: 12, color: "#475569" }}>{lg.label}</Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {sections.map((section, si) => {
        const spineNodes = childrenOf(section.id);
        return (
          <Fragment key={section.id}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{ justifyContent: { md: "center" }, mt: si === 0 ? 0 : 3, mb: 1.5 }}
            >
              <Box
                sx={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  display: "grid", placeItems: "center",
                  bgcolor: INK, color: "#fff", fontSize: 12, fontWeight: 700,
                }}
              >
                {si + 1}
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: INK }}>
                {section.title}
              </Typography>
            </Stack>

            {spineNodes.map((node, ni) => (
              <Fragment key={node.id}>
                {ni > 0 && <RailArrow />}
                <SpineRow
                  node={node}
                  branches={childrenOf(node.id)}
                  progress={progress}
                  side={sideByNodeId.get(node.id) ?? "right"}
                  onOpenNode={onOpenNode}
                />
              </Fragment>
            ))}

            {si < sections.length - 1 && <RailArrow />}
          </Fragment>
        );
      })}
    </Box>
  );
}
