// @vitest-environment jsdom
/**
 * The host dropdown has to exist, be filled from Zoom, and actually reach the request.
 *
 * The backend has accepted `zoom_host_user` since #1003 and ships `GET zoom/hosts/` whose
 * docstring says "Feeds the wizard's Host dropdown". The frontend contained zero references to
 * either for a week, during which Agileology owned a second Zoom licence that nothing could
 * point a session at. A test that only checked the service compiled would have passed
 * throughout; this one renders the step and reads the options.
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getZoomHosts = vi.fn();
const createZoom = vi.fn();
const listPresets = vi.fn();
const getWebinarTemplates = vi.fn();
const getMeetingTemplates = vi.fn();

vi.mock("@/lib/services/admin/admin-live-activities.service", () => ({
  adminLiveActivitiesService: {
    getZoomHosts,
    createZoom,
    listPresets,
    getWebinarTemplates,
    getMeetingTemplates,
    getLiveActivity: vi.fn(),
    createGoogleMeet: vi.fn(),
  },
}));

vi.mock("@/lib/services/live-class.service", () => ({
  liveClassService: { createSession: vi.fn(), getSessions: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/services/google.service", () => ({
  googleService: {
    status: vi.fn(),
    getGoogleCredentials: vi.fn().mockResolvedValue({ connected: false }),
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { role: "admin" }, isLoading: false }),
}));
vi.mock("@/lib/auth/role-utils", () => ({ canAccessAdminArea: () => true }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/hooks/useTenantTimezone", () => ({
  // Returns a STRING, not an object.
  useTenantTimezone: () => "Asia/Kolkata",
  useSessionTimezone: () => "Asia/Kolkata",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_k: string, d?: string) => d ?? _k }),
}));

const HOSTS = {
  hosts: [
    {
      email: "admin@agileologyedu.com",
      name: "Admin",
      user_id: "u1",
      licence: "Licensed",
      can_host_webinar: true,
      detail: "webinar API responds",
    },
    {
      email: "support@agileologyedu.com",
      name: "Support",
      user_id: "u2",
      licence: "Licensed",
      can_host_webinar: true,
      detail: "webinar API responds",
    },
    {
      email: "sharath@agileologyedu.com",
      name: "Sharath",
      user_id: "u3",
      licence: "Basic",
      can_host_webinar: false,
      detail: "no webinar licence",
    },
  ],
  default_host: "support@agileologyedu.com",
  webinar_host_count: 2,
};

/**
 * The picker lives on step 2, so every test has to get there - which means filling step 1 the
 * way an admin would. The wizard gates Next on a topic of 2+ characters and a future date.
 */
async function renderWizard({ advance = true } = {}) {
  const Page = (await import("./page")).default;
  const view = render(<Page />);
  if (!advance) return view;

  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const local = new Date(soon.getTime() - soon.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);

  fireEvent.change(await screen.findByLabelText(/topic|title/i), {
    target: { value: "Batch 8023-E" },
  });
  const when = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
  fireEvent.change(when, { target: { value: local } });

  const next = await screen.findByRole("button", { name: /next|continue/i });
  await waitFor(() => expect(next).not.toBeDisabled());
  fireEvent.click(next);
  return view;
}

/** Open a MUI select by its label and return its listbox. */
async function openSelect(label: RegExp) {
  const field = await screen.findByLabelText(label);
  fireEvent.mouseDown(field);
  return within(await screen.findByRole("listbox"));
}

describe("the host picker in the create wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getZoomHosts.mockResolvedValue(HOSTS);
    listPresets.mockResolvedValue([]);
    getWebinarTemplates.mockResolvedValue([]);
    getMeetingTemplates.mockResolvedValue([]);
  });

  it("asks the backend which Zoom users this tenant can host under", async () => {
    await renderWizard({ advance: false });
    await waitFor(() => expect(getZoomHosts).toHaveBeenCalled());
  });

  it("offers every host, and names the institution default", async () => {
    await renderWizard();
    await waitFor(() => expect(getZoomHosts).toHaveBeenCalled());
    const list = await openSelect(/host \(zoom user\)/i);
    expect(list.getByText(/institution default \(support@agileologyedu\.com\)/i)).toBeTruthy();
    expect(list.getByText(/admin@agileologyedu\.com/)).toBeTruthy();
    expect(list.getByText(/sharath@agileologyedu\.com/)).toBeTruthy();
  });

  it("says how many sessions can run at once - the fact whose absence caused this", async () => {
    await renderWizard();
    expect(await screen.findByText(/you can run 2 at once/i)).toBeTruthy();
  });

  it("shows each host's licence so a Basic user is recognisable", async () => {
    await renderWizard();
    await waitFor(() => expect(getZoomHosts).toHaveBeenCalled());
    const list = await openSelect(/host \(zoom user\)/i);
    expect(list.getByText(/Basic/)).toBeTruthy();
  });

  it("falls back to the tenant default rather than breaking when Zoom cannot be read", async () => {
    getZoomHosts.mockRejectedValue(new Error("zoom down"));
    await renderWizard();
    expect(
      await screen.findByText(/could not read the zoom users/i)
    ).toBeTruthy();
  });
});
