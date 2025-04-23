import React, { useState, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [videoSize, setVideoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Check if video is complete (allowing for small rounding errors)
      if (videoRef.current.currentTime >= videoRef.current.duration - 0.5) {
        if (onComplete) {
          onComplete();
        }
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
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
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

  // Get video container classes based on size
  const getVideoContainerClasses = () => {
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

  return (
    <div className="relative">
      {/* Video element with container */}
      <div className={getVideoContainerClasses()}>
        <video
          ref={videoRef}
          className="w-full bg-black aspect-video"
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
        />
      </div>

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 rounded-3xl">
        {/* Seek Bar */}
        <div className="mb-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-400 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex justify-between items-center">
          {/* Left Controls */}
          <div className="flex space-x-4 items-center">
            {/* Play/Pause Button */}
            <button className="text-white cursor-pointer" onClick={togglePlay}>
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            {/* Volume Control */}
            <div className="relative">
              <button 
                className="text-white cursor-pointer" 
                onClick={() => setShowVolumeControl(!showVolumeControl)}
                onMouseEnter={() => setShowVolumeControl(true)}
                onMouseLeave={() => setShowVolumeControl(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
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

            {/* Time Display */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Center - Title */}
          <div className="text-white text-sm flex-1 text-center truncate">
            {title}
          </div>

          {/* Right Controls */}
          <div className="flex space-x-4 items-center">
            {/* Video Size Controls */}
            <div className="flex space-x-1 mr-2">
              <button 
                onClick={() => setVideoSize('small')} 
                className={`text-xs px-2 py-1 rounded-md cursor-pointer ${
                  videoSize === 'small' 
                    ? 'bg-white text-black' 
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                S
              </button>
              <button 
                onClick={() => setVideoSize('medium')} 
                className={`text-xs px-2 py-1 rounded-md cursor-pointer ${
                  videoSize === 'medium' 
                    ? 'bg-white text-black' 
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                M
              </button>
              <button 
                onClick={() => setVideoSize('large')} 
                className={`text-xs px-2 py-1 rounded-md cursor-pointer ${
                  videoSize === 'large' 
                    ? 'bg-white text-black' 
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                L
              </button>
            </div>
            
            {/* Download Button */}
            <button className="text-white cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
            {/* Fullscreen Button */}
            <button className="text-white cursor-pointer" onClick={() => videoRef.current?.requestFullscreen()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer; 