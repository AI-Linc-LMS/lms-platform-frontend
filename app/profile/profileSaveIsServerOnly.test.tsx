/**
 * A profile save goes to the server, or it failed.
 *
 * The bug: "the profile data is currently only saving to local storage - it fails to save to the
 * server due to an API error." Three things compounded to hide it.
 *
 *  1. The page wrote the learner's edits to `localStorage` BEFORE it tried the server, always.
 *  2. When the server refused, it said "Profile saved locally" - an *info* toast, which reads
 *     like success - and threw the server's reason away.
 *  3. The next load merged that local copy back over the API profile, so the data kept LOOKING
 *     saved. Open the app on another device, or clear site data, and the work was gone.
 *
 * What is pinned here: nothing is written to browser storage on the way to a save or after one
 * fails; a failure is reported as a failure, carrying the server's own words; the typed values
 * stay on screen so the learner can retry; and the rejection reaches the editor that asked, so
 * it can keep itself open.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// framer-motion's whileInView needs one; jsdom has none.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams(),
}));
// `t` has to be ONE function: the page memoises its loader on it, so a fresh `t` per render
// re-fires the load effect forever.
const { translate } = vi.hoisted(() => ({
  translate: (key: string, opts?: unknown) =>
    opts && typeof opts === "object" && "reason" in opts
      ? `${key}|${String((opts as { reason: unknown }).reason)}`
      : key,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate, i18n: { language: "en", changeLanguage: () => {} } }),
}));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/profile/resume/ResumeBuilder", () => ({ ResumeBuilder: () => null }));
vi.mock("@/components/profile/SavedResumesSection", () => ({ SavedResumesSection: () => null }));
vi.mock("@/components/profile/ActivityHeatmap", () => ({ ActivityHeatmap: () => null }));
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({ percentage: 100, completion: null, missingFields: [], refresh: vi.fn() }),
  useModuleLocked: () => ({ showLock: false }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: null }) }));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: null, isAuthenticated: true, loading: false, logout: vi.fn() }),
}));

const { showToast, getUserProfile, updateUserProfile, getUserActivityHeatmap } = vi.hoisted(() => ({
  showToast: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserActivityHeatmap: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast }) }));
vi.mock("@/lib/services/profile.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/profile.service")>(
    "@/lib/services/profile.service",
  );
  return {
    ...actual,
    profileService: { getUserProfile, updateUserProfile, getUserActivityHeatmap },
  };
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProfilePage from "./page";

const SERVER_PROFILE = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  username: "ada",
  profile_picture: "",
  phone_number: "",
  bio: "",
  social_links: {},
  date_of_birth: null,
  city: null,
  state: null,
  experience: [],
  projects: [],
};

/** What the endpoint really answers with when it refuses a section. */
function refusal(body: unknown) {
  return Object.assign(new Error("Request failed with status code 400"), {
    response: { status: 400, data: { error: body } },
  });
}

function storageSnapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)!;
    out[k] = window.localStorage.getItem(k)!;
  }
  return out;
}

/**
 * Nothing in browser storage holds what the learner typed, and no profile cache exists.
 *
 * Deliberately not "storage is empty": a per-viewer UI preference (which sections this learner
 * shows) legitimately lives there. The line is that a learner's OWN WORDS never do.
 */
function expectNoLearnerDataStored(typed: string) {
  for (const [key, value] of Object.entries(storageSnapshot())) {
    expect(key).not.toMatch(/^user_profile_extra/);
    expect(value).not.toContain(typed);
  }
}

async function renderProfile() {
  getUserProfile.mockResolvedValue({ ...SERVER_PROFILE });
  getUserActivityHeatmap.mockResolvedValue({ heatmap_data: {} });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ProfilePage />
    </QueryClientProvider>,
  );
  await waitFor(() => expect(getUserProfile).toHaveBeenCalled());
  await act(async () => {});
  await waitFor(() => expect(screen.getAllByRole("button", { name: "profile.edit" }).length).toBeGreaterThan(0));
}

/** Open the Summary editor and type a bio - the shortest real edit on the page. */
async function typeABio(text: string) {
  fireEvent.click(screen.getAllByRole("button", { name: "profile.edit" })[0]);
  const field = screen.getAllByRole("textbox")[0];
  fireEvent.change(field, { target: { value: text } });
  fireEvent.click(screen.getAllByRole("button", { name: "profile.save" })[0]);
  await act(async () => {});
}

