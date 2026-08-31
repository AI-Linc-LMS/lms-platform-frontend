"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, R, TYPE } from "./jobsTokens";
import { JCard } from "./Surfaces";
import { JButton } from "./JButton";

export interface ErrorStateProps {
  title?: string;
  body?: string;
  /** The raw failure, rendered verbatim in a mono block. Never swallowed. */
  error?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: ReactNode;
  variant?: "page" | "panel" | "inline";
  busy?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

const PADDING = {
  page: { xs: 5, md: 6 },
  panel: { xs: 4, md: 5 },
  inline: { xs: 2.5, md: 3 },
} as const;

/**
 * The component that did not exist, and the single biggest fix in the module.
 *
 * Before this, every failed fetch in jobs-v2 rendered an EMPTY state — "No jobs found",
 * "No applications yet", "Job not found" — which lies to the user about their own data and
 * blames them for a server fault. **Every data-loading surface now keeps a `loadError` and
 * renders this when it is set. A `catch` may never `setX([])`.**
 */
export function ErrorState({
  title,
  body,
  error,
  onRetry,
  retryLabel,
  secondaryAction,
  variant = "panel",
  busy,
  sx,
  ...rest
}: ErrorStateProps) {
  const { t } = useTranslation("common");

  return (
    <JCard
      {...rest}
      role="alert"
      elevated={false}
      padded={false}
      sx={[
        {
          py: PADDING[variant],
          px: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1.5,
          borderColor: J.dangerBd,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        aria-hidden
        sx={{
          width: variant === "inline" ? 48 : 72,
          height: variant === "inline" ? 48 : 72,
          borderRadius: R.inner,
          display: "grid",
          placeItems: "center",
          bgcolor: J.dangerBg,
          color: J.dangerFg,
        }}
      >
        <IconWrapper icon="mdi:alert-circle-outline" size={variant === "inline" ? 24 : 34} />
      </Box>

      <Typography component="p" sx={TYPE.h3}>
        {title ?? (t("jobsV2.error.title") as string)}
      </Typography>
      <Typography sx={{ ...TYPE.body, maxWidth: "46ch" }}>
        {body ?? (t("jobsV2.error.body") as string)}
      </Typography>

      {error && (
        <Box
          sx={{
            mt: 0.5,
            px: 1.5,
            py: 1,
            maxWidth: "100%",
            borderRadius: R.ctl,
            bgcolor: J.surface2,
            border: `1px solid ${J.hairline}`,
            overflowX: "auto",
          }}
        >
          <Typography component="code" sx={{ ...TYPE.mono, whiteSpace: "pre-wrap", textAlign: "start" }}>
            {error}
          </Typography>
        </Box>
      )}

      {(onRetry || secondaryAction) && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: 1.25,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {onRetry && (
            <JButton
              variant="secondary"
              startIcon="mdi:refresh"
              onClick={onRetry}
              loading={busy}
              fullWidth
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {retryLabel ?? (t("jobsV2.error.retry") as string)}
            </JButton>
          )}
          {secondaryAction}
        </Box>
      )}
    </JCard>
  );
}
