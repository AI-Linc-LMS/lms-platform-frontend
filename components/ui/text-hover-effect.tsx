"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Aceternity-style SVG text hover (gradient reveal + stroke).
 * Vendored for Next 16 + Tailwind v4 without shadcn CLI.
 */
export function TextHoverEffect({
  text,
  duration = 0.25,
  className,
  fontSize = 56,
  viewBox = "0 0 320 100",
  fontFamily = "system-ui, sans-serif",
  direction = "ltr",
  colorMode = "default",
  /** Vertical position of text in viewBox (SVG %), e.g. "72%" to sit lower */
  textYPercent = "58%",
  /** e.g. xMidYMax meet anchors content to bottom of the SVG viewport */
  preserveAspectRatioProp = "xMidYMid meet",
  /** Single clean face: skip faint ghost layer (fixes “double font” on large Latin glyphs) */
  omitGhostLayer = false,
}: {
  text: string;
  duration?: number;
  className?: string;
  /** SVG text font size (px) */
  fontSize?: number;
  /** e.g. "0 0 900 120" for longer Arabic phrases */
  viewBox?: string;
  fontFamily?: string;
  direction?: "ltr" | "rtl";
  /** Higher-contrast strokes on dark backgrounds */
  colorMode?: "default" | "onDark";
  textYPercent?: string;
  preserveAspectRatioProp?: string;
  omitGhostLayer?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  const gid = `th-${uid}`;
  const strokeDash = Math.max(1400, text.length * 160);

  const strokeGhost =
    colorMode === "onDark"
      ? "rgba(148, 163, 184, 0.45)"
      : "rgba(148, 163, 184, 0.35)";
  const strokeMotion =
    colorMode === "onDark"
      ? "rgba(226, 232, 240, 0.45)"
      : "rgba(51, 65, 85, 0.85)";

  useEffect(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    const cx = ((cursor.x - rect.left) / w) * 100;
    const cy = ((cursor.y - rect.top) / h) * 100;
    setMaskPosition({ cx: `${cx}%`, cy: `${cy}%` });
  }, [cursor]);

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 700,
    fontFamily,
    direction,
    unicodeBidi: direction === "rtl" ? "embed" : "normal",
    /** Keeps stacked strokes aligned to the same glyph outline */
    paintOrder: "stroke fill",
  };

  const strokeW = Math.max(0.9, fontSize / 48);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatioProp}
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={cn("select-none", className)}
      aria-hidden
    >
      <defs>
        <radialGradient
          id={`${gid}-radial`}
          gradientUnits="userSpaceOnUse"
          r="32%"
          cx={maskPosition.cx}
          cy={maskPosition.cy}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <linearGradient id={`${gid}-line`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="45%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <mask id={`${gid}-mask`}>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gid}-radial)`}
          />
        </mask>
      </defs>
      {!omitGhostLayer ? (
        <text
          x="50%"
          y={textYPercent}
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth={strokeW}
          fill="transparent"
          stroke={strokeGhost}
          style={{
            ...textStyle,
            opacity: hovered ? 0.6 : colorMode === "onDark" ? 0.3 : 0.22,
          }}
        >
          {text}
        </text>
      ) : null}
      <text
        x="50%"
        y={textYPercent}
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth={strokeW}
        fill="transparent"
        stroke={strokeMotion}
        style={{
          strokeDasharray: strokeDash,
          strokeDashoffset: hovered ? 0 : strokeDash,
          ...textStyle,
          transition: `stroke-dashoffset ${duration}s ease-in-out`,
        }}
      >
        {text}
      </text>
      <text
        x="50%"
        y={textYPercent}
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth={strokeW}
        fill="transparent"
        stroke={`url(#${gid}-line)`}
        mask={`url(#${gid}-mask)`}
        style={textStyle}
      >
        {text}
      </text>
    </svg>
  );
}
