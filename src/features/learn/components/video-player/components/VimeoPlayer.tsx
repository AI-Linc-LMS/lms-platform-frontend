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
  const iframeRef = useRef<HTMLIFrameElement>(null);
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
    if (onVideoLoad) {
      onVideoLoad();
    }

    // Start Vimeo player API communication
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setTimeout(() => {
        // Subscribe to events needed for tracking
        const events = ["play", "pause", "timeupdate", "seeked", "ended"];

        events.forEach((event) => {
          const message = JSON.stringify({
            method: "addEventListener",
            value: event,
          });
          iframeRef.current?.contentWindow?.postMessage(message, "*");
        });

        // Get video duration - important for progress restoration
        const getDuration = JSON.stringify({
          method: "getDuration",
        });
        iframeRef.current?.contentWindow?.postMessage(getDuration, "*");
      }, 500);
    }
  };

  // Effect to check for saved progress and show the continue prompt
  useEffect(() => {
    // Need both iframe ref and video duration before we can apply progress
    if (
      iframeRef.current &&
      savedProgress > 0 &&
      !hasAppliedSavedProgress &&
      videoDuration > 0
    ) {
      //console.log(`VimeoPlayer: Ready to apply saved progress ${savedProgress.toFixed(1)}% for ${videoId}`);

      // Only show continue prompt if there's significant progress (more than 5% and less than 95%)
      if (savedProgress > 5 && savedProgress < 95) {
        setShowContinuePrompt(true);
      } else {
        // If progress is minimal or nearly complete, just apply it directly
        applyProgressAndStartPlayback(savedProgress);
      }
    }
  }, [
    savedProgress,
    hasAppliedSavedProgress,
    videoDuration,
    activityCompletionThreshold,
    videoId,
  ]);

  // Apply saved progress and start playback
  const applyProgressAndStartPlayback = (percent: number) => {
    if (iframeRef.current?.contentWindow && videoDuration > 0) {
      const timeToSet = (videoDuration * percent) / 100;
      //console.log(`VimeoPlayer: Applying saved progress: ${percent.toFixed(1)}%, setting time to: ${timeToSet.toFixed(1)}s for ${videoId}`);

      // For first watch, we should only restore progress if it's allowed
      // (not jumping ahead of what they've seen)
      if (
        !isFirstWatch ||
        (isFirstWatch && percent < activityCompletionThreshold)
      ) {
        // Set state variables first
        setLastKnownTime(timeToSet);
        setHasAppliedSavedProgress(true);

        // Seek to saved position using Vimeo API
        const seekToMessage = JSON.stringify({
          method: "setCurrentTime",
          value: timeToSet,
        });
        iframeRef.current.contentWindow.postMessage(seekToMessage, "*");

        // Force double-check after a moment to make sure it really applied
        setTimeout(() => {
          if (iframeRef.current?.contentWindow) {
            // Check current time
            const getCurrentTime = JSON.stringify({
              method: "getCurrentTime",
            });
            iframeRef.current.contentWindow.postMessage(getCurrentTime, "*");

            // Reapply if needed
            iframeRef.current.contentWindow.postMessage(seekToMessage, "*");
          }
        }, 500);

        // Start playback
        const playMessage = JSON.stringify({
          method: "play",
        });
        iframeRef.current.contentWindow.postMessage(playMessage, "*");
      }
    }
    // Close the prompt
    setShowContinuePrompt(false);
  };

  // Effect to periodically save progress
  useEffect(() => {
    // Set up interval to save progress every 5 seconds
    if (onSaveProgress && videoId && videoDuration > 0) {
      // Save progress immediately on mount if we have valid data
      if (lastKnownTime > 0 && !hasMarkedComplete) {
        const currentPercent = (lastKnownTime / videoDuration) * 100;
        if (currentPercent > 1 && currentPercent < 99) {
          //console.log(`VimeoPlayer: Saving initial progress for ${videoId}: ${currentPercent.toFixed(1)}%`);
          onSaveProgress(videoId, currentPercent);
        }
      }

      // Set up periodic saving
      progressSaveInterval.current = setInterval(() => {
        if (lastKnownTime > 0) {
          const currentPercent = (lastKnownTime / videoDuration) * 100;
          // Only save if we have meaningful progress and it's less than completion threshold
          if (currentPercent > 1 && currentPercent < 99) {
            //console.log(`VimeoPlayer: Saving progress (interval) for ${videoId}: ${currentPercent.toFixed(1)}%`);
            onSaveProgress(videoId, currentPercent);
          }
        }
      }, 5000); // Save every 5 seconds
    }

    // Also save on component unmount
    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }

      // Save final progress when component unmounts
      if (
        onSaveProgress &&
        videoId &&
        lastKnownTime > 0 &&
        videoDuration > 0 &&
        !hasMarkedComplete
      ) {
        const finalPercent = (lastKnownTime / videoDuration) * 100;
        if (finalPercent > 1 && finalPercent < 99) {
          //console.log(`VimeoPlayer: Saving final progress for ${videoId}: ${finalPercent.toFixed(1)}%`);
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

  // Effect to handle Vimeo messages including duration responses
  useEffect(() => {
    // For first-time viewers, inject CSS to disable the seekbar
    if (isFirstWatch && iframeRef.current) {
      const disableSeekbar = () => {
        try {
          const iframe = iframeRef.current;
          if (!iframe || !iframe.contentWindow) return;

          // Create a style element to inject
          const styleEl = document.createElement("style");
          styleEl.textContent = `
            /* Hide the seek bar's handle to prevent clicking/dragging */
            .vp-progress, .vp-progress-bar {
              pointer-events: none !important;
              cursor: not-allowed !important;
            }
            
            /* Add a visual indicator that seeking is disabled */
            .vp-controls::after {
              content: "${seekDisabledMessage}";
              position: absolute;
              bottom: 40px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              z-index: 2;
            }

            /* Make the progress bar more visible but non-interactive */
            .vp-progress {
              opacity: 1 !important;
            }
            
            /* Highlight the watched section */
            .vp-progress-bar {
              background-color: rgba(255, 255, 255, 0.3) !important;
            }

            .vp-progressed {
              background-color: white !important;
            }
          `;

          // Wait for iframe to load and inject the style
          const injectStyles = () => {
            try {
              if (iframe.contentDocument && iframe.contentDocument.head) {
                iframe.contentDocument.head.appendChild(styleEl);
              }
            } catch {
              //console.error('VideoPlayer - Error injecting styles:', err);
            }
          };

          // Try immediately and also wait for load
          injectStyles();
          iframe.addEventListener("load", injectStyles);

          return () => {
            iframe.removeEventListener("load", injectStyles);
          };
        } catch {
          //console.error('VideoPlayer - Error setting up seekbar disabling:', err);
        }
      };

      disableSeekbar();
    }

    const handleVimeoMessage = (event: MessageEvent) => {
      if (!event.origin.includes("vimeo.com")) return;

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        // Handle duration response - critical for progress restoration
        if (data.method === "getDuration" && typeof data.value === "number") {
          if (data.value > 0) {
            //console.log(`VimeoPlayer: Got duration ${data.value.toFixed(1)}s for ${videoId}`);
            setVideoDuration(data.value);

            // Once we have duration, we can check if we need to apply progress
            if (savedProgress > 0 && !hasAppliedSavedProgress) {
              //console.log('VimeoPlayer: Got duration, now can check for applying progress');
              if (savedProgress > 5 && savedProgress < 95) {
                setShowContinuePrompt(true);
              } else {
                applyProgressAndStartPlayback(savedProgress);
              }
            }
          }
        }

        // Check if getCurrentTime response shows we need to reapply seek position
        if (
          data.method === "getCurrentTime" &&
          typeof data.value === "number"
        ) {
          if (
            hasAppliedSavedProgress &&
            Math.abs(data.value - lastKnownTime) > 2
          ) {
            //console.log('VimeoPlayer: Had to reapply progress, time wasn\'t set correctly');
            const seekToMessage = JSON.stringify({
              method: "setCurrentTime",
              value: lastKnownTime,
            });
            iframeRef.current?.contentWindow?.postMessage(seekToMessage, "*");
          }
        }

        // For progress tracking, need to handle timeupdate and playProgress events
        if (data.event === "playProgress" || data.event === "timeupdate") {
          // Extract percent and time from different event formats
          let percent = 0;
          let currentTime = 0;

          if (data.data && typeof data.data.percent === "number") {
            percent = data.data.percent * 100;

            if (typeof data.data.seconds === "number") {
              currentTime = data.data.seconds;

              // Prevent false progress updates in first-time view
              if (isFirstWatch) {
                // If there appears to be a big jump forward, it might be a seek attempt
                const isSignificantJump = currentTime > lastKnownTime + 3;

                // Update last known time only if it's natural progression
                if (currentTime > lastKnownTime && !isSignificantJump) {
                  setLastKnownTime(currentTime);
                } else if (
                  isSignificantJump &&
                  iframeRef.current?.contentWindow
                ) {
                  // Revert back to last known position if there's a suspicious jump forward
                  const seekBackMessage = JSON.stringify({
                    method: "setCurrentTime",
                    value: lastKnownTime,
                  });
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                      seekBackMessage,
                      "*"
                    );
                  }

                  // Show warning
                  setShowSeekWarning(true);
                  setTimeout(() => setShowSeekWarning(false), 3000);

                  // Return early to prevent further processing of this suspicious timeupdate
                  return;
                }
              } else {
                // For returning viewers, just update normally
                setLastKnownTime(currentTime);
              }
            }
          } else if (
            data.data &&
            typeof data.data.seconds === "number" &&
            typeof data.data.duration === "number"
          ) {
            currentTime = data.data.seconds;
            percent = (currentTime / data.data.duration) * 100;

            // Update last known time with the same logic as above
            if (isFirstWatch) {
              const isSignificantJump = currentTime > lastKnownTime + 3;
              if (currentTime > lastKnownTime && !isSignificantJump) {
                setLastKnownTime(currentTime);
              } else if (
                isSignificantJump &&
                iframeRef.current?.contentWindow
              ) {
                const seekBackMessage = JSON.stringify({
                  method: "setCurrentTime",
                  value: lastKnownTime,
                });
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.postMessage(
                    seekBackMessage,
                    "*"
                  );
                }
                setShowSeekWarning(true);
                setTimeout(() => setShowSeekWarning(false), 3000);
                return;
              }
            } else {
              setLastKnownTime(currentTime);
            }
          }

          if (percent > 0) {
            setProgressPercent(percent);

            // Call onProgressUpdate callback if provided
            if (onProgressUpdate) {
              onProgressUpdate(percent);
            }

            // Check if video has reached the completion threshold percentage - prevent cheating by checking jump
            const isNaturalCompletion =
              !isFirstWatch ||
              (currentTime >=
                (videoDuration * activityCompletionThreshold) / 100 &&
                Math.abs(currentTime - lastKnownTime) < 3);

            if (
              percent >= activityCompletionThreshold &&
              !hasMarkedComplete &&
              isFirstCompletion &&
              isNaturalCompletion
            ) {
              if (onComplete) {
                onComplete();
                setHasMarkedComplete(true);
                setIsFirstCompletion(false);
              }
            }
          }
        }

        // Handle play event
        if (data.event === "play") {
          // Video play event - activity tracking handled by simplified approach
        }

        // Handle pause event
        if (data.event === "pause") {
          // Video pause event - activity tracking handled by simplified approach
        }

        // For first watch, prevent seeking ahead of the last watched point
        if (
          isFirstWatch &&
          data.event === "seeked" &&
          iframeRef.current &&
          data.data
        ) {
          const seekedTo = data.data.seconds || 0;

          // If user tried to seek ahead of what they've watched
          if (seekedTo > lastKnownTime + 2) {
            // Allow small buffer for seeking
            // Show warning
            setShowSeekWarning(true);
            setTimeout(() => setShowSeekWarning(false), 3000);

            // Seek back to last known position
            const seekBackMessage = JSON.stringify({
              method: "setCurrentTime",
              value: lastKnownTime,
            });
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(seekBackMessage, "*");
            }
          }
        } else if (data.event === "seeked") {
          // Normal seeking for non-first-watch - no special handling needed
        }

        // Also handle end event for backward compatibility
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
          setLastKnownTime(0); // Reset for next viewing
        }
      } catch {
        // Ignore parsing errors for non-JSON messages
      }
    };

    // Add the event listener
    window.addEventListener("message", handleVimeoMessage);

    // Setup Vimeo API communication after iframe is loaded
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Initialize communication for events
      ["timeupdate", "progress", "playProgress", "seeked"].forEach(
        (eventName) => {
          const message = JSON.stringify({
            method: "addEventListener",
            value: eventName,
          });
          iframeRef.current?.contentWindow?.postMessage(message, "*");
        }
      );

      // Get current time to initialize
      const getCurrentTime = JSON.stringify({
        method: "getCurrentTime",
      });
      iframeRef.current.contentWindow.postMessage(getCurrentTime, "*");

      // Poll for duration more frequently to ensure we get it
      const durationPoll = setInterval(() => {
        if (videoDuration > 0) {
          clearInterval(durationPoll);
          return;
        }

        // Request duration
        const getDuration = JSON.stringify({
          method: "getDuration",
        });
        iframeRef.current?.contentWindow?.postMessage(getDuration, "*");
      }, 1000);

      // Clear interval when component unmounts
      return () => {
        window.removeEventListener("message", handleVimeoMessage);
        clearInterval(durationPoll);
      };
    }

    return () => window.removeEventListener("message", handleVimeoMessage);
  }, [
    onComplete,
    activityCompletionThreshold,
    hasMarkedComplete,
    onProgressUpdate,
    isFirstWatch,
    lastKnownTime,
    seekDisabledMessage,
    isFirstCompletion,
    videoDuration,
    hasAppliedSavedProgress,
    savedProgress,
    videoId,
  ]);

  // Reset component state when video URL changes
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
        width="100%"
        height="100%"
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

      {/* First time viewing indicator */}
      {isFirstWatch && (
        <div className="absolute top-3 left-3 z-10 bg-yellow-600 text-[var(--font-light)] px-3 py-1 text-xs rounded-full">
          First Viewing
        </div>
      )}

      {/* Warning message when trying to seek ahead */}
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
