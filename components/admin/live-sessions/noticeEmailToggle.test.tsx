// @vitest-environment jsdom
/**
 * Cancelling a class must not always mail everyone attached to it.
 *
 * Mail cannot be recalled. A class called off two minutes after a typo was mailing the whole
 * audience with no way to say no, and `auto_reminders_enabled` defaults to FALSE - this platform
 * treats live-session mail as manual unless asked - so the one path that sent unconditionally was
 * doing it against the tenant's own default.
 *
 * The switch controls the EMAIL only. The in-app notice and the student-facing banner are not
 * optional and are not part of this choice: a student must always be able to find out the class
 * is off.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const postSessionNotice = vi.fn();

vi.mock("@/lib/services/admin/admin-live-activities.service", () => ({
  adminLiveActivitiesService: { postSessionNotice },
}));
vi.mock("@/lib/hooks/useTenantTimezone", () => ({
  useTenantTimezone: () => "Asia/Kolkata",
  useSessionTimezone: () => "Asia/Kolkata",
}));
vi.mock("@/components/common/IconWrapper", () => ({
  IconWrapper: () => null,
}));

const SESSION = {
  id: 240,
  topic_name: "live session testing",
  class_datetime: "2026-10-20T18:00:00+05:30",
  duration_minutes: 20,
  notice_type: "" as const,
  notice_reason: "",
};

async function openDialog() {
  const { LiveSessionNoticeDialog } = await import("./LiveSessionNoticeDialog");
  return render(
    <LiveSessionNoticeDialog
      open
      session={SESSION as never}
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />
  );
}

async function cancelWith({ email }: { email: boolean }) {
  await openDialog();
  fireEvent.change(screen.getByLabelText(/reason shown to students/i), {
    target: { value: "Trainer unavailable" },
  });
  const sw = screen.getByRole("switch", { name: /email the students/i });
  if (!email) fireEvent.click(sw);
  // "Cancel session" appears twice - the mode toggle and the submit. The submit is the last.
  const submits = screen.getAllByRole("button", { name: /^cancel session$/i });
  fireEvent.click(submits[submits.length - 1]);
  await waitFor(() => expect(postSessionNotice).toHaveBeenCalled());
  return postSessionNotice.mock.calls[0][1];
}

describe("the cancel/reschedule notice dialog", () => {
  beforeEach(() => {
    postSessionNotice.mockReset();
    postSessionNotice.mockResolvedValue({ id: 240 });
  });

  it("offers a switch for the email", async () => {
    await openDialog();
    expect(screen.getByRole("switch", { name: /email the students/i })).toBeTruthy();
  });

  it("has the email ON by default, so today's behaviour is what you keep", async () => {
    await openDialog();
    expect(screen.getByRole("switch", { name: /email the students/i })).toBeChecked();
  });

  it("sends notify_students: true when the switch is left alone", async () => {
    const payload = await cancelWith({ email: true });
    expect(payload.notify_students).toBe(true);
  });

  it("sends notify_students: false when the admin turns it off", async () => {
    const payload = await cancelWith({ email: false });
    expect(payload.notify_students).toBe(false);
  });

  it("still cancels - turning the email off is not turning the cancel off", async () => {
    const payload = await cancelWith({ email: false });
    expect(payload.notice_type).toBe("cancelled");
    expect(payload.reason).toBe("Trainer unavailable");
  });

  it("says plainly that students still see the notice when the email is off", async () => {
    await openDialog();
    fireEvent.click(screen.getByRole("switch", { name: /email the students/i }));
    expect(
      await screen.findByText(/students still see the notice and the reason/i)
    ).toBeTruthy();
  });
});
