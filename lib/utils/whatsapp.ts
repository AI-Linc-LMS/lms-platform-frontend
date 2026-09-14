/**
 * Links that let support reach a learner about their ticket.
 *
 * The backend stores the ticket's contact number as E.164 ("+919876543210") and hands back a
 * ready `whatsapp_url`, so it is the authority. The client-side derivation here is only a
 * fallback for a payload from before `whatsapp_url` existed; it accepts nothing looser than the
 * backend does, so it can never produce a link the server would have refused.
 */

const E164 = /^\+[1-9]\d{7,14}$/;

/** The number exactly as WhatsApp and a dialer want it, or null when it cannot be dialled. */
export function dialableNumber(phone?: string | null): string | null {
  const compact = (phone ?? "").replace(/[\s\-().]/g, "");
  return E164.test(compact) ? compact : null;
}

/**
 * A wa.me link, optionally with a message already typed. Prefers the server's link; falls back to
 * deriving one from the number; null when neither can be dialled (an old free-form number).
 */
export function whatsappChatUrl(
  contact: { whatsapp_url?: string | null; contact_phone?: string | null },
  message?: string,
): string | null {
  let base = (contact.whatsapp_url ?? "").trim();
  if (!/^https:\/\/wa\.me\/\d{8,15}$/.test(base)) {
    const number = dialableNumber(contact.contact_phone);
    base = number ? `https://wa.me/${number.slice(1)}` : "";
  }
  if (!base) return null;
  const text = (message ?? "").trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** A tel: link for the same number, or null. */
export function telHref(phone?: string | null): string | null {
  const number = dialableNumber(phone);
  return number ? `tel:${number}` : null;
}

/** The note support opens the chat with, so the learner knows at once who is writing and why. */
export function ticketChatMessage(opts: {
  learnerName?: string | null;
  orgName?: string | null;
  ticketId: number;
  subject?: string | null;
}): string {
  const first = (opts.learnerName ?? "").trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${first},` : "Hi,";
  const from = (opts.orgName ?? "").trim();
  const about = (opts.subject ?? "").trim();
  return [
    greeting,
    `this is ${from ? `${from} support` : "support"} about your ticket #${opts.ticketId}` +
      (about ? `: "${about}".` : "."),
  ].join(" ");
}

/**
 * A profile phone as the ticket form's starting value. Profiles saved through the current form are
 * already E.164; older ones can hold a bare 10-digit Indian mobile, which is given its +91 here so
 * the field does not open already invalid. Anything else starts empty rather than pre-filled wrong.
 */
export function profilePhoneForPrefill(raw?: string | null): string {
  const compact = (raw ?? "").replace(/[\s\-().]/g, "");
  if (dialableNumber(compact)) return compact;
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
  return "";
}
