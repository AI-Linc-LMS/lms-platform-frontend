"use client";

import { Box, Button, Dialog, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";

/**
 * "Content locked" — shown over Resume, Jobs and Interview until the profile is complete.
 *
 * A modal rather than an inline panel because the point is that the learner cannot proceed: the
 * page stays visible behind it so they know where they are, but nothing on it is reachable.
 *
 * It is NOT dismissable by clicking away. A lock a stray click gets past isn't a lock, and worse,
 * it would leave the learner staring at a page whose data never loads with no explanation. The
 * only exits are "Complete profile" and an explicit "Go back".
 */
export function ProfileLockModal({
  open,
  moduleLabel,
}: {
  open: boolean;
  moduleLabel: string;
}) {
  const router = useRouter();
  const { completion, percentage, missingFields } = useProfileGate();

  // Prefer the server's labelled list. Fall back to raw field names, which is what a 403 body
  // carries when the lock came from the API rather than the cached profile.
  const outstanding = completion?.required_fields?.length
    ? completion.required_fields.filter((f) => !f.filled)
    : missingFields.map((f) => ({
        field: f,
        label: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        filled: false,
      }));

  return (
    <Dialog
      open={open}
      // No onClose: clicking the backdrop or pressing Escape must not slip past the lock.
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: { sx: { borderRadius: 4, p: 1 } },
        backdrop: { sx: { backdropFilter: "blur(3px)", bgcolor: "rgba(15,23,42,0.55)" } },
      }}
    >
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            mx: "auto",
            mb: 2,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "white",
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
          }}
        >
          <Icon icon="mdi:lock-outline" width={28} />
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>Content locked</Typography>
        <Typography sx={{ color: "text.secondary", mt: 1, fontSize: "0.9rem", lineHeight: 1.55 }}>
          Update your profile to unlock <strong>{moduleLabel}</strong>. It takes about a minute, and
          it unlocks Resume, Jobs and Interview together.
        </Typography>

        <Box sx={{ mt: 2.5 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, percentage)}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#eef2f7",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                background: "linear-gradient(90deg, #7c3aed, #ec4899)",
              },
            }}
          />
          <Typography sx={{ mt: 0.75, fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8" }}>
            Profile {percentage}% complete
          </Typography>
        </Box>

        {outstanding.length > 0 && (
          <Stack
            spacing={0.9}
            sx={{
              mt: 2.5,
              p: 1.75,
              borderRadius: 3,
              textAlign: "left",
              bgcolor: "var(--surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.secondary" }}>
              STILL NEEDED
            </Typography>
            {outstanding.map((f) => (
              <Stack key={f.field} direction="row" spacing={1} alignItems="center">
                <Icon icon="mdi:circle-outline" width={15} style={{ color: "#cbd5e1" }} />
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{f.label}</Typography>
              </Stack>
            ))}
          </Stack>
        )}

        <Button
          fullWidth
          onClick={() => router.push("/profile#profile-strength")}
          sx={{
            mt: 2.5,
            py: 1.2,
            borderRadius: 2.5,
            fontWeight: 800,
            fontSize: "0.92rem",
            color: "white",
            textTransform: "none",
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            "&:hover": { background: "linear-gradient(135deg, #6d28d9, #db2777)" },
          }}
        >
          Complete profile
        </Button>
        <Button
          fullWidth
          onClick={() => router.push("/dashboard")}
          sx={{ mt: 1, textTransform: "none", fontWeight: 700, color: "text.secondary" }}
        >
          Go back
        </Button>
      </Box>
    </Dialog>
  );
}
