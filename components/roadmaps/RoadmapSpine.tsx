"use client";

import { Fragment } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type {
  RoadmapGraph,
  RoadmapNode,
  RoadmapProgress,
} from "@/lib/services/roadmaps.service";
import { RM, SPINE_FILL, BRANCH_FILL } from "./roadmapTokens";

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

const INK = RM.ink;
const VIOLET = RM.rail;
const RAIL_STRONG = RM.rail;

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
  const s = (variant === "spine" ? SPINE_FILL : BRANCH_FILL)[state];
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
        px: variant === "spine" ? 2 : 1.4,
        py: variant === "spine" ? 1.05 : 0.7,
        borderRadius: 1.25,
        bgcolor: s.bg,
        // Hard outline + hard offset shadow, no blur. This pairing is what makes the canvas
        // read as a drawn poster rather than a list of cards.
        border: RM.border,
        boxShadow: RM.shadow(variant === "spine" ? 3 : 2),
        transition: "transform .1s ease, box-shadow .1s ease, filter .1s ease",
        // Hover presses the sticker toward the page instead of lifting it: the shadow shortens
        // as the box moves into it, which is the interaction the flat style implies.
        "&:hover": {
          transform: "translate(1px, 1px)",
          boxShadow: RM.shadow(variant === "spine" ? 2 : 1),
          filter: "brightness(1.04)",
        },
        "&:active": {
          transform: "translate(3px, 3px)",
          boxShadow: RM.shadow(0),
        },
        "&:focus-visible": { outline: `3px solid ${VIOLET}`, outlineOffset: 3 },
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
            fontSize: variant === "spine" ? 14 : 12.5,
            fontWeight: variant === "spine" ? 700 : 600,
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

/**
 * A fan of dotted curves from the spine step to EVERY branch it owns.
 *
 * The earlier version drew one arrow into whichever branch happened to sit at a fixed height,
 * which read as an incomplete connection pointing at an arbitrary child. roadmap.sh fans one
 * line per child and puts no arrowhead on them at all: the fan says "these belong to that", and
 * DIRECTION is carried by the spine arrows instead. Same split here.
 *
 * The SVG stretches to the branch stack's real height (preserveAspectRatio="none") so it stays
 * correct no matter how many branches there are or how many wrap to two lines.
 * `vectorEffect="non-scaling-stroke"` keeps the line weight constant despite that stretch.
 */
