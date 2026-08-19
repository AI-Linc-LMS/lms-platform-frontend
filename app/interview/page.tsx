"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { MainLayout } from "@/components/layout/MainLayout";
import interviewService, { type AvailableInterview } from "@/lib/services/interview.service";

/**
 * The interviews a candidate can sit.
 *
 * Deliberately plain. This is the screen immediately before a timed, graded exercise, so it
 * says what the interview is, how long it takes, and nothing else. Anything more decorative
 * here is something to read while a stopwatch is about to start.
 *
 * Which interviews appear is decided entirely server-side. The browser does not filter, and
 * does not receive templates the candidate cannot sit.
 */
export default function InterviewListPage() {
  const router = useRouter();
  const [items, setItems] = useState<AvailableInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    interviewService
      .available()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 860, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <Typography sx={{ fontSize: "1.6rem", fontWeight: 600, mb: 0.5 }}>
          Mock interview
        </Typography>
        <Typography sx={{ color: "var(--font-secondary, #6b7280)", mb: 3 }}>
          A spoken interview with an AI interviewer. You can interrupt it, and it will
          interrupt you.
        </Typography>

        {loading ? (
          <Typography sx={{ color: "var(--font-secondary, #6b7280)" }}>Loading...</Typography>
        ) : failed ? (
          <Typography sx={{ color: "var(--font-secondary, #6b7280)" }}>
            We could not load your interviews. Please refresh and try again.
          </Typography>
        ) : items.length === 0 ? (
          <Box
            sx={{
              border: "1px solid var(--border-color, #e5e7eb)",
              borderRadius: "12px",
              p: 4,
              textAlign: "center",
            }}
          >
            <Icon icon="solar:microphone-3-line-duotone" width={36} height={36} />
            <Typography sx={{ mt: 1.5, fontWeight: 500 }}>
              You have no interviews waiting.
            </Typography>
            <Typography
              sx={{ mt: 0.5, fontSize: "0.9rem", color: "var(--font-secondary, #6b7280)" }}
            >
              They appear here when your course or cohort has one assigned.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  border: "1px solid var(--border-color, #e5e7eb)",
                  borderRadius: "12px",
                  p: 2.5,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                  transition: "border-color 200ms ease",
                  "&:hover": { borderColor: "var(--primary-500, #7c3aed)" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography sx={{ fontWeight: 500 }}>{item.title}</Typography>
                  <Typography
                    sx={{ fontSize: "0.88rem", color: "var(--font-secondary, #6b7280)" }}
                  >
                    {item.topic}
                    {item.subtopic ? ` · ${item.subtopic}` : ""} · {item.difficulty} ·{" "}
                    about {item.duration_minutes} min
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => router.push(`/interview/room?template=${item.id}`)}
                  sx={{ textTransform: "none", borderRadius: "8px" }}
                >
                  Start
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
