/**
 * Render a transactional notification email to a single HTML string.
 *
 * The structure mirrors the in-app preview (header with logo, subject as H1,
 * editable body, sign-off footer). Uses tables + inline styles for maximum
 * email-client compatibility (Outlook, Gmail webmail, Apple Mail, etc.).
 *
 * The resulting string is what goes into the `email_html` payload field so the
 * backend can forward it verbatim instead of re-rendering its own template.
 */

interface BuildEmailHtmlOptions {
  /** Subject line — also shown as the H1 inside the email card. */
  subject: string;
  /**
   * The editable body fragment authored in the rich-text editor. May contain
   * `{name}` placeholders the backend will substitute per-recipient.
   */
  bodyHtml: string;
  /** Display name of the sending organisation (used in header + footer). */
  clientName: string;
  /** Optional logo URL. Falls back to the client name as text when absent. */
  logoUrl?: string | null;
  /** Sign-off line above the company name in the footer. */
  signOff?: string;
  /** Top accent strip color (hex). Defaults to the indigo accent. */
  accentColor?: string;
  /**
   * Assessment schedule details. Rendered as a dedicated panel below the
   * body so recipients always see start/end times even when the admin has
   * customised the message.
   */
  schedule?: {
    startTime?: string | null;
    endTime?: string | null;
    durationMinutes?: number | null;
  } | null;
}

const formatScheduleDate = (s: string | null | undefined): string => {
  if (!s) return "";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? "" : d.toLocaleString();
  } catch {
    return "";
  }
};

const SANS_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Helvetica Neue', Arial, sans-serif";

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function buildAssessmentNotificationEmailHtml(
  opts: BuildEmailHtmlOptions
): string {
  const {
    subject,
    bodyHtml,
    clientName,
    logoUrl,
    signOff = "Best regards,",
    accentColor = "#5a4ea2",
    schedule,
  } = opts;

  const safeSubject = escape(subject);
  const safeName = escape(clientName);

  const headerInner = logoUrl
    ? `<img src="${escape(logoUrl)}" alt="${safeName}" style="max-height:52px;max-width:220px;display:block;border:0;outline:none;text-decoration:none;" />`
    : `<div style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:0.2px;">${safeName}</div>`;

  // Build the schedule panel — only rendered when at least one detail is set.
  const scheduleRows: string[] = [];
  if (schedule?.durationMinutes && schedule.durationMinutes > 0) {
    scheduleRows.push(
      `<div style="font-size:14px;color:#1f2937;line-height:1.5;"><span style="font-weight:700;color:#0f172a;">Duration:</span> ${escape(
        String(schedule.durationMinutes)
      )} minutes</div>`
    );
  }
  const startStr = formatScheduleDate(schedule?.startTime);
  if (startStr) {
    scheduleRows.push(
      `<div style="font-size:14px;color:#1f2937;line-height:1.5;"><span style="font-weight:700;color:#0f172a;">Start time:</span> ${escape(
        startStr
      )}</div>`
    );
  }
  const endStr = formatScheduleDate(schedule?.endTime);
  if (endStr) {
    scheduleRows.push(
      `<div style="font-size:14px;color:#1f2937;line-height:1.5;"><span style="font-weight:700;color:#0f172a;">End time:</span> ${escape(
        endStr
      )}</div>`
    );
  }
  const scheduleBlock = scheduleRows.length
    ? `<div style="margin-top:16px;padding:14px 18px;background-color:#f8fafc;border:1px solid #e5e7eb;border-left:3px solid ${accentColor};border-radius:6px;">
         <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;">Schedule</div>
         ${scheduleRows.join("\n         ")}
       </div>`
    : "";

  return [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml">',
    "<head>",
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',
    `<title>${safeSubject}</title>`,
    "</head>",
    `<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:${SANS_STACK};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:24px 12px;">`,
    "  <tr>",
    "    <td align=\"center\">",
    `      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 10px 24px -12px rgba(15,23,42,0.18);">`,
    // Accent strip
    `        <tr><td style="height:4px;line-height:4px;font-size:0;background-color:${accentColor};">&nbsp;</td></tr>`,
    // Header
    `        <tr><td align="center" style="padding:32px 40px 24px;">${headerInner}</td></tr>`,
    `        <tr><td style="padding:0 40px;"><div style="border-top:1px solid #eef0f3;height:0;line-height:0;font-size:0;">&nbsp;</div></td></tr>`,
    // Body (subject H1 + editable body fragment + auto schedule panel)
    `        <tr><td style="padding:32px 40px;color:#1f2937;font-size:15px;line-height:1.65;font-family:${SANS_STACK};">`,
    `          <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 20px;line-height:1.3;letter-spacing:-0.2px;">${safeSubject}</h1>`,
    `          <div>${bodyHtml}</div>`,
    `          ${scheduleBlock}`,
    "        </td></tr>",
    // Footer
    `        <tr><td><div style="border-top:1px solid #eef0f3;height:0;line-height:0;font-size:0;">&nbsp;</div></td></tr>`,
    `        <tr><td align="center" style="padding:28px 40px;background-color:#f8fafc;font-family:${SANS_STACK};">`,
    `          <div style="font-size:14px;color:#4b5563;margin-bottom:4px;">${escape(signOff)}</div>`,
    `          <div style="font-size:15px;font-weight:700;color:#0f172a;">${safeName}</div>`,
    `          <div style="margin-top:12px;font-size:11px;color:#9ca3af;line-height:1.55;">You received this email because you are enrolled with ${safeName}.</div>`,
    "        </td></tr>",
    "      </table>",
    "    </td>",
    "  </tr>",
    "</table>",
    "</body>",
    "</html>",
  ].join("\n");
}
