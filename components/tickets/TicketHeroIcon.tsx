"use client";

import React from "react";

interface Props {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
  title?: string;
}

export function TicketHeroIcon({
  size = 148,
  color = "var(--ticket-brand)",
  accentColor,
  className,
  title = "Support ticket",
}: Props) {
  const accent = accentColor || color;
  const height = Math.round(size * (110 / 180));

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 180 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <path
        d="M14 16 H166 a4 4 0 0 1 4 4 V44 a6 6 0 0 0 0 22 V90 a4 4 0 0 1 -4 4 H14 a4 4 0 0 1 -4 -4 V66 a6 6 0 0 0 0 -22 V20 a4 4 0 0 1 4 -4 Z"
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="118"
        y1="22"
        x2="118"
        y2="88"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3 5"
        opacity="0.6"
      />
      <line x1="28" y1="34" x2="100" y2="34" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="52" x2="86"  y2="52" stroke={accent} strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
      <line x1="28" y1="78" x2="104" y2="78" stroke={accent} strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
      <line x1="132" y1="36" x2="132" y2="74" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="136" y1="36" x2="136" y2="74" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="140" y1="36" x2="140" y2="74" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="144" y1="36" x2="144" y2="74" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="148" y1="36" x2="148" y2="74" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="152" y1="36" x2="152" y2="74" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
