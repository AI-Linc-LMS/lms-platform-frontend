import React, { useRef, useState, useEffect } from 'react';
import { VimeoPlayerProps } from '../types';
import { CircularProgress } from './CircularProgress';
import { processVimeoUrl } from '../utils/formatters';

export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  videoUrl,
  title,
  onComplete,
  isFirstWatch = false,
  activityCompletionThreshold = 95,
  onProgressUpdate,
  onVideoLoad,
  seekDisabledMessage = "You cannot skip ahead on first watch"
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastKnownTime, setLastKnownTime] = useState(0);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showSeekWarning, setShowSeekWarning] = useState(false);

  // Handle iframe load event
  const handleIframeLoad = () => {
    onVideoLoad();
    
    // Start Vimeo player API communication
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setTimeout(() => {
        // Subscribe to events needed for tracking
        const events = ['play', 'pause', 'timeupdate', 'seeked', 'ended'];
        
        events.forEach(event => {
          const message = JSON.stringify({
            method: 'addEventListener',
            value: event
          });
          iframeRef.current?.contentWindow?.postMessage(message, '*');
        });
      }, 500);
    }
  };

  // Effect to handle onComplete for Vimeo videos and apply CSS to disable seeking
  useEffect(() => {
    // For first-time viewers, inject CSS to disable the seekbar
    if (isFirstWatch && iframeRef.current) {
      const disableSeekbar = () => {
        try {
          const iframe = iframeRef.current;
          if (!iframe || !iframe.contentWindow) return;
          
          // Create a style element to inject
          const styleEl = document.createElement('style');
          styleEl.textContent = `
            /* Hide the seek bar's handle to prevent clicking/dragging */
            .vp-progress, .vp-progress-bar {
              pointer-events: none !important;
              cursor: not-allowed !important;
            }
            
            /* Add a visual indicator that seeking is disabled */
            .vp-controls::after {
              content: "Seeking disabled for first viewing";
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
            } catch (err) {
              console.error('VideoPlayer - Error injecting styles:', err);
            }
          };
          
          // Try immediately and also wait for load
          injectStyles();
          iframe.addEventListener('load', injectStyles);
          
          return () => {
            iframe.removeEventListener('load', injectStyles);
          };
        } catch (err) {
          console.error('VideoPlayer - Error setting up seekbar disabling:', err);
        }
      };
      
      disableSeekbar();
    }

    const handleVimeoMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vimeo.com')) return;

      try {
        const data = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data;

        // For progress tracking, we need to handle both timeupdate and playProgress events
        if (data.event === 'playProgress' || data.event === 'timeupdate') {
          // Extract percent and time from different event formats
          let percent = 0;
          let currentTime = 0;
          
          if (data.data && typeof data.data.percent === 'number') {
            percent = data.data.percent * 100;
            
            if (typeof data.data.seconds === 'number') {
              currentTime = data.data.seconds;
              // Update last known time for seek protection
              if (currentTime > lastKnownTime) {
                setLastKnownTime(currentTime);
              }
            }
          } else if (data.data && typeof data.data.seconds === 'number' && typeof data.data.duration === 'number') {
            currentTime = data.data.seconds;
            percent = (currentTime / data.data.duration) * 100;
            
            // Update last known time for seek protection
            if (currentTime > lastKnownTime) {
              setLastKnownTime(currentTime);
            }
          }
          
          if (percent > 0) {
            setProgressPercent(percent);
            
            // Call onProgressUpdate callback if provided
            if (onProgressUpdate) {
              onProgressUpdate(percent);
            }
            
            // Check if we've reached completion threshold
            if (percent >= activityCompletionThreshold && !hasMarkedComplete) {
              if (onComplete) {
                onComplete();
                setHasMarkedComplete(true);
              }
            }
          }
        }

        // For first watch, prevent seeking ahead of the last watched point
        if (isFirstWatch && data.event === 'seeked' && iframeRef.current && data.data) {
          const seekedTo = data.data.seconds || 0;
          
          // If user tried to seek ahead of what they've watched
          if (seekedTo > lastKnownTime + 2) { // Allow small buffer for seeking
            // Show warning
            setShowSeekWarning(true);
            setTimeout(() => setShowSeekWarning(false), 3000);
            
            // Seek back to last known position
            const seekBackMessage = JSON.stringify({
              method: 'setCurrentTime',
              value: lastKnownTime
            });
            iframeRef.current.contentWindow?.postMessage(seekBackMessage, '*');
          }
        }

        // Also handle end event for backward compatibility
        if (data.event === 'ended' && onComplete && !hasMarkedComplete) {
          onComplete();
          setHasMarkedComplete(true);
          setProgressPercent(100);
          setLastKnownTime(0); // Reset for next viewing
        }
      } catch (e) {
        console.error('VideoPlayer - Error processing Vimeo message:', e);
      }
    };

    window.addEventListener('message', handleVimeoMessage);
    
    // After iframe is loaded, initialize communication with Vimeo player
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setTimeout(() => {
        // Initialize Vimeo Player API communication - request both timeupdate and progress events
        ['timeupdate', 'progress', 'playProgress', 'seeked'].forEach(eventName => {
          const message = JSON.stringify({
            method: 'addEventListener',
            value: eventName
          });
          iframeRef.current?.contentWindow?.postMessage(message, '*');
        });
        
        // Also get the current time to initialize the progress
        const getCurrentTime = JSON.stringify({
          method: 'getCurrentTime'
        });
        iframeRef.current?.contentWindow?.postMessage(getCurrentTime, '*');
      }, 1000); // Give the iframe time to load
    }
    
    return () => window.removeEventListener('message', handleVimeoMessage);
  }, [onComplete, activityCompletionThreshold, hasMarkedComplete, onProgressUpdate, isFirstWatch, lastKnownTime]);

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
        <div className="absolute top-3 left-3 z-10 bg-yellow-600 text-white px-3 py-1 text-xs rounded-full">
          First Viewing
        </div>
      )}

      {/* Warning message when trying to seek ahead */}
      {showSeekWarning && (
        <div className="absolute bottom-16 left-0 right-0 text-center z-20">
          <div className="inline-block bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-full">
            {seekDisabledMessage}
          </div>
        </div>
      )}
    </div>
  );
}; 