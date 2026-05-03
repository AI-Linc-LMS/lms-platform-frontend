"use client";

import {
  Box,
  ButtonBase,
  Collapse,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { memo, useCallback, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export type MathSymbolItem = {
  char: string;
  nameKey: string;
};

export const MATH_SYMBOL_GROUPS: { id: string; symbols: MathSymbolItem[] }[] = [
  {
    id: "operators",
    symbols: [
      { char: "±", nameKey: "plusMinus" },
      { char: "×", nameKey: "multiply" },
      { char: "÷", nameKey: "divide" },
      { char: "·", nameKey: "middleDot" },
      { char: "√", nameKey: "squareRoot" },
    ],
  },
  {
    id: "calculus",
    symbols: [
      { char: "∞", nameKey: "infinity" },
      { char: "∑", nameKey: "summation" },
      { char: "∏", nameKey: "product" },
      { char: "∫", nameKey: "integral" },
      { char: "∂", nameKey: "partial" },
      { char: "∇", nameKey: "nabla" },
    ],
  },
  {
    id: "greek",
    symbols: [
      { char: "π", nameKey: "pi" },
      { char: "θ", nameKey: "theta" },
      { char: "λ", nameKey: "lambda" },
      { char: "α", nameKey: "alpha" },
      { char: "β", nameKey: "beta" },
      { char: "γ", nameKey: "gamma" },
      { char: "δ", nameKey: "delta" },
      { char: "ε", nameKey: "epsilon" },
      { char: "Ω", nameKey: "omega" },
    ],
  },
  {
    id: "relations",
    symbols: [
      { char: "≈", nameKey: "approximately" },
      { char: "≠", nameKey: "notEqual" },
      { char: "≤", nameKey: "leq" },
      { char: "≥", nameKey: "geq" },
    ],
  },
  {
    id: "sets",
    symbols: [
      { char: "∈", nameKey: "elementOf" },
      { char: "∉", nameKey: "notElementOf" },
      { char: "⊆", nameKey: "subsetOrEqual" },
      { char: "∪", nameKey: "union" },
      { char: "∩", nameKey: "intersection" },
      { char: "∅", nameKey: "emptySet" },
    ],
  },
  {
    id: "arrows_misc",
    symbols: [
      { char: "→", nameKey: "arrowRight" },
      { char: "↔", nameKey: "arrowLeftRight" },
      { char: "²", nameKey: "superscriptTwo" },
      { char: "³", nameKey: "superscriptThree" },
      { char: "°", nameKey: "degrees" },
    ],
  },
];

interface MathSymbolToolbarProps {
  onInsert: (text: string) => void;
}

const SYMBOL_FONT =
  'ui-sans-serif, system-ui, "Segoe UI Symbol", "Noto Sans Math", "Apple Color Emoji", sans-serif';

export const MathSymbolToolbar = memo(function MathSymbolToolbar({
  onInsert,
}: MathSymbolToolbarProps) {
  const { t } = useTranslation("common");
  const reactId = useId();
  const headingId = `subjective-math-symbols-title-${reactId}`;
  const descId = `subjective-math-symbols-desc-${reactId}`;
  const panelId = `subjective-math-symbols-panel-${reactId}`;

  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      component="section"
      role="region"
      aria-labelledby={headingId}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
        background: "linear-gradient(165deg, var(--font-light) 0%, var(--surface) 55%, var(--neutral-100) 100%)",
        boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo-dark) 8%, transparent), 0 1px 2px color-mix(in srgb, var(--primary-900) 6%, transparent)",
        overflow: "hidden",
      }}
    >
      <Typography component="h3" id={headingId} sx={visuallyHidden}>
        {t("quiz.mathSymbols.title")}
      </Typography>
      <ButtonBase
        component="button"
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-describedby={descId}
        aria-label={expanded ? t("quiz.mathSymbols.collapseSection") : t("quiz.mathSymbols.expandSection")}
        onClick={toggle}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          textAlign: "left",
          gap: 1.5,
          p: 1.75,
          pr: 1.25,
          borderRadius: 0,
          transition: "background-color 0.15s ease",
          backgroundColor: expanded ? "color-mix(in srgb, var(--surface-indigo-light) 65%, transparent)" : "color-mix(in srgb, var(--surface) 92%, transparent)",
          borderBottom: expanded ? "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)" : "none",
          "&:hover": {
            backgroundColor: expanded ? "color-mix(in srgb, var(--surface-indigo-light) 85%, transparent)" : "var(--neutral-100)",
          },
          "&.Mui-focusVisible": {
            outline: "2px solid var(--accent-indigo)",
            outlineOffset: -2,
            zIndex: 1,
          },
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--font-light)",
            border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
            boxShadow: "0 1px 3px color-mix(in srgb, var(--accent-indigo-dark) 14%, transparent)",
          }}
          aria-hidden
        >
          <IconWrapper icon="mdi:function-variant" size={24} color="var(--accent-indigo-dark)" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, py: 0.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.35 }}>
            <Typography
              component="span"
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: "var(--accent-indigo-dark)",
                fontSize: "0.9375rem",
                letterSpacing: "-0.01em",
              }}
            >
              {t("quiz.mathSymbols.title")}
            </Typography>
            <Typography
              component="span"
              variant="caption"
              sx={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--accent-indigo-dark)",
                bgcolor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
              }}
            >
              {t("quiz.mathSymbols.badge")}
            </Typography>
          </Box>
          <Typography
            id={descId}
            variant="caption"
            sx={{ display: "block", color: "var(--font-secondary)", lineHeight: 1.5, fontSize: "0.75rem" }}
          >
            {t("quiz.mathSymbols.help")}
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-indigo-dark)",
            mt: 0.25,
          }}
          aria-hidden
        >
          <IconWrapper
            icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"}
            size={28}
            color="var(--accent-indigo-dark)"
          />
        </Box>
      </ButtonBase>

      <Collapse in={expanded} timeout="auto">
        <Box
          id={panelId}
          role="group"
          aria-label={t("quiz.mathSymbols.title")}
          sx={{
            p: 1.75,
            pt: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            bgcolor: "var(--font-light)",
          }}
        >
          {MATH_SYMBOL_GROUPS.map((group) => (
            <SymbolGroupRow
              key={group.id}
              groupId={group.id}
              symbols={group.symbols}
              onInsert={onInsert}
              t={t}
              isNarrow={isNarrow}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
});

type TFn = (key: string, options?: Record<string, string>) => string;

function SymbolGroupRow({
  groupId,
  symbols,
  onInsert,
  t,
  isNarrow,
}: {
  groupId: string;
  symbols: MathSymbolItem[];
  onInsert: (s: string) => void;
  t: TFn;
  isNarrow: boolean;
}) {
  const groupLabel = t(`quiz.mathSymbols.groups.${groupId}`);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 0.75, sm: 1.25 },
        alignItems: { sm: "flex-start" },
      }}
    >
      <Typography
        component="h4"
        variant="caption"
        sx={{
          flexShrink: 0,
          fontWeight: 700,
          fontSize: "0.65rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--accent-indigo)",
          pt: { sm: 0.85 },
          minWidth: { sm: 108 },
        }}
      >
        {groupLabel}
      </Typography>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: isNarrow ? 0.75 : 0.6,
          alignItems: "center",
          p: { xs: 0.25, sm: 0 },
        }}
      >
        {symbols.map((s) => {
          const name = t(`quiz.mathSymbols.names.${s.nameKey}`);
          const aria = t("quiz.mathSymbols.insertNamed", { name });
          return (
            <Tooltip
              key={`${groupId}-${s.nameKey}`}
              title={name}
              placement="top"
              enterDelay={280}
              enterNextDelay={120}
              slotProps={{
                popper: {
                  modifiers: [{ name: "offset", options: { offset: [0, -6] } }],
                },
              }}
            >
              <ButtonBase
                type="button"
                onClick={() => onInsert(s.char)}
                aria-label={aria}
                sx={{
                  minWidth: isNarrow ? 44 : 38,
                  minHeight: isNarrow ? 44 : 36,
                  px: 1,
                  borderRadius: 1.25,
                  fontSize: isNarrow ? "1.05rem" : "0.98rem",
                  fontFamily: SYMBOL_FONT,
                  fontWeight: 600,
                  color: "color-mix(in srgb, var(--accent-indigo-dark) 88%, var(--font-dark))",
                  backgroundColor: "var(--neutral-50)",
                  border: "1px solid var(--border-default)",
                  transition:
                    "background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, transform 0.08s ease",
                  "@media (pointer: coarse)": {
                    minWidth: 46,
                    minHeight: 46,
                  },
                  "&:hover": {
                    backgroundColor: "var(--surface-indigo-light)",
                    borderColor: "color-mix(in srgb, var(--accent-indigo) 38%, transparent)",
                    boxShadow: "0 2px 6px color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
                  },
                  "&:active": {
                    transform: "scale(0.96)",
                    backgroundColor: "color-mix(in srgb, var(--surface-indigo-light) 85%, var(--accent-indigo))",
                  },
                  "&.Mui-focusVisible": {
                    outline: "2px solid var(--accent-indigo)",
                    outlineOffset: 2,
                  },
                }}
              >
                {s.char}
              </ButtonBase>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
