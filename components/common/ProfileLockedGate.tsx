"use client";

import { Box, ButtonBase, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";

/**
 * What a learner sees instead of Resume, Jobs or Interview until their profile is complete.
 *
 * Written as a task, not a refusal. This is something they can fix in about a minute, so the
 * screen names the exact fields still outstanding and links straight to them — a bare "access
 * denied" would be both ruder and less useful.
 *
 * The module keeps its own PageShell and header at the call site; only the body is replaced, so
 * the learner still knows where they are.
 */
export function ProfileLockedGate({ moduleLabel }: { moduleLabel: string }) {
  const router = useRouter();
  const { completion, percentage, missingFields } = useProfileGate();

  // Prefer the server's labelled list; fall back to raw field names if only those are known
  // (which happens when the lock came from a 403 body rather than the profile payload).
  const outstanding = completion?.required_fields?.length
    ? completion.required_fields.filter((f) => !f.filled)
    : missingFields.map((f) => ({
        field: f,
        label: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        filled: false,
      }));

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", py: { xs: 4, md: 8 }, textAlign: "center" }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: "auto",
          mb: 2,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: "white",
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
        }}
      >
        <Icon icon="mdi:lock-outline" width={30} />
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "1.25rem" }}>
        Complete your profile to unlock {moduleLabel}
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 1, fontSize: "0.92rem" }}>
        {moduleLabel} uses your details to match you properly. Fill in the last few fields and it
        opens immediately — nothing else is required.
      </Typography>

      <Box sx={{ mt: 3 }}>
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
          spacing={1}
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 3,
            textAlign: "left",
            bgcolor: "var(--surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "text.secondary" }}>
            STILL NEEDED
          </Typography>
          {outstanding.map((f) => (
            <Stack key={f.field} direction="row" spacing={1} alignItems="center">
              <Icon icon="mdi:circle-outline" width={16} style={{ color: "#cbd5e1" }} />
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{f.label}</Typography>
            </Stack>
          ))}
        </Stack>
      )}

      <ButtonBase
        onClick={() => router.push("/profile#profile-strength")}
        sx={{
          mt: 3,
          px: 3,
          py: 1.25,
          borderRadius: 2.5,
          fontWeight: 800,
          fontSize: "0.92rem",
          color: "white",
          gap: 0.75,
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
        }}
      >
        Complete your profile <Icon icon="mdi:arrow-right" width={18} />
      </ButtonBase>
    </Box>
  );
}

/**
 * Reads a `profile_incomplete` lock off a failed request.
 *
 * The server is authoritative: if an endpoint says locked, lock — even when the cached completion
 * says otherwise, because the cache can be stale and the API cannot.
 */
export function readProfileLock(err: unknown): { missing_fields?: string[]; detail?: string } | null {
  const resp = (err as { response?: { status?: number; data?: Record<string, unknown> } })?.response;
  if (resp?.status !== 403) return null;
  const data = resp.data ?? {};
  const detail = data.detail as Record<string, unknown> | string | undefined;
  // DRF renders a dict `message` as {"detail": {...}}; a plain string means a different 403.
  const body = typeof detail === "object" && detail !== null ? detail : data;
  if (body.code !== "profile_incomplete") return null;
  return {
    missing_fields: Array.isArray(body.missing_fields) ? (body.missing_fields as string[]) : [],
    detail: typeof body.detail === "string" ? body.detail : undefined,
  };
}
