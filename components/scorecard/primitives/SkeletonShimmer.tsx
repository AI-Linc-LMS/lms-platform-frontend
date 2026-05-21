"use client";

interface SkeletonShimmerProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  lines?: number;
  gap?: number;
}

export function SkeletonShimmer({
  width = "100%",
  height = 14,
  radius = 6,
  lines = 1,
  gap = 8,
}: SkeletonShimmerProps) {
  if (lines === 1) {
    return (
      <span
        className="sc-shimmer"
        aria-hidden
        style={{
          display: "block",
          width,
          height,
          borderRadius: radius,
        }}
      />
    );
  }

  return (
    <span style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="sc-shimmer"
          aria-hidden
          style={{
            display: "block",
            width: i === lines - 1 ? "70%" : width,
            height,
            borderRadius: radius,
          }}
        />
      ))}
    </span>
  );
}
