/**
 * Utility to load Razorpay script globally
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * The amount for Razorpay checkout's `options.amount`, which is in the currency's MINOR unit.
 *
 * Only the server's `amount_minor` qualifies: it is the exact figure the order was created with,
 * and the multiplier differs by currency (x100 for SAR and INR, x1000 for KWD, x1 for JPY), so the
 * browser must never derive it from the display amount. Undefined means "leave it out" — the
 * order id already fixes what is charged.
 */
export function checkoutAmountMinor(order: { amount_minor?: unknown }): number | undefined {
  const value = order.amount_minor;
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}
