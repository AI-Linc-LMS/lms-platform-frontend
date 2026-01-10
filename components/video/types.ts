export interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onComplete?: () => void;
  isFirstWatch?: boolean;
  activityCompletionThreshold?: number;
  onProgressUpdate?: (progress: number) => void;
  onVideoLoad?: () => void;
  videoId?: string | number;
  onSaveProgress?: (id: string | number, progress: number) => void;
}

export interface VimeoPlayerProps {
  videoUrl: string;
  title?: string;
  onComplete?: () => void;
  isFirstWatch?: boolean;
  activityCompletionThreshold?: number;
  onProgressUpdate?: (progress: number) => void;
  onVideoLoad?: () => void;
  seekDisabledMessage?: string;
  savedProgress?: number;
  videoId?: string | number;
  onSaveProgress?: (id: string | number, progress: number) => void;
}

export interface StandardPlayerProps extends VimeoPlayerProps {
  videoSize?: "small" | "medium" | "large";
  setVideoSize?: (size: "small" | "medium" | "large") => void;
  isMobile?: boolean;
}

