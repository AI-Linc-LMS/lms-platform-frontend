"use client";

import { useState } from "react";
import { Avatar, type AvatarProps } from "@mui/material";

type Props = Omit<AvatarProps, "src" | "children"> & {
  logoUrl?: string | null;
  companyName?: string | null;
};

const logoAvatarBaseSx = {
  bgcolor: "var(--card-bg)",
  color: "var(--accent-indigo)",
  border: "1px solid color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
  fontWeight: 600,
  boxSizing: "border-box" as const,
  p: 0.75,
  "& img": {
    objectFit: "contain" as const,
    objectPosition: "center",
  },
};

/**
 * Shows company logo when URL loads; on error or missing URL shows initials.
 * White tile + soft border + contain (matches admin jobs list styling).
 */
export function CompanyLogoAvatar({
  logoUrl,
  companyName,
  sx,
  ...avatarProps
}: Props) {
  const [broken, setBroken] = useState(false);
  const initial = companyName?.trim()?.[0]?.toUpperCase() || "C";
  const src = logoUrl?.trim() && !broken ? logoUrl.trim() : undefined;

  return (
    <Avatar
      key={logoUrl ?? ""}
      {...avatarProps}
      sx={[logoAvatarBaseSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      src={src}
      alt={companyName ?? "Company"}
      imgProps={{
        loading: "lazy",
        referrerPolicy: "no-referrer",
        onError: () => setBroken(true),
      }}
    >
      {initial}
    </Avatar>
  );
}
