import React, { useRef, useState, useEffect } from "react";
import { VimeoPlayerProps } from "../types";
import { CircularProgress } from "./CircularProgress";
import { processVimeoUrl } from "../utils/formatters";

export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  videoUrl,
  title,
  onComplete,
  isFirstWatch = false,
  activityCompletionThreshold = 100,
  onProgressUpdate,
  onVideoLoad,
  seekDisabledMessage = "You cannot skip ahead on first watch",
  savedProgress = 0,
  videoId,
  onSaveProgress,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastKnownTime, setLastKnownTime] = useState(0);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showSeekWarning, setShowSeekWarning] = useState(false);
  const [isFirstCompletion, setIsFirstCompletion] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [hasAppliedSavedProgress, setHasAppliedSavedProgress] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const progressSaveInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Handle iframe load event
  const handleIframeLoad = () => {
    if (onVideoLoad) onVideoLoad();

    // Ask Vimeo to send us the "ready" event
    if (iframeRef.current?.contentWindow) {
      const addReadyListener = JSON.stringify({
        method: "addEventListener",
        value: "ready",
      });
      iframeRef.current.contentWindow.postMessage(addReadyListener, "*");

      // Also request duration once ready
      const getDuration = JSON.stringify({
        method: "getDuration",
      });
      iframeRef.current.contentWindow.postMessage(getDuration, "*");
    }
  };

  // Apply saved progress
  const applyProgressAndStartPlayback = (percent: number) => {
    if (iframeRef.current?.contentWindow && videoDuration > 0) {
      const timeToSet = (videoDuration * percent) / 100;

      if (
        !isFirstWatch ||
        (isFirstWatch && percent < activityCompletionThreshold)
      ) {
        setLastKnownTime(timeToSet);
        setHasAppliedSavedProgress(true);

        const seekToMessage = JSON.stringify({
          method: "setCurrentTime",
          value: timeToSet,
        });
        iframeRef.current.contentWindow.postMessage(seekToMessage, "*");

        setTimeout(() => {
          const getCurrentTime = JSON.stringify({
            method: "getCurrentTime",
          });
          iframeRef.current?.contentWindow?.postMessage(getCurrentTime, "*");
          iframeRef.current?.contentWindow?.postMessage(seekToMessage, "*");
        }, 500);

        const playMessage = JSON.stringify({ method: "play" });
        iframeRef.current.contentWindow.postMessage(playMessage, "*");
      }
    }
    setShowContinuePrompt(false);
  };

  // Save progress periodically
  useEffect(() => {
    if (onSaveProgress && videoId && videoDuration > 0) {
      if (lastKnownTime > 0 && !hasMarkedComplete) {
        const currentPercent = (lastKnownTime / videoDuration) * 100;
        if (currentPercent > 1 && currentPercent < 99) {
          onSaveProgress(videoId, currentPercent);
        }
      }

      progressSaveInterval.current = setInterval(() => {
        if (lastKnownTime > 0) {
          const currentPercent = (lastKnownTime / videoDuration) * 100;
          if (currentPercent > 1 && currentPercent < 99) {
            onSaveProgress(videoId, currentPercent);
          }
        }
      }, 5000);
    }

    return () => {
      if (progressSaveInterval.current)
        clearInterval(progressSaveInterval.current);
      if (
        onSaveProgress &&
        videoId &&
        lastKnownTime > 0 &&
        videoDuration > 0 &&
        !hasMarkedComplete
      ) {
        const finalPercent = (lastKnownTime / videoDuration) * 100;
        if (finalPercent > 1 && finalPercent < 99) {
          onSaveProgress(videoId, finalPercent);
        }
      }
    };
  }, [
    onSaveProgress,
    videoId,
    lastKnownTime,
    videoDuration,
    hasMarkedComplete,
  ]);

  // Vimeo message handling
  useEffect(() => {
    const handleVimeoMessage = (event: MessageEvent) => {
      if (!event.origin.includes("vimeo.com")) return;

      let data;
      try {
        data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      // ✅ Wait for "ready" event before adding other listeners
      if (data.event === "ready" && iframeRef.current?.contentWindow) {
        ["play", "pause", "timeupdate", "seeked", "ended"].forEach((ev) => {
          const msg = JSON.stringify({ method: "addEventListener", value: ev });
          iframeRef.current?.contentWindow &&
            iframeRef?.current?.contentWindow.postMessage(msg, "*");
        });

        // Request duration
        const getDuration = JSON.stringify({ method: "getDuration" });
        iframeRef.current.contentWindow.postMessage(getDuration, "*");
      }

      // Handle duration response
      if (data.method === "getDuration" && typeof data.value === "number") {
        if (data.value > 0) {
          setVideoDuration(data.value);

          if (savedProgress > 0 && !hasAppliedSavedProgress) {
            if (savedProgress > 5 && savedProgress < 95) {
              setShowContinuePrompt(true);
            } else {
              applyProgressAndStartPlayback(savedProgress);
            }
          }
        }
      }

      // Handle progress events
      if (data.event === "timeupdate" || data.event === "playProgress") {
        let percent = 0;
        let currentTime = 0;

        if (data.data?.seconds && data.data?.duration) {
          currentTime = data.data.seconds;
          percent = (currentTime / data.data.duration) * 100;
        } else if (data.data?.percent && data.data?.seconds) {
          percent = data.data.percent * 100;
          currentTime = data.data.seconds;
        }

        if (isFirstWatch) {
          const isJump = currentTime > lastKnownTime + 3;
          if (isJump && iframeRef.current?.contentWindow) {
            const seekBack = JSON.stringify({
              method: "setCurrentTime",
              value: lastKnownTime,
            });
            iframeRef.current.contentWindow.postMessage(seekBack, "*");
            setShowSeekWarning(true);
            setTimeout(() => setShowSeekWarning(false), 3000);
            return;
          }
        }

        setLastKnownTime(currentTime);
        setProgressPercent(percent);
        if (onProgressUpdate) onProgressUpdate(percent);

        if (
          percent >= activityCompletionThreshold &&
          !hasMarkedComplete &&
          isFirstCompletion
        ) {
          if (onComplete) onComplete();
          setHasMarkedComplete(true);
          setIsFirstCompletion(false);
        }
      }

      // ✅ Handle ended event reliably now
      if (
        data.event === "ended" &&
        onComplete &&
        !hasMarkedComplete &&
        isFirstCompletion
      ) {
        onComplete();
        setHasMarkedComplete(true);
        setIsFirstCompletion(false);
        setProgressPercent(100);
        setLastKnownTime(0);
      }

      // Handle seek attempts during first watch
      if (isFirstWatch && data.event === "seeked" && data.data) {
        const seekedTo = data.data.seconds || 0;
        if (seekedTo > lastKnownTime + 2) {
          setShowSeekWarning(true);
          setTimeout(() => setShowSeekWarning(false), 3000);

          const seekBack = JSON.stringify({
            method: "setCurrentTime",
            value: lastKnownTime,
          });
          iframeRef.current?.contentWindow?.postMessage(seekBack, "*");
        }
      }
    };

    window.addEventListener("message", handleVimeoMessage);
    return () => window.removeEventListener("message", handleVimeoMessage);
  }, [
    onComplete,
    hasMarkedComplete,
    isFirstCompletion,
    activityCompletionThreshold,
    onProgressUpdate,
    isFirstWatch,
    lastKnownTime,
    savedProgress,
    hasAppliedSavedProgress,
    videoId,
  ]);

  // Reset when video changes
  useEffect(() => {
    setProgressPercent(0);
    setHasMarkedComplete(false);
    setLastKnownTime(0);
    setIsFirstCompletion(true);
    setVideoDuration(0);
    setShowSeekWarning(false);
    setHasAppliedSavedProgress(false);
    setShowContinuePrompt(false);
  }, [videoUrl]);

  return (
    <div className="w-full aspect-video bg-black relative">
      <iframe
        ref={iframeRef}
        src={processVimeoUrl(videoUrl)}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
        onLoad={handleIframeLoad}
      ></iframe>

      {/* Progress indicator */}
      <div className="absolute top-3 right-3 z-10">
        <CircularProgress
          progress={progressPercent}
          isComplete={hasMarkedComplete || progressPercent >= 100}
        />
      </div>

      {/* First Viewing Tag */}
      {isFirstWatch && (
        <div className="absolute top-3 left-3 z-10 bg-yellow-600 text-[var(--font-light)] px-3 py-1 text-xs rounded-full">
          First Viewing
        </div>
      )}

      {/* Seek warning */}
      {showSeekWarning && (
        <div className="absolute bottom-16 left-0 right-0 text-center z-20">
          <div className="inline-block bg-black bg-opacity-80 text-[var(--font-light)] text-sm px-4 py-2 rounded-full">
            {seekDisabledMessage}
          </div>
        </div>
      )}

      {/* Continue watching prompt */}
      {showContinuePrompt && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-30">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
            <h3 className="text-[var(--font-light)] text-lg font-semibold mb-4">
              Continue Watching?
            </h3>
            <p className="text-gray-200 mb-4">
              You were at {savedProgress.toFixed(0)}% of this video. Would you
              like to continue from where you left off?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-[var(--font-light)] px-4 py-2 rounded-md"
                onClick={() => applyProgressAndStartPlayback(savedProgress)}
              >
                Continue
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-[var(--font-light)] px-4 py-2 rounded-md"
                onClick={() => {
                  setShowContinuePrompt(false);
                  setHasAppliedSavedProgress(true);
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
