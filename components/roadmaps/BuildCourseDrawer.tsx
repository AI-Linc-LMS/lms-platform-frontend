"use client";

import { useQuery } from "@tanstack/react-query";
import { Box, Drawer, Skeleton, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  roadmapKeys,
  roadmapsService,
  type RoadmapNode,
} from "@/lib/services/roadmaps.service";

/**
 * What a step is, before you commit to studying it.
 *
 * Clicking a node used to build a course immediately, which is a lot to happen from one click on
 * a map you are still reading. This is the reading step: what the topic is, what it covers, how
 * much material sits behind it, and only then an explicit yes.
 *
 * Three things this gets right that the first cut did not:
 *
 * 1. **It opens from the right.** The map is read left to right and its spine sits right of
 *    centre; a left drawer covered the node you just clicked. Coming from the right keeps the
 *    thing you are asking about on screen.
 *
 * 2. **It explains the topic.** The node detail carries `summary`, and each target carries its
 *    own `description` — the first version fetched all of it and rendered a four-item fact list,
 *    so a node whose summary was empty showed a screen of nothing above the button.
 *
 * 3. **It asks a question.** "Build this course" as a bare button is an instruction. The learner
 *    is making a choice, so the footer poses it and offers both answers.
 */

/** Cap the covers-list so a 20-child parent does not turn the drawer into a scroll. */
const COVERS_SHOWN = 8;

