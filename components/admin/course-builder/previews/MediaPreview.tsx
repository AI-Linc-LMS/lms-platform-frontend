"use client";

import { useState } from "react";
import { PREVIEW_HEIGHT } from "./shared";
import { FallbackPreview } from "./FallbackPreview";

/**
 * Inline audio/video playback for an uploaded file.
 *
 * The error fallback is not optional: the backend classifies .mkv and .avi as `video`, and no
 * browser plays either - without onError those render as a silent black box with no way out.
 */
export function MediaPreview({
  kind,
  url,
  filename,
}: {
  kind: "video" | "audio";
  url: string;
  filename: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <FallbackPreview url={url} filename={filename} />;

  // No autoPlay: a materials list is not a video page.
  if (kind === "audio") {
    return <audio src={url} controls onError={() => setFailed(true)} style={{ width: "100%" }} />;
  }
  return (
    <video
      src={url}
      controls
      playsInline
      onError={() => setFailed(true)}
      style={{ width: "100%", maxHeight: PREVIEW_HEIGHT, borderRadius: 4, backgroundColor: "#000" }}
    />
  );
}
