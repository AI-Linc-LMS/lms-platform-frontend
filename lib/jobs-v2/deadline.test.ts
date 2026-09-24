import { describe, expect, it } from "vitest";
import "@/lib/i18n";
import {
  calendarDaysUntil,
  closesWithinDays,
  deadlineLabel,
  formatDate,
} from "./format";

/**
 * A closing date is stored as the END of that day in the institution's zone:
 * 23:59:59.999999 on the date the admin picked. Everything that prints it or counts down to it
 * has to read that instant as the closing date itself.
 *
 * Elapsed-time rounding did not. On the morning before the closing date the deadline is ~40
 * hours away: `Math.ceil` called that 2 days and relative-time rounding printed "Closes in 2
 * days" for a role that closes tomorrow (and N days out read N+1 before noon).
 */

const IST = "Asia/Kolkata";
const RIYADH = "Asia/Riyadh";

/** The last moment of `date` at `offset`, the way the server stores a closing date. */
const endOf = (date: string, offset = "+05:30") => `${date}T23:59:59.999999${offset}`;
const at = (date: string, time: string, offset = "+05:30") => `${date}T${time}:00${offset}`;

describe("deadlineLabel counts calendar days to the closing date", () => {
  it("says 'Closes today' on the closing date, from the first hour to the last", () => {
    for (const time of ["00:30", "09:00", "23:00"]) {
      const label = deadlineLabel(endOf("2026-09-24"), { timeZone: IST, now: at("2026-09-24", time) });
      expect(label?.text).toBe("Closes today");
      expect(label?.daysLeft).toBe(0);
      expect(label?.urgency).toBe("urgent");
    }
  });

  it("says 'Closes tomorrow' the day before, at 09:00 and at 23:00", () => {
    for (const time of ["09:00", "23:00"]) {
      const label = deadlineLabel(endOf("2026-09-25"), { timeZone: IST, now: at("2026-09-24", time) });
      expect(label?.text).toBe("Closes tomorrow");
      expect(label?.daysLeft).toBe(1);
    }
  });

  it("says 'Closes in 3 days' all day, not 'in 4 days' before noon", () => {
    for (const time of ["09:00", "23:00"]) {
      const label = deadlineLabel(endOf("2026-09-27"), { timeZone: IST, now: at("2026-09-24", time) });
      expect(label?.text).toBe("Closes in 3 days");
      expect(label?.daysLeft).toBe(3);
      expect(label?.urgency).toBe("soon");
    }
  });

  it("prints the closing date itself beyond a week, never the next day", () => {
    const label = deadlineLabel(endOf("2026-10-05"), { timeZone: IST, now: at("2026-09-24", "09:00") });
    expect(label?.text).toBe("Closes Oct 5, 2026");
    expect(label?.urgency).toBe("none");
  });

  it("calls a closing date that has passed closed, on its own date", () => {
    const label = deadlineLabel(endOf("2026-09-23"), { timeZone: IST, now: at("2026-09-24", "09:00") });
    expect(label?.text).toBe("Closed Sep 23, 2026");
    expect(label?.urgency).toBe("past");
  });

  it("reads the date in the institution's zone for every viewer", () => {
    // The end of 24 Sep in Riyadh is 02:29 on 25 Sep in India.
    const riyadhClose = endOf("2026-09-24", "+03:00");
    const riyadhMorning = at("2026-09-24", "09:00", "+03:00");
    expect(deadlineLabel(riyadhClose, { timeZone: RIYADH, now: riyadhMorning })?.text).toBe(
      "Closes today",
    );
    expect(formatDate(riyadhClose, { timeZone: RIYADH })).toBe("Sep 24, 2026");
    // What an India-based admin read before: the next day.
    expect(formatDate(riyadhClose, { timeZone: IST })).toBe("Sep 25, 2026");
  });
});

describe("in the viewer's own zone (no institution zone known)", () => {
  // Built from local parts, so this holds on any machine: an instant at 23:59:59.999 LOCAL.
  const endOfLocal = (y: number, m: number, d: number) => new Date(y, m - 1, d, 23, 59, 59, 999);
  const localAt = (y: number, m: number, d: number, h: number) => new Date(y, m - 1, d, h, 0, 0, 0);

  it("reads the end of today as today, at 09:00 and at 23:00", () => {
    for (const hour of [9, 23]) {
      const label = deadlineLabel(endOfLocal(2026, 9, 24), { now: localAt(2026, 9, 24, hour) });
      expect(label?.text).toBe("Closes today");
    }
    expect(formatDate(endOfLocal(2026, 9, 24))).toBe("Sep 24, 2026");
  });

  it("reads the end of tomorrow as tomorrow, at 09:00 and at 23:00", () => {
    for (const hour of [9, 23]) {
      const label = deadlineLabel(endOfLocal(2026, 9, 25), { now: localAt(2026, 9, 24, hour) });
      expect(label?.text).toBe("Closes tomorrow");
    }
  });
});

describe("closesWithinDays: the board's 'Closing in N days'", () => {
  const morning = at("2026-09-24", "09:00");

  it("holds exactly the roles whose label reads 'Closes today' through 'Closes in 3 days'", () => {
    expect(closesWithinDays(endOf("2026-09-24"), 3, { timeZone: IST, now: morning })).toBe(true);
    // More than 72 hours away all day long: the old millisecond window never included it.
    expect(closesWithinDays(endOf("2026-09-27"), 3, { timeZone: IST, now: morning })).toBe(true);
    expect(closesWithinDays(endOf("2026-09-28"), 3, { timeZone: IST, now: morning })).toBe(false);
  });

  it("never counts a closed role as closing soon", () => {
    expect(closesWithinDays(endOf("2026-09-23"), 3, { timeZone: IST, now: morning })).toBe(false);
    expect(closesWithinDays(undefined, 3, { timeZone: IST, now: morning })).toBe(false);
  });
});

describe("calendarDaysUntil", () => {
  it("counts dates, not 24-hour blocks", () => {
    expect(calendarDaysUntil(endOf("2026-09-25"), { timeZone: IST, now: at("2026-09-24", "00:30") })).toBe(1);
    expect(calendarDaysUntil(endOf("2026-09-25"), { timeZone: IST, now: at("2026-09-24", "23:59") })).toBe(1);
  });
});