describe("a profile save is a server save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // A signed-in learner. The cache these tests are about was keyed by the `user_id` claim in
    // this cookie and silently did nothing without it - so without it they would pass on the
    // broken code too.
    document.cookie = `access_token=h.${btoa(JSON.stringify({ user_id: 42 }))}.s`;
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it("writes nothing to browser storage when the save succeeds", async () => {
    updateUserProfile.mockResolvedValue({ ...SERVER_PROFILE, bio: "Engineer" });
    await renderProfile();
    await typeABio("Engineer");

    expect(updateUserProfile).toHaveBeenCalledWith(expect.objectContaining({ bio: "Engineer" }));
    expectNoLearnerDataStored("Engineer");
  });

  it("writes nothing to browser storage when the save FAILS", async () => {
    // This is the heart of it: the old code wrote the edit to localStorage before the request
    // was even made, so a refused save still left the learner's data on the device.
    updateUserProfile.mockRejectedValue(refusal({ bio: ["This field may not be blank."] }));
    await renderProfile();
    await typeABio("Engineer");

    expect(updateUserProfile).toHaveBeenCalled();
    expectNoLearnerDataStored("Engineer");
  });

  it("reports a failed save as a failure, in the server's own words", async () => {
    updateUserProfile.mockRejectedValue(
      refusal({ experience: [{ start_date: ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."] }] }),
    );
    await renderProfile();
    await typeABio("Engineer");

    const [message, severity] = showToast.mock.calls.at(-1)!;
    expect(severity).toBe("error");
    expect(severity).not.toBe("info");
    expect(String(message)).not.toMatch(/savedLocally|saved locally/i);
    // The reason travels with it, rather than being swallowed.
    expect(String(message)).toContain("Date has wrong format");
    expect(String(message)).toContain("Experience - Start date");
  });

  it("keeps what the learner typed on screen after a failed save, so they can retry", async () => {
    updateUserProfile.mockRejectedValue(refusal({ bio: ["Something the server disliked"] }));
    await renderProfile();
    await typeABio("Engineer at Acme");

    // Still in the editor, still holding the text: losing their words to report the failure
    // would be a worse bug than the one being fixed.
    const field = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    expect(field.value).toBe("Engineer at Acme");
  });

  it("rejects, so the editor that asked for the save knows it did not happen", async () => {
    updateUserProfile.mockRejectedValue(refusal({ bio: ["nope"] }));
    await renderProfile();
    await typeABio("Engineer");

    // The Save button is still there, because the section did not close on a save that failed.
    expect(screen.getAllByRole("button", { name: "profile.save" }).length).toBeGreaterThan(0);
  });
});

/**
 * Work an older build stranded on a device.
 *
 * Learners are out there with edits sitting in `user_profile_extra_<client>_u<id>` that the
 * server never accepted, because the page told them it had "saved locally". Deleting the cache
 * without looking would destroy exactly the data the bug was hiding. So it is shown, and they
 * choose - and it is never merged into the profile by itself, because a tenant-keyed version of
 * this cache once poured one learner's details into another account on a shared browser.
 */
describe("edits an older build stranded in this browser", () => {
  const KEY = "user_profile_extra_1_u42";

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = `access_token=h.${btoa(JSON.stringify({ user_id: 42 }))}.s`;
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it("offers them instead of merging them, and does not touch the profile until asked", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ city: "Pune", phone_number: "9876543210" }));
    await renderProfile();

    // Offered...
    expect(screen.getByText("profile.strandedTitle")).toBeTruthy();
    expect(screen.getByText(/Pune/)).toBeTruthy();
    // ...and NOT merged: no save has been attempted on its own.
    expect(updateUserProfile).not.toHaveBeenCalled();
    // ...and not thrown away either.
    expect(window.localStorage.getItem(KEY)).not.toBeNull();
  });

  it("saves them to the server when the learner says so, and only then forgets them", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ city: "Pune" }));
    updateUserProfile.mockResolvedValue({ ...SERVER_PROFILE, city: "Pune" });
    await renderProfile();

    fireEvent.click(screen.getByRole("button", { name: "profile.strandedSave" }));
    await act(async () => {});

    expect(updateUserProfile).toHaveBeenCalledWith(expect.objectContaining({ city: "Pune" }));
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(screen.queryByText("profile.strandedTitle")).toBeNull();
  });

  it("keeps them if that save fails, so a bad day does not cost the learner the data", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ city: "Pune" }));
    updateUserProfile.mockRejectedValue(refusal({ city: ["nope"] }));
    await renderProfile();

    fireEvent.click(screen.getByRole("button", { name: "profile.strandedSave" }));
    await act(async () => {});

    expect(window.localStorage.getItem(KEY)).not.toBeNull();
    expect(screen.getByText("profile.strandedTitle")).toBeTruthy();
  });

  it("says nothing when the stranded copy matches what the server already has", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ first_name: "Ada", bio: "" }));
    await renderProfile();
    expect(screen.queryByText("profile.strandedTitle")).toBeNull();
  });
});
