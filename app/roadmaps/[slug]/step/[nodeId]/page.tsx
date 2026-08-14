"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { Surface } from "@/components/roadmaps/surfaces";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";

/**
 * Retired surface, kept as a signpost.
 *
 * A roadmap step used to be somewhere you read content. Learning now happens in an adaptive
 * course built from the same verified material, so there is nothing to browse here. The route
 * stays rather than 404ing because links to it exist in the wild - bookmarks, and anything a
 * learner shared - and a dead end is a worse answer than a sentence explaining where the
 * content went.
 */
export default function RetiredRoadmapStepPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const { push, prefetch } = useInstantNavigation();

  useEffect(() => {
    prefetch(`/roadmaps/${slug}`);
  }, [prefetch, slug]);

  return (
    <PageShell>
      <Container maxWidth={false} sx={{ py: 6, px: { xs: 2, md: 3 }, maxWidth: 720, mx: "auto" }}>
        <Surface>
          <Stack spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
                color: "var(--accent-purple)",
              }}
            >
              <Icon icon="solar:map-point-wave-linear" width={22} />
            </Box>

            <Typography
              sx={{ fontWeight: 600, fontSize: "1.3rem", color: "var(--font-primary)" }}
            >
              Steps now become your own course
            </Typography>
            <Typography
              sx={{ fontSize: "0.95rem", color: "var(--font-secondary)", lineHeight: 1.65 }}
            >
              Pick a step on the roadmap and we build you an adaptive course from it, assembled
              from the verified question bank. You will find it in Courses, and your progress is
              tracked there rather than on the map.
            </Typography>

            <Stack direction="row" spacing={1.25} sx={{ pt: 0.5 }}>
              <Box
                component="button"
                onClick={() => push(`/roadmaps/${slug}`)}
                sx={{
                  appearance: "none",
                  border: "none",
                  cursor: "pointer",
                  font: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 2.25,
                  py: 1,
                  borderRadius: 999,
                  bgcolor: "color-mix(in srgb, var(--accent-purple) 65%, #1e1b4b)",
                  color: "#fff",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              >
                Back to the roadmap
                <Icon icon="solar:alt-arrow-right-linear" width={16} />
              </Box>
              <Box
                component="button"
                onClick={() => push("/adaptive-courses")}
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
                My courses
              </Box>
            </Stack>
          </Stack>
        </Surface>
      </Container>
    </PageShell>
  );
}
