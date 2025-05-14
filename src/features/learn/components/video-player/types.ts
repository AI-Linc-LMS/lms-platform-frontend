// VideoPlayer props interface
export interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onComplete?: () => void;
  isFirstWatch?: boolean;
  activityCompletionThreshold?: number;
  onProgressUpdate?: (progress: number) => void;
  onSaveProgress?: (videoId: string, progress: number) => void;
  savedProgress?: number;
  videoId: string;
}

// Internal component props
export interface StandardPlayerProps extends Omit<VideoPlayerProps, 'videoId'> {
  videoUrl: string;
  title: string;
  onComplete?: () => void;
  isFirstWatch?: boolean;
  activityCompletionThreshold?: number;
  onProgressUpdate?: (progress: number) => void;
  onVideoLoad?: () => void;
  videoSize?: 'small' | 'medium' | 'large';
  setVideoSize?: (size: 'small' | 'medium' | 'large') => void;
  isMobile?: boolean;
  seekDisabledMessage?: string;
  savedProgress?: number;
  videoId: string;
  onSaveProgress?: (videoId: string, progress: number) => void;
}

export interface VimeoPlayerProps extends Omit<VideoPlayerProps, 'videoId'> {
  videoUrl: string;
  title: string;
  onComplete?: () => void;
  isFirstWatch?: boolean;
  activityCompletionThreshold?: number;
  onProgressUpdate?: (progress: number) => void;
  onVideoLoad?: () => void;
  seekDisabledMessage?: string;
  savedProgress?: number;
  videoId: string;
  onSaveProgress?: (videoId: string, progress: number) => void;
}

export interface CircularProgressProps {
  progress: number;
  isComplete: boolean;
} 