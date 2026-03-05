"use client";

import { Paper, Typography, Box, Alert, AlertTitle, Button } from "@mui/material";
import Link from "next/link";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

/** Empty list / no results state */
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export const EmptyState = memo(function EmptyState({
  icon = "mdi:briefcase-outline",
  title,
  description,
}: EmptyStateProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: "center",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ color: "#9ca3af", mb: 2, display: "flex", justifyContent: "center" }}>
        <IconWrapper icon={icon} size={48} color="#9ca3af" />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Paper>
  );
});

/** API error or permission message with optional back link */
interface ErrorAlertProps {
  message: string;
  title?: string;
  severity?: "error" | "warning" | "info";
  backLink?: string;
  backLabel?: string;
}

export const ErrorAlert = memo(function ErrorAlert({
  message,
  title = "Error",
  severity = "error",
  backLink,
  backLabel = "Go back",
}: ErrorAlertProps) {
  return (
    <Alert
      severity={severity}
      sx={{ mb: 2 }}
      action={
        backLink ? (
          <Button variant="outlined" size="small" component={Link} href={backLink}>
            {backLabel}
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
});
