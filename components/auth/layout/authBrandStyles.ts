import { AUTH_BRAND_GLOW } from "@/lib/theme/gradients";

/** Shared word-highlight style for default auth right panel (brand + slogan). */
export const brandWordHighlightSx = {
  position: "relative" as const,
  display: "inline-block" as const,
  "&::after": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: "40%",
    background: AUTH_BRAND_GLOW,
    borderRadius: "20px",
    opacity: 0.3,
    zIndex: -1,
  },
};
