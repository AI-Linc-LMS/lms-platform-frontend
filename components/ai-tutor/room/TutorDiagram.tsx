"use client";

/**
 * Every text node sets its colour explicitly. None may inherit.
 *
 * This component is hard-coded for a dark surface - white text, white hairlines - and it is
 * used on two very different grounds: the session room, which is dark, and the recap, which
 * is a LIGHT page that gives the diagram its own dark slab to sit on.
 *
 * Two labels here set no `color` at all. In the room they inherited white and looked right;
 * in the recap they inherited the page's dark body colour and rendered dark-on-dark at about
 * 1.09:1, which is why a tester reported that recap diagrams "are not visible" while images
 * were fine. The nodes were there the whole time.
 */

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

/**
 * Diagrams, drawn as our own SVG from a structured spec.
 *
 * The alternative was Mermaid. It is not currently a dependency, it costs a large lazy
 * chunk, and its default visual language fights a fixed violet design system that forbids
 * drop shadows and caps type weight at 600. Five structured kinds cover the large majority
 * of what a tutor actually draws, they render instantly, and they look like the rest of the
 * product.
 *
 * The model emits nodes and edges rather than a diagram language, which also means it
 * cannot emit something unrenderable.
 */

export type DiagramRole = "step" | "decision" | "start" | "end" | "note";
export type DiagramState = "good" | "bad" | "warning";

export interface DiagramNode {
  id: string;
  label: string;
  note?: string;
  /** What the box IS. Drawn as a SHAPE, so it survives without colour. */
  role?: DiagramRole;
  /** A verdict on the box. Drawn as colour AND a glyph, never colour alone. */
  state?: DiagramState;
  /** Nodes sharing a group are drawn inside one labelled container. */
  group?: string;
  /** The one box to look at first. Drawn as a ring. */
  emphasis?: boolean;
}

export interface DiagramEdge {
  source: string;
  target: string;
  label?: string;
}

export interface DiagramSpec {
  kind: "flow" | "layers" | "compare" | "timeline" | "tree";
  title?: string;
  nodes: DiagramNode[];
  edges?: DiagramEdge[];
}

/**
 * A node's meaning reaches the eye through THREE channels, not one.
 *
 * `role` picks the shape, `state` picks a colour that always arrives with its own glyph, and
 * `emphasis` draws a ring. They are separable on purpose: a learner who cannot distinguish the
 * state colours still reads the glyph, and a greyscale screenshot still shows the shapes.
 *
 * The old component had one rule - tint node index 0 - which is colour standing in for "first"
 * when position already says "first". That is decoration, and it is also the colour-only-meaning
 * pattern this design system forbids. `tone="accent"` is kept so callers that pass it still get
 * the old look, but nothing in here infers importance from position any more.
 */
const STATE_STYLE: Record<DiagramState, { glyph: string; color: string; border: string; bg: string }> = {
  good: { glyph: "✓", color: "#6ee7b7", border: "rgba(16,185,129,0.75)", bg: "rgba(16,185,129,0.14)" },
  bad: { glyph: "✕", color: "#fca5a5", border: "rgba(239,68,68,0.75)", bg: "rgba(239,68,68,0.14)" },
  warning: { glyph: "!", color: "#fcd34d", border: "rgba(245,158,11,0.75)", bg: "rgba(245,158,11,0.14)" },
};

function roleShape(role?: DiagramRole) {
  switch (role) {
    // A question that branches: cut corners, so it reads as a decision at a glance.
    case "decision":
      return { borderRadius: "4px", borderStyle: "solid", clip: true };
    // Where a process begins or ends: a pill, the universal terminator.
    case "start":
    case "end":
      return { borderRadius: "999px", borderStyle: "solid", clip: false };
    // An aside that is not itself a step.
    case "note":
      return { borderRadius: "10px", borderStyle: "dashed", clip: false };
    default:
      return { borderRadius: "10px", borderStyle: "solid", clip: false };
  }
}

