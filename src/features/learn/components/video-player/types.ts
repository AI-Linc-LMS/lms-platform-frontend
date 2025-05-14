// VideoPlayer props interface
export interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onComplete?: () => void;
  isFirstWatch?: boolean;
  activityCompletionThreshold?: number;
  onProgressUpdate?: (progress: number) => void;
}

// Internal component props
export interface StandardPlayerProps extends VideoPlayerProps {
  onVideoLoad: () => void;
  videoSize: 'small' | 'medium' | 'large';
  setVideoSize: (size: 'small' | 'medium' | 'large') => void;
  isMobile: boolean;
  seekDisabledMessage?: string;
}

export interface VimeoPlayerProps extends VideoPlayerProps {
  onVideoLoad: () => void;
  seekDisabledMessage?: string;
}

export interface CircularProgressProps {
  progress: number;
  isComplete: boolean;
} 