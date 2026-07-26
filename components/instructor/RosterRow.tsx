"use client";

import { Box, Stack, Typography } from "@mui/material";

/** A single clickable student row shared by the cohort + course rosters. */
export function RosterRow({
  name,
  email,
  onClick,
  right,
}: {
  name: string;
  email: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Box
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        cursor: onClick ? "pointer" : "default",
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": onClick
          ? { borderColor: "color-mix(in srgb, #6366f1 40%, transparent)", boxShadow: "0 6px 16px -10px rgba(99,102,241,0.35)" }
          : undefined,
        "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: 2 },
      }}
    >
      <Box sx={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
        color: "#fff", fontWeight: 800, background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
        {(name || email || "?").slice(0, 1).toUpperCase()}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }} noWrap>{name || "-"}</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }} noWrap>{email}</Typography>
      </Box>
      {right && <Box sx={{ flexShrink: 0 }}>{right}</Box>}
    </Box>
  );
}
