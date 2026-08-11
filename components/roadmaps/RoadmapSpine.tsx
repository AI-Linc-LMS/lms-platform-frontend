"use client";

import { Fragment } from "react";
import { Box, Chip, Stack, Typography, useMediaQuery } from "@mui/material";
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

/** A step in the serpentine flow, with its branches stacked beneath it. */
function StepCell({
  node,
  branches,
  progress,
  dependsOn,
  onOpenNode,
}: {
  node: RoadmapNode;
  branches: RoadmapNode[];
  progress?: RoadmapProgress;
  /** Steps in OTHER sections this one needs. Shown as chips under the box rather than as a
   *  drawn edge: in a serpentine layout a dependency can be several rows away, and a line
   *  across that distance is unreadable and unroutable. */
  dependsOn: RoadmapNode[];
  onOpenNode: (n: RoadmapNode) => void;
}) {
  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <NodeBox
        node={node}
        variant="spine"
        progress={progress?.nodes?.[node.id]}
        onOpen={() => onOpenNode(node)}
      />

      {dependsOn.length > 0 && (
        <Stack direction="row" spacing={0.4} flexWrap="wrap" useFlexGap
               justifyContent="center" sx={{ mt: 0.6 }}>
          <Typography sx={{ fontSize: 10, color: "#94a3b8", alignSelf: "center" }}>
            needs
          </Typography>
          {dependsOn.map((d) => (
            <Chip
              key={d.id}
              label={d.title}
              size="small"
              onClick={() => onOpenNode(d)}
              sx={{
                height: 18, fontSize: 9.5, cursor: "pointer",
                bgcolor: "#f1f5f9", color: "#475569",
                "&:hover": { bgcolor: "#ede9fe", color: "#5b21b6" },
              }}
            />
          ))}
        </Stack>
      )}

      {branches.length > 0 && (
        <Box sx={{ position: "relative", mt: 1.25, pl: 1.5 }}>
          {/* A short drawn tick joining the step to its branch stack. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute", insetInlineStart: 4, top: -6, bottom: 8,
              width: 0, borderInlineStart: `2px dotted ${RAIL_STRONG}`, opacity: 0.7,
            }}
          />
          <Stack spacing={0.55}>
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
      )}
    </Box>
  );
}

/** Horizontal arrow between two steps in the same row, pointing the way the row flows. */
function RowArrow({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: { xs: "none", sm: "flex" },
        alignItems: "flex-start",
        pt: 2,
        flexShrink: 0,
        width: 34,
      }}
    >
      <svg width="34" height="16" viewBox="0 0 34 16" fill="none"
           style={{ transform: dir === "rtl" ? "scaleX(-1)" : undefined }}>
        <path d="M0,8 L26,8" stroke={RAIL_STRONG} strokeWidth="3" strokeLinecap="round" />
        <path d="M24,3 L32,8 L24,13" stroke={RAIL_STRONG} strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </Box>
  );
}

/**
 * The turn at the end of a row: a drawn elbow that drops to the next row and points back the
 * other way, which is what makes the serpentine read as one continuous path rather than as
 * separate rows.
 */
function RowTurn({ toward }: { toward: "left" | "right" }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        justifyContent: toward === "left" ? "flex-start" : "flex-end",
        py: 1,
        px: 2,
      }}
    >
      <svg width="120" height="44" viewBox="0 0 120 44" fill="none"
           style={{ transform: toward === "left" ? "scaleX(-1)" : undefined }}>
        <path
          d="M4,4 C4,26 40,10 60,22 C80,34 116,18 116,40"
          stroke={RAIL_STRONG}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M111,34 L116,42 L121,34" stroke={RAIL_STRONG} strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </Box>
  );
}

/**
 * A prose card beside the path: "Build a portfolio of projects" and friends.
 *
 * PLATFORM chrome, not canvas: it sits beside the map rather than being part of it, so it wears
 * the product's soft card language rather than the drawn one.
 *
 * Deliberately NOT a step. It carries advice the map cannot express as something you tick, so it
 * must never enter the progress denominator -- the backend keeps `note` out of
 * TRACKABLE_NODE_KINDS for exactly that reason, and this component has no state control.
 */
