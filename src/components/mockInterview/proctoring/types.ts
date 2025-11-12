// Types for proctoring events

export type ProctoringEventType =
  | "TAB_BLUR"
  | "TAB_FOCUS"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "SCREEN_SHARE_START"
  | "SCREEN_SHARE_STOP";

export interface ProctoringEvent {
  type: ProctoringEventType;
  timestamp: number; // Unix ms
  details?: Record<string, any>;
}

export interface ProctoringContextType {
  eventLog: ProctoringEvent[];
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  getEventLog: () => ProctoringEvent[];
  clearProctoringEvents: () => void;
  isScreenSharing: boolean;
}
