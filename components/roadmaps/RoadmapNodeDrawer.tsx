"use client";

import { useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import {
  roadmapKeys,
  roadmapsService,
  type RoadmapNode,
  type SelfState,
} from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * The node drawer. Content is fetched per node rather than embedded in the graph payload, so
 * the graph stays small and cacheable.
 *
 * Two rules this UI must not break:
 *  - The status control writes a SELF-DECLARED annotation. It moves the coverage bar and can
 *    never move mastery, so the copy says "covered", not "completed".
 *  - Opening the content goes through the normal course gate. When `accessible` is false the
 *    learner is told why and offered the course, rather than being handed a second, parallel
 *    route into content they are not enrolled in.
 */

const STATES: { value: SelfState; label: string; icon: string; key: string }[] = [
  { value: "done", label: "Done", icon: "solar:check-circle-bold", key: "D" },
  { value: "learning", label: "Learning", icon: "solar:book-bookmark-bold", key: "L" },
  { value: "skipped", label: "Skip", icon: "solar:close-circle-bold", key: "S" },
];

const RESOURCE_TINT: Record<string, string> = {
  official: "#1d4ed8",
  opensource: "#0f172a",
  article: "#b45309",
  course: "#047857",
  video: "#7c3aed",
  book: "#be123c",
  podcast: "#7c3aed",
  feed: "#c026d3",
  roadmap: "#0f172a",
};

export function RoadmapNodeDrawer({
  slug,
  node,
  selfState,
  onClose,
  onSetState,
}: {
  slug: string;
  node: RoadmapNode | null;
  selfState: SelfState;
  onClose: () => void;
  onSetState: (state: SelfState) => void;
}) {
  const { push } = useInstantNavigation();

  // useQuery rather than an effect: it keys the result to the node, so reopening a node is
  // instant and switching nodes can never flash the previous node's content (which a
  // fetch-into-state effect does, because the old detail is still in state while the new
  // request is in flight).
  const { data: detail, isLoading: loading } = useQuery({
    queryKey: roadmapKeys.node(slug, node?.id ?? 0),
    queryFn: () => roadmapsService.node(slug, node!.id),
    enabled: Boolean(node),
    staleTime: 10 * 60 * 1000,
  });

  // Single-key shortcuts, as on roadmap.sh. Cheap, and they make bulk self-assessment fast.
  useEffect(() => {
    if (!node?.isTrackable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const match = STATES.find((s) => s.key.toLowerCase() === e.key.toLowerCase());
      if (match) {
        e.preventDefault();
        onSetState(match.value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [node, onSetState]);

  return (
    <Drawer
      anchor="right"
      open={Boolean(node)}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 0 } }}
    >
      {node && (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid #e6e8ef" }}
          >
            {node.isTrackable ? (
              <Stack direction="row" spacing={0.75}>
                {STATES.map((s) => {
                  const active = selfState === s.value;
                  return (
                    <Button
                      key={s.value}
                      size="small"
                      onClick={() => onSetState(active ? "pending" : s.value)}
                      startIcon={<Icon icon={s.icon} width={15} />}
                      sx={{
                        textTransform: "none",
                        fontSize: 12.5,
                        fontWeight: 600,
                        borderRadius: 2,
                        color: active ? "#fff" : "#475569",
                        bgcolor: active ? "#7c3aed" : "transparent",
                        border: `1px solid ${active ? "#7c3aed" : "#e6e8ef"}`,
                        "&:hover": { bgcolor: active ? "#5b21b6" : "#f8fafc" },
                      }}
                    >
                      {s.label}
                    </Button>
                  );
                })}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 13, color: "#64748b" }}>Section</Typography>
            )}
            <IconButton onClick={onClose} size="small" aria-label="Close">
              <Icon icon="solar:close-circle-linear" width={22} />
            </IconButton>
          </Stack>

          <Box sx={{ px: 2.5, py: 2.5, overflowY: "auto", flex: 1 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>
              {node.title}
            </Typography>

            {loading && (
              <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                <CircularProgress size={22} />
              </Box>
            )}

            {detail && (
              <>
                {detail.summary && (
                  <Typography sx={{ mt: 1.5, fontSize: 14.5, color: "#475569", lineHeight: 1.65 }}>
                    {detail.summary}
                  </Typography>
                )}

                {/* A spine step: what it contains overall, then every sub-step. Without this
                    the drawer for a spine node is a title and one sentence, which is the
                    complaint that prompted it. */}
                {detail.totals?.steps ? (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                    {[
                      `${detail.totals.steps} steps`,
                      detail.totals.readingMinutes ? `${detail.totals.readingMinutes} min reading` : null,
                      detail.totals.questions ? `${detail.totals.questions} questions` : null,
                      detail.totals.codingProblems
                        ? `${detail.totals.codingProblems} coding problems`
                        : null,
                    ]
                      .filter(Boolean)
                      .map((f) => (
                        <Chip
                          key={f as string}
                          label={f as string}
                          size="small"
                          sx={{
                            height: 24, fontSize: 11.5, fontWeight: 600,
                            bgcolor: "#ede9fe", color: "#5b21b6",
                          }}
                        />
                      ))}
                  </Stack>
                ) : null}

                {detail.steps && detail.steps.length > 0 && (
                  <Box sx={{ mt: 2.5 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", mb: 1 }}>
                      Steps in this section
                    </Typography>
                    <Stack spacing={0.85}>
                      {detail.steps.map((s, i) => (
                        <Box
                          key={s.id}
                          sx={{
                            border: "1px solid #e6e8ef",
                            borderRadius: 2,
                            p: 1.35,
                            bgcolor: s.selfState === "done" ? "#f6fefb" : "#fff",
                          }}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={1.1}>
                            <Box
                              sx={{
                                width: 21, height: 21, borderRadius: "50%", flexShrink: 0, mt: 0.2,
                                display: "grid", placeItems: "center",
                                bgcolor: s.selfState === "done" ? "#059669" : "#ede9fe",
                                color: s.selfState === "done" ? "#fff" : "#5b21b6",
                                fontSize: 10.5, fontWeight: 700,
                              }}
                            >
                              {s.selfState === "done" ? <Icon icon="mdi:check" width={13} /> : i + 1}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                                {s.title}
                              </Typography>
                              {s.summary && (
                                <Typography
                                  sx={{ mt: 0.4, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}
                                >
                                  {s.summary}
                                </Typography>
                              )}
                              <Stack direction="row" spacing={1.25} sx={{ mt: 0.6, color: "#94a3b8" }}>
                                {s.readingMinutes > 0 && (
                                  <Typography sx={{ fontSize: 11 }}>{s.readingMinutes} min</Typography>
                                )}
                                {s.questions > 0 && (
                                  <Typography sx={{ fontSize: 11 }}>{s.questions} questions</Typography>
                                )}
                                {s.codingProblems > 0 && (
                                  <Typography sx={{ fontSize: 11 }}>
                                    {s.codingProblems} coding
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                            {s.accessible && s.courseId && s.submoduleId && (
                              <Button
                                size="small"
                                onClick={() =>
                                  push(`/adaptive-courses/${s.courseId}/submodule/${s.submoduleId}`)
                                }
                                sx={{
                                  textTransform: "none", fontWeight: 600, fontSize: 12,
                                  flexShrink: 0, minWidth: 0,
                                }}
                              >
                                Open
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {detail.opens.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", mb: 1 }}>
                      {detail.opens.length === 1 ? "What is in this step" : "What is in this step"}
                    </Typography>
                    <Stack spacing={1.25}>
                      {detail.opens.map((t) => {
                        const c = t.content ?? {};
                        const facts = [
                          c.readingMinutes ? `${c.readingMinutes} min read` : c.article ? "Article" : null,
                          c.questions ? `${c.questions} question${c.questions === 1 ? "" : "s"}` : null,
                          c.codingProblems
                            ? `${c.codingProblems} coding problem${c.codingProblems === 1 ? "" : "s"}`
                            : null,
                        ].filter(Boolean) as string[];
                        return (
                          <Box
                            key={`${t.type}-${t.submoduleId ?? t.courseId}`}
                            sx={{
                              border: "1px solid #e6e8ef",
                              borderRadius: 2,
                              p: 1.5,
                              bgcolor: t.accessible ? "#fff" : "#f8fafc",
                            }}
                          >
                            <Stack direction="row" alignItems="flex-start" spacing={1}>
                              <Icon
                                icon={
                                  t.accessible
                                    ? "solar:play-circle-bold-duotone"
                                    : "solar:lock-keyhole-minimalistic-bold-duotone"
                                }
                                width={18}
                                color={t.accessible ? "#7c3aed" : "#94a3b8"}
                                style={{ marginTop: 2, flexShrink: 0 }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                                  {t.title}
                                </Typography>
                                <Typography sx={{ fontSize: 11.5, color: "#64748b" }}>
                                  {t.courseTitle}
                                </Typography>
                                {(c.articleSummary || t.description) && (
                                  <Typography
                                    sx={{ mt: 0.75, fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}
                                  >
                                    {c.articleSummary || t.description}
                                  </Typography>
                                )}
                                {facts.length > 0 && (
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                    {facts.map((f) => (
                                      <Chip
                                        key={f}
                                        label={f}
                                        size="small"
                                        sx={{
                                          height: 20, fontSize: 10.5, fontWeight: 600,
                                          bgcolor: "#f1f5f9", color: "#475569",
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                )}
                              </Box>
                              {t.accessible ? (
                                <Button
                                  size="small"
                                  onClick={() =>
                                    push(
                                      t.submoduleId
                                        ? `/adaptive-courses/${t.courseId}/submodule/${t.submoduleId}`
                                        : `/adaptive-courses/${t.courseId}`
                                    )
                                  }
                                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 12.5, flexShrink: 0 }}
                                >
                                  Open
                                </Button>
                              ) : (
                                <Chip
                                  label={t.selfEnrollable ? "Join" : "Locked"}
                                  size="small"
                                  onClick={
                                    t.selfEnrollable
                                      ? () => push(`/adaptive-courses/${t.courseId}`)
                                      : undefined
                                  }
                                  sx={{
                                    height: 22, fontSize: 11, flexShrink: 0,
                                    cursor: t.selfEnrollable ? "pointer" : "default",
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                    {detail.opens.some((t) => !t.accessible) && (
                      <Typography sx={{ mt: 1, fontSize: 11.5, color: "#94a3b8" }}>
                        Locked steps need enrolment in the course that owns them.
                      </Typography>
                    )}
                  </Box>
                )}

                {detail.resources.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", mb: 1 }}>
                      Read more
                    </Typography>
                    <Stack spacing={0.75}>
                      {detail.resources.map((r) => (
                        <Stack key={r.url} direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={r.type}
                            size="small"
                            sx={{
                              height: 19,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "capitalize",
                              bgcolor: `${RESOURCE_TINT[r.type] ?? "#64748b"}14`,
                              color: RESOURCE_TINT[r.type] ?? "#64748b",
                            }}
                          />
                          <Typography
                            component="a"
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontSize: 13.5,
                              color: "#7c3aed",
                              textDecoration: "underline",
                              "&:hover": { color: "#5b21b6" },
                            }}
                          >
                            {r.title}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
