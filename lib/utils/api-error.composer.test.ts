import { describe, expect, it } from "vitest";

import { getAxiosErrorDetail } from "./api-error";

/**
 * "Request failed with status code 400" is not an error message, it is the absence of one.
 *
 * Reported as "[Instructor] AI Assessment Composer shows 'Request failed with status code 400'".
 * That exact string is what axios puts on `Error.message`, and three call sites in the composer
 * read `e.message` instead of the body the server sent. Every 400 the composer can return carries
 * a written explanation in `data.error` - "Pick the batch this assessment is for", "Unknown company
 * or round. Refresh the company list and try again", "Give the assessment a topic" - and all three
 * were being thrown away in favour of the status code.
 *
 * The same mistake reached an admin once before, on certificate templates, which is why
 * getAxiosErrorDetail exists. These pin the composer's own payloads to it.
 */

/** What axios actually throws: a real message, with the useful part on `response.data`. */
function axios400(body: unknown) {
  const err = new Error("Request failed with status code 400");
  return Object.assign(err, { response: { status: 400, data: body } });
}

describe("what the composer shows when the server refuses", () => {
  it("shows the batch guard's instruction, not the status code", () => {
    const shown = getAxiosErrorDetail(
      axios400({ error: "Pick the batch this assessment is for." }),
      "Failed to start the composer",
    );
    expect(shown).toBe("Pick the batch this assessment is for.");
    expect(shown).not.toContain("status code");
  });

  it("shows the company-catalogue message", () => {
    expect(
      getAxiosErrorDetail(
        axios400({ error: "Unknown company or round. Refresh the company list and try again." }),
        "Couldn't start the company prep",
      ),
    ).toContain("Refresh the company list");
  });

  it("shows a DRF detail as readily as an error", () => {
    expect(getAxiosErrorDetail(axios400({ detail: "Not found." }), "fallback")).toBe("Not found.");
  });

  it("falls back to our own words when the server sent nothing usable", () => {
    expect(getAxiosErrorDetail(axios400({}), "Failed to publish")).toBe("Failed to publish");
  });

  it("never surfaces the raw axios string, even with no response at all", () => {
    // A network drop. "Request failed with status code 400" is still on `.message`, and a reader
    // that reaches for it would print that for an error that has no status code at all.
    const shown = getAxiosErrorDetail(new Error("Request failed with status code 400"), "Failed to publish");
    expect(shown).toBe("Failed to publish");
  });

  it("joins a list of messages rather than printing an array", () => {
    expect(
      getAxiosErrorDetail(axios400({ error: ["Pick a batch", "Give it a topic"] }), "fallback"),
    ).toBe("Pick a batch. Give it a topic");
  });
});
