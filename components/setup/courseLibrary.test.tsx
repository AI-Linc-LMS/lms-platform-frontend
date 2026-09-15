import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { WizardState } from "@/lib/services/wizard.service";

/**
 * The setup wizard's Course library step, and what launch does with it.
 *
 * "Import from AI Linc catalogue" made launch copy each picked catalogue course into the new
 * tenant as a CLASSIC course (provisioning/wizard_views.py, duplicate_course()). The Features step
 * no longer offers `course`, the key that shows classic courses, so the only thing an import
 * could produce was a tenant holding courses that no screen lists, while Review promised
 * "Import from AI Linc catalogue · 5 courses".
 */

const launch = vi.hoisted(() => vi.fn());
const saveState = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ refreshClientInfo: () => Promise.resolve() }),
}));
vi.mock("@/lib/services/wizard.service", () => ({
  wizardService: { launch, saveState },
}));
// The layout reads the wizard theme context; this file checks the steps, not the chrome.
vi.mock("./WizardLayout", () => ({
  WizardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
// If the step still opened the catalogue browser, it would fetch the classic catalogue.
vi.mock("@/lib/services/api", () => ({
  default: { get: () => Promise.resolve({ data: { courses: [] } }) },
}));

import { SetupWizard } from "./SetupWizard";
import { CourseLibraryStep } from "./steps/CourseLibraryStep";

function wizard(step: number, wizardState: Record<string, unknown>): WizardState {
  return {
    client_id: 70,
    organisation_name: "Acme Academy",
    subdomain: "acme",
    setup_completed: false,
    setup_step: step,
    total_steps: 7,
    wizard_state: wizardState,
    logo_url: "https://cdn.example.com/logo.png",
    contact_email: "admin@acme.test",
  };
}

/** A draft saved before this change: Courses switched on, five classic courses picked. */
const SAVED_IMPORT = {
  welcome: { confirmed_org_name: "Acme Academy" },
  features: { selected_feature_ids: [3, 7, 8, 9, 10, 11] },
  course_library: {
    choice: "import",
    selected_course_ids: [101, 102, 103, 104, 105],
    selected_course_titles: ["A", "B", "C", "D", "E"],
  },
};

beforeEach(() => {
  cleanup();
  launch.mockReset().mockResolvedValue(wizard(7, {}));
  saveState.mockReset().mockImplementation(async (p: { setup_step?: number }) =>
    wizard(p.setup_step ?? 1, {}),
  );
});

describe("setup wizard: course library", () => {
  it("the Course library step no longer offers the classic catalogue import", () => {
    render(<CourseLibraryStep data={{}} onChange={vi.fn()} />);

    expect(screen.queryByText("Import from AI Linc catalogue")).toBeNull();
    expect(screen.getByText("Skip for now")).toBeTruthy();
  });

  it("a fresh draft can continue past the step without picking anything", () => {
    render(<SetupWizard initialState={wizard(6, { features: { selected_feature_ids: [3] } })} />);

    expect(screen.queryByText(/choose how to seed your course library/)).toBeNull();
    expect((screen.getByRole("button", { name: /Continue/ }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("a draft saved with an import reviews as Skip for now and launches without it", async () => {
    render(<SetupWizard initialState={wizard(7, SAVED_IMPORT)} />);

    expect(screen.queryByText("Import from AI Linc catalogue")).toBeNull();
    expect(screen.getByText("Skip for now")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Launch My LMS/ }));
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(1));

    const posted = launch.mock.calls[0][0] as typeof SAVED_IMPORT;
    expect(posted.course_library).toEqual({ choice: "skip" });
    // Everything else in the draft still launches as the admin set it.
    expect(posted.features).toEqual(SAVED_IMPORT.features);
    expect(posted.welcome).toEqual(SAVED_IMPORT.welcome);
  });
});
