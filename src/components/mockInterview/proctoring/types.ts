// Types for proctoring events

export type ProctoringEventType =
  | "TAB_BLUR"
  | "TAB_FOCUS"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS";

export interface ProctoringEvent {
  type: ProctoringEventType;
  timestamp: number;
  details?: Record<string, any>;
}

export interface ProctoringContextType {
  eventLog: ProctoringEvent[];
  getEventLog: () => ProctoringEvent[];
  clearProctoringEvents: () => void;
}

