import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getAxiosErrorDetail, getAxiosFormError } from "./api-error";

/**
 * Reported as: creating a certificate template shows "Request failed with status code 400" and
 * the template is not created.
 *
 * Reproduced against prod (Demo Client, client 34). The server was never vague:
 *
 *   POST /certificates/api/admin/clients/34/templates/  {kind: "upload", ...}
 *   400 {"asset":["An upload template needs a background image. Upload one at
 *        templates/upload-asset/ and send the returned key."]}
 *
 * DRF answers a rejected FIELD with a field-keyed object — no `detail`, no `error`, no `message`
 * — so every reader in the certificates admin fell through to `err.message`, which is Axios's
 * own "Request failed with status code 400". The reason was in the response the whole time.
 */
const axiosErr = (data: unknown) => ({ response: { data }, message: "Request failed with status code 400" });

describe("a field-keyed DRF error reaches the user", () => {
  it("surfaces the field message that the plain reader drops", () => {
    const err = axiosErr({ asset: ["An upload template needs a background image."] });
    // The pre-existing reader cannot see it — this is the gap, stated as a test.
    expect(getAxiosErrorDetail(err, "fallback")).toBe("fallback");
    expect(getAxiosFormError(err, "fallback"))
      .toBe("asset: An upload template needs a background image.");
  });

  it("handles the preset rejection the same way", () => {
    const err = axiosErr({ preset: ['"classic-navy" is not a known preset. Allowed: brand-classic.'] });
    expect(getAxiosFormError(err, "fallback"))
      .toBe('preset: "classic-navy" is not a known preset. Allowed: brand-classic.');
  });

  it("does not prefix non_field_errors, which names nothing to look at", () => {
    const err = axiosErr({ non_field_errors: ["Two defaults for one slot."] });
    expect(getAxiosFormError(err, "fallback")).toBe("Two defaults for one slot.");
  });

  it("still prefers detail / error / message when present", () => {
    expect(getAxiosFormError(axiosErr({ detail: "Not allowed." }), "fb")).toBe("Not allowed.");
    expect(getAxiosFormError(axiosErr({ error: "Nope." }), "fb")).toBe("Nope.");
    expect(getAxiosFormError(axiosErr({ message: "Bad." }), "fb")).toBe("Bad.");
  });

  it("joins several messages for one field", () => {
    const err = axiosErr({ seal_code: ["Too long.", "Letters only."] });
    expect(getAxiosFormError(err, "fb")).toBe("seal_code: Too long. Letters only.");
  });

  it("falls back when there is nothing usable", () => {
    expect(getAxiosFormError(axiosErr({}), "fb")).toBe("fb");
    expect(getAxiosFormError(axiosErr({ asset: [] }), "fb")).toBe("fb");
    expect(getAxiosFormError(new Error("boom"), "fb")).toBe("fb");
    expect(getAxiosFormError(undefined, "fb")).toBe("fb");
  });

  it("never returns Axios's own generic string", () => {
    // The exact string this whole change exists to stop showing an admin.
    const err = axiosErr({ asset: ["Needs a background."] });
    expect(getAxiosFormError(err, "fb")).not.toContain("Request failed with status code");
  });
});

describe("the certificates admin no longer shows the generic message", () => {
  const FILES = [
    "components/admin/certificates/TemplateEditorDialog.tsx",
    "components/admin/certificates/TemplatesTab.tsx",
    "components/admin/certificates/IssuedTab.tsx",
    "components/admin/certificates/PointsLadderTab.tsx",
  ];

  it.each(FILES)("%s reads the server's words, not err.message", (f) => {
    const src = readFileSync(join(process.cwd(), f), "utf8");
    expect(src, `${f} still falls back to Axios's generic string`)
      .not.toContain("? err.message");
    expect(src).toContain("getAxiosFormError");
  });
});
