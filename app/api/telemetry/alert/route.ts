import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
  },
});

const ALERT_FROM = process.env.SES_ALERT_FROM_EMAIL!;
const ALERT_TO = (process.env.SES_ALERT_TO_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
const ALERT_SECRET = process.env.TELEMETRY_ALERT_SECRET;

export interface OtelFailurePayload {
  traceId?: string;
  spanId?: string;
  spanName?: string;
  url?: string;
  statusCode?: number | string;
  errorMessage?: string;
  serviceName?: string;
  timestamp?: string;
}

export async function POST(req: NextRequest) {
  // Optional shared secret to prevent abuse
  if (ALERT_SECRET) {
    const auth = req.headers.get("x-alert-secret");
    if (auth !== ALERT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!ALERT_FROM || ALERT_TO.length === 0) {
    return NextResponse.json(
      { error: "SES not configured. Set SES_ALERT_FROM_EMAIL and SES_ALERT_TO_EMAILS." },
      { status: 500 }
    );
  }

  let body: OtelFailurePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { traceId, spanId, spanName, url, statusCode, errorMessage, serviceName, timestamp } = body;
  const ts = timestamp || new Date().toISOString();

  const subject = `[OTEL Alert] API failure${statusCode ? ` (${statusCode})` : ""} — ${serviceName || "lms-platform-frontend"}`;

  const htmlBody = `
<h2>OpenTelemetry Failure Alert</h2>
<table style="border-collapse:collapse;font-family:monospace;font-size:14px">
  <tr><td style="padding:4px 12px 4px 0;color:#555"><b>Service</b></td><td>${serviceName || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#555"><b>Timestamp</b></td><td>${ts}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#555"><b>URL</b></td><td>${url || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#555"><b>Status Code</b></td><td style="color:#c00">${statusCode || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#555"><b>Span Name</b></td><td>${spanName || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#555"><b>Trace ID</b></td><td>${traceId || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#555"><b>Span ID</b></td><td>${spanId || "—"}</td></tr>
  ${errorMessage ? `<tr><td style="padding:4px 12px 4px 0;color:#555"><b>Error</b></td><td style="color:#c00">${errorMessage}</td></tr>` : ""}
</table>
`.trim();

  const textBody = [
    `[OTEL Alert] API failure — ${serviceName || "lms-platform-frontend"}`,
    `Timestamp : ${ts}`,
    `URL       : ${url || "—"}`,
    `Status    : ${statusCode || "—"}`,
    `Span      : ${spanName || "—"}`,
    `Trace ID  : ${traceId || "—"}`,
    `Span ID   : ${spanId || "—"}`,
    errorMessage ? `Error     : ${errorMessage}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await ses.send(
      new SendEmailCommand({
        Source: ALERT_FROM,
        Destination: { ToAddresses: ALERT_TO },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: htmlBody },
            Text: { Data: textBody },
          },
        },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[telemetry/alert] SES send failed:", message);
    return NextResponse.json({ error: "Failed to send alert email", detail: message }, { status: 500 });
  }
}
