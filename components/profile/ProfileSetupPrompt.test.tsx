/**
 * Asking for the gating fields ON THE WAY IN, without turning the way in into a wall.
 *
 * The reported gap: "if these are compulsory for interviews, jobs, then why not take these
 * information at the start upon entering." So the prompt must actually appear on entry. But
 * 13,481 of 13,776 active learners on production are missing at least one of these fields, so a
 * prompt that cannot be got past would, on the day it shipped, stand between almost every
 * existing account and the course it is enrolled in.
 *
 * The tests that matter here are therefore the ones about NOT asking:
 *   - a tenant with none of the three modules is never asked at all;
 *   - "Not now" always works, and is not asked again in the same session;
 *   - a complete or exempt learner never sees it.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

const updateUserProfile = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/services/profile.service", () => ({
  profileService: { updateUserProfile: (...a: unknown[]) => updateUserProfile(...a) },
}));

vi.mock("@/lib/services/countries.service", () => ({
  countriesService: { list: async () => [{ code: "IN", name: "India" }] },
}));

let gateValue: Record<string, unknown>;
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => gateValue,
}));

import { ProfileSetupPrompt } from "./ProfileSetupPrompt";

type Field = { field: string; label: string; filled: boolean };

const FIVE: Field[] = [
  { field: "first_name", label: "First name", filled: true },
  { field: "last_name", label: "Last name", filled: true },
  { field: "phone_number", label: "Phone number", filled: true },
  { field: "date_of_birth", label: "Date of birth", filled: false },
  { field: "country", label: "Country", filled: false },
];

function setGate(overrides: Record<string, unknown> = {}) {
  const completion = {
    percentage: 60,
    is_complete: false,
    exempt: false,
    required_fields: FIVE,
    missing_fields: ["date_of_birth", "country"],
    gated_modules: ["jobs", "interview"],
    locked_modules: ["jobs", "interview"],
    ...((overrides.completion as object) ?? {}),
  };
  gateValue = {
    status: "ready",
    completion,
    percentage: completion.percentage,
    lockedModules: completion.locked_modules,
    missingFields: completion.missing_fields,
    gateApplies: (completion.gated_modules ?? []).length > 0,
    isComplete: completion.is_complete,
    skills: [],
    refresh,
    applyServerLock: vi.fn(),
    ...overrides,
  };
  delete (gateValue as Record<string, unknown>).completionOverride;
}

beforeEach(() => {
  updateUserProfile.mockReset().mockResolvedValue({});
  refresh.mockReset().mockResolvedValue(undefined);
  sessionStorage.clear();
  setGate();
});

describe("it asks on the way in", () => {
  it("shows the prompt without the learner going looking for it", async () => {
    render(<ProfileSetupPrompt />);
    expect(await screen.findByText(/finish setting up your account/i)).toBeInTheDocument();
  });

  it("asks for exactly the outstanding fields, and not the ones already filled", async () => {
    render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);

    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
  });

  it("names what it is for, from the tenant's own module list", async () => {
    render(<ProfileSetupPrompt />);
    const body = await screen.findByText(/we need a couple of details before/i);
    expect(body.textContent).toMatch(/Jobs/);
    expect(body.textContent).toMatch(/Interview/);
    expect(body.textContent).not.toMatch(/Resume/);
  });

  it("sends only the fields it asked for", async () => {
    render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);

    await userEvent.type(screen.getByLabelText(/date of birth/i), "2000-01-01");
    await userEvent.click(screen.getByLabelText(/country/i));
    await userEvent.click(await screen.findByText("India"));
    await userEvent.click(screen.getByTestId("profile-setup-save"));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    expect(updateUserProfile.mock.calls[0][0]).toEqual({
      date_of_birth: "2000-01-01",
      country: "India",
    });
    // A full-profile body would have blanked everything this dialog never loaded.
    expect(Object.keys(updateUserProfile.mock.calls[0][0])).toHaveLength(2);
  });

  it("refuses a date of birth the server would refuse, before the round trip", async () => {
    render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);

    await userEvent.type(screen.getByLabelText(/date of birth/i), "2024-01-01");
    await userEvent.click(screen.getByTestId("profile-setup-save"));

    expect(await screen.findByText(/at least 13/i)).toBeInTheDocument();
    expect(updateUserProfile).not.toHaveBeenCalled();
  });
});

describe("it never stands between a learner and their learning", () => {
  it('closes on "Not now"', async () => {
    render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);

    await userEvent.click(screen.getByTestId("profile-setup-skip"));

    await waitFor(() =>
      expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
    );
  });

  it("does not come back for the rest of the session", async () => {
    const first = render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);
    await userEvent.click(screen.getByTestId("profile-setup-skip"));
    first.unmount();

    // A fresh mount, as a navigation would produce.
    render(<ProfileSetupPrompt />);
    await waitFor(() =>
      expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
    );
  });

  it("but does come back in the next session", async () => {
    render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);
    await userEvent.click(screen.getByTestId("profile-setup-skip"));

    // A new session: the browser cleared sessionStorage.
    sessionStorage.clear();
    render(<ProfileSetupPrompt />);
    expect(await screen.findAllByText(/finish setting up your account/i)).not.toHaveLength(0);
  });

  it("survives a browser that refuses sessionStorage rather than blanking", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      render(<ProfileSetupPrompt />);
      await screen.findByText(/finish setting up your account/i);
      await userEvent.click(screen.getByTestId("profile-setup-skip"));
      await waitFor(() =>
        expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
      );
    } finally {
      spy.mockRestore();
      vi.restoreAllMocks();
    }
  });
});

describe("it stays quiet when it has nothing to ask for", () => {
  it("says nothing on a tenant that runs none of the gated modules", async () => {
    setGate({ completion: { gated_modules: [], locked_modules: [] } });
    render(<ProfileSetupPrompt />);
    await waitFor(() =>
      expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
    );
  });

  it("says nothing to a learner whose profile is complete", async () => {
    setGate({
      completion: {
        is_complete: true,
        percentage: 100,
        missing_fields: [],
        required_fields: FIVE.map((f) => ({ ...f, filled: true })),
        locked_modules: [],
      },
    });
    render(<ProfileSetupPrompt />);
    await waitFor(() =>
      expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
    );
  });

  it("says nothing to an exempt learner", async () => {
    setGate({ completion: { exempt: true } });
    render(<ProfileSetupPrompt />);
    await waitFor(() =>
      expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
    );
  });

  it("says nothing while the gate is still loading", async () => {
    setGate({ status: "loading" });
    render(<ProfileSetupPrompt />);
    await waitFor(() =>
      expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
    );
  });

  it("says nothing when the profile fetch failed", async () => {
    setGate({ status: "error", completion: null });
    gateValue.completion = null;
    render(<ProfileSetupPrompt />);
    await waitFor(() =>
      expect(screen.queryByText(/finish setting up your account/i)).not.toBeInTheDocument(),
    );
  });
});

describe("it fits a phone without touching the desktop dialog", () => {
  /**
   * The user's phone is a 360px Android. MUI's `xs` is mobile-first — an `xs` value with no `sm`
   * applies at EVERY width — so a 44px target written that way would grow the desktop buttons
   * too. Both halves are asserted: the phone rule is present AND it is absent from everything a
   * desktop browser can see.
   */
  it("gives both buttons a 44px target on a phone only", async () => {
    render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);

    for (const id of ["profile-setup-save", "profile-setup-skip"]) {
      const css = cssByMedia(screen.getByTestId(id));
      expect(css.phone).toContain("min-height:44px");
      expect(css.unscoped).not.toContain("min-height:44px");
    }
  });

  it("stacks the two buttons on a phone only", async () => {
    render(<ProfileSetupPrompt />);
    await screen.findByText(/finish setting up your account/i);

    // Side by side at 390px would leave "Save and continue" under 200px wide next to "Not now".
    const row = screen.getByTestId("profile-setup-save").parentElement!;
    const css = cssByMedia(row);
    expect(css.phone).toContain("flex-direction:column-reverse");
    expect(css.unscoped).not.toContain("flex-direction:column-reverse");
    expect(css.unscoped).toContain("flex-direction:row");
  });
});
