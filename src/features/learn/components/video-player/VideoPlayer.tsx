import React from 'react';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';
import { VideoPlayerProps } from './types';
import { StandardPlayer } from './components/StandardPlayer';
import { VideoPlaceholder } from './components/VideoPlaceholder';
import { isVimeoUrl } from './utils/formatters';
import { VimeoPlayer } from './components/VimeoPlayer';

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  onComplete,
  isFirstWatch = false,
  activityCompletionThreshold = 95,
  onProgressUpdate
}) => {
  const [videoSize, setVideoSize] = React.useState<'small' | 'medium' | 'large'>('medium');
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Check for undefined videoUrl
  const hasValidUrl = !!videoUrl;

  // Check if it's a Vimeo URL
  const isVimeo = hasValidUrl && isVimeoUrl(videoUrl);

  // Handle video load event
  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  // Reset state when video URL changes
  React.useEffect(() => {
    setIsVideoLoaded(false);
  }, [videoUrl]);

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

  // First-time viewer notice message - centralized for consistency
  const getSeekDisabledMessage = () => {
    return "You cannot skip ahead on first watch";
  };

  // Render placeholder when no valid URL is available
  if (!hasValidUrl) {
    return (
      <div className={getVideoContainerClasses()}>
        <VideoPlaceholder title={title} />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Video element with container */}
      <div className={getVideoContainerClasses()}>
        {isVimeo ? (
          <VimeoPlayer
            videoUrl={videoUrl}
            title={title}
            onComplete={onComplete}
            isFirstWatch={isFirstWatch}
            activityCompletionThreshold={activityCompletionThreshold}
            onProgressUpdate={onProgressUpdate}
            onVideoLoad={handleVideoLoad}
            seekDisabledMessage={getSeekDisabledMessage()}
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
          />
        )}
      </div>

      {!isVideoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Video size controls - only for desktop and non-Vimeo videos */}
      {!isMobile && !isVimeo && (
        <div className="absolute top-3 left-3 z-10 flex space-x-1 bg-black bg-opacity-50 rounded-md p-1">
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
      )}
    </div>
  );
};

export default VideoPlayer; 