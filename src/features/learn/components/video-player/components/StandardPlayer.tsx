import React, { useState, useRef, useEffect } from 'react';
import { StandardPlayerProps } from '../types';
import { CircularProgress } from './CircularProgress';
import { formatTime } from '../utils/formatters';

export const StandardPlayer: React.FC<StandardPlayerProps> = ({
  videoUrl,
  title,
  onComplete,
  isFirstWatch = false,
  activityCompletionThreshold = 95,
  onProgressUpdate,
  onVideoLoad,
  videoSize,
  setVideoSize,
  isMobile,
  seekDisabledMessage = "You cannot skip ahead on first watch"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastKnownTime, setLastKnownTime] = useState(0);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showSeekBlockMessage, setShowSeekBlockMessage] = useState(false);

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
      setProgressPercent(calculatedProgress);
      
      // Call onProgressUpdate callback if provided
      if (onProgressUpdate) {
        onProgressUpdate(calculatedProgress);
      }
      
      // Check if video has reached the completion threshold percentage
      if (calculatedProgress >= activityCompletionThreshold && !hasMarkedComplete) {
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
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    
    if (videoRef.current) {
      // If first watch, prevent seeking ahead of the last watched position
      if (isFirstWatch && seekTime > lastKnownTime + 2) { // Add small buffer
        videoRef.current.currentTime = lastKnownTime;
        setCurrentTime(lastKnownTime);
        
        // Show warning message
        setShowSeekBlockMessage(true);
        setTimeout(() => {
          setShowSeekBlockMessage(false);
        }, 3000);
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

  // Apply CSS overrides for first-time viewers
  useEffect(() => {
    if (isFirstWatch && progressContainerRef.current) {
      const container = progressContainerRef.current;
      
      // Add visual indicator for seek restriction
      const seekWarningEl = document.createElement('div');
      seekWarningEl.className = 'absolute top-0 left-0 w-full text-xs text-center';
      seekWarningEl.style.transform = 'translateY(-100%)';
      seekWarningEl.style.color = '#fff';
      seekWarningEl.style.backgroundColor = 'rgba(0,0,0,0.7)';
      seekWarningEl.style.padding = '2px 4px';
      seekWarningEl.style.borderRadius = '4px';
      seekWarningEl.style.fontSize = '10px';
      seekWarningEl.innerText = 'Seeking ahead disabled for first viewing';
      
      container.style.position = 'relative';
      container.appendChild(seekWarningEl);
      
      return () => {
        container.removeChild(seekWarningEl);
      };
    }
  }, [isFirstWatch]);

  // Reset state when videoUrl changes
  useEffect(() => {
    setProgressPercent(0);
    setHasMarkedComplete(false);
    setLastKnownTime(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [videoUrl]);

  // Effect to show "seek locked" message for first-time viewers on attempts to seek ahead
  useEffect(() => {
    if (isFirstWatch && progressContainerRef.current && showSeekBlockMessage) {
      const container = progressContainerRef.current;
      const seekWarningEl = document.createElement('div');
      seekWarningEl.className = 'absolute bottom-16 left-0 right-0 text-center z-30';
      seekWarningEl.innerHTML = `
        <div class="inline-block bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-full">
          ${seekDisabledMessage}
        </div>
      `;
      container.appendChild(seekWarningEl);
      
      return () => {
        container.removeChild(seekWarningEl);
      };
    }
  }, [isFirstWatch, showSeekBlockMessage, seekDisabledMessage]);

  return (
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
        onLoadedData={onVideoLoad}
      />
      
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
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 md:p-4 rounded-lg md:rounded-3xl">
        {/* Seek bar - custom styling for first-time viewers */}
        <div 
          ref={progressContainerRef}
          className={`mb-1 md:mb-2 ${isFirstWatch ? 'relative' : ''}`}
        >
          {/* Show the progress bar for both first-time and returning viewers */}
          <div className="relative w-full h-1 bg-gray-600 rounded-lg overflow-hidden">
            {/* Watched progress bar */}
            <div 
              className={`absolute top-0 left-0 h-full bg-white rounded-lg`}
              style={{ 
                width: `${Math.min(progressPercent, 100)}%`,
                transition: 'width 0.3s ease-out'
              }}
            ></div>
            
            {/* Interactive seek bar - only for returning viewers */}
            {!isFirstWatch && (
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Warning message when trying to seek ahead */}
        {showSeekBlockMessage && (
          <div className="absolute top-0 left-0 right-0 text-center" style={{ transform: 'translateY(-100%)' }}>
            <div className="inline-block bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-full">
              {seekDisabledMessage}
            </div>
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

            {/* Fullscreen Button */}
            <button className="text-white cursor-pointer" onClick={() => videoRef.current?.requestFullscreen()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 