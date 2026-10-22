import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClientDefault from "../api";
import { studentLiveSessionsService } from "./student-live-sessions.service";

/**
 * `getRecordings` is the only call the archive page makes, so its query string IS the page's
 * cost. What is pinned: a filter that is not set does not travel (the server treats absence as
 * "no filter", and a stray `has_notes=0` would be a filter the server has no negative form for),
 * flags go as "1", and rows from a backend that predates the new fields still arrive in one shape.
 */

vi.mock("../api", () => {
  const get = vi.fn();
  return { default: { get, post: vi.fn(), put: vi.fn(), delete: vi.fn() }, apiClient: { get } };
});

const get = (apiClientDefault as unknown as { get: ReturnType<typeof vi.fn> }).get;

const empty = { sessions: [], count: 0, limit: 20, offset: 0, has_more: false };

beforeEach(() => {
  get.mockReset();
});

describe("getRecordings", () => {
  it("sends only the filters that are set and sends flags as 1", async () => {
    get.mockResolvedValueOnce({ data: empty });
    await studentLiveSessionsService.getRecordings({
      limit: 20,
      offset: 0,
      q: "  python ",
      course: 9,
      has_recording: true,
      has_notes: false,
      facets: true,
    });
    const [url, cfg] = get.mock.calls[0] as [string, { params: Record<string, unknown> }];
    expect(url).toMatch(/\/live-activities\/recordings\/$/);
    // No offset 0, no batch, no since, no has_notes: nothing the server would read as a filter.
    expect(cfg.params).toEqual({ limit: 20, q: "python", course: 9, has_recording: "1", facets: "1" });
  });

  it("sends nothing but the page size when no filter is set", async () => {
    get.mockResolvedValueOnce({ data: empty });
    await studentLiveSessionsService.getRecordings();
    const [, cfg] = get.mock.calls[0] as [string, { params: Record<string, unknown> }];
    expect(cfg.params).toEqual({ limit: 20 });
  });

  it("drops an empty search and a non-numeric id rather than sending junk", async () => {
    get.mockResolvedValueOnce({ data: empty });
    await studentLiveSessionsService.getRecordings({
      q: "   ",
      course: Number("abc"),
      batch: 4,
      since: "2026-10-01",
      offset: 40,
      has_notes: true,
    });
    const [, cfg] = get.mock.calls[0] as [string, { params: Record<string, unknown> }];
    expect(cfg.params).toEqual({ limit: 20, offset: 40, batch: 4, since: "2026-10-01", has_notes: "1" });
  });

  it("normalises rows from a backend that predates the preview and the ids", async () => {
    get.mockResolvedValueOnce({
      data: {
        ...empty,
        count: 1,
        sessions: [{ occurrence_id: 1, session_id: 2, title: "Old row", has_summary: false }],
      },
    });
    const out = await studentLiveSessionsService.getRecordings();
    expect(out.sessions[0]).toMatchObject({ course_id: null, batch_id: null, notes_preview: null });
    expect(out.count).toBe(1);
    expect("facets" in out).toBe(false);
    expect("filters" in out).toBe(false);
  });

  it("carries the facets and the applied filters through when the server sends them", async () => {
    const facets = {
      courses: [{ id: 9, title: "Data Structures", count: 4 }],
      batches: [],
      totals: { all: 4, recordings: 3, notes: 2 },
    };
    const filters = {
      q: "python",
      course: null,
      batch: null,
      has_recording: true,
      has_notes: false,
      since: null,
      until: null,
    };
    get.mockResolvedValueOnce({ data: { ...empty, facets, filters } });
    const out = await studentLiveSessionsService.getRecordings({ q: "python", facets: true });
    expect(out.facets).toEqual(facets);
    // The echo is how a page can tell junk was dropped rather than the list silently widened.
    expect(out.filters).toEqual(filters);
  });
});
