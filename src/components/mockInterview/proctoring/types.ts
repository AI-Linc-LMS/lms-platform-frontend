// Types for proctoring events

export type ProctoringEventType =
  | "TAB_BLUR"
  | "TAB_FOCUS"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "SCREEN_SHARE_START"
  | "SCREEN_SHARE_STOP"
  | "FACE_NOT_DETECTED_START"
  | "FACE_NOT_DETECTED_END"
  | "LOOKING_AWAY_START"
  | "LOOKING_AWAY_END"
  | "MULTIPLE_FACES_START"
  | "MULTIPLE_FACES_END";

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
  logEvent: (type: ProctoringEventType, details?: Record<string, any>) => void;
}
