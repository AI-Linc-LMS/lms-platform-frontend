
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Lowered from 1280 → 900: html2canvas runs on the main thread and time scales with
// captured area. On a weak laptop, a 1280-wide capture pinned the CPU for seconds
// per attempt. 900px still produces a recognisable proof image.
const MAX_CAPTURE_WIDTH = 900;

/**
 * html2canvas often leaves cloned `video` nodes blank (MediaStream does not paint in
 * the clone). Copy the current frame from each live `video` and replace the clone with
 * a JPEG `img` so the proctoring preview shows in the screenshot.
 */
function injectLiveVideoFramesIntoClone(
  clonedDoc: Document,
  sourceRoot: HTMLElement
): void {
  const sourceVideos = Array.from(sourceRoot.querySelectorAll("video"));
  const cloneVideos = Array.from(clonedDoc.querySelectorAll("video"));
  const n = Math.min(sourceVideos.length, cloneVideos.length);

  for (let i = 0; i < n; i++) {
    const orig = sourceVideos[i]!;
    const cloned = cloneVideos[i]!;
    if (orig.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) continue;

    const w = orig.videoWidth || orig.clientWidth;
    const h = orig.videoHeight || orig.clientHeight;
    if (w < 2 || h < 2) continue;

    try {
      const snap = document.createElement("canvas");
      snap.width = w;
      snap.height = h;
      const ctx = snap.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(orig, 0, 0, w, h);
      const dataUrl = snap.toDataURL("image/jpeg", 0.9);

      const img = clonedDoc.createElement("img");
      img.src = dataUrl;
      const ocs = window.getComputedStyle(orig);
      img.style.width = `${cloned.clientWidth || parseInt(ocs.width, 10) || w}px`;
      img.style.height = `${cloned.clientHeight || parseInt(ocs.height, 10) || h}px`;
      img.style.objectFit = ocs.objectFit || "cover";
      img.style.borderRadius = ocs.borderRadius;
      img.style.transform = ocs.transform;
      img.style.display = ocs.display || "block";

      cloned.parentNode?.replaceChild(img, cloned);
    } catch {
      // Keep cloned video; inclusion without frame is better than failing capture
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
  if (typeof window === "undefined") {
    return promise.then((v) => v as T | "timeout").catch(() => "timeout" as const);
  }
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve("timeout"), ms);
    promise
      .then((v) => {
        window.clearTimeout(t);
        resolve(v);
      })
      .catch(() => {
        window.clearTimeout(t);
        resolve("timeout");
      });
  });
}

function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  quality: number,
  fileName: string
): Promise<{ file: File; size: number } | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve({
          file: new File([blob], fileName, { type: "image/jpeg" }),
          size: blob.size,
        });
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Rewrite resolved `color()` values to `rgba()` inside the cloned document.
 *
 * html2canvas 1.4.1 cannot parse the CSS Color 4 `color()` function and throws
 * `Attempting to parse an unsupported color function "color"` the moment it meets one. The app
 * uses `color-mix()` in 66 places in globals.css, and getComputedStyle resolves every one of
 * them to `color(srgb ...)` - so on any page carrying those tokens, capture never succeeded.
 *
 * Proven in a headless Chromium before this was written: with `color-mix()` on the captured
 * element's background, colour or border, html2canvas throws; on an element outside the capture
 * it does not; after this rewrite it returns a real image (14 distinct colours over the sample
 * grid, i.e. genuine content rather than a blank canvas).
 *
 * The measured consequence of not doing this: 30,901 violation screenshots in prod are the
 * placeholder image and 7 are real captures.
 *
 * Only the clone is touched - html2canvas hands `onclone` a detached document, so the styles the
 * learner sees are never modified.
 */
function colorFunctionToRgba(value: string): string {
  return value.replace(
    /color\(\s*srgb\s+([^)]+)\)/gi,
    (whole: string, body: string) => {
      const [channels, alphaPart] = body.split("/");
      const rgb = channels.trim().split(/\s+/).map(parseFloat);
      if (rgb.length < 3 || rgb.some((n) => Number.isNaN(n))) return whole;
      let alpha = 1;
      if (alphaPart !== undefined) {
        const parsed = parseFloat(alphaPart);
        if (!Number.isNaN(parsed)) {
          alpha = /%\s*$/.test(alphaPart) ? parsed / 100 : parsed;
        }
      }
      const to255 = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255)));
      return `rgba(${to255(rgb[0])}, ${to255(rgb[1])}, ${to255(rgb[2])}, ${alpha})`;
    },
  );
}

