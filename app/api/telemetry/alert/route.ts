import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type {
  FailureCategory,
  FailureAlertPayload,
} from "@/lib/telemetry/browser-tracer";

// ─────────────────────────────────────────────────────────────
// Environment
// ─────────────────────────────────────────────────────────────

const ALERT_FROM = process.env.SES_ALERT_FROM_EMAIL ?? "";

const ALERT_TO = (process.env.SES_ALERT_TO_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const AWS_SECRET_ACCESS_KEY=process.env.AWS_SES_SECRET_ACCESS_KEY
const AWS_SES_KEY_ID=process.env.AWS_ACCESS_KEY_ID

function makeSESClient() {
  const accessKeyId = AWS_SES_KEY_ID?.trim();
  const secretAccessKey =AWS_SECRET_ACCESS_KEY?.trim();
  const region = process.env.AWS_REGION?.trim() || "ap-south-1";



  if (!accessKeyId) {
    throw new Error("AWS_SES_ACCESS_KEY_ID is missing");
  }

  if (!secretAccessKey) {
    throw new Error("AWS_SES_SECRET_ACCESS_KEY is missing");
  }

  return new SESClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Category metadata
// ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  FailureCategory,
  {
    label: string;
    emoji: string;
    color: string;
    description: string;
  }
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
    description:
      "HTTP error on the student-enrollment-jobs API",
  },
  other: {
    label: "API Failure",
    emoji: "🔵",
    color: "#2563eb",
    description: "HTTP 4xx/5xx error on an API endpoint",
  },
};

// ─────────────────────────────────────────────────────────────
// Email builders
// ─────────────────────────────────────────────────────────────

function buildSubject(
  payload: FailureAlertPayload,
  service: string
): string {
  const meta = CATEGORY_META[payload.failureCategory];

  const parts: string[] = [
    `${meta.emoji} [OTEL ${meta.label}]`,
  ];

  if (payload.statusCode) {
    parts.push(`HTTP ${payload.statusCode}`);
  }

  if (
    payload.failureCategory === "latency" &&
    payload.durationMs
  ) {
    parts.push(`${Math.round(payload.durationMs)}ms`);
  }

  parts.push(`— ${service}`);

  return parts.join(" ");
}

function buildHtml(
  payload: FailureAlertPayload,
  ts: string
): string {
  const meta = CATEGORY_META[payload.failureCategory];

  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif">
  <h2>${meta.emoji} ${meta.label}</h2>

  <p><b>Description:</b> ${meta.description}</p>
  <p><b>Service:</b> ${payload.serviceName}</p>
  <p><b>Timestamp:</b> ${ts}</p>
  <p><b>URL:</b> ${payload.url}</p>
  <p><b>Status:</b> ${payload.statusCode ?? "-"}</p>

  ${
    payload.failureCategory === "latency"
      ? `<p><b>Duration:</b> ${payload.durationMs ?? "-"} ms</p>`
      : ""
  }

  <p><b>Span:</b> ${payload.spanName}</p>
  <p><b>Trace ID:</b> ${payload.traceId}</p>
  <p><b>Span ID:</b> ${payload.spanId}</p>
</body>
</html>
`;
}

function buildText(
  payload: FailureAlertPayload,
  ts: string
): string {
  const meta = CATEGORY_META[payload.failureCategory];

  return `
${meta.emoji} ${meta.label}

Description: ${meta.description}
Service: ${payload.serviceName}
Timestamp: ${ts}
URL: ${payload.url}
Status: ${payload.statusCode ?? "-"}

${
  payload.failureCategory === "latency"
    ? `Duration: ${payload.durationMs ?? "-"} ms`
    : ""
}

Span: ${payload.spanName}
Trace ID: ${payload.traceId}
Span ID: ${payload.spanId}
`;
}

// ─────────────────────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!ALERT_FROM || ALERT_TO.length === 0) {
      return NextResponse.json(
        {
          error:
            "SES_ALERT_FROM_EMAIL or SES_ALERT_TO_EMAILS missing",
        },
        { status: 500 }
      );
    }

    const body =
      (await req.json()) as FailureAlertPayload;

    const validCategories: FailureCategory[] = [
      "overload",
      "latency",
      "jobs-api",
      "other",
    ];

    if (
      !body.failureCategory ||
      !validCategories.includes(body.failureCategory)
    ) {
      return NextResponse.json(
        {
          error: "Invalid failureCategory",
        },
        { status: 400 }
      );
    }

    const ts =
      body.timestamp || new Date().toISOString();

    const service =
      body.serviceName || "lms-platform-frontend";

    const ses = makeSESClient();

    const result = await ses.send(
      new SendEmailCommand({
        Source: ALERT_FROM,
        Destination: {
          ToAddresses: ALERT_TO,
        },
        Message: {
          Subject: {
            Data: buildSubject(body, service),
          },
          Body: {
            Html: {
              Data: buildHtml(body, ts),
            },
            Text: {
              Data: buildText(body, ts),
            },
          },
        },
      })
    );

    return NextResponse.json({
      ok: true,
      messageId: result.MessageId,
      category: body.failureCategory,
    });
  } catch (err) {
    console.error("[SES] Error:", err);

    return NextResponse.json(
      {
        error: "Failed to send email",
        detail:
          err instanceof Error
            ? err.message
            : String(err),
      },
      { status: 500 }
    );
  }
}