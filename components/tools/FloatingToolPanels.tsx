"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, useDragControls } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ScientificCalculator } from "./ScientificCalculator";
import { ScratchNotepad } from "./ScratchNotepad";

const MotionBox = motion(Box);
const panelTransition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };

const dragHandleSx = {
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  "&:active": { cursor: "grabbing" },
} as const;

function startDragFromHandle(
  dragControls: ReturnType<typeof useDragControls>,
  e: React.PointerEvent
) {
  dragControls.start(e);
}

export interface FloatingToolPanelsProps {
  enabled: boolean;
  calculatorOpen: boolean;
  notepadOpen: boolean;
  onToggleCalculator: () => void;
  onToggleNotepad: () => void;
  /** sessionStorage key for notepad content */
  notepadStorageKey: string;
  /** Assessment / proctored mode: locked clipboard + assessment hint. */
  notepadRestrictClipboard?: boolean;
  /** Optional notepad hint (defaults via ScratchNotepad when omitted). */
  notepadHint?: string;
  /** Also set `data-assessment-tool` for assessment security hooks. */
  assessmentContext?: boolean;
  zIndex?: number;
}

export function FloatingToolPanels({
  enabled,
  calculatorOpen,
  notepadOpen,
  onToggleCalculator,
  onToggleNotepad,
  notepadStorageKey,
  notepadRestrictClipboard = false,
  notepadHint,
  assessmentContext = false,
  zIndex = 1400,
}: FloatingToolPanelsProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const calculatorDragControls = useDragControls();
  const notepadDragControls = useDragControls();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!enabled || !mounted || typeof document === "undefined") return null;
  if (!calculatorOpen && !notepadOpen) return null;

  const successDark = theme.palette.success.dark ?? theme.palette.success.main;
  const primaryDark = theme.palette.primary.dark ?? theme.palette.primary.main;
  const dragHint = t("tools.dragHandleHint");

  const portal = (
    <Box
      ref={constraintsRef}
      data-floating-tool="true"
      {...(assessmentContext ? { "data-assessment-tool": "true" } : {})}
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex,
      }}
    >
      {calculatorOpen && (
        <MotionBox
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={panelTransition}
          drag
          dragControls={calculatorDragControls}
          dragListener={false}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0.06}
          whileDrag={{
            scale: 1.01,
            zIndex: zIndex + 50,
            boxShadow: `0 28px 56px -12px ${alpha(theme.palette.primary.main, 0.35)}`,
          }}
          sx={{
            pointerEvents: "auto",
            position: "fixed",
            bottom: { xs: 2, sm: 3 },
            right: { xs: 2, sm: 3 },
            left: { xs: 2, sm: "auto" },
            width: { xs: "calc(100% - 32px)", sm: 380 },
            maxWidth: 400,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: `0 25px 50px -12px ${alpha(theme.palette.primary.main, 0.25)}`,
            }}
          >
            <Box
              title={dragHint}
              onPointerDown={(e) => startDragFromHandle(calculatorDragControls, e)}
              sx={dragHandleSx}
            >
              <Box
                sx={{
                  height: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${primaryDark})`,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  pt: 1.5,
                  pb: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                  }}
                >
                  <IconWrapper icon="mdi:calculator-variant" size={24} color="currentColor" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
                      {t("tools.calculator")}
                    </Typography>
                    <IconWrapper icon="mdi:drag-vertical" size={18} color={theme.palette.text.disabled} aria-hidden />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    {t("tools.calculatorSubtitle")}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={onToggleCalculator}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={t("tools.close")}
                  sx={{
                    color: "text.secondary",
                    flexShrink: 0,
                    "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.06) },
                  }}
                >
                  <IconWrapper icon="mdi:close" size={22} />
                </IconButton>
              </Box>
            </Box>
            <Box
              sx={{
                px: 2,
                pt: 1.5,
                pb: 2,
                background:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.background.paper, 0.98)
                    : alpha(theme.palette.grey[50], 0.95),
              }}
            >
              <ScientificCalculator
                errorLabel={t("tools.calculatorError")}
                radiansHint={t("tools.radiansHint")}
              />
            </Box>
          </Paper>
        </MotionBox>
      )}

      {notepadOpen && (
        <MotionBox
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={panelTransition}
          drag
          dragControls={notepadDragControls}
          dragListener={false}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0.06}
          whileDrag={{
            scale: 1.01,
            zIndex: zIndex + 50,
            boxShadow: `0 28px 56px -12px ${alpha(theme.palette.success.main, 0.32)}`,
          }}
          sx={{
            pointerEvents: "auto",
            position: "fixed",
            bottom: { xs: 2, sm: 3 },
            left: { xs: 2, sm: 3 },
            right: { xs: 2, sm: "auto" },
            width: { xs: "calc(100% - 32px)", sm: 400 },
            maxWidth: 440,
            maxHeight: "min(72vh, 520px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: "visible",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: `0 25px 50px -12px ${alpha(theme.palette.success.main, 0.22)}`,
              maxHeight: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              title={dragHint}
              onPointerDown={(e) => startDragFromHandle(notepadDragControls, e)}
              sx={{ ...dragHandleSx, overflow: "hidden", borderRadius: "12px 12px 0 0" }}
            >
              <Box
                sx={{
                  height: 4,
                  background: `linear-gradient(90deg, ${theme.palette.success.main}, ${successDark})`,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  pt: 1.5,
                  pb: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.success.main, 0.12),
                    color: "success.main",
                  }}
                >
                  <IconWrapper icon="mdi:notebook-edit-outline" size={24} color="currentColor" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
                      {t("tools.notepad")}
                    </Typography>
                    <IconWrapper icon="mdi:drag-vertical" size={18} color={theme.palette.text.disabled} aria-hidden />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    {t("tools.notepadSubtitle")}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={onToggleNotepad}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={t("tools.close")}
                  sx={{
                    color: "text.secondary",
                    flexShrink: 0,
                    "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.06) },
                  }}
                >
                  <IconWrapper icon="mdi:close" size={22} />
                </IconButton>
              </Box>
            </Box>
            <Box
              sx={{
                px: 2,
                pt: 1.5,
                pb: 2,
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.background.paper, 0.98)
                    : alpha(theme.palette.grey[50], 0.95),
              }}
            >
              <ScratchNotepad
                sessionStorageKey={notepadStorageKey}
                restrictClipboard={notepadRestrictClipboard}
                hint={notepadHint}
              />
            </Box>
          </Paper>
        </MotionBox>
      )}
    </Box>
  );

  return createPortal(portal, document.body);
}
