"use client";

import { Box } from "@mui/material";
import { formatMoney } from "@/lib/utils/money";

/**
 * The small Paid / Free pill on an adaptive course card.
 *
 * Geometry is deliberately identical to the Published/Draft badge so the two sit together as one
 * family rather than looking like two different design decisions. Amber for Paid — emerald is
 * already spoken for by Published, and reusing it would make "Paid" read as a status.
 *
 * Renders NOTHING when `isPaid` is undefined. That case is a course whose serializer has not sent
 * the field yet, and labelling it "Free" would be a confident lie about money. Absent beats wrong.
 */
export function PriceTag({
  isPaid,
  price,
  currency,
  withAmount = false,
}: {
  isPaid?: boolean;
  price?: string | number | null;
  currency?: string | null;
  /** Show the amount inside the pill ("₹1,499") rather than just "Paid". */
  withAmount?: boolean;
}) {
  if (isPaid === undefined || isPaid === null) return null;

  const amount = withAmount ? formatMoney(price, currency) : "";
  const label = isPaid ? amount || "Paid" : "Free";
  const hue = isPaid ? "#f59e0b" : "#94a3b8";

  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.3,
        borderRadius: 999,
        fontSize: "0.66rem",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        whiteSpace: "nowrap",
        color: hue,
        bgcolor: `color-mix(in srgb, ${hue} ${isPaid ? 16 : 16}%, transparent)`,
      }}
    >
      {label}
    </Box>
  );
}
