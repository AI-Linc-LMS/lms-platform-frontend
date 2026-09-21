"use client";

import type { ReactNode } from "react";
import { Box, Dialog, Drawer, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/* ==========================================================================
 * One dialog that knows what device it is on.
 *
 * A centred MUI Dialog on a phone is the single worst pattern in this product: it lands mid-screen
 * with its own scrollbar, its actions sit under the keyboard, and dismissing it means finding a
 * small x. Every native surface solves this the same way - the content comes up from the bottom,
 * takes the width of the screen, and is dismissed by swiping down or tapping the backdrop.
 *
 * Above `sm` this is exactly the Dialog it replaces, so a desktop layout is unchanged.
 * ======================================================================== */

export interface ResponsiveDialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** Pinned under the content; on a phone it sits above the home indicator. */
  footer?: ReactNode;
  /** Desktop width. Ignored on a phone, which is always full width. */
  maxWidth?: "xs" | "sm" | "md" | "lg";
  /** How tall the sheet may grow before its body scrolls. */
  maxHeightVh?: number;
  /** Hide the close button when the caller supplies its own. */
  hideCloseButton?: boolean;
  children: ReactNode;
  "data-testid"?: string;
}

export function ResponsiveDialog({
  open,
  onClose,
  title,
  description,
  footer,
  maxWidth = "sm",
  maxHeightVh = 88,
  hideCloseButton,
  children,
  ...rest
}: ResponsiveDialogProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  const head = (title || description || !hideCloseButton) && (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, px: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2.5 }, pb: 1 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: "1.05rem", sm: "1.15rem" }, color: "var(--font-primary)", lineHeight: 1.25 }}>
            {title}
          </Typography>
        )}
        {description && (
          <Typography sx={{ mt: 0.5, fontSize: "0.85rem", color: "var(--font-secondary)" }}>{description}</Typography>
        )}
      </Box>
      {!hideCloseButton && (
        <IconButton onClick={onClose} aria-label="Close" sx={{ width: 40, height: 40, flexShrink: 0, color: "var(--font-secondary)" }}>
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      )}
    </Box>
  );

  const body = (
    <Box sx={{ px: { xs: 2, sm: 3 }, pb: footer ? 1 : { xs: 2, sm: 3 }, overflowY: "auto", flex: 1, minHeight: 0 }}>{children}</Box>
  );

  const foot = footer && (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        borderTop: "1px solid var(--border-default, #eef2f7)",
        display: "flex",
        gap: 1,
        justifyContent: { xs: "stretch", sm: "flex-end" },
        // Full-width actions on a phone: a thumb reaches the bottom of the screen, not a 90px
        // button floating at the right edge.
        "& > *": { flex: { xs: 1, sm: "0 0 auto" } },
      }}
    >
      {footer}
    </Box>
  );

  if (isPhone) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: `${maxHeightVh}vh`,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--card-bg, #fff)",
              backgroundImage: "none",
              pb: "env(safe-area-inset-bottom)",
            },
          },
        }}
        {...rest}
      >
        <Box sx={{ width: 40, height: 4, borderRadius: 999, bgcolor: "var(--border-default, #e5e7eb)", mx: "auto", mt: 1.25 }} />
        {head}
        {body}
        {foot}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, backgroundColor: "var(--card-bg, #fff)", backgroundImage: "none" } } }}
      {...rest}
    >
      {head}
      {body}
      {foot}
    </Dialog>
  );
}
