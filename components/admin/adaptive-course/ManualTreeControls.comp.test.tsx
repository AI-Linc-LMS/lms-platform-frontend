import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The builder's "Add week" / "Add topic" row.
 *
 * #1843 taught it to accept a pasted list, but left the box one line tall, so the only thing
 * saying a list was allowed was a placeholder nobody reads to the end. An admin looked at it,
 * saw the same single-line field as before, and reported the feature as not deployed. The
 * affordance is the feature here: these tests pin the shape of the open row, not just the
 * parsing underneath it.
 */

const mocks = vi.hoisted(() => ({ showToast: vi.fn(), createModule: vi.fn() }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { createModule: mocks.createModule },
}));

import { AddModuleRow } from "./ManualTreeControls";

/** Renders the row and opens it, which is what clicking the ghost "Add week" does. */
function open() {
  const onAdded = vi.fn();
  render(<AddModuleRow courseId={455} onAdded={onAdded} />);
  fireEvent.click(screen.getByRole("button", { name: /add week/i }));
  return { onAdded, field: screen.getByPlaceholderText(/name this week/i) };
}

beforeEach(() => {
  mocks.showToast.mockReset();
  mocks.createModule.mockReset().mockResolvedValue(undefined);
});

describe("the builder's add row", () => {
  it("opens as a list-sized box, not a one-line field", () => {
    const { field } = open();
    // A single-line <input> is the bug being fixed: it tells the admin one title is all this
    // takes, whatever the placeholder says.
    expect(field.tagName).toBe("TEXTAREA");

    // How tall it opens cannot be asserted from the DOM here. MUI sizes a multiline field by
    // measuring a hidden twin's scrollHeight, and jsdom has no layout, so every textarea in
    // this file renders at height: 0px whatever minRows says. The height comes from
    // `outerHeight = Math.max(minRows * singleRowHeight, outerHeight)` in
    // @mui/material/TextareaAutosize, which is a floor in any real browser - so the prop is
    // what gets pinned, deliberately, rather than a measurement that would pass with it gone.
    const src = readFileSync(
      join(process.cwd(), "components/admin/adaptive-course/ManualTreeControls.tsx"),
      "utf8",
    );
    expect(src, "the box must open at list height, not one line").toMatch(/minRows=\{3\}/);
  });

  it("says a list is allowed before anything has been typed", () => {
    open();
    expect(screen.getByText(/one per line/i)).toBeInTheDocument();
    expect(screen.getByText(/shift\+enter/i)).toBeInTheDocument();
  });

  it("counts the rows on the button so a double paste is visible before it is sent", () => {
    const { field } = open();
    fireEvent.change(field, { target: { value: "1. Variables\n2. Loops\n3. Functions" } });
    expect(screen.getByRole("button", { name: "Add 3" })).toBeEnabled();
    expect(screen.getByText(/3 rows, one per line/i)).toBeInTheDocument();
  });

  it("creates one row per line IN ORDER and refetches the tree once for the batch", async () => {
    const { onAdded, field } = open();
    fireEvent.change(field, { target: { value: "Variables\nLoops\nFunctions" } });
    fireEvent.click(screen.getByRole("button", { name: "Add 3" }));

    await waitFor(() => expect(mocks.createModule).toHaveBeenCalledTimes(3));
    expect(mocks.createModule.mock.calls.map((c) => c[1].title)).toEqual([
      "Variables",
      "Loops",
      "Functions",
    ]);
    // ONE refetch, not three. Refetching and re-rendering the whole tree per row is the
    // slowness the paste path exists to remove.
    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1));
  });

  it("keeps the rows it could not create, so a failure half way does not lose the list", async () => {
    mocks.createModule
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("boom"));
    const { field } = open();
    fireEvent.change(field, { target: { value: "Variables\nLoops\nFunctions" } });
    fireEvent.click(screen.getByRole("button", { name: "Add 3" }));

    // Retyping a list the admin already pasted is the worst possible answer to a server error.
    await waitFor(() => expect((field as HTMLTextAreaElement).value).toBe("Loops\nFunctions"));
    expect(mocks.createModule).toHaveBeenCalledTimes(2);
  });

  it("still submits a single title on Enter", async () => {
    const { field } = open();
    fireEvent.change(field, { target: { value: "Functions and scope" } });
    fireEvent.keyDown(field, { key: "Enter" });
    await waitFor(() => expect(mocks.createModule).toHaveBeenCalledTimes(1));
    expect(mocks.createModule.mock.calls[0][1].title).toBe("Functions and scope");
  });

  it("makes a new line on Shift+Enter instead of submitting", () => {
    const { field } = open();
    fireEvent.change(field, { target: { value: "Variables" } });
    fireEvent.keyDown(field, { key: "Enter", shiftKey: true });
    expect(mocks.createModule).not.toHaveBeenCalled();
  });
});
