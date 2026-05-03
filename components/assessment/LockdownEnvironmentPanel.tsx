"use client";

import { Box, Typography, Button, Paper, Alert, List, ListItem, ListItemText } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { LockdownGateResult } from "@/lib/utils/lockdown-environment.utils";

type PanelVariant = "blocking" | "inline";

interface LockdownEnvironmentPanelProps {
  variant: PanelVariant;
  slug: string;
  assessmentTitle?: string;
  gate: LockdownGateResult;
  /** When true, show a one-line UA hint for support (trimmed). */
  showAgentHint?: boolean;
}

export function LockdownEnvironmentPanel({
  variant,
  slug,
  assessmentTitle,
  gate,
  showAgentHint = false,
}: LockdownEnvironmentPanelProps) {
  const { t } = useTranslation("common");
  const router = useRouter();

  if (!gate.required || gate.satisfied) return null;

  const uaShort =
    typeof navigator !== "undefined" && navigator.userAgent
      ? navigator.userAgent.slice(0, 160) +
        (navigator.userAgent.length > 160 ? "…" : "")
      : "";

  const body = (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("assessments.lockdown.intro")}
      </Typography>
      <List dense sx={{ py: 0, mb: 2 }}>
        <ListItem sx={{ px: 0, alignItems: "flex-start" }}>
          <ListItemText
            primary={t("assessments.lockdown.bulletSeb")}
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItem>
        <ListItem sx={{ px: 0, alignItems: "flex-start" }}>
          <ListItemText
            primary={t("assessments.lockdown.bulletRespondus")}
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItem>
        <ListItem sx={{ px: 0, alignItems: "flex-start" }}>
          <ListItemText
            primary={t("assessments.lockdown.bulletKiosk")}
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItem>
      </List>
      {gate.allowedClients?.length ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {t("assessments.lockdown.allowedOnly", {
            list: gate.allowedClients.join(", "),
          })}
        </Typography>
      ) : null}
      {showAgentHint && uaShort ? (
        <Typography
          variant="caption"
          component="pre"
          sx={{
            display: "block",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "text.secondary",
            mb: 2,
            fontFamily: "monospace",
          }}
        >
          {t("assessments.lockdown.agentHint")}
          {uaShort}
        </Typography>
      ) : null}
    </>
  );

  if (variant === "inline") {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          {t("assessments.lockdown.title")}
        </Typography>
        {assessmentTitle ? (
          <Typography variant="body2" sx={{ mb: 1 }}>
            {assessmentTitle}
          </Typography>
        ) : null}
        {body}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: "var(--neutral-100)",
      }}
    >
      <Paper elevation={2} sx={{ maxWidth: 560, width: 1, p: 3, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t("assessments.lockdown.title")}
        </Typography>
        {assessmentTitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {assessmentTitle}
          </Typography>
        ) : null}
        {body}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1 }}>
          <Button variant="contained" onClick={() => router.push(`/assessments/${slug}`)}>
            {t("assessments.backToAssessments")}
          </Button>
          <Button variant="outlined" onClick={() => router.push(`/assessments/${slug}/device-check`)}>
            {t("assessments.lockdown.retryDeviceCheck")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