export function BuildCourseDrawer({
  slug,
  node,
  onClose,
  onBuild,
  busy = false,
}: {
  slug: string;
  node: RoadmapNode | null;
  onClose: () => void;
  onBuild: (node: RoadmapNode) => void;
  busy?: boolean;
}) {
  const { data: detail, isLoading } = useQuery({
    queryKey: roadmapKeys.node(slug, node?.id ?? 0),
    queryFn: () => roadmapsService.node(slug, node!.id),
    enabled: Boolean(node?.id),
    staleTime: 10 * 60 * 1000,
  });

  const totals = detail?.totals ?? {};
  const own = detail?.opens?.[0]?.content ?? {};
  const questions = totals.questions ?? own.questions ?? 0;
  const coding = totals.codingProblems ?? own.codingProblems ?? 0;
  const steps = totals.steps ?? (detail?.opens?.length ? 1 : 0);
  const reading = totals.readingMinutes ?? own.readingMinutes ?? 0;

  // The explanation, in order of how specific it is to this node. The target description is the
  // submodule's own blurb and is usually the most concrete thing available for a leaf.
  const blurb =
    detail?.summary?.trim() ||
    node?.summary?.trim() ||
    detail?.opens?.[0]?.description?.trim() ||
    "";

  // A parent lists its children; a leaf lists its targets when it opens more than one. Either
  // way the learner sees the actual syllabus rather than a count of it.
  const covers: { key: string; title: string; note?: string }[] =
    detail?.steps?.length
      ? detail.steps.map((s) => ({
          key: `s${s.id}`,
          title: s.title,
          note: s.questions ? `${s.questions} questions` : undefined,
        }))
      : (detail?.opens ?? []).length > 1
        ? (detail?.opens ?? []).map((o, i) => ({
            key: `o${o.submoduleId ?? o.courseId}-${i}`,
            title: o.title,
            note: o.content?.questions ? `${o.content.questions} questions` : undefined,
          }))
        : [];

  const facts = [
    steps ? `${steps} ${steps === 1 ? "topic" : "topics"}` : null,
    questions ? `${questions} questions` : null,
    coding ? `${coding} coding ${coding === 1 ? "problem" : "problems"}` : null,
    reading ? `~${reading} min reading` : null,
  ].filter(Boolean) as string[];

  return (
    <Drawer
      // Right, not left: the spine sits right of centre and a left drawer hid the clicked node.
      anchor="right"
      open={Boolean(node)}
      onClose={busy ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 460 },
            bgcolor: "var(--card-bg)",
            borderLeft: "1px solid var(--border-default)",
            backgroundImage: "none",
          },
        },
      }}
    >
      {node && (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Scrolls; the ask below stays pinned. */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                }}
              >
                {node.kind === "topic" ? "Topic" : "Step"}
              </Typography>
              <Box
                component="button"
                onClick={onClose}
                aria-label="Close"
                sx={{
                  appearance: "none",
                  border: "none",
                  bgcolor: "transparent",
                  cursor: "pointer",
                  color: "var(--font-secondary)",
                  p: 0.5,
                  display: "flex",
                }}
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </Box>
            </Stack>

            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "1.35rem",
                lineHeight: 1.25,
                color: "var(--font-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {node.title}
            </Typography>

            {isLoading && !blurb ? (
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                <Skeleton variant="text" width="100%" height={18} />
                <Skeleton variant="text" width="92%" height={18} />
                <Skeleton variant="text" width="60%" height={18} />
              </Stack>
            ) : (
              blurb && (
                <Typography
                  sx={{
                    mt: 1.25,
                    fontSize: "0.94rem",
                    color: "var(--font-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  {blurb}
                </Typography>
              )
            )}

            {/* The size of the thing, as a strip rather than a checklist. Ticks next to
                "1 topic" read as completed work, which none of this is yet. */}
            {facts.length > 0 && (
              <Box
                sx={{
                  mt: 2.5,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                }}
              >
                {facts.map((f) => (
                  <Box
                    key={f}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1,
                      border: "1px solid var(--border-default)",
                      bgcolor: "var(--surface)",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--font-primary)",
                    }}
                  >
                    {f}
                  </Box>
                ))}
              </Box>
            )}

            {covers.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-secondary)",
                    mb: 1,
                  }}
                >
                  What it covers
                </Typography>
                <Stack>
                  {covers.slice(0, COVERS_SHOWN).map((c) => (
                    <Stack
                      key={c.key}
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      sx={{
                        py: 0.9,
                        borderBottomWidth: "1px",
                        borderBottomStyle: "solid",
                        borderBottomColor: "var(--border-default)",
                      }}
                    >
                      <Box sx={{ display: "flex", color: "var(--accent-purple)" }}>
                        <Icon icon="solar:hashtag-square-linear" width={15} />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.88rem",
                          color: "var(--font-primary)",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {c.title}
                      </Typography>
                      {c.note && (
                        <Typography
                          sx={{
                            fontSize: "0.76rem",
                            color: "var(--font-secondary)",
                            flexShrink: 0,
                          }}
                        >
                          {c.note}
                        </Typography>
                      )}
                    </Stack>
                  ))}
                </Stack>
                {covers.length > COVERS_SHOWN && (
                  <Typography
                    sx={{ mt: 1, fontSize: "0.8rem", color: "var(--font-secondary)" }}
                  >
                    and {covers.length - COVERS_SHOWN} more
                  </Typography>
                )}
              </Box>
            )}

            {detail?.resources && detail.resources.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-secondary)",
                    mb: 1,
                  }}
                >
                  Read more
                </Typography>
                <Stack spacing={0.6}>
                  {detail.resources.slice(0, 4).map((r) => (
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
              </Box>
            )}
          </Box>

          {/* The ask. Pinned, so it is reachable whatever the length of the syllabus above. */}
          <Box
            sx={{
              p: 3,
              borderTopWidth: "1px",
              borderTopStyle: "solid",
              borderTopColor: "var(--border-default)",
              bgcolor: "var(--card-bg)",
            }}
          >
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 0.5,
              }}
            >
              Create a course on this?
            </Typography>
            <Typography
              sx={{ fontSize: "0.82rem", color: "var(--font-secondary)", mb: 1.75, lineHeight: 1.6 }}
            >
              We will assemble it from the verified question bank, not generate it with AI. It is
              yours alone, and you will find it in Courses.
            </Typography>

            <Stack direction="row" spacing={1.25}>
              <Box
                component="button"
                onClick={onClose}
                disabled={busy}
                sx={{
                  appearance: "none",
                  cursor: busy ? "default" : "pointer",
                  font: "inherit",
                  px: 2.25,
                  py: 1.25,
                  borderRadius: 999,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--border-default)",
                  bgcolor: "transparent",
                  color: "var(--font-secondary)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Not now
              </Box>
              <Box
                component="button"
                onClick={() => onBuild(node)}
                disabled={busy}
                sx={{
                  appearance: "none",
                  border: "none",
                  cursor: busy ? "default" : "pointer",
                  font: "inherit",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  px: 2.5,
                  py: 1.25,
                  borderRadius: 999,
                  bgcolor: busy
                    ? "color-mix(in srgb, var(--accent-purple) 30%, #1e1b4b)"
                    : "color-mix(in srgb, var(--accent-purple) 65%, #1e1b4b)",
                  color: "#fff",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {busy ? (
                  <>
                    <Icon icon="svg-spinners:180-ring-with-bg" width={17} />
                    Starting
                  </>
                ) : (
                  <>
                    <Icon icon="solar:magic-stick-3-linear" width={17} />
                    Yes, build it
                  </>
                )}
              </Box>
            </Stack>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
