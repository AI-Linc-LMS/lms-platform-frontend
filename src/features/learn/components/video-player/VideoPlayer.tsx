import React, { useState, useRef, useEffect } from 'react';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onComplete?: () => void;
  isFirstWatch?: boolean; // Add prop to indicate if this is the first watch
  activityCompletionThreshold?: number; // Threshold percentage to mark as complete (default: 95%)
  onProgressUpdate?: (progress: number) => void; // Add this callback
}

// Circular progress component
const CircularProgress = ({ progress, isComplete }: { progress: number, isComplete: boolean }) => {
  // Circle properties
  const size = 40;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      {/* SVG for circular progress */}
      {!isComplete ? (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#5FA564"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
      ) : (
        /* Completed checkmark */
        <div className="w-10 h-10 rounded-full bg-[#5FA564] flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M5 12l5 5L20 7" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      
      {/* Percentage in center if not complete */}
      {!isComplete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  title, 
  onComplete, 
  isFirstWatch = false,
  activityCompletionThreshold = 95,
  onProgressUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [videoSize, setVideoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false); // Track if video has been marked complete
  const [progressPercent, setProgressPercent] = useState(0); // Track progress percentage
  const [lastKnownTime, setLastKnownTime] = useState(0); // Track the furthest watched point
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Check for undefined videoUrl
  const hasValidUrl = !!videoUrl;

  // Explicitly check for Vimeo URLs
  const isVimeoUrl = hasValidUrl && (
    videoUrl.includes('vimeo.com') ||
    videoUrl.includes('player.vimeo.com')
  );

  // Clean and prepare Vimeo URL
  const getProcessedVimeoUrl = () => {
    if (!hasValidUrl) return '';

    console.log('VideoPlayer - Processing Vimeo URL:', videoUrl);

    // First, decode HTML entities
    let processedUrl = videoUrl.replace(/&amp;/g, '&');

    // If it's a regular Vimeo URL (not a player URL), convert it
    if (processedUrl.includes('vimeo.com') && !processedUrl.includes('player.vimeo.com')) {
      // Extract the video ID
      const vimeoRegex = /vimeo.com\/(\d+)/;
      const match = processedUrl.match(vimeoRegex);

      if (match && match[1]) {
        const videoId = match[1];
        processedUrl = `https://player.vimeo.com/video/${videoId}`;
        console.log('VideoPlayer - Converted to player URL:', processedUrl);
      }
    }

    // Add necessary parameters for embedding if they don't exist
    if (!processedUrl.includes('?')) {
      processedUrl += '?';
    } else if (!processedUrl.endsWith('&') && !processedUrl.endsWith('?')) {
      processedUrl += '&';
    }

    // Add essential parameters for proper embedding - always show controls
    processedUrl += 'dnt=1&app_id=122963&title=0&byline=0&portrait=0&playsinline=1&controls=1';
    
    console.log('VideoPlayer - Final processed Vimeo URL:', processedUrl);
    return processedUrl;
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    console.log('VideoPlayer - Vimeo iframe loaded successfully');
    setIsVideoLoaded(true);
    
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

  // Handle video load event
  const handleVideoLoad = () => {
    console.log('VideoPlayer - Regular video loaded successfully');
    setIsVideoLoaded(true);
  };

  // Handle console logs once on mount or when videoUrl changes
  useEffect(() => {
    console.log('VideoPlayer - Component mounted or videoUrl changed');
    console.log('VideoPlayer - Video URL:', videoUrl);
    console.log('VideoPlayer - Has valid URL:', hasValidUrl);
    console.log('VideoPlayer - Is Vimeo URL:', isVimeoUrl);
    console.log('VideoPlayer - Is first watch:', isFirstWatch);

    setIsVideoLoaded(false);
    setHasMarkedComplete(false);
    setProgressPercent(0);

    return () => {
      console.log('VideoPlayer - Component unmounting or videoUrl changing');
    };
  }, [videoUrl, hasValidUrl, isVimeoUrl, isFirstWatch]);

  // Effect to handle onComplete for Vimeo videos and apply CSS to disable seeking
  useEffect(() => {
    if (isVimeoUrl) {
      console.log('VideoPlayer - Setting up Vimeo message listener for progress tracking');
      
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
            `;
            
            // Wait for iframe to load and inject the style
            const injectStyles = () => {
              try {
                if (iframe.contentDocument && iframe.contentDocument.head) {
                  iframe.contentDocument.head.appendChild(styleEl);
                  console.log('VideoPlayer - Injected CSS to disable seekbar');
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
              console.log('VideoPlayer - Progress update:', percent.toFixed(1) + '%');
              setProgressPercent(percent);
              
              // Call onProgressUpdate callback if provided
              if (onProgressUpdate) {
                onProgressUpdate(percent);
              }
              
              // Check if we've reached completion threshold
              if (percent >= activityCompletionThreshold && !hasMarkedComplete) {
                console.log(`VideoPlayer - Vimeo video reached ${activityCompletionThreshold}%, calling onComplete`);
                if (onComplete) {
                  onComplete();
                  setHasMarkedComplete(true);
                }
              }
            }
          }

          // Only log important events to avoid console spam
          if (data.event !== 'playProgress') {
            console.log('VideoPlayer - Received message from Vimeo:', data);
          }

          // For first watch, prevent seeking ahead of the last watched point
          if (isFirstWatch && data.event === 'seeked' && iframeRef.current && data.data) {
            const seekedTo = data.data.seconds || 0;
            
            // If user tried to seek ahead of what they've watched
            if (seekedTo > lastKnownTime + 2) { // Allow small buffer for seeking
              console.log(`VideoPlayer - Detected seek ahead during first watch (to ${seekedTo}, max allowed: ${lastKnownTime})`);
              
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
            console.log('VideoPlayer - Vimeo video ended, calling onComplete');
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
    }
  }, [isVimeoUrl, onComplete, activityCompletionThreshold, hasMarkedComplete, isVideoLoaded, onProgressUpdate, isFirstWatch, lastKnownTime]);

  // Handle time update for regular videos
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration > 0) {
      // Set current time for display
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);

      // Update last known time for seek protection
      if (currentTime > lastKnownTime) {
        setLastKnownTime(currentTime);
      }

      // Calculate and update progress percentage
      const calculatedProgress = (currentTime / videoRef.current.duration) * 100;
      console.log('VideoPlayer - Progress update:', calculatedProgress.toFixed(1) + '%');
      setProgressPercent(calculatedProgress);
      
      // Call onProgressUpdate callback if provided
      if (onProgressUpdate) {
        onProgressUpdate(calculatedProgress);
      }
      
      // Check if video has reached the completion threshold percentage
      if (calculatedProgress >= activityCompletionThreshold && !hasMarkedComplete) {
        console.log(`VideoPlayer - Regular video reached ${activityCompletionThreshold}%, calling onComplete`);
        if (onComplete) {
          onComplete();
          setHasMarkedComplete(true);
        }
      }
    }
  };

  // Toggle play/pause for regular videos
  const togglePlay = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          await videoRef.current.pause();
          setIsPlaying(false);
        } else {
          try {
            await videoRef.current.play();
            setIsPlaying(true);
          } catch (playError: unknown) {
            console.error('VideoPlayer - Error during play():', playError);
            // If autoplay is blocked, don't change the UI state
            if (playError instanceof Error && playError.name !== 'NotAllowedError') {
              setIsPlaying(false);
            }
          }
        }
      } catch (err) {
        console.error('VideoPlayer - Error in toggle play:', err);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      console.log('VideoPlayer - Video metadata loaded, duration:', videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    
    if (videoRef.current) {
      // If first watch, prevent seeking ahead of the last watched position
      if (isFirstWatch && seekTime > lastKnownTime + 2) { // Add small buffer
        console.log(`VideoPlayer - Preventing seek ahead during first watch (to ${seekTime}, max allowed: ${lastKnownTime})`);
        videoRef.current.currentTime = lastKnownTime;
        setCurrentTime(lastKnownTime);
        
        // Show a message to the user
        const videoContainer = videoRef.current.parentElement;
        if (videoContainer) {
          const seekBlockMessage = document.createElement('div');
          seekBlockMessage.className = 'absolute bottom-4 left-0 right-0 text-center';
          seekBlockMessage.innerHTML = `
            <div class="inline-block bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-full">
              You cannot skip ahead on first watch
            </div>
          `;
          
          videoContainer.appendChild(seekBlockMessage);
          setTimeout(() => {
            videoContainer.removeChild(seekBlockMessage);
          }, 3000);
        }
      } else {
        // Normal seeking
        videoRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Get video container classes based on size and device
  const getVideoContainerClasses = () => {
    if (isMobile) {
      return "relative w-full rounded-lg"; // Always full width on mobile
    }

    const baseClasses = "relative mx-auto rounded-2xl";

    switch (videoSize) {
      case 'small':
        return `${baseClasses} w-2/3`;
      case 'large':
        return `${baseClasses} w-full`;
      case 'medium':
      default:
        return `${baseClasses} w-5/6`;
    }
  };

  // Render placeholder when no valid URL is available
  if (!hasValidUrl) {
    return (
      <div className={getVideoContainerClasses()}>
        <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-white">
          <div className="text-center p-4">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-semibold">{title || 'Video Unavailable'}</p>
            <p className="text-sm text-gray-400 mt-1">The video URL is missing or invalid</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Video element with container */}
      <div className={getVideoContainerClasses()}>
        {isVimeoUrl ? (
          // Vimeo Iframe for Vimeo videos
          <div className="w-full aspect-video bg-black">
            <iframe
              ref={iframeRef}
              src={getProcessedVimeoUrl()}
              className="w-full h-full border-0"
              width="100%"
              height="100%"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={title}
              onLoad={handleIframeLoad}
            ></iframe>
            
            {/* Progress indicator for Vimeo videos - positioned in top-right corner */}
            <div className="absolute top-3 right-3 z-10">
              <CircularProgress 
                progress={progressPercent} 
                isComplete={hasMarkedComplete || progressPercent >= 100} 
              />
            </div>
          </div>
        ) : (
          // Regular video element for direct video files
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full bg-black aspect-video"
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              controls={false}
              playsInline
              preload="metadata"
              onLoadedData={handleVideoLoad}
            />
            
            {/* Progress indicator for regular videos - positioned in top-right corner */}
            <div className="absolute top-3 right-3 z-10">
              <CircularProgress 
                progress={progressPercent} 
                isComplete={hasMarkedComplete || progressPercent >= 100} 
              />
            </div>
          </div>
        )}
      </div>

      {!isVideoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Video Controls - Only show for non-Vimeo videos */}
      {!isVimeoUrl && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 md:p-4 rounded-lg md:rounded-3xl">
          {/* Seek Bar - Only show for returning viewers */}
          {!isFirstWatch && (
            <div className="mb-1 md:mb-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-400 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          <div className="flex justify-between items-center">
            {/* Left Controls */}
            <div className="flex space-x-2 md:space-x-4 items-center">
              {/* Play/Pause Button */}
              <button
                className="text-white cursor-pointer"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>

              {/* Volume Control - hidden on mobile */}
              {!isMobile && (
                <div className="relative">
                  <button
                    className="text-white cursor-pointer"
                    onClick={() => setShowVolumeControl(!showVolumeControl)}
                    onMouseEnter={() => setShowVolumeControl(true)}
                    onMouseLeave={() => setShowVolumeControl(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m12.728 0a9 9 0 010-12.728" />
                    </svg>
                  </button>

                  {showVolumeControl && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 rounded-md" onMouseEnter={() => setShowVolumeControl(true)} onMouseLeave={() => setShowVolumeControl(false)}>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-gray-400 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Time Display */}
              <div className="text-white text-xs md:text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Center - Title - Hidden on mobile */}
            {!isMobile && (
              <div className="text-white text-sm flex-1 text-center truncate mx-2">
                {title}
              </div>
            )}

            {/* Right Controls */}
            <div className="flex space-x-2 md:space-x-4 items-center">
              {/* Video Size Controls - Hidden on mobile */}
              {!isMobile && (
                <div className="flex space-x-1 mr-2">
                  <button
                    onClick={() => setVideoSize('small')}
                    className={`text-xs px-2 py-1 rounded-md cursor-pointer ${videoSize === 'small'
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-gray-700'
                      }`}
                  >
                    S
                  </button>
                  <button
                    onClick={() => setVideoSize('medium')}
                    className={`text-xs px-2 py-1 rounded-md cursor-pointer ${videoSize === 'medium'
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-gray-700'
                      }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => setVideoSize('large')}
                    className={`text-xs px-2 py-1 rounded-md cursor-pointer ${videoSize === 'large'
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-gray-700'
                      }`}
                  >
                    L
                  </button>
                </div>
              )}

              {/* Download Button - Hidden on mobile */}
              {!isMobile && (
                <button className="text-white cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              )}

              {/* Fullscreen Button */}
              <button className="text-white cursor-pointer" onClick={() => videoRef.current?.requestFullscreen()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 