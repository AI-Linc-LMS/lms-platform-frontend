/**
 * Shared microphone constraints for every getUserMedia({ audio }) call in the app.
 *
 * Layered defaults:
 *   1. Standard WebRTC switches - echoCancellation, noiseSuppression, autoGainControl.
 *      These engage the browser's built-in DSP. Supported everywhere.
 *   2. channelCount: 1 + sampleRate: 48000 - mono at the rate Whisper and RNNoise both
 *      expect. Saves bandwidth and avoids resampling.
 *   3. `advanced: [{ voiceIsolation: true }]` - Chrome 130+ ML-based voice isolation.
 *      Advanced constraints are best-effort: unsupported browsers silently ignore them
 *      instead of throwing OverconstrainedError.
 *
 * Real Teams-grade isolation is layered on top of this via the AudioWorklet-based
 * RNNoise processor in `noise-suppression.ts`. The constraints below are the cheap
 * first line of defense; RNNoise is the heavy artillery.
 */
export function getAudioConstraints(): MediaTrackConstraints {
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    advanced: [
      { voiceIsolation: true } as MediaTrackConstraintSet,
    ],
  };
}

export const VIDEO_CAMERA_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: "user",
};
