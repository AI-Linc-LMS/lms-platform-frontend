/**
 * Heuristics only — not a security guarantee. Prefer `require_laptop_class_device` from API + this check.
 */

export type LaptopHeuristicResult = {
  ok: boolean;
  reasons: string[];
};

export function assessLaptopClassDevice(): LaptopHeuristicResult {
  const reasons: string[] = [];
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { ok: true, reasons: [] };
  }

  const ua = navigator.userAgent || "";
  const mobileRe =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  if (mobileRe.test(ua)) {
    reasons.push("User-Agent suggests a phone or tablet browser.");
  }

  const maxTouch = navigator.maxTouchPoints ?? 0;
  if (maxTouch > 2 && window.screen.width < 900) {
    reasons.push("Large touch point count on a narrow viewport.");
  }

  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (coarse && window.innerWidth < 768) {
    reasons.push("Coarse pointer on a small viewport.");
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * True when the learner should not start or take an assessment on this device
 * (phones, tablets, iPadOS “desktop” Safari, coarse-pointer small screens, etc.).
 * Client-only: returns false during SSR.
 */
export function isMobileOrTabletForAssessment(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };
  if (nav.userAgentData?.mobile === true) {
    return true;
  }

  if (!assessLaptopClassDevice().ok) {
    return true;
  }

  // iPadOS 13+ Safari often reports as MacIntel with touch points
  if (
    typeof navigator.platform === "string" &&
    navigator.platform === "MacIntel" &&
    (navigator.maxTouchPoints ?? 0) > 1
  ) {
    return true;
  }

  return false;
}

export type NetworkProbeResult = {
  ok: boolean;
  latencyMs: number | null;
  effectiveType?: string;
  downlinkMbps?: number;
  message: string;
};

/** Lightweight RTT probe; does not upload body. */
export async function probeNetworkQuality(
  pingUrl?: string,
): Promise<NetworkProbeResult> {
  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number };
    }
  ).connection;
  const effectiveType = conn?.effectiveType;
  const downlinkMbps = conn?.downlink;

  const url =
    pingUrl ||
    (typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : "");

  if (!url) {
    return {
      ok: true,
      latencyMs: null,
      effectiveType,
      downlinkMbps,
      message: "No probe URL; skipped.",
    };
  }

  const start = performance.now();
  try {
    await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      credentials: "same-origin",
    });
    const ms = Math.round(performance.now() - start);
    const slow = ms > 2500;
    return {
      ok: !slow,
      latencyMs: ms,
      effectiveType,
      downlinkMbps,
      message: slow
        ? `Slow response (~${ms} ms). Try a stronger connection.`
        : `Latency ~${ms} ms.`,
    };
  } catch {
    return {
      ok: false,
      latencyMs: null,
      effectiveType,
      downlinkMbps,
      message: "Could not reach the server (offline or blocked).",
    };
  }
}
