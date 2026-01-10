"use client";

import React, { useRef, useState, useEffect } from "react";
import { StandardPlayerProps } from "../types";
import { CircularProgress } from "./CircularProgress";

export const StandardPlayer: React.FC<StandardPlayerProps> = ({
  videoUrl,
  title,
  onComplete,
  isFirstWatch = false,
  activityCompletionThreshold = 100,
  onProgressUpdate,
  onVideoLoad,
  videoSize = "medium",
  setVideoSize,
  isMobile = false,
  seekDisabledMessage = "You cannot skip ahead on first watch",
  savedProgress = 0,
  videoId,
  onSaveProgress,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showSeekWarning, setShowSeekWarning] = useState(false);
  const [lastKnownTime, setLastKnownTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Convert YouTube URL to embed format if needed
  let embedUrl = videoUrl;
  if (videoUrl.includes("youtube.com/watch")) {
    const youtubeId = videoUrl.match(/[?&]v=([^&]+)/)?.[1];
    if (youtubeId) {
      embedUrl = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
    }
  }

  const handleIframeLoad = () => {
    if (onVideoLoad) onVideoLoad();
  };

  // YouTube API message handling
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      if (!event.origin.includes("youtube.com")) return;

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        
        if (data.event === "onStateChange") {
          // State 0 = ended
          if (data.info === 0 && onComplete && !hasMarkedComplete) {
            // Verify we're actually at the end
            const currentTime = data.info?.currentTime || lastKnownTime;
            const duration = data.info?.duration || videoDuration;
            
            // Only mark complete if video has played for at least 10 seconds
            // and is at least 90% complete or within 2 seconds of end
            if (
              duration > 0 &&
              currentTime >= 10 &&
              (currentTime >= duration - 2 || currentTime / duration >= 0.9)
            ) {
              // Clear saved progress from localStorage since video is completed
              if (videoId) {
                try {
                  // Remove progress from all possible storage keys
                  // The format used by VideoPlayer is: video_progress_v1_{videoId}_{title}
                  const storageKeys = [
                    `video_progress_v1_${videoId}_${title || ""}`,
                  ];
                  
                  // Also try to remove legacy formats
                  const legacyKeys = Object.keys(localStorage).filter(
                    (key) =>
                      key.includes(String(videoId)) &&
                      (key.startsWith("video_progress_") || key.startsWith("video-progress-"))
                  );
                  
                  [...storageKeys, ...legacyKeys].forEach((key) => {
                    localStorage.removeItem(key);
                  });
                } catch (error) {
                  // Error clearing video progress
                }
              }

              onComplete();
              setHasMarkedComplete(true);
              setProgressPercent(100);
            }
          }
        }

        if (data.event === "onProgress") {
          const currentTime = data.info?.currentTime || 0;
          const duration = data.info?.duration || 0;
          if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            setLastKnownTime(currentTime);
            setVideoDuration(duration);
            setProgressPercent(percent);
            if (onProgressUpdate) onProgressUpdate(percent);
            
            // Don't mark complete on progress events - only on state change to "ended"
            // This prevents premature completion when video starts playing
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    window.addEventListener("message", handleYouTubeMessage);
    return () => window.removeEventListener("message", handleYouTubeMessage);
  }, [onComplete, hasMarkedComplete, activityCompletionThreshold, onProgressUpdate, lastKnownTime, videoDuration]);

  // Save progress periodically
  useEffect(() => {
    if (onSaveProgress && videoId && videoDuration > 0 && lastKnownTime > 0 && !hasMarkedComplete) {
      const currentPercent = (lastKnownTime / videoDuration) * 100;
      if (currentPercent > 1 && currentPercent < 99) {
        onSaveProgress(videoId, currentPercent);
      }

      const interval = setInterval(() => {
        if (lastKnownTime > 0) {
          const percent = (lastKnownTime / videoDuration) * 100;
          if (percent > 1 && percent < 99) {
            onSaveProgress(videoId, percent);
          }
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [onSaveProgress, videoId, lastKnownTime, videoDuration, hasMarkedComplete]);

  useEffect(() => {
    setProgressPercent(0);
    setHasMarkedComplete(false);
    setShowSeekWarning(false);
    setLastKnownTime(0);
    setVideoDuration(0);
  }, [videoUrl]);

  return (
    <div className="w-full">
      <div 
        className="w-full bg-black relative"
        style={{
          height: 'calc(100vh - 200px)',
          minHeight: '500px',
          maxHeight: '90vh',
        }}
      >
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
          onLoad={handleIframeLoad}
        />

        {/* Progress indicator */}
        <div className="absolute top-3 right-3 z-10">
          <CircularProgress
            progress={progressPercent}
            isComplete={hasMarkedComplete || progressPercent >= 100}
          />
        </div>

        {/* First Viewing Tag */}
        {isFirstWatch && (
          <div className="absolute top-3 left-3 z-10 bg-yellow-600 text-white px-3 py-1 text-xs rounded-full">
            First Viewing
          </div>
        )}

        {/* Seek warning */}
        {showSeekWarning && (
          <div className="absolute bottom-16 left-0 right-0 text-center z-20">
            <div className="inline-block bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-full">
              {seekDisabledMessage}
            </div>
          </div>
        )}

        {/* Overlay to prevent seeking on first watch */}
        {isFirstWatch && (
          <div
            className="absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-auto cursor-not-allowed"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSeekWarning(true);
              setTimeout(() => setShowSeekWarning(false), 3000);
            }}
          />
        )}
      </div>
    </div>
  );
};

