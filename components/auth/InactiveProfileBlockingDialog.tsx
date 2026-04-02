"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { alpha } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Non-dismissible overlay when the user is signed in but user-profile `is_profile_active` is not `true`.
 * Hidden only when the API reports `is_profile_active: true`. Parent controls `open`.
 */
export function InactiveProfileBlockingDialog({
  open,
  message,
}: {
  open: boolean;
  message: string;
}) {
  const { t } = useTranslation("common");

  return (
    <Dialog
      open={open}
      onClose={() => {
        /* blocked — no dismiss */
      }}
      disableEscapeKeyDown
      fullWidth
      maxWidth="sm"
      slotProps={{
        root: {
          sx: {
            zIndex: 20000,
          },
        },
        backdrop: {
          sx: {
            zIndex: 19999,
            backdropFilter: "blur(14px)",
            backgroundColor: "rgba(15, 23, 42, 0.65)",
          },
        },
      }}
      PaperProps={{
        elevation: 12,
        sx: {
          zIndex: 20001,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pt: 3,
          pb: 1,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
            color: "warning.main",
          }}
        >
          <IconWrapper icon="mdi:account-alert-outline" size={26} />
        </Box>
        <Typography variant="h6" component="span" fontWeight={700}>
          {t("auth.profileInactiveTitle")}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 3, pt: 0 }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ lineHeight: 1.65, fontSize: "0.9375rem" }}
        >
          {message}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