function NoteCard({ node }: { node: RoadmapNode }) {
  const items = node.items ?? [];
  return (
    <Box
      sx={{
        maxWidth: 560, mx: "auto", my: 4, p: 2.5, borderRadius: 2.5,
        border: "1px solid #e6e8ef", bgcolor: "#fff",
        boxShadow: "0 2px 10px rgba(15,23,42,.05)",
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

/** "Keep learning with the following relevant track." Platform chrome, same reasoning. */
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
        maxWidth: 560, mx: "auto", mt: 5, p: 2.5, borderRadius: 2.5,
        border: "1px solid #e6e8ef", boxShadow: "0 2px 10px rgba(15,23,42,.05)",
        bgcolor: "#fff", textAlign: "center",
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
              px: 2, py: 1, borderRadius: 2, border: "none",
              bgcolor: VIOLET, color: "#fff", fontSize: 13, fontWeight: 700,
              transition: "background-color .15s ease, transform .15s ease",
              "&:hover": { bgcolor: "#5b21b6", transform: "translateY(-2px)" },
              "&:focus-visible": { outline: `2px solid ${INK}`, outlineOffset: 2 },
            }}
          >
            {r.pageTitle}
          </Box>
        ))}
      </Stack>
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
  // Columns per row, and therefore where the path turns. Resolved with a media query rather
  // than CSS alone because the serpentine has to CHUNK the steps to know which rows reverse,
  // and a pure-CSS version would need a different nth-child rule per breakpoint.
  const wide = useMediaQuery("(min-width:1200px)");
  const mid = useMediaQuery("(min-width:900px)");
  const cols = wide ? 3 : mid ? 2 : 1;

  const sections = graph.nodes
    .filter((n) => n.kind === "milestone")
    .sort((a, b) => a.order - b.order);
  const childrenOf = (id: number) =>
    graph.nodes.filter((n) => n.parentId === id).sort((a, b) => a.order - b.order);

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const dependsOn = (id: number) =>
    graph.edges
      .filter((e) => e.kind === "depends" && e.to === id)
      .map((e) => byId.get(e.from))
      .filter((n): n is RoadmapNode => Boolean(n));

  const notes = graph.nodes.filter((n) => n.kind === "note").sort((a, b) => a.order - b.order);

  const chunk = (arr: RoadmapNode[]) => {
    const rows: RoadmapNode[][] = [];
    for (let i = 0; i < arr.length; i += cols) rows.push(arr.slice(i, i + cols));
    return rows;
  };

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
        const rows = chunk(childrenOf(section.id));
        return (
          <Fragment key={section.id}>
            <Stack
              direction="row"
              alignItems="center"
              sx={{ justifyContent: { md: "center" }, mt: si === 0 ? 0 : 4, mb: 2.25 }}
            >
              <Box
                sx={{
                  px: 2.25, py: 0.9, borderRadius: 1.25,
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

            {rows.map((row, ri) => {
              // Odd rows run right-to-left. `row-reverse` keeps DOM order equal to reading
              // order, so keyboard traversal and screen readers still follow the real sequence
              // even though the row is painted backwards.
              const rtl = ri % 2 === 1;
              return (
                <Fragment key={`${section.id}-${ri}`}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: rtl ? "row-reverse" : "row" },
                      alignItems: "flex-start",
                      justifyContent: "center",
                      gap: { xs: 1.5, sm: 0 },
                    }}
                  >
                    {row.map((node, ci) => (
                      <Fragment key={node.id}>
                        <Box sx={{ width: { xs: "100%", sm: 260 }, flexShrink: 0 }}>
                          <StepCell
                            node={node}
                            branches={childrenOf(node.id)}
                            progress={progress}
                            dependsOn={dependsOn(node.id)}
                            onOpenNode={onOpenNode}
                          />
                        </Box>
                        {ci < row.length - 1 && <RowArrow dir={rtl ? "rtl" : "ltr"} />}
                      </Fragment>
                    ))}
                  </Box>
                  {ri < rows.length - 1 && (
                    <RowTurn toward={rtl ? "right" : "left"} />
                  )}
                </Fragment>
              );
            })}
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
