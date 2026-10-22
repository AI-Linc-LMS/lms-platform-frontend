export * from "./types";
export { studentLiveSessionsService } from "./student-live-sessions.service";
// The lean student surfaces' row shapes. They are NOT StudentLiveSession: each endpoint
// carries only the fields its own page renders, which is the whole reason they are separate.
export type {
  JoinNowSession,
  JoinNowPayload,
  UpcomingSession,
  UpcomingPayload,
  RecordingSession,
  RecordingsPayload,
} from "./student-live-sessions.service";
export { nextSitting, type NextSitting } from "./next-sitting";
