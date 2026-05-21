/**
 * RNNoise-based noise suppression for incoming microphone streams.
 *
 * Wraps `@sapphi-red/web-noise-suppressor` so the rest of the app deals only with a tiny
 * `applyNoiseSuppression(stream)` API. The WASM + AudioWorklet assets are vendored to
 * `/public/noise-suppression/` (see the install script in package.json) so the browser
 * loads them as plain static assets — no bundler magic, no URL imports.
 *
 * Output: a new MediaStream that carries the cleaned audio track (+ any video tracks
 * from the input, untouched). The audio is processed at ~48kHz mono with ~10ms latency.
 * The original stream's audio track is NOT stopped automatically — the caller decides
 * what to do with it (typically you replace the consumer's track and stop the raw one).
 *
 * On any failure (no AudioWorklet, WASM fetch dies, browser too old), this returns the
 * input stream unchanged with a console warning. Suppression is a quality enhancement,
 * not a hard requirement, so degrading gracefully is correct.
 */

const WASM_URL = "/noise-suppression/rnnoise.wasm";
const WASM_SIMD_URL = "/noise-suppression/rnnoise_simd.wasm";
const WORKLET_URL = "/noise-suppression/rnnoise-worklet.js";

let cachedWasmBinary: ArrayBuffer | null = null;
let cachedAudioContext: AudioContext | null = null;
let workletRegisteredOnContext: AudioContext | null = null;

async function loadWasmBinary(): Promise<ArrayBuffer> {
  if (cachedWasmBinary) return cachedWasmBinary;
  const { loadRnnoise } = await import("@sapphi-red/web-noise-suppressor");
  cachedWasmBinary = await loadRnnoise({
    url: WASM_URL,
    simdUrl: WASM_SIMD_URL,
  });
  return cachedWasmBinary;
}

function getSharedAudioContext(): AudioContext {
  if (cachedAudioContext && cachedAudioContext.state !== "closed") {
    return cachedAudioContext;
  }
  cachedAudioContext = new AudioContext({ sampleRate: 48000 });
  return cachedAudioContext;
}

export interface NoiseSuppressionHandle {
  outputStream: MediaStream;
  teardown: () => void;
}

export async function applyNoiseSuppression(
  inputStream: MediaStream,
  options?: { force?: boolean },
): Promise<NoiseSuppressionHandle> {
  const inputAudioTracks = inputStream.getAudioTracks();
  if (inputAudioTracks.length === 0) {
    return {
      outputStream: inputStream,
      teardown: () => undefined,
    };
  }

  if (!options?.force && !getNoiseSuppressionPreference()) {
    return {
      outputStream: inputStream,
      teardown: () => undefined,
    };
  }

  try {
    if (typeof window === "undefined" || typeof AudioWorkletNode === "undefined") {
      throw new Error("AudioWorklet not available in this environment");
    }

    const { RnnoiseWorkletNode } = await import("@sapphi-red/web-noise-suppressor");
    const wasmBinary = await loadWasmBinary();
    const audioContext = getSharedAudioContext();

    if (audioContext.state === "suspended") {
      try {
        await audioContext.resume();
      } catch {
        /* ignore — may need user gesture; the source-node attach below will trigger it */
      }
    }

    if (workletRegisteredOnContext !== audioContext) {
      await audioContext.audioWorklet.addModule(WORKLET_URL);
      workletRegisteredOnContext = audioContext;
    }

    const audioOnlyStream = new MediaStream(inputAudioTracks);
    const sourceNode = audioContext.createMediaStreamSource(audioOnlyStream);
    const rnnoiseNode = new RnnoiseWorkletNode(audioContext, {
      maxChannels: 1,
      wasmBinary,
    });
    const destinationNode = audioContext.createMediaStreamDestination();

    sourceNode.connect(rnnoiseNode);
    rnnoiseNode.connect(destinationNode);

    const cleanAudioTrack = destinationNode.stream.getAudioTracks()[0];
    if (!cleanAudioTrack) {
      throw new Error("RNNoise destination produced no audio track");
    }

    const outputStream = new MediaStream();
    outputStream.addTrack(cleanAudioTrack);
    for (const v of inputStream.getVideoTracks()) {
      outputStream.addTrack(v);
    }

    let tornDown = false;
    const teardown = () => {
      if (tornDown) return;
      tornDown = true;
      try {
        sourceNode.disconnect();
      } catch {
        /* already disconnected */
      }
      try {
        rnnoiseNode.disconnect();
        rnnoiseNode.destroy();
      } catch {
        /* already destroyed */
      }
      try {
        cleanAudioTrack.stop();
      } catch {
        /* ignore */
      }
      // CRITICAL: also stop the RAW input audio tracks here. The cleanAudioTrack
      // above is the downstream output of the worklet — stopping it doesn't release
      // the microphone. The browser's mic indicator stays ON until every track
      // sharing the actual mic device is stopped. The caller's userStreamRef points
      // to the post-NS stream, which doesn't contain the raw tracks; if we don't
      // stop them here they survive submit() + page navigation as a leak.
      for (const t of inputAudioTracks) {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      }
    };

    return { outputStream, teardown };
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn(
        "[noise-suppression] RNNoise unavailable; falling back to raw mic stream.",
        err,
      );
    }
    return {
      outputStream: inputStream,
      teardown: () => undefined,
    };
  }
}

export function isNoiseSuppressionSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof AudioWorkletNode === "undefined") return false;
  if (typeof AudioContext === "undefined") return false;
  if (typeof MediaStream === "undefined") return false;
  return true;
}

const NS_PREF_KEY = "mockInterview.noiseSuppressionEnabled";

/** Default ON. Persisted in sessionStorage so a candidate's choice survives device-check → take. */
export function getNoiseSuppressionPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.sessionStorage.getItem(NS_PREF_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function setNoiseSuppressionPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(NS_PREF_KEY, String(enabled));
  } catch {
    /* sessionStorage unavailable (private mode); fall through */
  }
}

/**
 * Fire-and-forget warmup: pulls the WASM binary into the in-memory cache + registers the
 * AudioWorklet on the shared AudioContext. Calling this from device-check means the take
 * page's `applyNoiseSuppression()` hits a hot cache instead of paying ~150KB download +
 * worklet compile on its critical-path render. Idempotent and safe to call multiple times.
 */
export async function prewarmNoiseSuppression(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isNoiseSuppressionSupported()) return;
  if (!getNoiseSuppressionPreference()) return;
  try {
    await loadWasmBinary();
    const audioContext = getSharedAudioContext();
    if (workletRegisteredOnContext !== audioContext) {
      await audioContext.audioWorklet.addModule(WORKLET_URL);
      workletRegisteredOnContext = audioContext;
    }
  } catch {
    /* warmup is best-effort; the take page will retry and warn if it actually breaks */
  }
}
