"use client";

import {
  Icon as IconifyIcon,
  IconProps as IconifyIconProps,
} from "@iconify/react";
import { useTheme, useMediaQuery } from "@mui/material";
import { memo, useMemo } from "react";

// SSR-safe Icon component wrapper
// Optimized for bundle size - only loads icons on demand
export interface IconProps extends Omit<IconifyIconProps, "icon"> {
  icon: string;
  size?: number | string | { xs?: number; sm?: number; md?: number; lg?: number };
}

export const Icon = memo<IconProps>(function Icon({ icon, size = 24, ...props }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"), { noSsr: true });
  const isSm = useMediaQuery(theme.breakpoints.only("sm"), { noSsr: true });
  const isMd = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });

  const iconSize = useMemo(() => {
  if (typeof size === "object" && size !== null) {
    // Responsive size object
    if (isMd && size.md !== undefined) {
        return size.md;
    } else if (isSm && size.sm !== undefined) {
        return size.sm;
    } else if (isXs && size.xs !== undefined) {
        return size.xs;
    } else {
      // Fallback to first available size
        return size.md || size.sm || size.xs || 24;
    }
  } else {
      return size;
  }
  }, [size, isXs, isSm, isMd]);

  return <IconifyIcon icon={icon} width={iconSize} height={iconSize} {...props} />;
});
