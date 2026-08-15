import * as blazeface from "@tensorflow-models/blazeface";
// Both backends must be IMPORTED to register themselves with tfjs-core; `tf.setBackend(name)`
// resolves false for a name that was never registered. The old code called setBackend("cpu") in a
// catch block without either importing the CPU backend or checking the return value, so the
// documented "fall back to CPU on locked-down GPUs" path silently did nothing — the very users it
// was written for went straight to a permanent "No face detected".
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";

/**
 * Loading the face-detection model for the proctored device check.
 *
 * WHY THIS MODULE EXISTS. `blazeface.load()` with no `modelUrl` fetches its weights from the
 * package default, `https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1`. tfhub.dev has
 * since been retired into Kaggle Models, so that one call is now a three-hop redirect —
 * tfhub.dev -> www.kaggle.com -> storage.googleapis.com — performed by every student's browser at
 * the moment they sit down to a graded assessment. It had no timeout, no retry, and no local copy.
 *
 * Any one of those hosts being slow or blocked meant the model never loaded, and because the
 * device-check page never rendered the resulting error, the student was left staring at
 * "No face detected. Please position yourself in front of the camera." beside a camera preview that
 * was visibly working, with the Proceed button disabled and no way forward. That single failure is
 * roughly 38% of every support ticket the platform has ever received, and the population most
 * affected — campus placement drives behind college firewalls and captive portals — is exactly the
 * population these assessments are for.
 *
 * The weights are 455 KB in total. They are now committed to `public/models/blazeface/` and served
 * as same-origin static assets, so the exam critical path no longer depends on a third party at all.
 * They are committed rather than vendored from node_modules by a postinstall script (the pattern
 * `scripts/vendor-noise-suppression.mjs` uses for RNNoise) because the blazeface package ships only
 * JavaScript — the weights exist nowhere but the CDN, and fetching them at build time would just
 * move the same fragile dependency from exam time to deploy time.
 */

/** Same-origin copy. `public/models/blazeface/` -> `/models/blazeface/`. */
const LOCAL_MODEL_URL = "/models/blazeface/model.json";

/**
 * Last resort only. Kept so that a deploy which somehow ships without the static asset degrades to
 * the old behaviour instead of failing every device check outright — but it is never tried first,
 * and it is never the thing standing between a student and their exam.
 */
const CDN_MODEL_URL = "https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1";

/** Per attempt. Generous enough for a slow campus link, short enough not to look like a hang. */
const LOAD_TIMEOUT_MS = 15_000;

export type FaceModelSource = "local" | "cdn";

/** Thrown when no source could supply a usable model. Carries enough for the UI to be specific. */
export class FaceModelLoadError extends Error {
  readonly attempts: { source: FaceModelSource; error: string }[];

  constructor(attempts: { source: FaceModelSource; error: string }[]) {
    super("Face detection model could not be loaded.");
    this.name = "FaceModelLoadError";
    this.attempts = attempts;
  }
}

function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // `blazeface.load()` has no abort signal, so a timeout cannot cancel the in-flight fetch — it
    // only stops US waiting on it. A late resolution is harmless: the promise is already settled
    // and the orphaned request is at most one wasted download.
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Pick a tfjs backend. WebGL where available, CPU where the GPU is blocked or missing — CPU is
 * slower but keeps the device check working instead of failing outright, which is what users on
 * locked-down GPU drivers used to hit.
 */
async function ensureBackend(): Promise<void> {
  for (const backend of ["webgl", "cpu"] as const) {
    try {
      // setBackend RESOLVES FALSE for an unregistered or unusable backend rather than throwing,
      // which is why the previous try/catch could not detect the WebGL failure it was written to
      // handle. Check the result, do not just await it.
      const ok = await tf.setBackend(backend);
      if (!ok) continue;
      await tf.ready();
      return;
    } catch {
      // Try the next one.
    }
  }
  throw new Error(
    "No usable TensorFlow backend (WebGL and CPU both unavailable in this browser).",
  );
}

let inFlight: Promise<{ model: blazeface.BlazeFaceModel; source: FaceModelSource }> | null = null;

async function loadOnce(): Promise<{ model: blazeface.BlazeFaceModel; source: FaceModelSource }> {
  await ensureBackend();

  const attempts: { source: FaceModelSource; error: string }[] = [];
  const sources: { source: FaceModelSource; url: string }[] = [
    { source: "local", url: LOCAL_MODEL_URL },
    { source: "cdn", url: CDN_MODEL_URL },
  ];

  for (const { source, url } of sources) {
    try {
      const model = await withTimeout(
        blazeface.load({ modelUrl: url }),
        LOAD_TIMEOUT_MS,
        `face model (${source})`,
      );
      return { model, source };
    } catch (err) {
      attempts.push({
        source,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  throw new FaceModelLoadError(attempts);
}

/**
 * Load the model, retrying the whole ladder once before giving up.
 *
 * Concurrent callers share one in-flight load. A failure clears the cache so a later Retry actually
 * re-attempts rather than replaying the cached rejection — the previous implementation cached the
 * rejected promise, which is why retrying by hand never helped.
 */
export async function loadFaceModel(): Promise<blazeface.BlazeFaceModel> {
  if (!inFlight) {
    inFlight = (async () => {
      try {
        return await loadOnce();
      } catch (first) {
        // One clean retry. A cold campus link that failed the first ladder often succeeds on the
        // second; if it does not, the error the caller sees is the second, more representative one.
        if (first instanceof FaceModelLoadError) {
          return await loadOnce();
        }
        throw first;
      }
    })().catch((err) => {
      inFlight = null;
      throw err;
    });
  }
  const { model } = await inFlight;
  return model;
}

/** Test/diagnostic seam: forget any cached model so the next call re-runs the ladder. */
export function resetFaceModelCache(): void {
  inFlight = null;
}
