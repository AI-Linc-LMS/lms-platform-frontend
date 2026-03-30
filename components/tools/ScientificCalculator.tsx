"use client";

import { useCallback, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { evaluateScientificExpression } from "@/lib/utils/scientific-expression-eval";

type Btn =
  | { t: "d"; v: string }
  | { t: "op"; v: string }
  | { t: "fn"; v: string; suffix: string }
  | { t: "const"; v: string }
  | { t: "act"; v: "clear" | "bs" | "eq" };

const ROWS: Btn[][] = [
  [
    { t: "fn", v: "sin", suffix: "(" },
    { t: "fn", v: "cos", suffix: "(" },
    { t: "fn", v: "tan", suffix: "(" },
    { t: "act", v: "clear" },
  ],
  [
    { t: "fn", v: "log", suffix: "(" },
    { t: "fn", v: "ln", suffix: "(" },
    { t: "fn", v: "sqrt", suffix: "(" },
    { t: "act", v: "bs" },
  ],
  [
    { t: "d", v: "(" },
    { t: "d", v: ")" },
    { t: "const", v: "PI" },
    { t: "op", v: "^" },
  ],
  [
    { t: "d", v: "7" },
    { t: "d", v: "8" },
    { t: "d", v: "9" },
    { t: "op", v: "/" },
  ],
  [
    { t: "d", v: "4" },
    { t: "d", v: "5" },
    { t: "d", v: "6" },
    { t: "op", v: "*" },
  ],
  [
    { t: "d", v: "1" },
    { t: "d", v: "2" },
    { t: "d", v: "3" },
    { t: "op", v: "-" },
  ],
  [
    { t: "d", v: "0" },
    { t: "d", v: "." },
    { t: "const", v: "E" },
    { t: "op", v: "+" },
  ],
  [{ t: "act", v: "eq" }],
];

function needsImplicitMul(expr: string, next: string): boolean {
  if (!expr) return false;
  const last = expr[expr.length - 1];
  if (next === "(" && /[0-9PIE.)]/.test(last)) return true;
  if (/[0-9]/.test(next) && last === ")") return true;
  if (next === "PI" || next === "E") {
    if (/[0-9.)]/.test(last)) return true;
  }
  return false;
}

function btnRole(b: Btn): "num" | "op" | "fn" | "const" | "clear" | "bs" | "eq" {
  if (b.t === "act") {
    if (b.v === "clear") return "clear";
    if (b.v === "bs") return "bs";
    return "eq";
  }
  if (b.t === "d") return "num";
  if (b.t === "op") return "op";
  if (b.t === "const") return "const";
  return "fn";
}

export interface ScientificCalculatorProps {
  errorLabel: string;
  radiansHint: string;
}

