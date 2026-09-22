import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * Admin scorecard skills / badges and the project library on a phone.
 *
 * A phone gets cards and bottom sheets (held open mid-request); a desktop gets the original
 * tables and Dialogs. Phone-only sizes live inside the max-width:599.95px block.
 */

let phone = false;
const realMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: phone && /max-width:\s*599\.95px/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  // The project library's hero animates in on intersection; jsdom has no IntersectionObserver.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  phone = false;
  vi.unstubAllGlobals();
});

vi.mock("react-i18next", () => {
  const t = (key: string) => key;
  const value = { t, i18n: { language: "en" } };
  return { useTranslation: () => value };
});

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  updateBadge: vi.fn(),
  deleteProject: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/scorecard/skills",
  useParams: () => ({}),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title, action }: { title: string; action?: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {action}
    </header>
  ),
  HeaderActionButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@/components/admin/skill-mapping/SkillMappingDialog", () => ({ SkillMappingDialog: () => null }));
vi.mock("@/lib/services/admin/admin-skills.service", () => ({
  adminSkillsService: {
    listSkills: vi.fn(async () => [
      {
        id: 1,
        name: "0/1 Knapsack",
        slug: "knapsack",
        category: "DSA",
        description: "",
        is_active: true,
        mapping_count: 2,
        created_at: null,
        updated_at: "2026-05-29T00:00:00Z",
      },
    ]),
    createSkill: vi.fn(),
    deleteSkill: vi.fn(),
    getContentBrowser: vi.fn(async () => null),
  },
}));
const badge = {
  id: 3,
  name: "30-Day Streak",
  slug: "streak-30",
  description: "Stay active 30 days in a row.",
  iconSlug: "mdi:fire",
  criteriaJson: { type: "streak", days: 30 },
  points: 100,
  isActive: true,
  awardedCount: 0,
  createdAt: null,
  updatedAt: null,
};
vi.mock("@/lib/services/admin/admin-badges.service", () => ({
  adminBadgesService: {
    listBadges: vi.fn(async () => [badge]),
    updateBadge: mocks.updateBadge,
    createBadge: vi.fn(),
    deleteBadge: vi.fn(),
  },
}));
vi.mock("@/lib/services/admin/admin-projects.service", async (orig) => {
  const real = await orig<typeof import("@/lib/services/admin/admin-projects.service")>();
  return {
    ...real,
    listProjects: vi.fn(async () => [
      {
        id: 8,
        title: "Pricing page",
        brief_html: "",
        runtime: "web_static",
        tier: "auto",
        max_marks: 20,
        starter_files: { "index.html": "" },
        editable_paths: [],
        grader_files: {},
        reference_solution: {},
        rubric: [],
        verification: null,
        is_active: true,
      },
    ]),
    deleteProject: mocks.deleteProject,
  };
});

import SkillsPage from "@/app/admin/scorecard/skills/page";
import BadgesPage from "@/app/admin/scorecard/badges/page";
import ProjectLibraryPage from "@/app/admin/projects/page";
import { SegmentedTabs } from "@/components/admin/assessment/shared/SegmentedTabs";
import { StatusChip } from "@/components/admin/assessment/shared/AssessmentStatusChip";

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

