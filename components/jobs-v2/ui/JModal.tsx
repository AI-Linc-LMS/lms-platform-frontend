"use client";

import { useCallback, useId, useState, type ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, R, SHADOW, TYPE, focusRing, tint } from "./jobsTokens";
import { MicroRuleList } from "./Surfaces";
import { JButton } from "./JButton";

export type JModalSize = "sm" | "md" | "lg" | "xl";

const WIDTHS: Record<JModalSize, number> = { sm: 480, md: 640, lg: 880, xl: 1080 };

export interface JModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: string;
  size?: JModalSize;
  tone?: "neutral" | "danger";
  footer?: ReactNode;
  /**
   * When true, a backdrop click and `Esc` do NOT close — they raise a "Discard your changes?"
   * confirm. This is the fix for the candidate pipeline modal and the apply flow silently
   * binning typed data.
   */
  dirty?: boolean;
  /** Below `md` every JModal is a bottom sheet, unless the content is a form. */
  mobile?: "sheet" | "fullscreen";
  children: ReactNode;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * ONE dialog language for the whole module. It replaces four: the indigo-gradient header, the
 * hand-built Box "title", the full-screen form and the bare MUI Dialog.
 *
 * The header is a `J.surface2` band with a hairline under it — **not** a gradient. The gradient
 * header was the only one of the four that cannot render legibly in dark, and it is the one
 * DESIGN.md bans outright.
 */
export function JModal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  icon,
  size = "md",
  tone = "neutral",
  footer,
  dirty = false,
  mobile = "sheet",
  children,
  sx,
  ...rest
}: JModalProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  // The only sanctioned useMediaQuery in the module: WHICH variant to mount cannot be
  // expressed in CSS, and a dialog is never server-rendered while closed.
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const [discardOpen, setDiscardOpen] = useState(false);

  const auto = useId().replace(/:/g, "");
  const titleId = `jm-${auto}-title`;
  const descId = `jm-${auto}-desc`;

  const requestClose = useCallback(() => {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  const asSheet = isCompact && mobile === "sheet";
  const asFullscreen = isCompact && mobile === "fullscreen";

  return (
    <>
      <Dialog
        {...rest}
        open={open}
        onClose={requestClose}
        fullScreen={asFullscreen}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        slotProps={{
          paper: {
            sx: [
              {
                borderRadius: asFullscreen
                  ? 0
                  : asSheet
                    ? `${R.card} ${R.card} 0 0`
                    : R.card,
                bgcolor: J.surface,
                color: J.ink,
                backgroundImage: "none",
                border: asFullscreen ? "none" : `1px solid ${J.hairline}`,
                boxShadow: SHADOW.overlay,
                overflow: "hidden",
                width: "100%",
                maxWidth: asSheet || asFullscreen ? "100%" : WIDTHS[size],
                // dvh, never vh: a mobile keyboard must not crush the sheet.
                maxHeight: asFullscreen ? "100dvh" : asSheet ? "92dvh" : "88vh",
                m: asSheet || asFullscreen ? 0 : 2,
              },
              ...(Array.isArray(sx) ? sx : [sx]),
            ],
          },
          container: asSheet ? { sx: { alignItems: "flex-end" } } : undefined,
        }}
      >
        {asSheet && (
          <Box
            aria-hidden
            sx={{
              display: "flex",
              justifyContent: "center",
              pt: 1,
              bgcolor: J.surface2,
            }}
          >
            <Box sx={{ width: 40, height: 4, borderRadius: R.pill, bgcolor: J.hairlineStrong }} />
          </Box>
        )}

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            px: { xs: 2, md: 3 },
            py: { xs: 1.75, md: 2 },
            paddingInlineEnd: "48px",
            bgcolor: J.surface2,
            borderBottom: `1px solid ${J.hairline}`,
          }}
        >
          {icon && (
            <Box
              aria-hidden
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: R.ctl,
                display: "grid",
                placeItems: "center",
                bgcolor: tone === "danger" ? J.dangerBg : tint(J.azure, 12),
                color: tone === "danger" ? J.dangerFg : J.azure,
              }}
            >
              <IconWrapper icon={icon} size={22} />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {eyebrow && (
              <Typography sx={{ ...TYPE.eyebrow, color: J.ink3, mb: 0.5 }}>{eyebrow}</Typography>
            )}
            <DialogTitle id={titleId} sx={{ ...TYPE.h3, p: 0, m: 0 }}>
              {title}
            </DialogTitle>
            {description && (
              <Typography id={descId} sx={{ ...TYPE.small, mt: 0.5 }}>
                {description}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={requestClose}
            aria-label={t("jobsV2.modal.close") as string}
            sx={{
              position: "absolute",
              top: 10,
              // RTL-safe: never `right`.
              insetInlineEnd: 8,
              color: J.ink3,
              "&:hover": { bgcolor: J.surface3, color: J.ink },
              ...focusRing,
            }}
          >
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>

        <DialogContent
          sx={{
            p: { xs: 2, md: 3 },
            overscrollBehavior: "contain",
            bgcolor: J.surface,
          }}
        >
          {children}
        </DialogContent>

        {footer && (
          <DialogActions
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 1.5, md: 2 },
              gap: 1.25,
              borderTop: `1px solid ${J.hairline}`,
              bgcolor: J.surface2,
              // On xs the footer stacks full-width with the primary on top; the caller passes
              // destructive/secondary first and primary last, and `column-reverse` flips it.
              flexDirection: { xs: "column-reverse", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              "& > *": { width: { xs: "100%", sm: "auto" } },
            }}
          >
            {footer}
          </DialogActions>
        )}
      </Dialog>

      {/* Rendered only when it can be needed. JModal renders JConfirm and JConfirm renders
          JModal, so an unconditional instance would recurse forever. The inner modal is never
          `dirty`, which is what terminates the chain. */}
      {(dirty || discardOpen) && (
      <JConfirm
        open={discardOpen}
        title={t("jobsV2.modal.discardTitle") as string}
        body={t("jobsV2.modal.discardBody") as string}
        confirmLabel={t("jobsV2.modal.discardConfirm") as string}
        cancelLabel={t("jobsV2.modal.discardCancel") as string}
        tone="danger"
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setDiscardOpen(false)}
      />
      )}
    </>
  );
}

