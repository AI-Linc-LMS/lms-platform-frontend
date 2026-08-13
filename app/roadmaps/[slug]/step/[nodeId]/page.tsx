"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { Surface } from "@/components/roadmaps/surfaces";
import { NODE_STATES } from "@/components/roadmaps/NodeStateMenu";
import {
  roadmapKeys,
  roadmapsService,
  type SelfState,
} from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { stepUnitHref } from "@/lib/roadmap-step-links";

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

  const roundLeaves = useMemo(
    () => (current?.parentId ? leaves.filter((n) => n.parentId === current.parentId) : []),
    [leaves, current]
  );
  const roundDone = roundLeaves.filter((n) => {
    const st = progressQuery.data?.nodes?.[n.id]?.selfState;
    return st === "done" || st === "skipped";
  }).length;

  const index = leaves.findIndex((n) => n.id === nodeId);
  const prev = index > 0 ? leaves[index - 1] : null;
  const next = index >= 0 && index < leaves.length - 1 ? leaves[index + 1] : null;

  const backToMap = () => push(`/roadmaps/${slug}`);

  const target = detail?.opens?.[0];
  const heroIcon = (() => {
    const c = target?.content ?? {};
    if ((c.codingProblems ?? 0) > 0) return "solar:code-square-bold-duotone";
    if ((c.questions ?? 0) > 0) return "solar:checklist-minimalistic-bold-duotone";
    return "solar:book-2-bold-duotone";
  })();
  const content = target?.content ?? {};

  const units = [
    content.article && content.articleId && {
      key: "article",
      kind: "article" as const,
      label: "Read",
      icon: "solar:book-2-linear",
      title: content.articleTitle || "Article",
      meta: content.readingMinutes ? `~${content.readingMinutes} min read` : "Article",
      summary: content.articleSummary,
    },
    (content.questions ?? 0) > 0 && content.quizConfigId && {
      key: "quiz",
      kind: "quiz" as const,
      label: "Practise",
      icon: "solar:checklist-minimalistic-linear",
      title: "Practice questions",
      meta: `${content.questions} questions`,
      summary: "",
    },
    (content.codingProblems ?? 0) > 0 && content.codingProblemId && {
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
      <ModulePageHeader
        eyebrow={graph?.pageTitle ?? "Roadmap"}
        title={detail?.title ?? "Step"}
        description={detail?.summary}
        accent="purple"
        icon={heroIcon}
        action={
          <HeaderActionButton
            variant="ghost"
            icon="solar:map-point-wave-linear"
            onClick={backToMap}
          >
            Back to the map
          </HeaderActionButton>
        }
        hideGuide
      />

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 }, maxWidth: 1080, mx: "auto" }}>
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

        {detail && roundLeaves.length > 1 && (
          <Surface sx={{ mb: 2.5, py: 1.75 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography
                sx={{
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                }}
              >
                {roundTitle || "This round"}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)" }}>
                {roundDone} of {roundLeaves.length} marked
              </Typography>
            </Stack>
            {/* One segment per step. The current step is the tall one, so position is
                readable at a glance without counting. */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "flex-end" }}>
              {roundLeaves.map((n) => {
                const st = progressQuery.data?.nodes?.[n.id]?.selfState ?? "pending";
                const isCurrent = n.id === nodeId;
                const filled = st === "done" || st === "learning";
                return (
                  <Box
                    key={n.id}
                    component="button"
                    aria-label={n.title}
                    onClick={() => push(`/roadmaps/${slug}/step/${n.id}`)}
                    title={n.title}
                    sx={{
                      appearance: "none",
                      border: "none",
                      cursor: "pointer",
                      p: 0,
                      flex: 1,
                      minWidth: 4,
                      height: isCurrent ? 14 : 8,
                      borderRadius: 999,
                      bgcolor: isCurrent
                        ? "var(--accent-purple)"
                        : filled
                          ? "color-mix(in srgb, var(--accent-purple) 45%, transparent)"
                          : "var(--border-default)",
                      "&:hover": {
                        bgcolor: isCurrent
                          ? "var(--accent-purple)"
                          : "color-mix(in srgb, var(--accent-purple) 70%, transparent)",
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Surface>
        )}

        {detail && (
          <Stack spacing={2.5}>
            <Surface>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ flexWrap: "wrap", rowGap: 1 }}
              >
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-secondary)",
                  }}
                >
                  Mark this step
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  {NODE_STATES.map((st) => {
                    const active = selfState === st.value;
                    return (
                      <Box
                        key={st.value}
                        component="button"
                        onClick={() => setState.mutate(active ? "pending" : st.value)}
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
                          borderColor: active
                            ? "var(--accent-purple)"
                            : "var(--border-default)",
                          bgcolor: active
                            ? "color-mix(in srgb, var(--accent-purple) 10%, transparent)"
                            : "var(--card-bg)",
                          color: active ? "var(--accent-purple)" : "var(--font-primary)",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                        }}
                      >
                        <Icon icon={st.icon} width={15} />
                        {st.label}
                      </Box>
                    );
                  })}
                </Stack>
                {index >= 0 && (
                  <Typography
                    sx={{
                      ml: "auto",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "var(--font-secondary)",
                    }}
                  >
                    Step {index + 1} of {leaves.length}
                  </Typography>
                )}
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
                          bgcolor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
                          color: "var(--accent-purple)",
                        }}
                      >
                        <Icon icon={u.icon} width={17} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: "1rem",
                            color: "var(--font-primary)",
                          }}
                        >
                          {u.title}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--font-secondary)" }}
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
                      onClick={() => {
                        const href = stepUnitHref(
                          target,
                          u.kind,
                          `/roadmaps/${slug}/step/${nodeId}`
                        );
                        if (href) push(href);
                      }}
                      sx={{
                        mt: "auto",
                        alignSelf: "flex-start",
                        appearance: "none",
                        cursor: "pointer",
                        font: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 2.25,
                        py: 1.05,
                        borderRadius: 999,
                        border: "none",
                        // The raw accent is a LIGHT violet in some tenant themes (#c084fc),
                        // and white on it measures ~2.2:1 -- the button read as washed out and
                        // failed AA. Darkening the accent keeps the brand hue while putting
                        // the label back over 4.5:1 on every theme.
                        bgcolor: "color-mix(in srgb, var(--accent-purple) 65%, #1e1b4b)",
                        color: "#fff",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        "&:hover": {
                          bgcolor: "color-mix(in srgb, var(--accent-purple) 45%, #1e1b4b)",
                        },
                      }}
                    >
                      {u.label}
                      <Icon icon="solar:alt-arrow-right-linear" width={16} />
                    </Box>
                  </Surface>
                ))}
              </Box>
            )}

            {detail.resources.length > 0 && (
              <Surface>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-secondary)",
                    mb: 1.25,
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
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-secondary)",
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
                          color: "var(--font-primary)",
                          fontSize: "0.88rem",
                          fontWeight: 500,
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
  color: "var(--font-primary)",
  fontSize: "0.88rem",
  fontWeight: 500,
  "&:hover": { borderColor: "var(--accent-purple)", color: "var(--accent-purple)" },
} as const;
