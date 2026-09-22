import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * The admin must see WHO they are adding before they add them.
 *
 * The incident: on one tenant, "Gouse Basha" (never signed in) and "Shaik Ghouse Hussain" were both
 * learners. A search for "gouse" matched only the first. The admin ticked the one result, pressed
 * "Enroll 1", and the wrong learner joined the batch; the right one could not see its recordings.
 */
const GOUSE = {
  id: 12470, name: "Gouse Basha", email: "gbasha6256@gmail.com", last_login: null,
  cohorts: [{ id: 538, name: "Data Analytics and AI Engineering" }],
};
const SHAIK = {
  id: 21329, name: "Shaik Ghouse Hussain", email: "shaikghousehussain@gmail.com",
  last_login: "2026-09-21T06:26:19Z", cohorts: [{ id: 538, name: "Data Analytics and AI Engineering" }],
};

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  getManageStudents: vi.fn(),
  enrollMembers: vi.fn(async () => ({ succeeded: 1, skipped: 0, missing: [] })),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: { getManageStudents: mocks.getManageStudents },
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { enrollMembers: mocks.enrollMembers },
}));

import { EnrollCohortStudentsDialog } from "./EnrollCohortStudentsDialog";

beforeEach(() => {
  mocks.enrollMembers.mockClear();
  // Plain substring search, like the API: "gouse" does not match "Ghouse".
  mocks.getManageStudents.mockImplementation(async ({ search }: { search?: string }) => {
    const all = [GOUSE, SHAIK];
    const q = (search ?? "").toLowerCase();
    return { students: q ? all.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q)) : all };
  });
});

const openDialog = () =>
  render(<EnrollCohortStudentsDialog open cohortId={527} enrolledIds={new Set()} onClose={vi.fn()} onEnrolled={vi.fn()} />);

async function search(text: string) {
  vi.useFakeTimers();
  fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), { target: { value: text } });
  await act(async () => { vi.advanceTimersByTime(400); });
  vi.useRealTimers();
}

describe("adding learners to a batch", () => {
  it("names the selected learner by email above the Enroll button, and flags a never-signed-in account", async () => {
    openDialog();
    await search("gouse");
    fireEvent.click(await screen.findByText("Gouse Basha"));
    const review = screen.getByTestId("enroll-review");
    expect(review.textContent).toMatch(/gbasha6256@gmail\.com/);
    expect(review.textContent).toMatch(/never signed in/i);
  });

  it("marks never-signed-in accounts and current batches in the results", async () => {
    openDialog();
    const hints = await screen.findAllByTestId("student-hints");
    expect(hints[0].textContent).toMatch(/Never signed in/);
    expect(hints[0].textContent).toMatch(/Data Analytics and AI Engineering/);
    expect(hints[1].textContent).not.toMatch(/Never signed in/);
  });

  it("keeps a selection, with its email, after the search changes", async () => {
    openDialog();
    await search("gouse");
    fireEvent.click(await screen.findByText("Gouse Basha"));
    await search("shaik");
    await screen.findByText("Shaik Ghouse Hussain");
    const rows = screen.getAllByTestId("enroll-review-row");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toMatch(/gbasha6256@gmail\.com/);
  });

  it("lets the admin drop a wrong pick from the review and enrols only who is left", async () => {
    openDialog();
    fireEvent.click(await screen.findByText("Gouse Basha"));
    fireEvent.click(screen.getByText("Shaik Ghouse Hussain"));
    fireEvent.click(within(screen.getByTestId("enroll-review")).getByRole("button", { name: /remove gouse basha/i }));
    expect(screen.getAllByTestId("enroll-review-row")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /^enroll/i }));
    await waitFor(() => expect(mocks.enrollMembers).toHaveBeenCalledWith(527, [21329]));
  });

  it("shows no review panel until someone is selected", async () => {
    openDialog();
    await screen.findByText("Gouse Basha");
    expect(screen.queryByTestId("enroll-review")).toBeNull();
  });
});
