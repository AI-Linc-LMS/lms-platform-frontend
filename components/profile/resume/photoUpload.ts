/**
 * Getting a learner's photo into a resume without making the resume unsaveable.
 *
 * The photo is stored INSIDE the resume, as a base64 data URL on `basicInfo.photo`. That was true
 * before saved resumes existed and it only showed up once they did: base64 costs about a third
 * more than the bytes it encodes, so a 400KB JPEG lands as ~533KB and an ordinary phone photo
 * (2-5MB) lands as 3-7MB. The server refuses a resume over 512KB, so a learner on the Western
 * template - which exists to show a photo - could upload a perfectly normal photo and then be told
 * "This resume is too large to save", a message about the wrong thing entirely.
 *
 * So the size is dealt with HERE, at the upload, where the photo can still be named as the cause:
 * the image is drawn down to at most 600px on its longest edge and re-encoded, which is far more
 * than a 64px avatar or a print-resolution corner portrait needs, and only if that still will not
 * fit is the learner told - about the photo, not about the resume.
 */

/** Longest edge, in CSS pixels, of the stored photo. */
export const PHOTO_MAX_EDGE = 600;

/**
 * Ceiling for the stored data URL. Comfortably above a 600px JPEG (typically 40-90KB) and far
 * below the server's 512KB budget for the whole resume, which also has to hold the text.
 */
export const MAX_PHOTO_BYTES = 300 * 1024;

export type PhotoResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "notAnImage" | "unreadable" | "tooLarge" };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("unreadable"));
    reader.readAsDataURL(file);
  });
}

/**
 * Draw the image down to `PHOTO_MAX_EDGE` and re-encode as JPEG.
 *
 * Returns null when the browser cannot do it - no 2d context, a decode failure, a canvas tainted
 * by something unexpected. A photo that cannot be shrunk is not a reason to reject it; it just
 * has to pass the size check on its original bytes.
 */
function downscale(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      const image = new Image();
      image.onerror = () => done(null);
      image.onload = () => {
        try {
          const { width, height } = image;
          if (!width || !height) return done(null);
          const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(width, height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return done(null);
          // A JPEG has no alpha, so a transparent PNG would come out black without this.
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const out = canvas.toDataURL("image/jpeg", 0.85);
          done(typeof out === "string" && out.startsWith("data:image/") ? out : null);
        } catch {
          done(null);
        }
      };
      image.src = dataUrl;
    } catch {
      done(null);
    }
  });
}

/** Bytes the data URL's payload actually costs. */
export function dataUrlBytes(dataUrl: string): number {
  const payload = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((payload.length * 3) / 4);
}

/**
 * Turn a chosen file into something a resume can carry, or say why it cannot.
 *
 * Never throws: a failure here has to reach the learner as a sentence about their photo.
 */
export async function prepareResumePhoto(file: File): Promise<PhotoResult> {
  if (!file.type || !file.type.startsWith("image/")) {
    return { ok: false, reason: "notAnImage" };
  }

  let original: string;
  try {
    original = await readAsDataUrl(file);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (!original.startsWith("data:image/")) return { ok: false, reason: "unreadable" };

  const shrunk = await downscale(original);
  // Keep whichever is smaller. Re-encoding a tiny icon as JPEG can make it bigger.
  const candidate =
    shrunk && dataUrlBytes(shrunk) < dataUrlBytes(original) ? shrunk : original;

  if (dataUrlBytes(candidate) > MAX_PHOTO_BYTES) {
    return { ok: false, reason: "tooLarge" };
  }
  return { ok: true, dataUrl: candidate };
}
