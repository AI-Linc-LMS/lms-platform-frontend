import type {
  CLSMetric,
  FIDMetric,
  INPMetric,
  LCPMetric,
  TTFBMetric,
} from "web-vitals";

type WebVitalsMetric =
  | CLSMetric
  | FIDMetric
  | INPMetric
  | LCPMetric
  | TTFBMetric;

interface PerfSample {
  source: "web-vitals" | "react-profiler" | "navigation";
  name: string;
  value: number;
  detail?: Record<string, unknown>;
  timestamp: number;
}

const STORAGE_KEY = "__perf_samples__";
const MAX_SAMPLES = 25;
let monitoringStarted = false;

const persistSample = (sample: PerfSample) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as PerfSample[]) : [];
    const next = [...list.slice(-(MAX_SAMPLES - 1)), sample];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Silent failure, storage might be unavailable (Safari private mode, etc.)
  }
};

const sendBeacon = (sample: PerfSample) => {
  const endpoint = import.meta.env.VITE_PERF_ENDPOINT;
  if (!endpoint || typeof navigator === "undefined") {
    return;
  }

  try {
    const payload = JSON.stringify(sample);
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon(endpoint, blob)) {
      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // Swallow network errors; metrics are best-effort.
  }
};

const recordSample = (sample: PerfSample) => {
  persistSample(sample);
  sendBeacon(sample);
};

const normalizeMetric = (metric: WebVitalsMetric): PerfSample => ({
  source: "web-vitals",
  name: metric.name,
  value: Number(metric.value.toFixed(3)),
  detail: {
    rating: metric.rating,
    delta: Number(metric.delta.toFixed(3)),
    id: metric.id,
  },
  timestamp: Date.now(),
});

const observeNavigationTimings = () => {
  if (typeof performance === "undefined") return;
  const [nav] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];
  if (!nav) return;

  recordSample({
    source: "navigation",
    name: "initial-load",
    value: nav.domContentLoadedEventEnd,
    detail: {
      type: nav.type,
      transferSize: nav.transferSize,
      decodedBodySize: nav.decodedBodySize,
      duration: nav.duration,
    },
    timestamp: Date.now(),
  });
};

export const startPerfMonitoring = () => {
  if (monitoringStarted || typeof window === "undefined") {
    return;
  }

  monitoringStarted = true;

  void import("web-vitals").then(({ onCLS, onFID, onINP, onLCP, onTTFB }) => {
    const report = (metric: WebVitalsMetric) =>
      recordSample(normalizeMetric(metric));

    onCLS(report);
    onFID(report);
    onINP(report);
    onLCP(report);
    onTTFB(report);
  });

  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            recordSample({
              source: "web-vitals",
              name: "LCP-element",
              value: entry.startTime,
              detail: {
                size: (entry as PerformanceEntry & { size?: number }).size,
              },
              timestamp: Date.now(),
            });
          }
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Observer not supported, safe to ignore.
    }
  }

  observeNavigationTimings();
};

export const recordProfilerSample = (
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDuration: number,
  baseDuration: number
) => {
  if (typeof window === "undefined") return;

  recordSample({
    source: "react-profiler",
    name: id,
    value: Number(actualDuration.toFixed(3)),
    detail: {
      phase,
      baseDuration: Number(baseDuration.toFixed(3)),
    },
    timestamp: Date.now(),
  });
};
