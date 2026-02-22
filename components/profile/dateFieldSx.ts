import type { SxProps, Theme } from "@mui/material";

/**
 * Returns sx props that replace the browser's default "---------, ----"
 * placeholder on empty date inputs with readable text like "DD / MM / YYYY".
 * Hides the custom placeholder on focus so the native picker takes over.
 */
export function datePlaceholderSx(
  value: string | undefined,
  placeholder = "DD / MM / YYYY"
): SxProps<Theme> {
  if (value) return {};
  return {
    "& input::-webkit-datetime-edit": { color: "transparent" },
    "& .MuiOutlinedInput-root::before": {
      content: `"${placeholder}"`,
      position: "absolute",
      left: 14,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9e9e9e",
      fontSize: "0.9375rem",
      pointerEvents: "none",
    },
    "& .MuiOutlinedInput-root.Mui-focused::before": {
      display: "none",
    },
  };
}
