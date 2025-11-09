import { useState, useEffect, useCallback } from 'react';

interface FullScreenHook {
  isFullScreen: boolean;
  isFullScreenSupported: boolean;
  enterFullScreen: () => Promise<void>;
  exitFullScreen: () => Promise<void>;
  toggleFullScreen: () => Promise<void>;
}

export const useFullScreen = (): FullScreenHook => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  // Check if full screen is supported
  useEffect(() => {
    const supported = !!(
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen
    );
    setIsFullScreenSupported(supported);
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      const fullScreenElement = 
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      
      setIsFullScreen(!!fullScreenElement);
    };

    // Add event listeners for different browsers
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const enterFullScreen = useCallback(async (): Promise<void> => {
    if (!isFullScreenSupported) {
      console.warn('Full screen is not supported by this browser');
      return;
    }

    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter full screen:', error);
      throw error;
    }
  }, [isFullScreenSupported]);

  const exitFullScreen = useCallback(async (): Promise<void> => {
    if (!isFullScreen) return;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit full screen:', error);
      throw error;
    }
  }, [isFullScreen]);

  const toggleFullScreen = useCallback(async (): Promise<void> => {
    if (isFullScreen) {
      await exitFullScreen();
    } else {
      await enterFullScreen();
    }
  }, [isFullScreen, enterFullScreen, exitFullScreen]);

  return {
    isFullScreen,
    isFullScreenSupported,
    enterFullScreen,
    exitFullScreen,
    toggleFullScreen
  };
};