/** Colour-bearing properties html2canvas reads. Order does not matter. */
const COLOR_PROPERTIES = [
  "backgroundColor", "color", "borderTopColor", "borderRightColor", "borderBottomColor",
  "borderLeftColor", "outlineColor", "textDecorationColor", "columnRuleColor", "caretColor",
  "fill", "stroke", "backgroundImage", "boxShadow",
] as const;

export function sanitizeUnsupportedColorFunctions(clonedDoc: Document): number {
  const view = clonedDoc.defaultView;
  if (!view) return 0;
  let rewritten = 0;
  clonedDoc.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const computed = view.getComputedStyle(el);
    for (const prop of COLOR_PROPERTIES) {
      const value = computed[prop as unknown as number] as unknown as string;
      if (typeof value === "string" && value.includes("color(")) {
        el.style.setProperty(
          prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
          colorFunctionToRgba(value),
        );
        rewritten += 1;
      }
    }
  });
  return rewritten;
}

/** Tiny JPEG so upload / evidence pipeline still runs when full-page capture fails. */
async function minimalProofPlaceholderFile(): Promise<File | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 0, 320, 180);
  ctx.fillStyle = "#64748b";
  ctx.font = "14px system-ui,sans-serif";
  ctx.fillText("Full-page capture unavailable (browser)", 16, 96);
  const out = await canvasToJpegFile(
    canvas,
    0.82,
    `assessment-proof-placeholder-${Date.now()}.jpg`,
  );
  return out?.file ?? null;
}

/**
 * Rasterizes the live page with html2canvas. Includes the proctoring camera tile by
 * copying live video frames into the cloned DOM (see injectLiveVideoFramesIntoClone).
 */
export type CaptureViolationScreenshotOptions = {
  /** Defaults to `assessment-violation-${Date.now()}.jpg` */
  filename?: string;
};

export async function captureViolationScreenshotFile(
  options?: CaptureViolationScreenshotOptions
): Promise<File | null> {
  if (typeof document === "undefined" || !document.body) {
    return null;
  }

  // Capture only the visible viewport - not the full scrollable body. This dramatically
  // reduces the DOM area html2canvas must rasterize, cutting main-thread time from
  // several seconds down to well under a second on typical hardware.
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const scale = Math.min(1, MAX_CAPTURE_WIDTH / Math.max(vw, 1));

  let quality = 0.82;
  let captureScale = scale;

  const HTML2CANVAS_TIMEOUT_MS = 10_000;
  const MAX_ATTEMPTS = 3;
  const FAST_FAIL_MS = 250;
  let consecutiveFastFails = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now();
    try {
      const canvasOrTimeout = await withTimeout(
        (await import("html2canvas")).default(document.body, {
          scale: captureScale,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#f9fafb",
          // Clip to viewport so html2canvas doesn't walk off-screen DOM
          width: vw,
          height: vh,
          x: window.scrollX,
          y: window.scrollY,
          ignoreElements: (el) => el instanceof HTMLAudioElement,
          onclone: (clonedDoc) => {
            // Must run BEFORE html2canvas walks the clone: one unparsed color() aborts the
            // whole capture, which is what has been minting placeholders instead of evidence.
            sanitizeUnsupportedColorFunctions(clonedDoc);
            injectLiveVideoFramesIntoClone(clonedDoc, document.body);
          },
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
        }),
        HTML2CANVAS_TIMEOUT_MS,
      );
      if (canvasOrTimeout === "timeout") {
        continue;
      }
      const canvas = canvasOrTimeout;

      const name =
        options?.filename ?? `assessment-violation-${Date.now()}.jpg`;
      const out = await canvasToJpegFile(canvas, quality, name);
      if (out && out.size <= MAX_FILE_BYTES) {
        return out.file;
      }
    } catch {
      // Detect "this browser/page combo can't ever render" - html2canvas typically
      // throws within tens of ms when a CSS feature it doesn't understand is hit
      // (e.g. color-mix()). Two fast-fails in a row → skip remaining retries.
      if (Date.now() - attemptStart < FAST_FAIL_MS) {
        consecutiveFastFails += 1;
        if (consecutiveFastFails >= 2) break;
      } else {
        consecutiveFastFails = 0;
      }
    }

    if (quality > 0.52) {
      quality -= 0.15;
    } else {
      captureScale = Math.round(captureScale * 800) / 1000;
      if (captureScale < 0.3) {
        break;
      }
    }
  }

  return minimalProofPlaceholderFile();
}
