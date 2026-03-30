"use client";

import { Box, IconButton, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface FloatingToolToggleButtonsProps {
  calculatorOpen: boolean;
  notepadOpen: boolean;
  onToggleCalculator: () => void;
  onToggleNotepad: () => void;
}

export function FloatingToolToggleButtons({
  calculatorOpen,
  notepadOpen,
  onToggleCalculator,
  onToggleNotepad,
}: FloatingToolToggleButtonsProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();

  const toolSx = (active: boolean, accent: "primary" | "success") => {
    const main = accent === "primary" ? theme.palette.primary.main : theme.palette.success.main;
    const borderIdle = alpha(theme.palette.divider, 0.95);
    return {
      width: 44,
      height: 44,
      borderRadius: 2,
      border: "1px solid",
      borderColor: active ? main : borderIdle,
      bgcolor: active ? alpha(main, 0.14) : alpha(theme.palette.background.paper, 0.95),
      color: active ? main : theme.palette.text.secondary,
      boxShadow: active ? `0 2px 10px ${alpha(main, 0.22)}` : `0 1px 2px ${alpha(theme.palette.common.black, 0.06)}`,
      transition: theme.transitions.create(
        ["border-color", "background-color", "box-shadow", "color", "transform"],
        { duration: theme.transitions.duration.shorter }
      ),
      "&:hover": {
        borderColor: main,
        bgcolor: alpha(main, 0.12),
        color: main,
        boxShadow: `0 4px 14px ${alpha(main, 0.28)}`,
      },
      "&:active": {
        transform: "scale(0.96)",
      },
    };
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        pr: { xs: 0.25, sm: 0.5 },
      }}
    >
      <Tooltip title={t("tools.calculator")}>
        <IconButton
          size="small"
          onClick={onToggleCalculator}
          aria-label={t("tools.calculator")}
          aria-pressed={calculatorOpen}
          sx={toolSx(calculatorOpen, "primary")}
        >
          <IconWrapper icon="mdi:calculator-variant" size={24} color="currentColor" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t("tools.notepad")}>
        <IconButton
          size="small"
          onClick={onToggleNotepad}
          aria-label={t("tools.notepad")}
          aria-pressed={notepadOpen}
          sx={toolSx(notepadOpen, "success")}
        >
          <IconWrapper icon="mdi:notebook-edit-outline" size={24} color="currentColor" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
