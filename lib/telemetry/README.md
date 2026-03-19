# OpenTelemetry

This project uses [OpenTelemetry](https://opentelemetry.io/) for distributed tracing, following the [OTel Demo Frontend](https://opentelemetry.io/docs/demo/services/frontend/) pattern.

Traces are sent to an OTLP HTTP endpoint. Use the **otel-backend** Node.js server (sibling project) to receive traces and store them in MongoDB.

## Setup

### 1. Start otel-backend (MongoDB)

From the `otel-backend` directory:

```bash
cd ../otel-backend
yarn install
yarn dev
```

The OTLP endpoint will be at `http://localhost:3000/v1/traces`.

### 2. Environment variables

Add to `.env` or `.env.local`:

```env
# API base URL — MUST match your backend (used to filter which spans are traced)
# If wrong, API calls (including 403/500) won't appear in MongoDB
NEXT_PUBLIC_API_BASE_URL=https://be-app.ailinc.com

# Service name for traces (optional, defaults to "lms-platform-frontend")
OTEL_SERVICE_NAME=lms-platform-frontend
NEXT_PUBLIC_OTEL_SERVICE_NAME=lms-platform-frontend

# OTLP traces endpoint — point to otel-backend (stores in MongoDB)
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:3000/v1/traces
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:3000/v1/traces

# Debug: log exported vs filtered spans in browser console (optional)
NEXT_PUBLIC_OTEL_DEBUG=true
```

For production, use your deployed otel-backend URL (e.g. `https://api.example.com/v1/traces`). Ensure CORS allows your frontend origin.

**Important:** `NEXT_PUBLIC_API_BASE_URL` must be set at build time and must match your backend (e.g. `https://be-app.ailinc.com`). If it defaults to `http://localhost:8000`, all production API spans will be filtered out and never reach MongoDB.

### 3. Query traces

Use the otel-backend API to query traces:

- `GET /api/traces` — list traces (supports `traceId`, `serviceName`, `startTime`, `endTime`, `limit`)
- `GET /api/traces/trace/:traceId` — all spans for a trace

## Architecture

- **Server (Node.js)**: `instrumentation.ts` runs at Next.js startup and auto-instruments HTTP, fetch, etc.
- **Browser**: `TelemetryProvider` initializes the Web SDK on first load; auto-instruments fetch, XHR, document load, user interactions.

## Troubleshooting

### API failures (403, 500) not in MongoDB

1. **Check `NEXT_PUBLIC_API_BASE_URL`** — It must match your backend exactly (e.g. `https://be-app.ailinc.com`). Rebuild after changing.
2. **Enable debug** — Set `NEXT_PUBLIC_OTEL_DEBUG=true` and open the browser console. You'll see:
   - `[OTel] exported span` — span was sent to otel-backend
   - `[OTel] filtered span (not API)` — span was dropped (URL didn't match)
3. **Verify otel-backend** — Check Network tab for POSTs to `/v1/traces`. If 4xx/5xx, fix CORS or endpoint URL.
4. **Flush on unload** — Spans are flushed on `pagehide`/`beforeunload` so closing the tab still sends pending traces.

## References

- [OpenTelemetry Demo Frontend](https://opentelemetry.io/docs/demo/services/frontend/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/guides/instrumentation)
- [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/)
