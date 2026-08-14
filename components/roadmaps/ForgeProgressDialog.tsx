"use client";

import { useQuery } from "@tanstack/react-query";
import { Box, Dialog, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { forgeKeys, forgeService, type ForgeJob } from "@/lib/services/roadmaps.service";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * Watching a course get built.
 *
 * The build is genuinely incremental on the server (one topic at a time), so this shows the
 * real thing rather than a spinner with an invented percentage: each topic flips to done as its
 * content is copied. That honesty is the point of the screen. A learner who is told "no AI, we
 * are assembling reviewed material" and then sees the topics land one by one believes it.
 *
 * Polling stops the moment the job is terminal, so a finished dialog left open costs nothing.
 */
export function ForgeProgressDialog({
  job,
  open,
  onClose,
}: {
  job: ForgeJob | null;
  open: boolean;
  onClose: () => void;
}) {
  const { push } = useInstantNavigation();
  const jobId = job?.id ?? 0;

  const { data } = useQuery({
    queryKey: forgeKeys.job(jobId),
    queryFn: () => forgeService.job(jobId),
    enabled: open && jobId > 0 && !job?.alreadyBuilt,
    initialData: job ?? undefined,
    // Stop the moment there is nothing left to watch.
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "failed" || s === "cancelled" ? false : 1200;
    },
  });

  const live = data ?? job;
  const done = live?.status === "completed";
  const failed = live?.status === "failed";
  // Read from the LIVE job, not the one we opened with: otherwise a dialog that started at
  // "queued" can never be dismissed, because its close handler is still looking at that.
  const terminal = done || failed || live?.status === "cancelled";

  // Nothing was rebuilt because they already had it: say so rather than animating a fake build.
  const reused = Boolean(job?.alreadyBuilt);

  if (!live) return null;

  return (
    <Dialog
      open={open}
      onClose={terminal || reused ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            boxShadow: "none",
            backgroundImage: "none",
          },
        },
      }}
    >
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
              color: "var(--accent-purple)",
            }}
          >
            <Icon
              icon={
                done || reused
                  ? "solar:check-circle-bold"
                  : failed
                    ? "solar:danger-triangle-linear"
                    : "solar:magic-stick-3-linear"
              }
              width={20}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--font-primary)" }}
            >
              {reused
                ? "You already have this course"
                : done
                  ? "Your course is ready"
                  : failed
                    ? "We could not finish this one"
                    : "Building your course"}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
              {live.title}
            </Typography>
          </Box>
        </Stack>

        {!reused && (
          <>
            <Box
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: "var(--surface)",
                border: "1px solid var(--border-default)",
                overflow: "hidden",
                mb: 1,
              }}
            >
              <Box
                sx={{
                  width: `${live.percent}%`,
                  height: "100%",
                  bgcolor: "var(--accent-purple)",
                  transition: "width .4s ease",
                }}
              />
            </Box>
            <Typography
              sx={{ fontSize: "0.8rem", color: "var(--font-secondary)", mb: 2 }}
            >
              {live.completedItems} of {live.totalItems} topics assembled from the verified bank
            </Typography>

            <Stack spacing={0.5} sx={{ maxHeight: 240, overflowY: "auto", mb: 2 }}>
              {live.items.map((it) => (
                <Stack
                  key={it.order}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ py: 0.35 }}
                >
                  <Icon
                    icon={
                      it.status === "done"
                        ? "solar:check-circle-bold"
                        : it.status === "failed"
                          ? "solar:close-circle-linear"
                          : it.status === "running"
                            ? "svg-spinners:180-ring-with-bg"
                            : "solar:record-linear"
                    }
                    width={15}
                    color={
                      it.status === "done"
                        ? "var(--accent-green)"
                        : it.status === "failed"
                          ? "var(--accent-red)"
                          : "var(--font-tertiary)"
                    }
                  />
                  <Typography
                    sx={{
                      fontSize: "0.84rem",
                      color:
                        it.status === "pending"
                          ? "var(--font-tertiary)"
                          : "var(--font-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {it.title}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}

        <Stack direction="row" spacing={1.25} justifyContent="flex-end">
          {(terminal || reused) && (
            <Box
              component="button"
              onClick={onClose}
              sx={{
                appearance: "none",
                cursor: "pointer",
                font: "inherit",
                px: 2,
                py: 1,
                borderRadius: 999,
                border: "1px solid var(--border-default)",
                bgcolor: "var(--card-bg)",
                color: "var(--font-primary)",
                fontSize: "0.88rem",
                fontWeight: 500,
              }}
            >
              Stay here
            </Box>
          )}
          {(done || reused) && live.courseId && (
            <Box
              component="button"
              onClick={() => push(`/adaptive-courses/${live.courseId}`)}
              sx={{
                appearance: "none",
                cursor: "pointer",
                font: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 2.25,
                py: 1,
                borderRadius: 999,
                border: "none",
                bgcolor: "color-mix(in srgb, var(--accent-purple) 65%, #1e1b4b)",
                color: "#fff",
                fontSize: "0.88rem",
                fontWeight: 600,
              }}
            >
              Start learning
              <Icon icon="solar:alt-arrow-right-linear" width={16} />
            </Box>
          )}
        </Stack>

        {(done || reused) && (
          <Typography
            sx={{ mt: 1.5, fontSize: "0.78rem", color: "var(--font-tertiary)", textAlign: "right" }}
          >
            You will also find it in Courses.
          </Typography>
        )}
      </Box>
    </Dialog>
  );
}
