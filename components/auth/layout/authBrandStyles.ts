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
    background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
    borderRadius: "20px",
    opacity: 0.3,
    zIndex: -1,
  },
};
