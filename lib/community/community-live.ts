import type { LiveSessionDto } from "@/lib/community/widget-types";

const LS_KEY = "ailinc_community_live_sessions_v1";

export type LocalLiveSession = {
  id: string;
  title: string;
  meet_url: string;
  starts_at: string;
  ends_at: string;
};

function readAll(): LocalLiveSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LocalLiveSession[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: LocalLiveSession[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

export function loadLocalLiveSessions(): LocalLiveSession[] {
  return readAll();
}

export function upsertLocalLiveSession(session: LocalLiveSession) {
  const all = readAll().filter((s) => s.id !== session.id);
  all.push(session);
  writeAll(all);
}

export function activeLocalLiveSessions(now = Date.now()): LocalLiveSession[] {
  return readAll().filter((s) => {
    const start = new Date(s.starts_at).getTime();
    const end = new Date(s.ends_at).getTime();
    return start <= now && now < end;
  });
}

export function dtoToPodShape(s: LiveSessionDto) {
  return {
    id: s.id,
    title: s.title,
    meet_url: s.meet_url,
    active_count: s.active_count ?? 8,
    imageSeed: String(s.id),
  };
}

export function localToPodShape(s: LocalLiveSession) {
  return {
    id: s.id,
    title: s.title,
    meet_url: s.meet_url,
    active_count: 6,
    imageSeed: s.id,
  };
}

/** Format a date as a Google Calendar template URL. Use UTC `Z` form. */
export function addToCalendarUrl(
  title: string,
  startsAt: string,
  endsAt: string,
  details?: string
): string | null {
  try {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/\.\d{3}/, "")
        .replace(/[-:]/g, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: details || "Community live session",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return null;
  }
}

/** Returns minutes until a session starts; negative when in the past. */
export function minutesUntilStart(startsAt?: string | null): number | null {
  if (!startsAt) return null;
  const t = new Date(startsAt).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.round((t - Date.now()) / 60000);
}

/** "Starting soon" window: the room becomes joinable 15 minutes early. */
export const ROOM_JOIN_EARLY_MINUTES = 15;