export function ScientificCalculator({ errorLabel, radiansHint }: ScientificCalculatorProps) {
  const theme = useTheme();
  const [expr, setExpr] = useState("");
  const [error, setError] = useState<string | null>(null);

  const append = useCallback((chunk: string) => {
    setError(null);
    setExpr((prev) => {
      const next = needsImplicitMul(prev, chunk) ? `${prev}*${chunk}` : prev + chunk;
      return next;
    });
  }, []);

  const onBtn = useCallback(
    (b: Btn) => {
      if (b.t === "d" || b.t === "op") {
        append(b.v);
        return;
      }
      if (b.t === "const") {
        append(b.v);
        return;
      }
      if (b.t === "fn") {
        setError(null);
        setExpr((prev) => {
          const fnChunk = `${b.v}${b.suffix}`;
          const p = needsImplicitMul(prev, "(") ? `${prev}*` : prev;
          return p + fnChunk;
        });
        return;
      }
      if (b.t === "act") {
        if (b.v === "clear") {
          setExpr("");
          setError(null);
          return;
        }
        if (b.v === "bs") {
          setExpr((prev) => prev.slice(0, -1));
          setError(null);
          return;
        }
        if (b.v === "eq") {
          setExpr((prev) => {
            try {
              const n = evaluateScientificExpression(prev);
              queueMicrotask(() => setError(null));
              return String(n);
            } catch {
              queueMicrotask(() => setError(errorLabel));
              return prev;
            }
          });
        }
      }
    },
    [append, errorLabel]
  );

  const displayBg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.black, 0.45)
      : alpha(theme.palette.grey[800], 0.06);
  const displayBorder =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.08)
      : alpha(theme.palette.common.black, 0.08);

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, lineHeight: 1.4 }}>
        {radiansHint}
      </Typography>
      <Box
        sx={{
          mb: 1.25,
          px: 1.5,
          py: 1.25,
          minHeight: 48,
          borderRadius: 2,
          bgcolor: displayBg,
          border: "1px solid",
          borderColor: displayBorder,
          boxShadow: theme.palette.mode === "dark" ? "inset 0 2px 8px rgba(0,0,0,0.35)" : "inset 0 1px 3px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography
          component="div"
          sx={{
            width: "100%",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.95rem",
            fontWeight: 600,
            lineHeight: 1.35,
            wordBreak: "break-all",
            color: error ? "error.main" : expr ? "text.primary" : "text.disabled",
            textAlign: "right",
            minHeight: "1.35em",
          }}
        >
          {expr || "0"}
        </Typography>
      </Box>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {ROWS.map((row, ri) => (
          <Box key={ri} sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.75 }}>
            {row.map((b, bi) => {
              const label =
                b.t === "fn"
                  ? `${b.v}(`
                  : b.t === "act"
                    ? b.v === "clear"
                      ? "AC"
                      : b.v === "bs"
                        ? "⌫"
                        : "="
                    : b.v;
              const span = b.t === "act" && b.v === "eq" ? { gridColumn: "span 4" } : {};
              const role = btnRole(b);
              const primary = theme.palette.primary.main;
              const subtleBorder = alpha(primary, 0.35);
              const fnBg = alpha(primary, 0.1);

              const base: SxProps<Theme> = {
                minWidth: 0,
                minHeight: 40,
                py: 1.1,
                fontSize: role === "fn" ? "0.68rem" : "0.78rem",
                fontWeight: 600,
                borderRadius: 1.75,
                textTransform: "none",
                boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.2 : 0.06)}`,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "box-shadow", "transform", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:active": {
                  transform: "scale(0.97)",
                },
                ...span,
              };

              let btnSx: SxProps<Theme> = base;
              if (role === "num" || role === "const") {
                btnSx = {
                  ...base,
                  borderColor: alpha(theme.palette.text.primary, 0.12),
                  color: "text.primary",
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  "&:hover": {
                    borderColor: alpha(theme.palette.text.primary, 0.22),
                    bgcolor: alpha(theme.palette.action.hover, 0.8),
                  },
                };
              } else if (role === "op") {
                btnSx = {
                  ...base,
                  borderColor: subtleBorder,
                  color: "primary.main",
                  bgcolor: alpha(primary, 0.04),
                  "&:hover": {
                    borderColor: primary,
                    bgcolor: alpha(primary, 0.1),
                  },
                };
              } else if (role === "fn") {
                btnSx = {
                  ...base,
                  borderColor: "transparent",
                  color: "primary.main",
                  bgcolor: fnBg,
                  "&:hover": {
                    bgcolor: alpha(primary, 0.18),
                  },
                };
              } else if (role === "clear" || role === "bs") {
                btnSx = {
                  ...base,
                  borderColor: alpha(theme.palette.error.main, 0.35),
                  color: "error.main",
                  bgcolor: alpha(theme.palette.error.main, 0.06),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.main, 0.12),
                  },
                };
              } else {
                btnSx = {
                  ...base,
                  py: 1.35,
                  minHeight: 44,
                  fontSize: "0.95rem",
                  boxShadow: `0 4px 12px ${alpha(primary, 0.35)}`,
                  "&:hover": {
                    boxShadow: `0 6px 16px ${alpha(primary, 0.45)}`,
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                };
              }

              return (
                <Button
                  key={`${ri}-${bi}`}
                  variant={role === "eq" ? "contained" : "outlined"}
                  color={role === "eq" ? "primary" : "inherit"}
                  size="small"
                  sx={btnSx}
                  onClick={() => onBtn(b)}
                >
                  {label}
                </Button>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