function NodeBox({
  node,
  tone = "default",
}: {
  node: DiagramNode;
  tone?: "default" | "accent";
}) {
  const shape = roleShape(node.role);
  const state = node.state ? STATE_STYLE[node.state] : null;
  const accent = tone === "accent" && !state;
  return (
    <Box
      data-testid="diagram-node"
      data-role={node.role ?? "step"}
      data-state={node.state ?? ""}
      data-emphasis={node.emphasis ? "true" : "false"}
      sx={{
        px: 1.75,
        py: 1.25,
        borderRadius: shape.borderRadius,
        border: "1px solid",
        borderStyle: shape.borderStyle,
        borderColor: state
          ? state.border
          : accent
            ? "rgba(168,85,247,0.8)"
            : "rgba(255,255,255,0.18)",
        bgcolor: state ? state.bg : accent ? "rgba(168,85,247,0.16)" : "rgba(255,255,255,0.06)",
        minWidth: 108,
        textAlign: "center",
        ...(node.emphasis
          ? { boxShadow: "0 0 0 2px rgba(168,85,247,0.9)", position: "relative" }
          : null),
        ...(shape.clip
          ? { clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }
          : null),
      }}
    >
      <Typography
        sx={{ fontSize: "0.86rem", fontWeight: 500, lineHeight: 1.3, color: "#fff" }}
      >
        {state ? (
          <Box
            component="span"
            data-testid="diagram-state-glyph"
            aria-hidden="true"
            sx={{ color: state.color, fontWeight: 700, mr: 0.75 }}
          >
            {state.glyph}
          </Box>
        ) : null}
        {node.label}
      </Typography>
      {node.note ? (
        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.65)", mt: 0.25 }}>
          {node.note}
        </Typography>
      ) : null}
    </Box>
  );
}

/**
 * One full-width row of a `layers` diagram.
 *
 * Kept separate from `NodeBox` because a layer row is full-bleed by definition - it is a band in
 * a stack, not a box in a row - but it must still honour `state` and `emphasis`, or a node's
 * meaning would depend on which diagram kind it happened to land in.
 */
function LayerRow({ node }: { node: DiagramNode }) {
  const state = node.state ? STATE_STYLE[node.state] : null;
  return (
    <Box
      data-testid="diagram-node"
      data-role={node.role ?? "step"}
      data-state={node.state ?? ""}
      data-emphasis={node.emphasis ? "true" : "false"}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: "10px",
        border: "1px solid",
        borderStyle: node.role === "note" ? "dashed" : "solid",
        borderColor: state ? state.border : "rgba(255,255,255,0.16)",
        bgcolor: state ? state.bg : "rgba(255,255,255,0.06)",
        ...(node.emphasis ? { boxShadow: "0 0 0 2px rgba(168,85,247,0.9)" } : null),
      }}
    >
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 500, color: "#fff" }}>
        {state ? (
          <Box
            component="span"
            data-testid="diagram-state-glyph"
            aria-hidden="true"
            sx={{ color: state.color, fontWeight: 700, mr: 0.75 }}
          >
            {state.glyph}
          </Box>
        ) : null}
        {node.label}
      </Typography>
      {node.note ? (
        <Typography sx={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.65)" }}>
          {node.note}
        </Typography>
      ) : null}
    </Box>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 34,
        color: "rgba(255,255,255,0.65)",
      }}
    >
      {label ? (
        <Typography sx={{ fontSize: "0.85rem", mb: 0.25, color: "#fff" }}>
        {label}
      </Typography>
      ) : null}
      <Box component="svg" viewBox="0 0 34 10" sx={{ width: 34, height: 10 }}>
        <line x1="0" y1="5" x2="26" y2="5" stroke="currentColor" strokeWidth="1.25" />
        <polygon points="26,1.5 33,5 26,8.5" fill="currentColor" />
      </Box>
    </Box>
  );
}

