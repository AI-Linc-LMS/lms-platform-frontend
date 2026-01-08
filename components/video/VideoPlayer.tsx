"use client";

import { useState, useCallback, useEffect } from "react";
import { VideoPlayerProps } from "./types";
import { isVimeoUrl } from "./utils/formatters";
import { StandardPlayer } from "./components/StandardPlayer";
import { VimeoPlayer } from "./components/VimeoPlayer";

// Constants for localStorage
const STORAGE_PREFIX = "video_progress_";
const STORAGE_VERSION = "v1";

export function VideoPlayer({
  videoUrl,
  title,
  onComplete,
  isFirstWatch = false,
  activityCompletionThreshold = 100,
  onProgressUpdate,
  onVideoLoad,
  videoId,
  onSaveProgress,
}: VideoPlayerProps) {
  const [videoSize, setVideoSize] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);
  const [videoFingerprint, setVideoFingerprint] = useState<string>("");

  useEffect(() => {
    setSavedProgress(0);
    setIsProgressLoaded(false);
  }, [videoUrl, videoId]);

  // Generate a stable identifier for the video
  useEffect(() => {
    if (videoUrl && videoId) {
      const urlParts = videoUrl.split("/");
      const lastUrlPart = urlParts[urlParts.length - 1];
      const fingerprint = `${videoId}_${lastUrlPart}`;
      setVideoFingerprint(fingerprint);
    } else if (videoUrl) {
      const urlParts = videoUrl.split("/");
      const lastUrlPart = urlParts[urlParts.length - 1];
      setVideoFingerprint(lastUrlPart);
    }
  }, [videoUrl, videoId]);

  const getStorageKey = useCallback(
    (id: string) => {
      return `${STORAGE_PREFIX}${STORAGE_VERSION}_${id}_${title || ""}`;
    },
    [title]
  );

  const getSeekDisabledMessage = useCallback(() => {
    return "You cannot skip ahead on first viewing";
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load saved progress from localStorage
  useEffect(() => {
    const loadSavedProgress = async () => {
      setSavedProgress(0);
      if (!videoFingerprint) {
        return;
      }

      try {
        const storageKey = getStorageKey(videoFingerprint);
        const localProgress = localStorage.getItem(storageKey);

        if (localProgress) {
          const parsedProgress = parseFloat(localProgress);
          if (!isNaN(parsedProgress) && parsedProgress > 0) {
            setSavedProgress(parsedProgress);
          }
        } else if (videoId) {
          // Try legacy formats
          const legacyKey = getStorageKey(String(videoId));
          const legacyProgress = localStorage.getItem(legacyKey);
          if (legacyProgress) {
            const parsedProgress = parseFloat(legacyProgress);
            if (!isNaN(parsedProgress) && parsedProgress > 0) {
              setSavedProgress(parsedProgress);
              localStorage.setItem(storageKey, legacyProgress);
            }
          }

          // Also check even older format
          const oldFormatKey = `video-progress-${videoId}`;
          const oldFormatProgress = localStorage.getItem(oldFormatKey);
          if (oldFormatProgress) {
            const parsedProgress = parseFloat(oldFormatProgress);
            if (!isNaN(parsedProgress) && parsedProgress > 0) {
              setSavedProgress(parsedProgress);
              localStorage.setItem(storageKey, oldFormatProgress);
              localStorage.removeItem(oldFormatKey);
            }
          }
        }
      } catch (error) {
        // Error loading video progress
      } finally {
        setIsProgressLoaded(true);
      }
    };

    if (videoFingerprint) {
      loadSavedProgress();
    } else {
      const timeout = setTimeout(() => {
        setIsProgressLoaded(true);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [videoFingerprint, videoId, getStorageKey]);

  // Handler to save progress
  const handleSaveProgress = useCallback(
    (id: string | number, progress: number) => {
      try {
        if (!videoFingerprint || progress <= 0) return;
        const storageKey = getStorageKey(videoFingerprint);
        localStorage.setItem(storageKey, progress.toString());

        if (id !== videoFingerprint) {
          const idStorageKey = getStorageKey(String(id));
          localStorage.setItem(idStorageKey, progress.toString());
        }

        if (onSaveProgress) {
          onSaveProgress(id, progress);
        }
      } catch (error) {
        // Error saving video progress
      }
    },
    [onSaveProgress, getStorageKey, videoFingerprint]
  );

  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
    if (onVideoLoad) {
      onVideoLoad();
    }
  }, [onVideoLoad]);

  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-2xl",
    large: "w-full",
  };

  const hasValidUrl = !!videoUrl && typeof videoUrl === "string";
  const isVimeo = hasValidUrl && isVimeoUrl(videoUrl);
  const effectiveVideoId = videoFingerprint || String(videoId) || "unknown";

  if (!hasValidUrl) {
    return (
      <div className="w-full">
        <div
          className="bg-gray-800 flex items-center justify-center text-white"
          style={{
            height: "calc(100vh - 200px)",
            minHeight: "500px",
            maxHeight: "90vh",
          }}
        >
          <div className="text-center">
            <p className="text-xl font-medium mb-2">
              {title || "Video Placeholder"}
            </p>
            <p className="text-sm text-gray-400">No video URL provided</p>
          </div>
        </div>
      </div>
    );
  }

  const showLoading = isLoading || !isProgressLoaded;

  return (
    <div className="w-full">
      {showLoading && (
        <div
          className="bg-gray-800 flex items-center justify-center"
          style={{
            height: "calc(100vh - 300px)",
            minHeight: "500px",
            maxHeight: "90vh",
          }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      <div className={`${showLoading ? "hidden" : "block"}`}>
        {isVimeo ? (
          <VimeoPlayer
            videoUrl={videoUrl}
            title={title}
            onComplete={
              onComplete
                ? () => {
                    try {
                      if (onComplete) onComplete();
                    } catch (error) {
                      // Error in onComplete
                    }
                  }
                : undefined
            }
            isFirstWatch={isFirstWatch}
            activityCompletionThreshold={activityCompletionThreshold}
            onProgressUpdate={onProgressUpdate}
            onVideoLoad={handleVideoLoad}
            seekDisabledMessage={getSeekDisabledMessage()}
            savedProgress={savedProgress}
            videoId={effectiveVideoId}
            onSaveProgress={handleSaveProgress}
          />
        ) : (
          <StandardPlayer
            videoUrl={videoUrl}
            title={title}
            onComplete={onComplete}
            isFirstWatch={isFirstWatch}
            activityCompletionThreshold={activityCompletionThreshold}
            onProgressUpdate={onProgressUpdate}
            onVideoLoad={handleVideoLoad}
            videoSize={videoSize}
            setVideoSize={setVideoSize}
            isMobile={isMobile}
            seekDisabledMessage={getSeekDisabledMessage()}
            savedProgress={savedProgress}
            videoId={effectiveVideoId}
            onSaveProgress={handleSaveProgress}
          />
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;
