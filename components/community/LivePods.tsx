"use client";

import { Box, Typography, Avatar, Badge, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";

export type LivePodItem = {
  id: string | number;
  title: string;
  meet_url: string;
  active_count?: number;
  imageSeed?: string;
};

const accentPalette = [
  "var(--primary-400)",
  "var(--success-500)",
  "var(--accent-red)",
  "var(--warning-500)",
  "var(--accent-indigo)",
  "var(--accent-teal)",
];

interface LivePodsProps {
  pods: LivePodItem[];
  loading?: boolean;
}

export function LivePods({ pods, loading = false }: LivePodsProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const handleJoinPod = (pod: LivePodItem) => {
    const url = pod.meet_url?.trim();
    if (!url) {
      showToast("No meeting link available.", "error");
      return;
    }
    // Built-in LiveKit rooms live at /community/live/<id>. Stay in-app for
    // those — opening in a new tab loses cookies on tenant subdomains and
    // bounces through the SSO sign-in flow again.
    const builtInMatch = url.match(/\/community\/live\/(\d+)/);
    if (builtInMatch) {
      router.push(`/community/live/${builtInMatch[1]}`);
      return;
    }
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      showToast("Could not open link.", "error");
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{
          mb: 2,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--font-secondary)",
        }}
      >
        Live Right Now
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={28} sx={{ color: "var(--primary-500)" }} />
        </Box>
      ) : pods.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No live rooms scheduled for this window. Hosts can add one with Schedule live.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            pb: 2,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {pods.map((pod, idx) => {
            const accent = accentPalette[idx % accentPalette.length];
            const seed = encodeURIComponent(String(pod.imageSeed ?? pod.id));
            const image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            // Backend returns a stub `active_count` (always 1) — we don't
            // actually know how many people are in the LiveKit room. Showing
            // a fake number is worse than showing none, so we render a simple
            // "LIVE" pip instead.
            return (
              <Box
                key={String(pod.id)}
                onClick={() => handleJoinPod(pod)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 72,
                  cursor: "pointer",
                  "&:hover .pod-ring": { transform: "scale(1.05)" },
                }}
              >
                <Box
                  className="pod-ring"
                  sx={{
                    position: "relative",
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${accent}, var(--card-bg))`,
                    p: "3px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s",
                    animation: "live-pod-pulse 2.2s ease-in-out infinite",
                    "@keyframes live-pod-pulse": {
                      "0%": { boxShadow: "0 0 0 0 color-mix(in srgb, var(--primary-400) 35%, transparent)" },
                      "70%": { boxShadow: "0 0 0 10px color-mix(in srgb, var(--primary-400) 0%, transparent)" },
                      "100%": { boxShadow: "0 0 0 0 transparent" },
                    },
                  }}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    badgeContent={
                      <Box
                        sx={{
                          backgroundColor: "var(--error-500)",
                          color: "var(--font-light)",
                          fontSize: "0.55rem",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          px: 0.5,
                          py: 0.2,
                          borderRadius: 1,
                          border: "2px solid var(--card-bg)",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                        }}
                      >
                        <Box
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            backgroundColor: "var(--font-light)",
                            animation: "pod-blink 1s infinite",
                            "@keyframes pod-blink": { "50%": { opacity: 0 } },
                          }}
                        />
                        LIVE
                      </Box>
                    }
                  >
                    <Avatar
                      src={image}
                      sx={{
                        width: 66,
                        height: 66,
                        border: "2px solid var(--card-bg)",
                        backgroundColor: "var(--surface)",
                      }}
                    />
                  </Badge>

                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -4,
                      backgroundColor: "var(--accent-indigo)",
                      borderRadius: "50%",
                      p: 0.5,
                      border: "2px solid var(--card-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconWrapper icon="mdi:video" size={12} color="var(--font-light)" />
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  fontWeight={600}
                  textAlign="center"
                  sx={{
                    mt: 1.5,
                    lineHeight: 1.2,
                    color: "var(--font-muted)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    width: 72,
                  }}
                >
                  {pod.title}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