describe("skill catalog", () => {
  it("is a card per skill on a phone with a 44px deactivate button", async () => {
    phone = true;
    render(<SkillsPage />);
    const card = await screen.findByTestId("skill-card");
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(card).getByText("0/1 Knapsack")).toBeTruthy();
    const deactivate = within(card).getByRole("button", { name: "Deactivate 0/1 Knapsack" });
    expect(cssByMedia(deactivate).unscoped).toMatch(/width:44px/);
  });

  it("is the original table on a desktop", async () => {
    render(<SkillsPage />);
    expect(await screen.findByText("0/1 Knapsack")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.queryByTestId("skill-card")).toBeNull();
  });

  it("new skill is a sheet on a phone and the original Dialog on a desktop", async () => {
    phone = true;
    const { unmount } = render(<SkillsPage />);
    await screen.findByTestId("skill-card");
    fireEvent.click(screen.getByRole("button", { name: "New skill" }));
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeTruthy();
    unmount();

    phone = false;
    render(<SkillsPage />);
    await screen.findByText("0/1 Knapsack");
    fireEvent.click(screen.getByRole("button", { name: "New skill" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector(".MuiDialogTitle-root")?.textContent).toBe("Create new skill");
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeNull();
  });

  it("category chips are 44px pills on a phone only", async () => {
    render(<SkillsPage />);
    await screen.findByText("0/1 Knapsack");
    expectPhoneOnly(screen.getByText("All categories").closest(".MuiChip-root")!, /height:44px/);
  });
});

describe("badges", () => {
  it("edit is a sheet on a phone that stays open while the save runs", async () => {
    phone = true;
    mocks.updateBadge.mockImplementation(() => new Promise(() => {}));
    render(<BadgesPage />);
    const card = await screen.findByTestId("badge-card");
    fireEvent.click(within(card).getByRole("button", { name: "Edit 30-Day Streak" }));
    const paper = document.querySelector(".MuiDrawer-paperAnchorBottom") as HTMLElement;
    expect(paper).toBeTruthy();
    fireEvent.click(within(paper).getByRole("button", { name: "Save changes" }));
    expect(mocks.updateBadge).toHaveBeenCalled();
    await waitFor(() => expect(within(paper).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true));
    fireEvent.click(document.querySelector(".MuiDrawer-root .MuiBackdrop-root")!);
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeTruthy();
  });

  it("is the original table and Dialog on a desktop", async () => {
    render(<BadgesPage />);
    await screen.findByText("30-Day Streak");
    expect(screen.getByRole("table")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit 30-Day Streak" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector(".MuiDialogTitle-root")?.textContent).toBe("Edit 30-Day Streak");
  });
});

describe("project library", () => {
  it("is a card per project on a phone with 44px Edit and Delete", async () => {
    phone = true;
    render(<ProjectLibraryPage />);
    const card = await screen.findByTestId("project-card");
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(card).getByText("Pricing page")).toBeTruthy();
    expect(within(card).getByRole("button", { name: /adminPeoplePhone\.edit/ })).toBeTruthy();
    fireEvent.click(within(card).getByRole("button", { name: /adminPeoplePhone\.delete/ }));
    const paper = document.querySelector(".MuiDrawer-paperAnchorBottom") as HTMLElement;
    expect(within(paper).getByText("adminPeoplePhone.deleteProjectTitle")).toBeTruthy();
  });

  it("is the original table and delete Dialog on a desktop", async () => {
    render(<ProjectLibraryPage />);
    await screen.findByText("Pricing page");
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.queryByTestId("project-card")).toBeNull();
  });
});

describe("shared assessment primitives stay the same on a desktop", () => {
  it("segmented tabs are 44px and their counts 12px on a phone only", () => {
    render(
      <SegmentedTabs tabs={[{ value: "a", label: "Active", count: 3 }]} value="a" onChange={vi.fn()} />,
    );
    const tab = screen.getByRole("tab");
    expectPhoneOnly(tab, /min-height:44px/);
    expectPhoneOnly(within(tab).getByText("3"), /font-size:0\.75rem/);
    expect(cssByMedia(within(tab).getByText("3")).unscoped).toMatch(/font-size:0\.7rem/);
  });

  it("a status chip is 12px on a phone and keeps 0.72rem elsewhere", () => {
    render(<StatusChip label="Not verified" tone="warning" />);
    const chip = screen.getByText("Not verified").parentElement!;
    expectPhoneOnly(chip, /font-size:0\.75rem/);
    expect(cssByMedia(chip).unscoped).toMatch(/font-size:0\.72rem/);
  });
});