export function TutorDiagram({ spec }: { spec: DiagramSpec }) {
  const nodes = Array.isArray(spec?.nodes) ? spec.nodes : [];
  if (!nodes.length) return null;

  const title = spec.title ? (
    <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, mb: 1.75, color: "#fff" }}>
      {spec.title}
    </Typography>
  ) : null;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = Array.isArray(spec.edges) ? spec.edges : [];

  if (spec.kind === "layers") {
    /**
     * `group` is what turns this from a list into a picture.
     *
     * Every node used to be a full-width row with the first one tinted - no containment, no
     * nesting, colour meaning "first". A learner asking why the labelled-parts diagram looked
     * like a list was right: it WAS a list. Nodes sharing a `group` are now drawn inside one
     * labelled container, and ungrouped nodes keep the old full-width row, so a spec written
     * before this change renders exactly as it did.
     */
    const blocks: { group: string | null; items: DiagramNode[] }[] = [];
    for (const node of nodes) {
      const g = node.group?.trim() || null;
      const last = blocks[blocks.length - 1];
      if (last && last.group !== null && last.group === g) last.items.push(node);
      else blocks.push({ group: g, items: [node] });
    }
    return (
      <Box>
        {title}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {blocks.map((block, bi) =>
            block.group ? (
              <Box
                key={`${block.group}-${bi}`}
                data-testid="diagram-group"
                sx={{
                  p: 1.25,
                  borderRadius: "12px",
                  border: "1px dashed rgba(255,255,255,0.28)",
                  bgcolor: "rgba(255,255,255,0.03)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.72)",
                    mb: 0.75,
                  }}
                >
                  {block.group}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {block.items.map((node) => (
                    <LayerRow key={node.id} node={node} />
                  ))}
                </Box>
              </Box>
            ) : (
              block.items.map((node) => <LayerRow key={node.id} node={node} />)
            ),
          )}
        </Box>
      </Box>
    );
  }

  if (spec.kind === "compare") {
    return (
      <Box>
        {title}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.min(nodes.length, 3)}, 1fr)` },
            gap: 1.5,
          }}
        >
          {/* Only fall back to "tint the first one" when the model sent no verdicts at all.
              Where it did send them, the states ARE the comparison and an extra positional
              tint would be a second, contradicting signal. */}
          {nodes.map((node, i) => (
            <NodeBox
              key={node.id}
              node={node}
              tone={!nodes.some((n) => n.state) && i === 0 ? "accent" : "default"}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (spec.kind === "timeline") {
    return (
      <Box>
        {title}
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {nodes.map((node, i) => (
            <Box key={node.id} sx={{ display: "flex", gap: 1.5 }}>
              <Box
                sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    bgcolor: "#a855f7",
                    mt: "6px",
                  }}
                />
                {i < nodes.length - 1 ? (
                  <Box sx={{ flex: 1, width: "1px", bgcolor: "rgba(255,255,255,0.18)" }} />
                ) : null}
              </Box>
              <Box sx={{ pb: i < nodes.length - 1 ? 2 : 0 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 500, color: "#fff" }}>
                  {node.label}
                </Typography>
                {node.note ? (
                  <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.65)" }}>
                    {node.note}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (spec.kind === "tree") {
    const rooted = nodes.filter((n) => !edges.some((e) => e.target === n.id));
    // Every node being a target means the edges describe a cycle. There is then no root to
    // start from, and the old code rendered an empty box - the learner asked for a picture and
    // got blank space. Start from the first node instead; `seen` stops the walk coming back.
    const roots = rooted.length ? rooted : nodes.slice(0, 1);
    const childrenOf = (id: string) =>
      edges
        .filter((e) => e.source === id)
        .map((e) => byId.get(e.target))
        .filter(Boolean) as DiagramNode[];

    /**
     * Recurse to the FULL depth of what the model sent.
     *
     * This used to render the root and exactly one level: `childrenOf(root.id)` was called and
     * never called again, so every grandchild the model sent was silently dropped. A tutor
     * drawing a three-level hierarchy got two levels and no indication anything was missing -
     * which reads as the model failing to answer, not the canvas truncating it.
     *
     * `seen` is not defensive dressing: an edge list is a free-form graph, so a model that
     * emits a cycle (or two nodes pointing at each other) would recurse until the room's tab
     * dies. A node is drawn once, on its first path from a root.
     */
    const renderNode = (node: DiagramNode, seen: Set<string>, depth: number): ReactNode => {
      if (seen.has(node.id) || depth > 6) return null;
      const nextSeen = new Set(seen).add(node.id);
      const kids = childrenOf(node.id).filter((k) => !nextSeen.has(k.id));
      return (
        <Box key={node.id} sx={{ textAlign: "center" }}>
          <NodeBox node={node} tone={depth === 0 ? "accent" : "default"} />
          {kids.length ? (
            <>
              <Box
                sx={{ height: 18, width: "1px", bgcolor: "rgba(255,255,255,0.18)", mx: "auto" }}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                {kids.map((child) => renderNode(child, nextSeen, depth + 1))}
              </Box>
            </>
          ) : null}
        </Box>
      );
    };

    return (
      <Box>
        {title}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          {roots.map((root) => renderNode(root, new Set<string>(), 0))}
        </Box>
      </Box>
    );
  }

  // flow (default): a left-to-right chain, wrapping on narrow screens.
  return (
    <Box>
      {title}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: "center",
        }}
      >
        {nodes.map((node, i) => (
          <Box key={node.id} sx={{ display: "flex", alignItems: "center" }}>
            <NodeBox node={node} tone={i === 0 ? "accent" : "default"} />
            {i < nodes.length - 1 ? (
              <Arrow label={edges.find((e) => e.source === node.id)?.label} />
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
