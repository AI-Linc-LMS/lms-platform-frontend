"use client";

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

export interface DiagramNode {
  id: string;
  label: string;
  note?: string;
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

function NodeBox({
  node,
  tone = "default",
}: {
  node: DiagramNode;
  tone?: "default" | "accent";
}) {
  return (
    <Box
      sx={{
        px: 1.75,
        py: 1.25,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: tone === "accent" ? "rgba(168,85,247,0.8)" : "rgba(255,255,255,0.18)",
        bgcolor:
          tone === "accent" ? "rgba(168,85,247,0.16)" : "rgba(255,255,255,0.06)",
        minWidth: 108,
        textAlign: "center",
      }}
    >
      <Typography sx={{ fontSize: "0.86rem", fontWeight: 500, lineHeight: 1.3 }}>
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
        <Typography sx={{ fontSize: "0.85rem", mb: 0.25 }}>{label}</Typography>
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
    return (
      <Box>
        {title}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {nodes.map((node, i) => (
            <Box
              key={node.id}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.16)",
                bgcolor:
                  i === 0
                    ? "rgba(168,85,247,0.16)"
                    : "rgba(255,255,255,0.06)",
              }}
            >
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 500, color: "#fff" }}>
                {node.label}
              </Typography>
              {node.note ? (
                <Typography sx={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.65)" }}>
                  {node.note}
                </Typography>
              ) : null}
            </Box>
          ))}
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
          {nodes.map((node, i) => (
            <NodeBox key={node.id} node={node} tone={i === 0 ? "accent" : "default"} />
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
    const roots = nodes.filter((n) => !edges.some((e) => e.target === n.id));
    const childrenOf = (id: string) =>
      edges.filter((e) => e.source === id).map((e) => byId.get(e.target)).filter(Boolean) as DiagramNode[];
    return (
      <Box>
        {title}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          {roots.map((root) => (
            <Box key={root.id} sx={{ textAlign: "center" }}>
              <NodeBox node={root} tone="accent" />
              {childrenOf(root.id).length ? (
                <>
                  <Box
                    sx={{
                      height: 18,
                      width: "1px",
                      bgcolor: "rgba(255,255,255,0.18)",
                      mx: "auto",
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
                    {childrenOf(root.id).map((child) => (
                      <NodeBox key={child.id} node={child} />
                    ))}
                  </Box>
                </>
              ) : null}
            </Box>
          ))}
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
