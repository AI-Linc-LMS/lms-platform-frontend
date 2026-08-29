/**
 * The shape of camera monitoring, kept apart from the thing that implements it.
 *
 * `CameraMonitor` drags in TensorFlow and BlazeFace through the proctoring service, which is
 * a static import chain of roughly 180kB. The room and the preflight need to talk ABOUT
 * monitoring on every render without paying for it, so the vocabulary lives here and the
 * implementation is loaded on demand.
 */

export type MonitoringState = "off" | "starting" | "watching" | "unavailable";

export interface MonitorSnapshot {
  state: MonitoringState;
  /** What to tell the candidate. Never accusatory: nothing here blocks or penalises them. */
  detail: string;
  /**
   * Whether monitoring has genuinely run at any point.
   *
   * This is the fact worth recording on the attempt, and it is not the same question as what
   * the camera saw. "Nothing was watching" and "something watched and saw nothing wrong" look
   * identical in a report that only stores violations, and they mean opposite things.
   */
  ran: boolean;
}

export const MONITOR_OFF: MonitorSnapshot = {
  state: "off",
  detail: "",
  ran: false,
};
