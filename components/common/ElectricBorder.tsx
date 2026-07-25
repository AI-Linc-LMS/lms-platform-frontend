"use client";

// Animated glowing "electric" border. SVG feTurbulence + feDisplacementMap
// (crisp electric edge) + a layered glow stroke + an optional soft aura.
// Inspired by react-bits / @BalintFerenczy, reworked to SVG so there is NO
// requestAnimationFrame / canvas loop: the shimmer is a single browser-native,
// GPU-composited SMIL <animate>. Self-contained (no assets/URLs) -> CSP-safe.
// Degrades to a clean static electric edge if SMIL is ever disabled.
//
// NOTE: `chaos` now means DISPLACEMENT IN PIXELS (clamped to [2,14]), not the
// old amplitude. Call sites must pass a px value (e.g. 9 for a hero card, 4 for
// a small inline number) or the border clamps to the 2px minimum and reads flat.

import React, { CSSProperties, ReactNode, useId } from "react";

function hexToRgba(hex: string, alpha = 1): string {
  let h = (hex || "#000").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const int = parseInt(h.slice(0, 6), 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ElectricBorderProps {
  children?: ReactNode;
  color?: string;
  /** 1 = calm, 2 = fast; maps to a shorter SMIL scroll duration. */
  speed?: number;
  /** Displacement in px, clamped to [2,14]. */
  chaos?: number;
  borderRadius?: number;
  /** Soft radial glow behind the card. Default true; pass false for tiny inline use. */
  aura?: boolean;
  className?: string;
  style?: CSSProperties;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  color = "#fde047",
  speed = 1,
  chaos = 9,
  borderRadius = 28,
  aura = true,
  className,
  style,
}) => {
  const uid = useId().replace(/:/g, "");
  const filterId = `eb-f-${uid}`;
  const coreId = `eb-c-${uid}`;
  const dur = `${Math.max(2.5, 6 / Math.max(0.35, speed)).toFixed(2)}s`; // faster speed -> shorter dur
  const disp = Math.max(2, Math.min(14, chaos)); // clamp to a clean range

  return (
    <div className={`relative isolate ${className ?? ""}`} style={{ borderRadius, ...style }}>
      {/* soft premium aura behind the card (static, cheap) */}
      {aura && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[inherit]"
          style={{
            borderRadius,
            background:
              `radial-gradient(60% 60% at 50% 0%, ${hexToRgba(color, 0.55)}, transparent 70%),` +
              ` radial-gradient(70% 70% at 50% 100%, ${hexToRgba("#a855f7", 0.42)}, transparent 72%)`,
            filter: "blur(22px)",
            opacity: 0.9,
          }}
        />
      )}

      {/* crisp electric outline: two strokes sharing one displacement filter */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        style={{ borderRadius }}
      >
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            {/* LOW baseFrequency fractalNoise = includes the smooth carrier the old canvas deleted */}
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="7" result="noise" />
            <feOffset in="noise" dx="0" dy="0" result="scroll">
              <animate attributeName="dy" values="0; -260" dur={dur} repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feDisplacementMap in="SourceGraphic" in2="scroll" scale={disp} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id={coreId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* wide soft glow stroke (blurred, displaced) */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          opacity={0.3}
          style={{ filter: `url(#${filterId}) blur(3px)` }}
        />
        {/* crisp bright core stroke (same displacement, no blur) */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={`url(#${coreId})`}
          strokeWidth={1.6}
          strokeLinejoin="round"
          style={{ filter: `url(#${filterId})` }}
        />
      </svg>

      <div className="relative z-[1] rounded-[inherit]">{children}</div>
    </div>
  );
};

export default ElectricBorder;
