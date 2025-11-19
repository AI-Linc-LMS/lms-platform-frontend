import { ColorScheme } from "../types/resume";

export interface ColorTheme {
  primary: string;        // Main headings, key accents
  secondary: string;      // Supporting elements
  accent: string;         // Highlights, badges
  background: string;     // Subtle backgrounds
  textPrimary: string;    // Main text
  textSecondary: string;  // Muted text
  border: string;         // Borders, dividers
  skillBg: string;        // Skill badges background
}

export const getThemeColors = (scheme: ColorScheme): ColorTheme => {
  switch (scheme) {
    case "Professional Blue":
      return {
        primary: "#1e40af",           // Deep blue for headings
        secondary: "#3b82f6",         // Medium blue for accents
        accent: "#60a5fa",            // Light blue for highlights
        background: "#eff6ff",        // Very light blue background
        textPrimary: "#1e293b",       // Dark slate for main text
        textSecondary: "#64748b",     // Slate for secondary text
        border: "#cbd5e1",            // Light slate for borders
        skillBg: "#dbeafe",           // Light blue for skill badges
      };
    case "Modern Green":
      return {
        primary: "#047857",           // Deep green for headings
        secondary: "#10b981",         // Medium green for accents
        accent: "#34d399",            // Light green for highlights
        background: "#ecfdf5",        // Very light green background
        textPrimary: "#064e3b",       // Dark green for main text
        textSecondary: "#64748b",     // Slate for secondary text
        border: "#cbd5e1",            // Light slate for borders
        skillBg: "#d1fae5",           // Light green for skill badges
      };
    case "Creative Purple":
      return {
        primary: "#6b21a8",           // Deep purple for headings
        secondary: "#8b5cf6",         // Medium purple for accents
        accent: "#a78bfa",            // Light purple for highlights
        background: "#faf5ff",        // Very light purple background
        textPrimary: "#4c1d95",       // Dark purple for main text
        textSecondary: "#64748b",     // Slate for secondary text
        border: "#cbd5e1",            // Light slate for borders
        skillBg: "#e9d5ff",           // Light purple for skill badges
      };
    case "Classic Navy":
      return {
        primary: "#1e293b",           // Navy for headings
        secondary: "#475569",         // Slate for accents
        accent: "#64748b",            // Medium slate for highlights
        background: "#f8fafc",        // Very light gray background
        textPrimary: "#0f172a",       // Almost black for main text
        textSecondary: "#64748b",     // Slate for secondary text
        border: "#cbd5e1",            // Light slate for borders
        skillBg: "#e2e8f0",           // Light gray for skill badges
      };
    default:
      return getThemeColors("Professional Blue");
  }
};

// Legacy function for backward compatibility
export const getColorsFromScheme = (scheme: ColorScheme) => {
  const theme = getThemeColors(scheme);
  return {
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
  };
};

// Extended color palette for resume builders (standard colors)
export const standardResumeColors = [
  // Blues
  { name: "Blue", value: "#2563eb", category: "Professional" },
  { name: "Navy Blue", value: "#1e40af", category: "Professional" },
  { name: "Sky Blue", value: "#0ea5e9", category: "Professional" },
  { name: "Royal Blue", value: "#3b82f6", category: "Professional" },
  
  // Greens
  { name: "Green", value: "#059669", category: "Modern" },
  { name: "Forest Green", value: "#047857", category: "Modern" },
  { name: "Teal", value: "#14b8a6", category: "Modern" },
  { name: "Emerald", value: "#10b981", category: "Modern" },
  
  // Purples
  { name: "Purple", value: "#7c3aed", category: "Creative" },
  { name: "Indigo", value: "#6366f1", category: "Creative" },
  { name: "Violet", value: "#8b5cf6", category: "Creative" },
  { name: "Lavender", value: "#a78bfa", category: "Creative" },
  
  // Reds/Pinks
  { name: "Red", value: "#dc2626", category: "Bold" },
  { name: "Rose", value: "#e11d48", category: "Bold" },
  { name: "Pink", value: "#ec4899", category: "Bold" },
  { name: "Coral", value: "#f43f5e", category: "Bold" },
  
  // Oranges/Yellows
  { name: "Orange", value: "#ea580c", category: "Energetic" },
  { name: "Amber", value: "#f59e0b", category: "Energetic" },
  { name: "Yellow", value: "#eab308", category: "Energetic" },
  
  // Grays/Neutrals
  { name: "Slate", value: "#475569", category: "Classic" },
  { name: "Gray", value: "#6b7280", category: "Classic" },
  { name: "Zinc", value: "#71717a", category: "Classic" },
  { name: "Stone", value: "#78716c", category: "Classic" },
];

export const getColorName = (colorValue: string): string => {
  const color = standardResumeColors.find(c => c.value.toLowerCase() === colorValue.toLowerCase());
  return color ? color.name : "Custom";
};

