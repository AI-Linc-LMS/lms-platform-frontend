/**
 * Formatting money for display.
 *
 * There was no shared formatter — the only currency-symbol map in the codebase was a
 * non-exported closure inside an assessment preview component, and several places simply
 * hardcoded `₹`. That is fine while everything is INR and wrong the moment it isn't, which is a
 * live risk on a platform with tenants in India and Saudi Arabia.
 *
 * The server always sends the currency alongside the amount. Read it; never assume rupees.
 */

const SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SAR: "﷼",
  AED: "د.إ",
};

/** The bare symbol for a currency code, falling back to the code itself. */
export function currencySymbol(currency?: string | null): string {
  const code = (currency || "INR").toUpperCase();
  return SYMBOLS[code] ?? code;
}

/**
 * `formatMoney("1499.00", "INR")` → `"₹1,499"`.
 *
 * Prices on this platform are whole-rupee in practice, so trailing `.00` is noise on a card.
 * A genuine fractional amount keeps its decimals rather than being silently rounded — showing
 * someone a price they will not actually be charged is worse than an untidy number.
 */
export function formatMoney(
  amount: string | number | null | undefined,
  currency?: string | null,
): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return "";

  const code = (currency || "INR").toUpperCase();
  const hasFraction = Math.abs(value % 1) > 0;
  const digits = hasFraction ? 2 : 0;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    // An unknown ISO code throws. Better a readable "SAR 1,499" than a crashed card.
    return `${currencySymbol(code)}${value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }
}
