"use client";

import { useQuery } from "@tanstack/react-query";
import { Box, Drawer, Stack, Typography } from "@mui/material";
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
 * a map you are still reading. This restores the drawer as a reading step: what the topic
 * covers, how much material sits behind it, and then an explicit "build it".
 *
 * The size line is the honest part of the pitch. "24 questions and 3 coding problems" is what
 * the learner is actually being offered, and it comes from the same counts the roadmap already
 * computes rather than a promise the build might not keep.
 */
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

  const facts = [
    steps ? `${steps} ${steps === 1 ? "topic" : "topics"}` : null,
    questions ? `${questions} questions` : null,
    coding ? `${coding} coding problems` : null,
    reading ? `~${reading} min reading` : null,
  ].filter(Boolean) as string[];

  return (
    <Drawer
      anchor="left"
      open={Boolean(node)}
      onClose={busy ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 420 },
            bgcolor: "var(--card-bg)",
            borderRight: "1px solid var(--border-default)",
            backgroundImage: "none",
          },
        },
      }}
    >
      {node && (
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
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
                color: "var(--font-tertiary)",
                p: 0.5,
              }}
            >
              <Icon icon="solar:close-circle-linear" width={20} />
            </Box>
          </Stack>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "1.3rem",
              color: "var(--font-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {node.title}
          </Typography>

          {(node.summary || detail?.summary) && (
            <Typography
              sx={{
                mt: 1,
                fontSize: "0.92rem",
                color: "var(--font-secondary)",
                lineHeight: 1.65,
              }}
            >
              {detail?.summary || node.summary}
            </Typography>
          )}

          {facts.length > 0 && (
            <Stack spacing={0.75} sx={{ mt: 2.5 }}>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                }}
              >
                What you get
              </Typography>
              {facts.map((f) => (
                <Stack key={f} direction="row" spacing={1} alignItems="center">
                  <Icon
                    icon="solar:check-circle-linear"
                    width={15}
                    color="var(--accent-purple)"
                  />
                  <Typography sx={{ fontSize: "0.88rem", color: "var(--font-primary)" }}>
                    {f}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {isLoading && (
            <Typography sx={{ mt: 2, fontSize: "0.85rem", color: "var(--font-tertiary)" }}>
              Checking what is available...
            </Typography>
          )}

          {detail?.resources && detail.resources.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 2.5 }}>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                }}
              >
                Read more
              </Typography>
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
          )}

          <Box sx={{ mt: "auto", pt: 3 }}>
            <Typography
              sx={{ fontSize: "0.8rem", color: "var(--font-tertiary)", mb: 1.25 }}
            >
              We will build you an adaptive course from this, using questions from the verified
              bank. It is yours alone, and you will find it in Courses.
            </Typography>
            <Box
              component="button"
              onClick={() => onBuild(node)}
              disabled={busy}
              sx={{
                appearance: "none",
                border: "none",
                cursor: busy ? "default" : "pointer",
                font: "inherit",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                px: 2.5,
                py: 1.35,
                borderRadius: 999,
                bgcolor: busy
                  ? "color-mix(in srgb, var(--accent-purple) 30%, #1e1b4b)"
                  : "color-mix(in srgb, var(--accent-purple) 65%, #1e1b4b)",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 600,
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
                  Build this course
                </>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
