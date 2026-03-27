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
 * Rasterizes the live page with html2canvas. Includes the proctoring camera tile by
 * copying live video frames into the cloned DOM (see injectLiveVideoFramesIntoClone).
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
        ignoreElements: (el) => el instanceof HTMLAudioElement,
        onclone: (clonedDoc) => {
          injectLiveVideoFramesIntoClone(clonedDoc, document.body);
        },
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
