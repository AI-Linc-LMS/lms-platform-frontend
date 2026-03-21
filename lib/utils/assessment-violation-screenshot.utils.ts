import html2canvas from "html2canvas";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CAPTURE_WIDTH = 1280;

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
 * Rasterizes the live page with html2canvas (browser paint/computed layout).
 * Does not embed fonts or walk external stylesheet cssRules (avoids SecurityError
 * from html-to-image on cross-origin CSS). Result is JPEG for S3 upload.
 */
export async function captureViolationScreenshotFile(): Promise<File | null> {
  if (typeof document === "undefined" || !document.body) {
    return null;
  }

  const body = document.body;
  const w = Math.max(body.scrollWidth, body.clientWidth, 1);
  const scale = Math.min(1, MAX_CAPTURE_WIDTH / w);

  let quality = 0.82;
  let captureScale = scale;

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const canvas = await html2canvas(body, {
        scale: captureScale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#f9fafb",
        ignoreElements: (el) =>
          el instanceof HTMLVideoElement || el instanceof HTMLAudioElement,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
      });

      const name = `assessment-violation-${Date.now()}.jpg`;
      const out = await canvasToJpegFile(canvas, quality, name);
      if (out && out.size <= MAX_FILE_BYTES) {
        return out.file;
      }
    } catch {
      return null;
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

  return null;
}
