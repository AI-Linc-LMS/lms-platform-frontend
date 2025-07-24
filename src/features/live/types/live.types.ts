export interface Trainer {
  name: string;
  avatar: string;
  bio: string;
  linkedIn?: string;
}

export interface UpcomingSession {
  id: number;
  title: string;
  description: string;
  trainer: Trainer;
  scheduledTime: string;
  duration: number;
  zoomLink: string;
  isLive?: boolean;
}

export interface Recording {
  id: number;
  title: string;
  description: string;
  trainer: Trainer;
  recordedDate: string;
  duration: number;
  views: number;
  zoomRecordingLink: string;
  category: string;
} 