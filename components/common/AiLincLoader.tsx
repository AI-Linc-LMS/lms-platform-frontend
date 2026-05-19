"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

export interface AiLincLoaderProps {
  variant?: "fullscreen" | "inline";
  label?: string;
  subMessage?: string;
  size?: number;
  hidePercent?: boolean;
}

export function AiLincLoader({
  variant = "fullscreen",
  label = "AI LINC · LOADING",
  subMessage,
  size,
  hidePercent = false,
}: AiLincLoaderProps) {
  const [pct, setPct] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let p = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      if (!mountedRef.current) return;
      p += Math.random() * 11 + 4;
      if (p >= 99) {
        setPct(99);
        return;
      }
      setPct(Math.floor(p));
      timer = setTimeout(tick, 80 + Math.random() * 110);
    };
    const startTimer = setTimeout(tick, 120);
    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const markSize = size ?? (variant === "fullscreen" ? 320 : 180);

  const markPath =
    "M 200 120 C 150 48.5, 105 48.5, 100 120 C 95 191.5, 150 191.5, 200 120 C 282.5 9.999999999999986, 356.75 9.999999999999986, 365 120 C 373.25 230, 282.5 230, 200 120 Z M 200 120 C 164 69, 129.6 69, 126 120 C 122.4 171, 164 171, 200 120 C 268.5 34, 332.15 34, 339 120 C 345.85 206, 268.5 206, 200 120 Z";

  const content = (
    <Box
      sx={{
        width: markSize,
        height: Math.round(markSize * 0.6),
        mx: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          animation:
            "ailinc-mark-fadein 0.6s ease-out both, ailinc-mark-breathe 3.4s ease-in-out 0.6s infinite",
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 400 240"
          sx={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id="ailinc-loader-grad"
              x1="40"
              y1="120"
              x2="380"
              y2="120"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0"
                style={{ stopColor: "var(--ailinc-brand-gradient-start)" }}
              />
              <stop
                offset="1"
                style={{ stopColor: "var(--ailinc-brand-gradient-end)" }}
              />
            </linearGradient>
            <linearGradient
              id="ailinc-loader-trace"
              x1="40"
              y1="120"
              x2="380"
              y2="120"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0"
                style={{
                  stopColor: "var(--ailinc-brand-highlight)",
                  stopOpacity: 0,
                }}
              />
              <stop
                offset="0.5"
                style={{
                  stopColor: "var(--ailinc-brand-highlight)",
                  stopOpacity: 0.9,
                }}
              />
              <stop
                offset="1"
                style={{
                  stopColor: "var(--ailinc-brand-highlight)",
                  stopOpacity: 0,
                }}
              />
            </linearGradient>
          </defs>
          <g transform="rotate(-7 200 120)">
            <path
              d={markPath}
              fill="url(#ailinc-loader-grad)"
              fillRule="evenodd"
            />
            <path
              d={markPath}
              fill="none"
              stroke="url(#ailinc-loader-trace)"
              strokeWidth={4}
              strokeLinecap="round"
              fillRule="evenodd"
              style={{
                strokeDasharray: 1600,
                strokeDashoffset: 1600,
                mixBlendMode: "screen",
                animation:
                  "ailinc-mark-trace 2.6s cubic-bezier(.22,1,.36,1) infinite",
              }}
            />
          </g>
        </Box>
      </Box>

      <Box
        component="style"
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes ailinc-mark-fadein {
              from { opacity: 0; transform: scale(0.92); }
              to   { opacity: 1; transform: scale(1); }
            }
            @keyframes ailinc-mark-breathe {
              0%, 100% { transform: scale(1); }
              50%      { transform: scale(1.035); }
            }
            @keyframes ailinc-mark-trace {
              0%   { stroke-dashoffset: 1600; }
              60%  { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -1600; }
            }
          `,
        }}
      />
    </Box>
  );

  const captionBlock = (
    <Box sx={{ textAlign: "center", mt: 3 }}>
      {!hidePercent && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', 'Liberation Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--font-secondary)",
          }}
        >
          <Box component="span" sx={{ fontWeight: 500 }}>
            {label}
          </Box>
          <Box
            component="span"
            sx={{
              display: "inline-block",
              minWidth: 24,
              color: "var(--ailinc-brand-gradient-end)",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            {String(pct).padStart(2, "0")}
          </Box>
        </Box>
      )}
      {subMessage && (
        <Typography
          variant="body2"
          sx={{
            mt: 1.5,
            color: "var(--font-secondary)",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {subMessage}
        </Typography>
      )}
    </Box>
  );

  if (variant === "inline") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          backgroundColor: "transparent",
        }}
        role="status"
        aria-label={label}
      >
        {content}
        {captionBlock}
      </Box>
    );
  }

  return (
    <Box
      role="status"
      aria-label={label}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      {content}
      {captionBlock}
    </Box>
  );
}
