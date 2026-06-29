"use client";

import { Box, Typography } from "@mui/material";
import type { AdaptiveCourseVideoLessonSummary } from "@/lib/services/adaptive-course.service";

/**
 * Plays a rendered adaptive video lesson. S3-stored videos use a native HTML5
 * <video> (with a WebVTT caption track); Vimeo-stored videos use the Vimeo
 * iframe player. The MP4 URL is presigned + resolved server-side per request.
 */
export function VideoLessonPlayer({ lesson }: { lesson: AdaptiveCourseVideoLessonSummary }) {
  if (lesson.storage === "vimeo" && (lesson.vimeo_id || lesson.video_url)) {
    const src = lesson.video_url || `https://player.vimeo.com/video/${lesson.vimeo_id}`;
    return (
      <Box sx={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 4, overflow: "hidden", bgcolor: "#000" }}>
        <iframe
          src={src}
          title={lesson.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </Box>
    );
  }

  if (!lesson.video_url) {
    return (
      <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
        This video isn&apos;t available yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "#000", boxShadow: "0 30px 80px -40px rgba(2,6,23,0.8)" }}>
      <video
        controls
        poster={lesson.poster_url || undefined}
        style={{ width: "100%", display: "block", aspectRatio: "16 / 9", background: "#000" }}
      >
        <source src={lesson.video_url} type="video/mp4" />
        {lesson.captions_url && (
          <track kind="captions" src={lesson.captions_url} srcLang="en-IN" label="English" default />
        )}
      </video>
    </Box>
  );
}
