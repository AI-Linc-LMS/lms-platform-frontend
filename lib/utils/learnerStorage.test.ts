/**
 * The line: a learner's own data never sits in browser storage; the reason a save failed always
 * reaches them.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { purgeLearnerStorage, readStrandedProfile } from "./profile-cache";
import { readProfileSaveError } from "./profileSaveError";

function signIn(userId: number) {
  document.cookie = `access_token=h.${btoa(JSON.stringify({ user_id: userId }))}.s`;
}

describe("purgeLearnerStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signIn(42);
  });
  afterEach(() => window.localStorage.clear());

  it("sweeps every key any build wrote a learner's own data to, for every account", () => {
    window.localStorage.setItem("user_profile_extra_1", "{}");            // the original tenant-keyed blob
    window.localStorage.setItem("user_profile_extra_1_u42", "{}");        // this learner
    window.localStorage.setItem("user_profile_extra_1_u99", "{}");        // somebody else on this device
    window.localStorage.setItem("resumeData", "{}");                       // an old resume draft
    window.localStorage.setItem("resume_layout_v1_1", "{}");               // a tenant-wide resume arrangement
    window.localStorage.setItem("profile_visible_sections_1_u42", "[]");   // a per-viewer UI preference

    purgeLearnerStorage();

    expect(window.localStorage.getItem("user_profile_extra_1")).toBeNull();
    expect(window.localStorage.getItem("user_profile_extra_1_u42")).toBeNull();
    expect(window.localStorage.getItem("user_profile_extra_1_u99")).toBeNull();
    expect(window.localStorage.getItem("resumeData")).toBeNull();
    expect(window.localStorage.getItem("resume_layout_v1_1")).toBeNull();
    // Deliberately kept: which sections you show is a view preference, not your record, and it
    // is already scoped to one viewer. Logout clears it through the session, not through here.
    expect(window.localStorage.getItem("profile_visible_sections_1_u42")).toBe("[]");
  });

  it("reads only the signed-in learner's stranded copy, never anybody else's", () => {
    window.localStorage.setItem("user_profile_extra_1_u99", JSON.stringify({ city: "Someone else" }));
    expect(readStrandedProfile()).toBeNull();

    window.localStorage.setItem("user_profile_extra_1_u42", JSON.stringify({ city: "Pune" }));
    expect(readStrandedProfile()).toEqual({ city: "Pune" });
  });
});

describe("readProfileSaveError", () => {
  it("names the nested field a list section was refused for", () => {
    const err = {
      response: {
        data: {
          error: {
            experience: [{ start_date: ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."] }, {}],
          },
        },
      },
    };
    const { message, fields } = readProfileSaveError(err, "fallback");
    expect(message).toBe(
      "Experience - Start date: Date has wrong format. Use one of these formats instead: YYYY-MM-DD.",
    );
    // Keyed by the top-level name, because that is what a form knows its inputs by.
    expect(fields.experience).toContain("Date has wrong format");
  });

  it("reads a flat field error", () => {
    const err = { response: { data: { error: { portfolio_website_url: ["Enter a valid URL."] } } } };
    expect(readProfileSaveError(err, "fallback").message).toBe("Portfolio website url: Enter a valid URL.");
  });

  it("falls back only when the server said nothing usable", () => {
    expect(readProfileSaveError(new Error("Network Error"), "Could not reach the server").message).toBe(
      "Could not reach the server",
    );
  });

  it("does not put a label in front of a non-field error", () => {
    const err = { response: { data: { detail: "Authentication credentials were not provided." } } };
    expect(readProfileSaveError(err, "fallback").message).toBe("Authentication credentials were not provided.");
  });
});

describe("a failed save says WHICH kind of failure it was", () => {
  /**
   * A learner reported "Not saved: Could not reach the server" on a profile save. Every
   * server-side check came back healthy - CORS preflight 200, the endpoint answering 401 in
   * 180ms, the token refresh returning 401 not 500, her exact payload validating, and the
   * response builder taking 323ms. The message had sent the investigation at the network, and
   * the network was not the only thing it could mean.
   *
   * It is the FALLBACK, returned whenever no message can be parsed - which includes a 502 from
   * the load balancer or a 504, where the server answered and simply said nothing useful.
   */
  it("names the status when the server answered but explained nothing", () => {
    const err = { response: { status: 502, data: "" } };
    const out = readProfileSaveError(err, "Could not reach the server");
    expect(out.message).toContain("502");
    expect(out.message).not.toContain("Could not reach");
    expect(out.status).toBe(502);
  });

  it("says a timeout was a timeout", () => {
    const err = { code: "ECONNABORTED", message: "timeout of 45000ms exceeded" };
    const out = readProfileSaveError(err, "Could not reach the server");
    expect(out.message).toContain("timed out");
    expect(out.status).toBeNull();
  });

  it("still says 'could not reach' when nothing came back at all", () => {
    const out = readProfileSaveError(new Error("Network Error"), "Could not reach the server");
    expect(out.message).toBe("Could not reach the server");
    expect(out.status).toBeNull();
  });

  it("a real validation message still wins over any of this", () => {
    const err = { response: { status: 400, data: { error: { skills: ["This field is required."] } } } };
    const out = readProfileSaveError(err, "Could not reach the server");
    expect(out.message).toBe("Skills: This field is required.");
    expect(out.status).toBe(400);
  });
});
