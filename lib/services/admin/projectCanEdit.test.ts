import { describe, expect, it } from "vitest";

import type { AdminProjectTemplate } from "./admin-projects.service";

/**
 * `can_edit` decides who is shown a Save button, and `undefined` is not `false`.
 *
 * Opening the project library to instructors meant the server started saying, per brief, whether
 * THIS caller may rewrite it - an admin owns every brief in the tenant, an instructor owns only
 * the ones their own batches own. The screen reads that answer.
 *
 * The trap is the rollout. The frontend fleet and the API deploy separately, and a backend that
 * predates the field simply omits it. Reading a missing field as "no" would take the library away
 * from the admins who have always had it, on every tenant site that updated first - a far worse
 * failure than an instructor briefly seeing a Save button that 403s.
 */

const brief = (canEdit: boolean | undefined): Pick<AdminProjectTemplate, "can_edit"> => ({
  can_edit: canEdit,
});

/** Exactly the expression the list and the editor use. */
const mayEdit = (p: Pick<AdminProjectTemplate, "can_edit">) => p.can_edit !== false;

describe("who the screen offers editing to", () => {
  it("offers it when the server says yes", () => {
    expect(mayEdit(brief(true))).toBe(true);
  });

  it("withholds it when the server says no", () => {
    expect(mayEdit(brief(false))).toBe(false);
  });

  it("offers it when the server did not say - an older backend", () => {
    expect(mayEdit(brief(undefined))).toBe(true);
  });

  it("offers it when the field is absent from the object entirely", () => {
    expect(mayEdit({} as Pick<AdminProjectTemplate, "can_edit">)).toBe(true);
  });
});
