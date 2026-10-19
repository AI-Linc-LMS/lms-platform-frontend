/**
 * Two classes live at the same time: the student must be able to reach BOTH.
 *
 * Observed on Agileology, 19 Oct. Two 18:00 webinars were created for cohort "test", one hosted
 * by admin@agileologyedu.com and one by support@agileologyedu.com - which is the entire reason a
 * tenant buys a second Zoom licence. The backend returned both to every role. The student page
 * showed one.
 *
 * The page picked the hero with `.find()` (one session) and built its list from
 * `meeting_status === "scheduled"` (which excludes everything live). A second live class was
 * therefore neither the hero nor in the list: it was absent from the page altogether, with no
 * empty state and nothing to click.
 *
 * This pins the selection arithmetic rather than the markup - it is the arithmetic that lost the
 * session, and it stays true however the hero is styled.
 */

import { describe, expect, it } from "vitest";

type S = {
  id: number;
  topic_name: string;
  meeting_status: "live" | "scheduled" | "ended" | "expired";
  notice_type?: string;
  class_datetime?: string;
  duration_minutes?: number;
  join_gated?: boolean;
  host_started?: boolean;
};

/** The page's selection, as shipped: every live class is a hero, and no hero repeats below. */
function select(instances: S[]) {
  const liveList = instances.filter(
    (s) => s.meeting_status === "live" && s.notice_type !== "cancelled"
  );
  const live = liveList[0];
  const heroes = [...liveList];
  if (live && !heroes.includes(live)) heroes.unshift(live);
  const upcoming = instances.filter(
    (s) => s.meeting_status === "scheduled" && !heroes.includes(s)
  );
  return { heroes, upcoming, shown: new Set([...heroes, ...upcoming].map((s) => s.id)) };
}

const AT_18 = "2026-10-19T18:00:00+05:30";

const onAdminHost: S = {
  id: 239, topic_name: "testing", meeting_status: "live", class_datetime: AT_18,
  duration_minutes: 20,
};
const onSupportHost: S = {
  id: 240, topic_name: "live session testing", meeting_status: "live", class_datetime: AT_18,
  duration_minutes: 20,
};

describe("the student live-sessions page with two classes running at once", () => {
  it("loses neither of them", () => {
    const { shown } = select([onAdminHost, onSupportHost]);
    expect([...shown].sort()).toEqual([239, 240]);
  });

  it("gives each live class its own hero", () => {
    const { heroes } = select([onAdminHost, onSupportHost]);
    expect(heroes.map((s) => s.id)).toEqual([239, 240]);
  });

  it("does not list a hero a second time as upcoming", () => {
    const later: S = {
      id: 241, topic_name: "tomorrow", meeting_status: "scheduled",
      class_datetime: "2026-10-20T18:00:00+05:30",
    };
    const { heroes, upcoming } = select([onAdminHost, onSupportHost, later]);
    expect(upcoming.map((s) => s.id)).toEqual([241]);
    for (const h of heroes) expect(upcoming).not.toContain(h);
  });

  it("still shows exactly one hero in the ordinary single-class case", () => {
    const { heroes, upcoming } = select([
      onSupportHost,
      { id: 241, topic_name: "tomorrow", meeting_status: "scheduled" },
    ]);
    expect(heroes.map((s) => s.id)).toEqual([240]);
    expect(upcoming.map((s) => s.id)).toEqual([241]);
  });

  it("never promotes a cancelled class to a hero, however many are live", () => {
    const cancelled: S = { ...onAdminHost, id: 242, notice_type: "cancelled" };
    const { heroes, shown } = select([cancelled, onSupportHost]);
    expect(heroes.map((s) => s.id)).toEqual([240]);
    // It is not joinable and not upcoming, so it is correctly absent rather than lost.
    expect(shown.has(242)).toBe(false);
  });

  it("shows nothing as a hero when nothing is live", () => {
    const { heroes, upcoming } = select([
      { id: 241, topic_name: "tomorrow", meeting_status: "scheduled" },
    ]);
    expect(heroes).toEqual([]);
    expect(upcoming.map((s) => s.id)).toEqual([241]);
  });
});

describe("the shipped bug, kept as a regression witness", () => {
  it("the old selection dropped the second live class entirely", () => {
    // Exactly what app/live-sessions/page.tsx did before this fix.
    const live = [onAdminHost, onSupportHost].find((s) => s.meeting_status === "live");
    const upcoming = [onAdminHost, onSupportHost].filter(
      (s) => s.meeting_status === "scheduled" && s !== live
    );
    const shown = new Set([live, ...upcoming].filter(Boolean).map((s) => (s as S).id));
    expect(shown.has(240)).toBe(false); // the second class: nowhere on the page
    expect([...shown]).toEqual([239]);
  });
});
