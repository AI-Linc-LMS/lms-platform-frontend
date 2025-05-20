import  { useState, useCallback, useEffect } from 'react';
import { VideoPlayerProps } from './types';
import { isVimeoUrl } from './utils/formatters';
import { StandardPlayer } from './components/StandardPlayer';
import { VimeoPlayer } from './components/VimeoPlayer';

// Constants for localStorage
const STORAGE_PREFIX = 'video_progress_';
const STORAGE_VERSION = 'v1';

export function VideoPlayer({
  videoUrl,
  title,
  onComplete,
  isFirstWatch = false,
  activityCompletionThreshold = 95,
  onProgressUpdate,
  videoId,
  onSaveProgress
}: VideoPlayerProps) {
  // State for video size (small/medium/large)
  const [videoSize, setVideoSize] = useState<'small' | 'medium' | 'large'>('medium');
  // Loading state for the video player
  const [isLoading, setIsLoading] = useState(true);
  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  // Saved progress from API or localStorage
  const [savedProgress, setSavedProgress] = useState(0);
  // Flag to ensure progress is loaded before video starts
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);
  // Video fingerprint - more reliable than just videoId
  const [videoFingerprint, setVideoFingerprint] = useState<string>('');

  useEffect(() => {
    setSavedProgress(0);
  }, [videoUrl, videoId]);
  // Generate a stable identifier for the video that will work across sessions
  useEffect(() => {
    // Create a fingerprint based on videoId and URL
    // This ensures we can find the video even if videoId changes
    // between refreshes or after login/logout
    if (videoUrl && videoId) {
      // Extract unique parts from the URL
      const urlParts = videoUrl.split('/');
      const lastUrlPart = urlParts[urlParts.length - 1];
      
      // Create fingerprint with both videoId and URL parts
      // for maximum reliability
      const fingerprint = `${videoId}_${lastUrlPart}`;
      console.log('Generated video fingerprint:', fingerprint);
      setVideoFingerprint(fingerprint);
    } else if (videoUrl) {
      // Fallback to just URL-based fingerprint if no videoId
      const urlParts = videoUrl.split('/');
      const lastUrlPart = urlParts[urlParts.length - 1];
      console.log('Generated URL-only fingerprint:', lastUrlPart);
      setVideoFingerprint(lastUrlPart);
    }
  }, [videoUrl, videoId]);

  // Get localStorage key for this video - format to ensure consistency across sessions
  const getStorageKey = useCallback((id: string) => {
    return `${STORAGE_PREFIX}${STORAGE_VERSION}_${id}`;
  }, []);

  // First-time viewer notice message - centralized for consistency
  const getSeekDisabledMessage = useCallback(() => {
    return "You cannot skip ahead on first viewing";
  }, []);

  // Detect mobile on component mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Effect to load saved progress from localStorage or API
  useEffect(() => {
    const loadSavedProgress = async () => {
      setSavedProgress(0);
      // Require a valid fingerprint to continue
      if (!videoFingerprint) {
        console.log('No video fingerprint available yet, waiting...');
        return;
      }
      
      try {
        console.log(`Loading progress for video fingerprint: ${videoFingerprint}`);
        
        // Check localStorage with our versioned key
        const storageKey = getStorageKey(videoFingerprint);
        const localProgress = localStorage.getItem(storageKey);
        
        console.log('storageKey', storageKey);
        console.log('localProgress', localProgress);
        console.log(`Found progress in localStorage (${storageKey}):`, localProgress);
        
        if (localProgress) {
          const parsedProgress = parseFloat(localProgress);
          if (!isNaN(parsedProgress) && parsedProgress > 0) {
            console.log(`Setting saved progress to: ${parsedProgress.toFixed(1)}%`);
            setSavedProgress(parsedProgress);
          }
        } else {
          // For backward compatibility, try with videoId directly
          console.log('videoId:', videoId);
          if (videoId) {
            // Check legacy format based on just videoId
            const legacyKey = getStorageKey(videoId);
            const legacyProgress = localStorage.getItem(legacyKey);
            console.log('legacyKey', legacyKey);
            console.log('legacyProgress', legacyProgress);
            
            if (legacyProgress) {
              const parsedProgress = parseFloat(legacyProgress);
              if (!isNaN(parsedProgress) && parsedProgress > 0) {
                console.log(`Using legacy storage key, found progress: ${parsedProgress.toFixed(1)}%`);
                setSavedProgress(parsedProgress);
                
                // Migrate to new format
                localStorage.setItem(storageKey, legacyProgress);
              }
            }
            
            // Also check even older format
            const oldFormatKey = `video-progress-${videoId}`;
            const oldFormatProgress = localStorage.getItem(oldFormatKey);
            
            if (oldFormatProgress) {
              const parsedProgress = parseFloat(oldFormatProgress);
              if (!isNaN(parsedProgress) && parsedProgress > 0) {
                console.log(`Using old format storage key, found progress: ${parsedProgress.toFixed(1)}%`);
                setSavedProgress(parsedProgress);
                
                // Migrate to new format
                localStorage.setItem(storageKey, oldFormatProgress);
                localStorage.removeItem(oldFormatKey);
              }
            }
          }
        }
        
        // If no local progress, could check API here
        // Example API call:
        // const response = await fetch(`/api/video-progress/${videoId}`);
        // if (response.ok) {
        //   const data = await response.json();
        //   if (data.progress && !isNaN(data.progress)) {
        //     setSavedProgress(data.progress);
        //   }
        // }
      } catch (error) {
        console.error('Error loading video progress:', error);
      } finally {
        // Mark progress as loaded, regardless of result
        setIsProgressLoaded(true);
      }
    };
    
    if (videoFingerprint) {
      loadSavedProgress();
    } else {
      // If no fingerprint yet, wait for it but don't block video forever
      const timeout = setTimeout(() => {
        setIsProgressLoaded(true);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [videoFingerprint, videoId, getStorageKey]);

  // Handler to save progress
  const handleSaveProgress = useCallback((id: string, progress: number) => {
    try {
      if (!videoFingerprint || progress <= 0) return;
      
      // Use fingerprint for storage
      const storageKey = getStorageKey(videoFingerprint);
      
      // Save to localStorage
      console.log(`Saving progress for ${id} (fingerprint: ${videoFingerprint}): ${progress.toFixed(1)}% using key ${storageKey}`);
      localStorage.setItem(storageKey, progress.toString());
      
      // For compatibility, also save with the provided ID if different from fingerprint
      if (id !== videoFingerprint) {
        const idStorageKey = getStorageKey(id);
        localStorage.setItem(idStorageKey, progress.toString());
      }
      
      // Also call the provided onSaveProgress prop if it exists
      if (onSaveProgress) {
        onSaveProgress(id, progress);
      }
    } catch (error) {
      console.error('Error saving video progress to localStorage:', error);
    }
  }, [onSaveProgress, getStorageKey, videoFingerprint]);

  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Apply size classes based on current videoSize
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-full md:max-w-4xl'
  };

  // Check if we have a valid URL
  const hasValidUrl = !!videoUrl && typeof videoUrl === 'string';
  const isVimeo = hasValidUrl && isVimeoUrl(videoUrl);

  // Save effective videoId (use fingerprint if available, fall back to videoId)
  const effectiveVideoId = videoFingerprint || videoId || 'unknown';

  // Render placeholder when no valid URL is available
  if (!hasValidUrl) {
    return (
      <div className={`${sizeClasses[videoSize]}`}>
        <div className="bg-gray-800 aspect-video flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-xl font-medium mb-2">{title || 'Video Placeholder'}</p>
            <p className="text-sm text-gray-400">No video URL provided</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while either video or progress is still loading
  const showLoading = isLoading || !isProgressLoaded;

  // If debugging is needed, add this somewhere in the JSX:
  // <div className="text-xs text-white bg-black bg-opacity-50 p-1 absolute bottom-0 left-0">
  //   ID: {effectiveVideoId.slice(0, 10)}... | Progress: {savedProgress.toFixed(1)}%
  // </div>

  return (
    <div className={`mx-auto ${sizeClasses[videoSize]}`}>
      {showLoading && (
        <div className="bg-gray-800 aspect-video flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      <div className={`${showLoading ? 'hidden' : 'block'}`}>
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