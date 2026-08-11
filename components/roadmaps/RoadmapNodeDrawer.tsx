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

                {detail.opens.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", mb: 1 }}>
                      Practise this
                    </Typography>
                    <Stack spacing={1}>
                      {detail.opens.map((t) => (
                        <Box
                          key={`${t.type}-${t.submoduleId ?? t.courseId}`}
                          sx={{
                            border: "1px solid #e6e8ef",
                            borderRadius: 2,
                            p: 1.5,
                            bgcolor: t.accessible ? "#fff" : "#f8fafc",
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Icon
                              icon={
                                t.accessible
                                  ? "solar:play-circle-bold-duotone"
                                  : "solar:lock-keyhole-minimalistic-bold-duotone"
                              }
                              width={18}
                              color={t.accessible ? "#7c3aed" : "#94a3b8"}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                                {t.title}
                              </Typography>
                              <Typography sx={{ fontSize: 11.5, color: "#64748b" }}>
                                {t.courseTitle}
                              </Typography>
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
                                sx={{ textTransform: "none", fontWeight: 600, fontSize: 12.5 }}
                              >
                                Open
                              </Button>
                            ) : (
                              <Chip
                                label={t.selfEnrollable ? "Join course" : "Locked"}
                                size="small"
                                onClick={
                                  t.selfEnrollable
                                    ? () => push(`/adaptive-courses/${t.courseId}`)
                                    : undefined
                                }
                                sx={{
                                  height: 22,
                                  fontSize: 11,
                                  cursor: t.selfEnrollable ? "pointer" : "default",
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                      ))}
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
