"use client";

import { Box, Container, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * The deactivated-workspace message itself, without page chrome, so a host that already owns a
 * shell can render exactly the same words as the full-page screen below.
 *
 * It names no support address, phone number or billing link on purpose. The platform does not
 * know which of those an institution wants its learners to use, and a guessed one sends people
 * somewhere nobody is reading - worse than the honest "ask your administrator".
 */
export function WorkspaceDeactivatedNotice() {
  const { t } = useTranslation("common");

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            width: { xs: 88, sm: 104 },
            height: { xs: 88, sm: 104 },
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
            color: "warning.main",
          }}
        >
          <IconWrapper icon="mdi:lock-outline" size={48} />
        </Box>
      </Box>

      <Typography
        component="h1"
        variant="h5"
        sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}
      >
        {t("auth.workspaceDeactivatedTitle", {
          defaultValue: "Workspace deactivated",
        })}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ lineHeight: 1.7, fontSize: "0.9375rem", maxWidth: 480, mx: "auto" }}
      >
        {t("auth.workspaceDeactivatedBody", {
          defaultValue:
            "Your institution's access to this platform has been suspended. Please contact your administrator for more information.",
        })}
      </Typography>
    </Box>
  );
}

/**
 * The notice as a standalone page. Rendered in place of the app, so it carries its own
 * background and centering rather than inheriting a shell it no longer sits inside.
 *
 * It deliberately renders nothing interactive: no retry, no "back to dashboard", no link that
 * would mount a route and start it fetching. Every authenticated call is 403ing, so any action
 * offered here would just fail in front of the person it was offered to.
 */
export function WorkspaceDeactivatedScreen() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        py: { xs: 4, sm: 8 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <WorkspaceDeactivatedNotice />
        </Paper>
      </Container>
    </Box>
  );
}
