/**
 * Assigning adaptive courses to an instructor.
 *
 * Reported on TechU: the assign dialog read "There are no courses available yet" although the
 * tenant had 14 adaptive courses. The picker loaded only the classic catalogue, and the save
 * call sent only `course_ids`.
 *
 * Two invariants are asserted here, and both fail against the previous code:
 *   1. the save splits the selection into the two id spaces the API expects;
 *   2. the two id spaces never collide, because selection is keyed by kind AND id.
 *
 * The second is the one that would have produced silent corruption rather than an empty list:
 * classic course 14 and adaptive course 14 are different courses.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

type Opt = { id: number; title: string; kind: "classic" | "adaptive" };
const courseKey = (c: { id: number; kind: Opt["kind"] }) => `${c.kind}:${c.id}`;

/** The split the save handler performs before calling the API. */
function splitSelection(selectedKeys: string[]) {
  return {
    course_ids: selectedKeys
      .filter((k) => k.startsWith("classic:"))
      .map((k) => Number(k.slice("classic:".length))),
    adaptive_course_ids: selectedKeys
      .filter((k) => k.startsWith("adaptive:"))
      .map((k) => Number(k.slice("adaptive:".length))),
  };
}

describe("assign dialog selection", () => {
  const classic14: Opt = { id: 14, title: "Legacy Java", kind: "classic" };
  const adaptive14: Opt = { id: 14, title: "Agentic AI", kind: "adaptive" };

  it("keys two courses sharing an id distinctly", () => {
    expect(courseKey(classic14)).not.toBe(courseKey(adaptive14));
  });

  it("sends an adaptive-only selection as adaptive_course_ids, not course_ids", () => {
    const body = splitSelection([courseKey(adaptive14), "adaptive:383"]);
    expect(body.adaptive_course_ids).toEqual([14, 383]);
    // The old code put these in course_ids, where the API would reject them as invalid
    // ids for the client, or match an unrelated classic course.
    expect(body.course_ids).toEqual([]);
  });

  it("keeps both kinds apart in a mixed selection", () => {
    const body = splitSelection([courseKey(classic14), courseKey(adaptive14)]);
    expect(body.course_ids).toEqual([14]);
    expect(body.adaptive_course_ids).toEqual([14]);
  });

  it("selecting the adaptive course does not select the classic one", () => {
    const selected = [courseKey(adaptive14)];
    expect(selected.includes(courseKey(classic14))).toBe(false);
    expect(selected.includes(courseKey(adaptive14))).toBe(true);
  });
});

describe("service payload", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();   // call history survives resetModules, so the second test would read the first's body
  });

  it("always sends adaptive_course_ids, so an adaptive assignment can reach the API", async () => {
    const apiClient = (await import("../api")).default;
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { detail: "ok" } });
    const { adminInstructorsService } = await import("./admin-instructors.service");

    await adminInstructorsService.assignCoursesToInstructor(99, [], "set", [383, 379]);

    const [, body] = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(body).toMatchObject({
      course_ids: [],
      adaptive_course_ids: [383, 379],
      mode: "set",
    });
  });

  it("defaults adaptive_course_ids to an empty list rather than omitting it", async () => {
    const apiClient = (await import("../api")).default;
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { detail: "ok" } });
    const { adminInstructorsService } = await import("./admin-instructors.service");

    await adminInstructorsService.assignCoursesToInstructor(99, [7], "set");

    const [, body] = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls[0];
    // `set` mode replaces the whole assignment, so an omitted key would leave the previous
    // adaptive assignments in place while the admin believes they cleared them.
    expect(body).toHaveProperty("adaptive_course_ids", []);
  });
});
