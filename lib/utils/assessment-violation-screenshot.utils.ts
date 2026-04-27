import html2canvas from "html2canvas";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CAPTURE_WIDTH = 1280;

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

  const body = document.body;
  const w = Math.max(body.scrollWidth, body.clientWidth, 1);
  const scale = Math.min(1, MAX_CAPTURE_WIDTH / w);

  let quality = 0.82;
  let captureScale = scale;

  const HTML2CANVAS_TIMEOUT_MS = 22_000;

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const canvasOrTimeout = await withTimeout(
        html2canvas(body, {
          scale: captureScale,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#f9fafb",
          ignoreElements: (el) => el instanceof HTMLAudioElement,
          onclone: (clonedDoc) => {
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
      // Keep trying lower quality / scale — a single html2canvas error must not skip remaining attempts.
    }

    if (quality > 0.52) {
      quality -= 0.1;
    } else {
      captureScale = Math.round(captureScale * 850) / 1000;
      if (captureScale < 0.28) {
        break;
      }
    }
  }

  return minimalProofPlaceholderFile();
}