function BranchFan({ side, count }: { side: "left" | "right"; count: number }) {
  if (count <= 0) return null;
  const W = 44;
  // Each branch occupies an equal slice of the stack, so its centre is at (i + 0.5)/count.
  const targets = Array.from({ length: count }, (_, i) => ((i + 0.5) * 100) / count);

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: W,
        [side === "right" ? "left" : "right"]: -W,
        display: { xs: "none", md: "block" },
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} 100`}
        preserveAspectRatio="none"
        fill="none"
      >
        {targets.map((y, i) => (
          <path
            key={i}
            d={
              side === "right"
                ? `M0,50 C${W * 0.55},50 ${W * 0.45},${y} ${W},${y}`
                : `M${W},50 C${W * 0.45},50 ${W * 0.55},${y} 0,${y}`
            }
            stroke={RAIL_STRONG}
            strokeWidth="2.2"
            strokeDasharray="1 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.8}
          />
        ))}
      </svg>
    </Box>
  );
}

/**
 * A prose card beside the path: "Build a portfolio of projects" and friends.
 *
 * Deliberately NOT a step. It carries advice the map cannot express as something you tick, so
 * it must never enter the progress denominator -- the backend keeps `note` out of
 * TRACKABLE_NODE_KINDS for exactly that reason, and this component has no state control.
 */
function NoteCard({ node }: { node: RoadmapNode }) {
  const items = node.items ?? [];
  return (
    <Box
      sx={{
        maxWidth: 520,
        mx: "auto",
        my: 3.5,
        p: 2.25,
        borderRadius: 1.25,
        border: RM.border,
        bgcolor: "#fff",
        boxShadow: RM.shadow(4),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: items.length ? 1.5 : 0 }}>
        <Icon icon="solar:lightbulb-bolt-bold-duotone" width={19} color={VIOLET} />
        <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: INK }}>{node.title}</Typography>
      </Stack>
      <Stack spacing={1.25}>
        {items.map((it) => (
          <Box key={it.title}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: VIOLET }}>
              {it.title}
            </Typography>
            <Typography sx={{ fontSize: 12.75, color: "#475569", lineHeight: 1.55 }}>
              {it.text}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/** "Keep learning with the following relevant track." */
function RelatedTracks({
  related,
  onOpen,
}: {
  related: NonNullable<RoadmapGraph["related"]>;
  onOpen: (slug: string) => void;
}) {
  if (!related.length) return null;
  return (
    <Box
      sx={{
        maxWidth: 520, mx: "auto", mt: 4.5, p: 2.25, borderRadius: 1.25,
        border: RM.border, boxShadow: RM.shadow(4), bgcolor: "#fff", textAlign: "center",
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 800, color: INK, mb: 1.5 }}>
        Keep learning with the following relevant track
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        {related.map((r) => (
          <Box
            key={r.slug}
            component="button"
            onClick={() => onOpen(r.slug)}
            sx={{
              appearance: "none", font: "inherit", cursor: "pointer",
              px: 2.25, py: 1, borderRadius: 1.25,
              border: RM.border, boxShadow: RM.shadow(3),
              bgcolor: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 700,
              transition: "transform .1s ease, box-shadow .1s ease",
              "&:hover": { transform: "translate(1px,1px)", boxShadow: RM.shadow(2) },
              "&:active": { transform: "translate(3px,3px)", boxShadow: RM.shadow(0) },
              "&:focus-visible": { outline: `3px solid ${INK}`, outlineOffset: 3 },
            }}
          >
            {r.pageTitle}
          </Box>
        ))}
      </Stack>
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
        <path d="M8,0 L8,25" stroke={RAIL_STRONG} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M2.5,23 L8,32 L13.5,23" stroke={RAIL_STRONG} strokeWidth="3"
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
  dependsOn,
  onOpenNode,
}: {
  node: RoadmapNode;
  branches: RoadmapNode[];
  progress?: RoadmapProgress;
  side: "left" | "right";
  /** Steps in OTHER sections this one genuinely needs. Shown inline rather than as a drawn
   *  edge: a long line across a tall canvas is unreadable, while "needs: JavaScript" right
   *  under the box is not. */
  dependsOn: RoadmapNode[];
  onOpenNode: (n: RoadmapNode) => void;
}) {
  // position:relative so the fan can stretch to exactly this stack's height.
  const branchStack = (
    <Box sx={{ position: "relative", width: "100%", maxWidth: 260 }}>
      <BranchFan side={side} count={branches.length} />
      <Stack spacing={0.7}>
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
    </Box>
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
          pr: "44px",
        }}
      >
        {side === "left" && branches.length > 0 && branchStack}
      </Box>

      {/* Centre: the spine step */}
      <Box sx={{ width: { xs: "100%", md: 264 }, ml: { xs: 3.5, md: 0 } }}>
        <NodeBox
          node={node}
          variant="spine"
          progress={progress?.nodes?.[node.id]}
          onOpen={() => onOpenNode(node)}
        />
        {dependsOn.length > 0 && (
          <Stack
            direction="row" spacing={0.5} flexWrap="wrap" useFlexGap
            justifyContent="center" sx={{ mt: 0.75 }}
          >
            <Typography sx={{ fontSize: 10.5, color: "#94a3b8", alignSelf: "center" }}>
              needs
            </Typography>
            {dependsOn.map((d) => (
              <Chip
                key={d.id}
                label={d.title}
                size="small"
                onClick={() => onOpenNode(d)}
                icon={<Icon icon="solar:arrow-right-up-linear" width={11} />}
                sx={{
                  height: 19, fontSize: 10, cursor: "pointer",
                  bgcolor: "#f1f5f9", color: "#475569",
                  "&:hover": { bgcolor: "#ede9fe", color: "#5b21b6" },
                }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* Right cell */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "flex-start",
          alignItems: "center",
          width: "100%",
          pl: "44px",
        }}
      >
        {side === "right" && branches.length > 0 && branchStack}
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
  onOpenRoadmap,
}: {
  graph: RoadmapGraph;
  progress?: RoadmapProgress;
  onOpenNode: (node: RoadmapNode) => void;
  onOpenRoadmap?: (slug: string) => void;
}) {
  const sections = graph.nodes
    .filter((n) => n.kind === "milestone")
    .sort((a, b) => a.order - b.order);
  const childrenOf = (id: number) =>
    graph.nodes.filter((n) => n.parentId === id).sort((a, b) => a.order - b.order);

  // Resolved before render rather than by mutating a counter inside JSX (which
  // react-hooks/immutability rejects). Alternating across the WHOLE map, not per section, keeps
  // the canvas balanced when a section has an odd number of steps.
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  // "needs X" is read off the depends edges, so the graph data is the single source and the
  // chips can never drift from the topology the seeder declared.
  const dependsOn = (id: number) =>
    graph.edges
      .filter((e) => e.kind === "depends" && e.to === id)
      .map((e) => byId.get(e.from))
      .filter((n): n is RoadmapNode => Boolean(n));

  const notes = graph.nodes.filter((n) => n.kind === "note").sort((a, b) => a.order - b.order);

  const sideByNodeId = new Map<number, "left" | "right">();
  sections
    .flatMap((s) => childrenOf(s.id))
    .forEach((n, i) => sideByNodeId.set(n.id, i % 2 === 0 ? "right" : "left"));

  return (
    <Box sx={{ position: "relative", pb: 5 }}>
      {graph.legends.length > 0 && (
        <Box
          sx={{
            mb: 3.5, mx: "auto", width: "fit-content", minWidth: 210,
            border: RM.border, borderRadius: 1.25, boxShadow: RM.shadow(3),
            px: 2, py: 1.25, bgcolor: "#fff",
          }}
        >
          {graph.legends.map((lg) => (
            <Stack key={lg.id} direction="row" alignItems="center" spacing={1} sx={{ py: 0.3 }}>
              <Box
                sx={{
                  width: 17, height: 17, borderRadius: "50%", bgcolor: lg.color,
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}
              >
                <Icon icon="mdi:check-bold" width={11} color="#fff" />
              </Box>
              <Typography sx={{ fontSize: 12.5, color: INK, fontWeight: 500 }}>
                {lg.label}
              </Typography>
            </Stack>
          ))}
        </Box>
      )}

      {sections.map((section, si) => {
        const spineNodes = childrenOf(section.id);
        return (
          <Fragment key={section.id}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{ justifyContent: { md: "center" }, mt: si === 0 ? 0 : 3.5, mb: 2 }}
            >
              <Box
                sx={{
                  px: 2.25, py: 0.9, borderRadius: 1.25, flexShrink: 0,
                  bgcolor: "#fff", border: RM.border, boxShadow: RM.shadow(3),
                  display: "flex", alignItems: "center", gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 21, height: 21, borderRadius: "50%",
                    display: "grid", placeItems: "center",
                    bgcolor: INK, color: "#fff", fontSize: 11, fontWeight: 800,
                  }}
                >
                  {si + 1}
                </Box>
                <Typography sx={{ fontSize: 17, fontWeight: 800, color: INK }}>
                  {section.title}
                </Typography>
              </Box>
            </Stack>

            {spineNodes.map((node, ni) => (
              <Fragment key={node.id}>
                {ni > 0 && <RailArrow />}
                <SpineRow
                  node={node}
                  branches={childrenOf(node.id)}
                  progress={progress}
                  side={sideByNodeId.get(node.id) ?? "right"}
                  dependsOn={dependsOn(node.id)}
                  onOpenNode={onOpenNode}
                />
              </Fragment>
            ))}

            {si < sections.length - 1 && <RailArrow />}
          </Fragment>
        );
      })}

      {notes.map((n) => (
        <NoteCard key={n.id} node={n} />
      ))}

      {onOpenRoadmap && (
        <RelatedTracks related={graph.related ?? []} onOpen={onOpenRoadmap} />
      )}
    </Box>
  );
}
