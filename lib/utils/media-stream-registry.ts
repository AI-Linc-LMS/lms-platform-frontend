const registeredStreams = new Set<MediaStream>();

export function registerMediaStream(stream: MediaStream | null): void {
  if (stream && typeof stream.getTracks === "function") {
    registeredStreams.add(stream);
  }
}

export function stopAndClearRegisteredStreams(): void {
  registeredStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => {
        if (track.readyState === "live" || track.readyState === "ended") {
          track.stop();
        }
      });
    } catch {
      // Ignore per-track errors during cleanup
    }
  });
  registeredStreams.clear();
}
