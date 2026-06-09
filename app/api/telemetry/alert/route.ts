import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { FailureCategory, FailureAlertPayload } from "@/lib/telemetry/browser-tracer";

const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
  },
});

const ALERT_FROM = process.env.SES_ALERT_FROM_EMAIL!;
const ALERT_TO = (process.env.SES_ALERT_TO_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
const ALERT_SECRET = process.env.TELEMETRY_ALERT_SECRET;

// ─── Category metadata ──────────────────────────────────────────────────────

const CATEGORY_META: Record<
  FailureCategory,
  { label: string; emoji: string; color: string; description: string }
> = {
  overload: {
    label: "Overload",
    emoji: "🔴",
    color: "#dc2626",
    description: "Rate-limited (429) or service unavailable (503)",
  },
  latency: {
    label: "High Latency",
    emoji: "🟡",
    color: "#d97706",
    description: "API call exceeded latency threshold",
  },
  "jobs-api": {
    label: "Enrollment Job Failure",
    emoji: "🟠",
    color: "#ea580c",
    description: "HTTP error on the student-enrollment-jobs API (/admin-dashboard/…/student-enrollment-jobs/)",
  },
  other: {
    label: "API Failure",
    emoji: "🔵",
    color: "#2563eb",
    description: "HTTP 4xx/5xx error on an API endpoint",
  },
};

// ─── Email builders ─────────────────────────────────────────────────────────

function buildSubject(payload: FailureAlertPayload, service: string): string {
  const meta = CATEGORY_META[payload.failureCategory];
  const parts: string[] = [`${meta.emoji} [OTEL ${meta.label}]`];
  if (payload.statusCode) parts.push(`HTTP ${payload.statusCode}`);
  if (payload.failureCategory === "latency" && payload.durationMs) {
    parts.push(`${Math.round(payload.durationMs)}ms`);
  }
  parts.push(`— ${service}`);
  return parts.join(" ");
}

function buildHtml(payload: FailureAlertPayload, ts: string): string {
  const meta = CATEGORY_META[payload.failureCategory];

  const rows: [string, string | number | undefined][] = [
    ["Category", `${meta.emoji} ${meta.label} — ${meta.description}`],
    ["Service", payload.serviceName],
    ["Timestamp", ts],
    ["URL", payload.url],
    ["Status Code", payload.statusCode],
    ...(payload.failureCategory === "latency"
      ? ([["Duration", payload.durationMs != null ? `${Math.round(payload.durationMs)} ms` : undefined]] as [string, string | undefined][])
      : []),
    ["Span Name", payload.spanName],
    ["Trace ID", payload.traceId],
    ["Span ID", payload.spanId],
  ];

  const tableRows = rows
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top"><b>${label}</b></td>
      <td style="padding:6px 0;font-family:monospace;word-break:break-all">${value}</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <!-- Header -->
    <div style="background:${meta.color};padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">
        ${meta.emoji} OpenTelemetry Alert — ${meta.label}
      </h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:13px">${meta.description}</p>
    </div>
    <!-- Body -->
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${tableRows}
      </table>
    </div>
    <!-- Footer -->
    <div style="padding:12px 24px;background:#f3f4f6;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        Sent by lms-platform-frontend · OTEL alerting · ${ts}
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

function buildText(payload: FailureAlertPayload, ts: string): string {
  const meta = CATEGORY_META[payload.failureCategory];
  const lines = [
    `${meta.emoji} OTEL Alert — ${meta.label}`,
    `${meta.description}`,
    "",
    `Service   : ${payload.serviceName ?? "—"}`,
    `Timestamp : ${ts}`,
    `URL       : ${payload.url ?? "—"}`,
    `Status    : ${payload.statusCode ?? "—"}`,
    payload.failureCategory === "latency"
      ? `Duration  : ${payload.durationMs != null ? Math.round(payload.durationMs) + " ms" : "—"}`
      : "",
    `Span      : ${payload.spanName ?? "—"}`,
    `Trace ID  : ${payload.traceId ?? "—"}`,
    `Span ID   : ${payload.spanId ?? "—"}`,
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

  let body: FailureAlertPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate that failureCategory is one of the known values — reject unknowns
  const validCategories: FailureCategory[] = ["overload", "latency", "jobs-api", "other"];
  if (!body.failureCategory || !validCategories.includes(body.failureCategory)) {
    return NextResponse.json({ error: "Invalid or missing failureCategory" }, { status: 400 });
  }

  const ts = body.timestamp || new Date().toISOString();
  const service = body.serviceName || "lms-platform-frontend";

  try {
    await ses.send(
      new SendEmailCommand({
        Source: ALERT_FROM,
        Destination: { ToAddresses: ALERT_TO },
        Message: {
          Subject: { Data: buildSubject(body, service) },
          Body: {
            Html: { Data: buildHtml(body, ts) },
            Text: { Data: buildText(body, ts) },
          },
        },
      })
    );

    return NextResponse.json({ ok: true, category: body.failureCategory });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[telemetry/alert] SES send failed:", message);
    return NextResponse.json(
      { error: "Failed to send alert email", detail: message },
      { status: 500 }
    );
  }
}