/**
 * `JSheet` is the same component, forced to the bottom-sheet presentation at every breakpoint.
 * Every `JModal` already becomes a sheet below `md`; this exists for the surfaces that want a
 * sheet on a desktop too (the scraped preview).
 */
export function JSheet(props: Omit<JModalProps, "mobile">) {
  return <JModal {...props} mobile="sheet" />;
}

export interface JConfirmProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "neutral" | "danger";
  /**
   * Exactly what will change, as micro-rule bullets: "40 jobs become visible to every student",
   * "200 applicants move to Rejected". **Required for every bulk action** (4.20).
   */
  consequences?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  icon?: string;
}

export function JConfirm({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "neutral",
  consequences,
  onConfirm,
  onCancel,
  busy,
  icon,
}: JConfirmProps) {
  const { t } = useTranslation("common");
  return (
    <JModal
      open={open}
      // A danger confirm requires an explicit button press: a stray backdrop click must not
      // dismiss the only thing standing between an operator and 200 rejected applicants.
      onClose={tone === "danger" ? () => undefined : onCancel}
      title={title}
      size="sm"
      tone={tone}
      icon={icon ?? (tone === "danger" ? "mdi:alert-outline" : "mdi:help-circle-outline")}
      footer={
        <>
          <JButton variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel ?? (t("jobsV2.modal.cancel") as string)}
          </JButton>
          <JButton
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={busy}
          >
            {confirmLabel}
          </JButton>
        </>
      }
    >
      {body && <Typography sx={TYPE.body}>{body}</Typography>}
      {consequences && consequences.length > 0 && (
        <Box sx={{ mt: body ? 2 : 0 }}>
          <Typography sx={{ ...TYPE.label, mb: 1 }}>
            {t("jobsV2.modal.consequences")}
          </Typography>
          <MicroRuleList items={consequences} tone={tone === "danger" ? J.dangerFg : J.azure} />
        </Box>
      )}
    </JModal>
  );
}
