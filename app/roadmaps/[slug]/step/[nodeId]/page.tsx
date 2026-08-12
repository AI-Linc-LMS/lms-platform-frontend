"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { Surface } from "@/components/roadmaps/surfaces";
import { NODE_STATES } from "@/components/roadmaps/NodeStateMenu";
import {
  roadmapKeys,
  roadmapsService,
  type RoadmapNodeTarget,
  type SelfState,
} from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * One step of a roadmap.
 *
 * This route exists because a roadmap step used to open
 * `/adaptive-courses/{courseId}/submodule/{submoduleId}`, which frames the work as course
 * work: "Back to course", course points, journey sequencing. Roadmaps and adaptive courses are
 * separate products over the same content, and a learner who chose a roadmap should stay in it.
 *
 * What is roadmap-owned here: the framing, the position ("step 4 of 48"), moving to the next
 * step, and marking status. What is NOT forked: the article reader, the quiz engine and the
 * coding editor are shared runtimes, and a per-module copy of a Monaco editor would rot.
 * Those are opened with `?from=`, so their back control returns here rather than to the course.
 */
export default function RoadmapStepPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const nodeId = Number(params?.nodeId ?? 0);
  const { push } = useInstantNavigation();
  const qc = useQueryClient();

  const graphQuery = useQuery({
    queryKey: roadmapKeys.graph(slug),
    queryFn: () => roadmapsService.graph(slug),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(slug),
  });
  const detailQuery = useQuery({
    queryKey: roadmapKeys.node(slug, nodeId),
    queryFn: () => roadmapsService.node(slug, nodeId),
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(slug && nodeId),
  });
  const progressQuery = useQuery({
    queryKey: roadmapKeys.progress(slug),
    queryFn: () => roadmapsService.progress(slug),
    staleTime: 30 * 1000,
    enabled: Boolean(slug),
  });

  const setState = useMutation({
    mutationFn: (state: SelfState) => roadmapsService.setNodeState(slug, nodeId, state),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roadmapKeys.progress(slug) });
    },
  });

  const graph = graphQuery.data;
  const detail = detailQuery.data;
  const selfState = progressQuery.data?.nodes?.[nodeId]?.selfState ?? "pending";

  /** Leaf order across the whole map, so "next" means the next thing to actually do. */
  const leaves = useMemo(
    () => (graph?.nodes ?? []).filter((n) => n.kind === "subtopic"),
    [graph]
  );
  const current = leaves.find((n) => n.id === nodeId);
  const siblings = useMemo(
    () =>
      current?.parentId
        ? leaves.filter((n) => n.parentId === current.parentId && n.id !== nodeId)
        : [],
    [leaves, current, nodeId]
  );
  const roundTitle = useMemo(() => {
    const parent = (graph?.nodes ?? []).find((n) => n.id === current?.parentId);
    if (!parent) return "";
    const grand = (graph?.nodes ?? []).find((n) => n.id === parent.parentId);
    return grand?.title || parent.title;
  }, [graph, current]);

  const index = leaves.findIndex((n) => n.id === nodeId);
  const prev = index > 0 ? leaves[index - 1] : null;
  const next = index >= 0 && index < leaves.length - 1 ? leaves[index + 1] : null;

  const backToMap = () => push(`/roadmaps/${slug}`);

  /** Where a unit opens. The players are shared; only the return path is ours. */
  const unitHref = (t: RoadmapNodeTarget, kind: "article" | "quiz" | "coding") => {
    const from = encodeURIComponent(`/roadmaps/${slug}/step/${nodeId}`);
    const base = `/adaptive-courses/${t.courseId}/submodule/${t.submoduleId}`;
    const c = t.content ?? {};
    if (kind === "article" && c.articleId) return `${base}/article/${c.articleId}?from=${from}`;
    if (kind === "coding" && c.codingConfigId) return `${base}?from=${from}`;
    return `${base}?from=${from}`;
  };

  const target = detail?.opens?.[0];
  const content = target?.content ?? {};

  const units = [
    content.article && {
      key: "article",
      kind: "article" as const,
      label: "Read",
      icon: "solar:book-2-linear",
      title: content.articleTitle || "Article",
      meta: content.readingMinutes ? `~${content.readingMinutes} min read` : "Article",
      summary: content.articleSummary,
    },
    (content.questions ?? 0) > 0 && {
      key: "quiz",
      kind: "quiz" as const,
      label: "Practise",
      icon: "solar:checklist-minimalistic-linear",
      title: "Practice questions",
      meta: `${content.questions} questions`,
      summary: "",
    },
    (content.codingProblems ?? 0) > 0 && {
      key: "coding",
      kind: "coding" as const,
      label: "Solve",
      icon: "solar:code-square-linear",
      title: "Coding problems",
      meta: `${content.codingProblems} problems`,
      summary: "",
    },
  ].filter(Boolean) as {
    key: string;
    kind: "article" | "quiz" | "coding";
    label: string;
    icon: string;
    title: string;
    meta: string;
    summary?: string;
  }[];

  return (
    <PageShell>
      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 }, maxWidth: 1080, mx: "auto" }}>
        {/* Roadmap chrome. Deliberately NOT the course header: the learner is inside a
            roadmap and every control here returns them to it. */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 2, color: "var(--font-tertiary)", flexWrap: "wrap" }}
        >
          <Box
            component="button"
            onClick={backToMap}
            sx={{
              appearance: "none",
              border: "none",
              bgcolor: "transparent",
              font: "inherit",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "var(--font-secondary)",
              p: 0,
              "&:hover": { color: "var(--accent-purple)" },
            }}
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} />
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
              {graph?.pageTitle ?? "Back to roadmap"}
            </Typography>
          </Box>
          {index >= 0 && (
            <Typography sx={{ fontSize: "0.8rem" }}>
              · Step {index + 1} of {leaves.length}
            </Typography>
          )}
        </Stack>

        {detailQuery.isLoading && (
          <Typography sx={{ color: "var(--font-tertiary)" }}>Loading step...</Typography>
        )}

        {detailQuery.isError && (
          <Surface>
            <Typography sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Step not found
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: "0.85rem", color: "var(--font-tertiary)" }}>
              It may have been removed from this roadmap.
            </Typography>
          </Surface>
        )}

        {detail && (
          <Stack spacing={2.5}>
            <Surface>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "1.4rem",
                  color: "var(--font-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {detail.title}
              </Typography>
              {detail.summary && (
                <Typography
                  sx={{
                    mt: 0.75,
                    fontSize: "0.9rem",
                    color: "var(--font-secondary)",
                    lineHeight: 1.6,
                    maxWidth: 720,
                  }}
                >
                  {detail.summary}
                </Typography>
              )}

              {/* Status lives on the step, not only in the map's right-click menu, so a
                  learner who works through steps never has to go back to mark one. */}
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                {NODE_STATES.map((s) => {
                  const active = selfState === s.value;
                  return (
                    <Box
                      key={s.value}
                      component="button"
                      onClick={() => setState.mutate(active ? "pending" : s.value)}
                      sx={{
                        appearance: "none",
                        cursor: "pointer",
                        font: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 999,
                        border: "1px solid",
                        borderColor: active ? "var(--accent-purple)" : "var(--border-default)",
                        bgcolor: active
                          ? "color-mix(in srgb, var(--accent-purple) 8%, transparent)"
                          : "var(--card-bg)",
                        color: active ? "var(--accent-purple)" : "var(--font-secondary)",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                      }}
                    >
                      <Icon icon={s.icon} width={15} />
                      {active ? `${s.label} ✓` : s.label}
                    </Box>
                  );
                })}
              </Stack>
            </Surface>

            {target && !target.accessible && (
              <Surface>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Icon icon="solar:lock-keyhole-linear" width={18} />
                  <Typography sx={{ fontSize: "0.88rem", color: "var(--font-secondary)" }}>
                    This step is locked. It belongs to {target.courseTitle}, which your
                    institution has not opened for you yet.
                  </Typography>
                </Stack>
              </Surface>
            )}

            {units.length > 0 && target?.accessible && (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  // A lone unit spans the row rather than sitting in a half-width column
                  // beside nothing, which is the same dead space in miniature.
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: units.length === 1 ? "1fr" : "repeat(2, minmax(0,1fr))",
                  },
                }}
              >
                {units.map((u) => (
                  <Surface key={u.key} sx={{ display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid var(--border-default)",
                          bgcolor: "var(--surface)",
                          color: "var(--font-secondary)",
                        }}
                      >
                        <Icon icon={u.icon} width={17} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: "var(--font-primary)",
                          }}
                        >
                          {u.title}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}
                        >
                          {u.meta}
                        </Typography>
                      </Box>
                    </Stack>
                    {u.summary && (
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          color: "var(--font-secondary)",
                          lineHeight: 1.55,
                          mb: 1.5,
                        }}
                      >
                        {u.summary}
                      </Typography>
                    )}
                    <Box
                      component="button"
                      onClick={() => push(unitHref(target, u.kind))}
                      sx={{
                        mt: "auto",
                        alignSelf: "flex-start",
                        appearance: "none",
                        cursor: "pointer",
                        font: "inherit",
                        px: 1.75,
                        py: 0.85,
                        borderRadius: 999,
                        border: "none",
                        bgcolor: "var(--accent-purple)",
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                      }}
                    >
                      {u.label}
                    </Box>
                  </Surface>
                ))}
              </Box>
            )}

            {detail.resources.length > 0 && (
              <Surface>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-tertiary)",
                    mb: 1,
                  }}
                >
                  Read more
                </Typography>
                <Stack spacing={0.75}>
                  {detail.resources.map((r) => (
                    <Box
                      key={r.url}
                      component="a"
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: "0.85rem",
                        color: "var(--accent-purple)",
                        textDecoration: "underline",
                      }}
                    >
                      {r.title}
                    </Box>
                  ))}
                </Stack>
              </Surface>
            )}

            {siblings.length > 0 && (
              <Surface>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-tertiary)",
                    mb: 1.25,
                  }}
                >
                  {roundTitle ? `More in ${roundTitle}` : "More in this round"}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 0.75,
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))" },
                  }}
                >
                  {siblings.map((n) => {
                    const st = progressQuery.data?.nodes?.[n.id]?.selfState ?? "pending";
                    const marker = NODE_STATES.find((x) => x.value === st);
                    return (
                      <Box
                        key={n.id}
                        component="button"
                        onClick={() => push(`/roadmaps/${slug}/step/${n.id}`)}
                        sx={{
                          appearance: "none",
                          cursor: "pointer",
                          font: "inherit",
                          textAlign: "start",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.25,
                          py: 0.9,
                          borderRadius: 2,
                          border: "1px solid transparent",
                          bgcolor: "transparent",
                          color: "var(--font-secondary)",
                          fontSize: "0.85rem",
                          minWidth: 0,
                          "&:hover": {
                            borderColor: "var(--border-default)",
                            bgcolor: "var(--surface)",
                          },
                        }}
                      >
                        <Icon
                          icon={marker?.icon ?? "solar:record-linear"}
                          width={15}
                          color={st === "pending" ? "var(--font-tertiary)" : marker?.tone}
                        />
                        <Box
                          component="span"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.title}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Surface>
            )}

            {/* Move through the map without returning to it between every step. */}
            <Stack direction="row" spacing={1.5} sx={{ pt: 0.5, flexWrap: "wrap" }}>
              {prev && (
                <Box
                  component="button"
                  onClick={() => push(`/roadmaps/${slug}/step/${prev.id}`)}
                  sx={navBtn}
                >
                  <Icon icon="solar:alt-arrow-left-linear" width={15} />
                  Previous step
                </Box>
              )}
              {next && (
                <Box
                  component="button"
                  onClick={() => push(`/roadmaps/${slug}/step/${next.id}`)}
                  sx={{ ...navBtn, ml: "auto" }}
                >
                  Next step
                  <Icon icon="solar:alt-arrow-right-linear" width={15} />
                </Box>
              )}
            </Stack>
          </Stack>
        )}
      </Container>
    </PageShell>
  );
}

const navBtn = {
  appearance: "none",
  cursor: "pointer",
  font: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 0.6,
  px: 1.75,
  py: 0.85,
  borderRadius: 999,
  border: "1px solid var(--border-default)",
  bgcolor: "var(--card-bg)",
  color: "var(--font-secondary)",
  fontSize: "0.85rem",
  fontWeight: 500,
  "&:hover": { borderColor: "var(--accent-purple)", color: "var(--accent-purple)" },
} as const;
