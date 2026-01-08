"use client";

import { useState, useEffect } from "react";
import { Icon as IconifyIcon } from "@iconify/react";

/**
 * IconWrapper component props
 */
export interface IconWrapperProps {
  icon: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  }

/**
 * SSR-safe Icon wrapper that only renders on client-side
 * Prevents hydration mismatches in Next.js
 */
export function IconWrapper({
  icon,
  size = 24,
  color,
  className,
  style,
}: IconWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with same dimensions during SSR
    return (
      <svg
        width={size}
        height={size}
        style={{ display: "inline-block" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <IconifyIcon
      icon={icon}
      width={size}
      height={size}
      style={{ color, ...style }}
      className={className}
    />
  );
}
