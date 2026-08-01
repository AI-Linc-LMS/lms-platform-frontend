"use client";

import type { ReactNode } from "react";
import { Box, Button, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";

/**
 * Component-level profile locks.
 *
 * Replaces the full-page ProfileLockModal on Resume, Jobs and Interview. That modal made the
 * whole page unreachable, which answered "you cannot do this" but never "what am I missing
 * out on" — a learner staring at a blurred page has no reason to spend the minute it takes to
 * fix their profile. Locking only the action leaves the page browsable: you can read what the
 * module does, see the layout, and understand the offer before being asked to pay for it.
 *
 * Two shapes, one message:
 *   ProfileLockCard   replaces a whole component (a job list, the interview launcher)
 *   LockedAction      wraps a single control (Save resume, Download PDF)
 *
 * The lock is a product flow, never a security boundary. Every gated endpoint enforces the
 * real rule server-side, so nothing here is load-bearing for access control.
 */

/** The outstanding fields, preferring the server's labelled list over raw field names. */
function useOutstandingFields() {
  const { completion, missingFields } = useProfileGate();
  return completion?.required_fields?.length
    ? completion.required_fields.filter((f) => !f.filled)
    : missingFields.map((f) => ({
        field: f,
        label: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        filled: false,
      }));
}

function CompleteProfileButton({ fullWidth = true, size = "md" }: { fullWidth?: boolean; size?: "sm" | "md" }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  return (
    <Button
      fullWidth={fullWidth}
      onClick={() => router.push("/profile#profile-strength")}
      startIcon={<Icon icon="mdi:account-edit-outline" width={size === "sm" ? 16 : 18} />}
      sx={{
        py: size === "sm" ? 0.7 : 1.15,
        px: size === "sm" ? 2 : 2.5,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: size === "sm" ? "0.78rem" : "0.9rem",
        color: "white",
        textTransform: "none",
        background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
        boxShadow: "0 14px 30px -12px rgba(192,38,211,0.7)",
        "&:hover": { filter: "brightness(1.06)", background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" },
      }}
    >
      {t("lock.completeProfile", { defaultValue: "Complete profile" })}
    </Button>
  );
}

/**
 * A locked stand-in for one component.
 *
 * `preview` is the point of this over a modal: it renders the real component behind the lock,
 * dimmed and inert, so the learner can see the thing they are unlocking. Pass it whenever
 * there is something worth seeing; omit it when there would be nothing but an empty state.
 */
export function ProfileLockCard({
  title,
  body,
  preview,
  compact = false,
}: {
  title: string;
  body: string;
  preview?: ReactNode;
  compact?: boolean;
}) {
  const { t } = useTranslation("common");
  const { percentage } = useProfileGate();
  const outstanding = useOutstandingFields();

  return (
    <Box sx={{ position: "relative", borderRadius: 4, overflow: "hidden" }}>
      {preview && (
        <Box
          aria-hidden
          // inert would be ideal, but React 18's typings do not carry it; pointerEvents plus
          // aria-hidden keeps the preview out of both the tab order and the pointer path.
          sx={{
            pointerEvents: "none",
            userSelect: "none",
            filter: "blur(2.5px) saturate(0.65)",
            opacity: 0.45,
            maxHeight: compact ? 220 : 380,
            overflow: "hidden",
            maskImage: "linear-gradient(to bottom, #000 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 30%, transparent 100%)",
          }}
        >
          {preview}
        </Box>
      )}

      <Box
        sx={
          preview
            ? { position: "absolute", inset: 0, display: "grid", placeItems: "center", px: 2 }
            : { position: "static" }
        }
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 460,
            textAlign: "center",
            p: { xs: 2.5, sm: 3 },
            borderRadius: 4,
            bgcolor: "#fff",
            border: "1px solid #e4e7f0",
            boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 18px 40px -24px rgba(30,27,75,0.35)",
            mx: "auto",
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              mx: "auto",
              mb: 1.75,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "white",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            }}
          >
            <Icon icon="mdi:lock-outline" width={22} />
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", letterSpacing: "-0.3px" }}>
            {title}
          </Typography>
          <Typography sx={{ color: "#475569", mt: 0.75, fontSize: "0.85rem", lineHeight: 1.55 }}>
            {body}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, percentage)}
              sx={{
                height: 7,
                borderRadius: 999,
                bgcolor: "#eef2f7",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #a855f7, #ec4899)",
                },
              }}
            />
            <Typography sx={{ mt: 0.75, fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8" }}>
              {t("lock.profilePercentComplete", { defaultValue: "Profile {{pct}}% complete", pct: percentage })}
            </Typography>
          </Box>

          {outstanding.length > 0 && !compact && (
            <Stack
              direction="row"
              flexWrap="wrap"
              justifyContent="center"
              gap={0.75}
              sx={{ mt: 2 }}
            >
              {outstanding.map((f) => (
                <Box
                  key={f.field}
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e4e7f0",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  {f.label}
                </Box>
              ))}
            </Stack>
          )}

          <Box sx={{ mt: 2.25 }}>
            <CompleteProfileButton />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Wraps a single control. The control still renders, so the learner can see the capability
 * exists, but it cannot be activated and hovering says why.
 */
export function LockedAction({
  locked,
  label,
  children,
}: {
  locked: boolean;
  label: string;
  children: ReactNode;
}) {
  const { t } = useTranslation("common");
  const { percentage } = useProfileGate();
  const router = useRouter();

  if (!locked) return <>{children}</>;

  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5, textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, mb: 0.25 }}>{label}</Typography>
          <Typography sx={{ fontSize: "0.72rem", opacity: 0.85 }}>
            {t("lock.unlockHint", { defaultValue: "Complete your profile to unlock. {{pct}}% done.", pct: percentage })}
          </Typography>
        </Box>
      }
    >
      {/* The span carries the tooltip: a disabled child fires no pointer events of its own. */}
      <Box
        component="span"
        onClick={() => router.push("/profile#profile-strength")}
        sx={{ position: "relative", display: "inline-flex", cursor: "pointer" }}
      >
        <Box sx={{ pointerEvents: "none", opacity: 0.45, filter: "grayscale(0.7)" }}>{children}</Box>
        <Box
          sx={{
            position: "absolute",
            top: -4,
            insetInlineEnd: -4,
            width: 18,
            height: 18,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            boxShadow: "0 2px 6px -1px rgba(15,10,44,0.4)",
          }}
        >
          <Icon icon="mdi:lock" width={11} />
        </Box>
      </Box>
    </Tooltip>
  );
}

/**
 * A one-line banner for the top of a gated page. Explains the state once, so the individual
 * locked components below do not each have to repeat the whole story.
 */
export function ProfileLockBanner({ moduleLabel }: { moduleLabel: string }) {
  const { t } = useTranslation("common");
  const { percentage } = useProfileGate();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        p: 1.75,
        mb: 2.5,
        borderRadius: 3,
        bgcolor: "#fdfcff",
        border: "1px solid #ede9fe",
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
        }}
      >
        <Icon icon="mdi:lock-outline" width={17} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>
          {t("lock.bannerTitle", { defaultValue: "{{module}} is limited until your profile is complete", module: moduleLabel })}
        </Typography>
        <Typography sx={{ fontSize: "0.76rem", color: "#64748b", mt: 0.15 }}>
          {t("lock.bannerBody", {
            defaultValue:
              "You can look around. Finishing your profile takes about a minute and unlocks Resume, Jobs and Interview together. {{pct}}% done.",
            pct: percentage,
          })}
        </Typography>
      </Box>
      <CompleteProfileButton fullWidth={false} size="sm" />
    </Box>
  );
}
