import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Adding an article that repeats one the topic already has.
 *
 * The backend answers 409 `duplicate_article` (BE #897) because learners were seeing two READ rows
 * teaching the same lesson. The builder has to say which article it repeats and let the admin
 * either add it anyway (re-sent with confirm_duplicate) or back out without sending anything.
 */

const mocks = vi.hoisted(() => ({ showToast: vi.fn(), addArticle: vi.fn() }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: { id: 29 } }) }));
vi.mock("@/lib/services/file-upload.service", () => ({ uploadFile: vi.fn() }));
vi.mock("@/lib/services/adaptive-video.service", () => ({
  adaptiveVideoAdminService: { searchCatalog: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/admin/admin-adaptive-course.service")>()),
  adminAdaptiveCourseService: {
    addArticle: mocks.addArticle,
    getSuggestions: vi.fn(async () => null),
    searchBank: vi.fn(async () => ({ results: [], count: 0 })),
  },
}));

import { AddContentDialog } from "./AddContentDialog";

const BODY = "Java is an object oriented language, and Big O describes how cost grows.";

const duplicate409 = () =>
  Object.assign(new Error("Request failed with status code 409"), {
    response: {
      status: 409,
      data: {
        code: "duplicate_article",
        detail: "This topic already has an article like this.",
        duplicate_of: {
          id: 971,
          title: "Java Fundamentals & Complexity Analysis",
          similarity: 0.83,
          same_title: true,
          reason: "same title, body 83% similar",
        },
      },
    },
  });

function renderAndSubmit() {
  const onAdded = vi.fn();
  render(<AddContentDialog open submoduleId={988} submoduleTitle="Java" onClose={vi.fn()} onAdded={onAdded} />);
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Java Fundamentals & Complexity Analysis" } });
  fireEvent.change(screen.getByLabelText("Body"), { target: { value: BODY } });
  fireEvent.click(screen.getByRole("button", { name: "Add article" }));
  return { onAdded };
}

beforeEach(() => {
  mocks.showToast.mockReset();
  mocks.addArticle.mockReset();
});

describe("AddContentDialog when an article repeats one the topic has", () => {
  it("shows which article it repeats instead of a generic error toast", async () => {
    mocks.addArticle.mockRejectedValueOnce(duplicate409());
    renderAndSubmit();

    expect(await screen.findByRole("alertdialog", { name: "Possible duplicate article" })).toBeInTheDocument();
    expect(screen.getByText(/Java Fundamentals & Complexity Analysis/, { selector: "p" })).toHaveTextContent(
      "same title, body 83% similar",
    );
    expect(screen.getByRole("button", { name: "Add anyway" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.addArticle).toHaveBeenCalledTimes(1);
    expect(mocks.addArticle.mock.calls[0][1]).not.toHaveProperty("confirm_duplicate");
  });

  it("Add anyway re-sends the same article with confirm_duplicate", async () => {
    mocks.addArticle
      .mockRejectedValueOnce(duplicate409())
      .mockResolvedValueOnce({ id: 1100, title: "Java Fundamentals & Complexity Analysis", reading_tier: "Intermediate" });
    const { onAdded } = renderAndSubmit();

    fireEvent.click(await screen.findByRole("button", { name: "Add anyway" }));

    await waitFor(() => expect(mocks.addArticle).toHaveBeenCalledTimes(2));
    expect(mocks.addArticle).toHaveBeenLastCalledWith(988, {
      title: "Java Fundamentals & Complexity Analysis",
      body: BODY,
      summary: undefined,
      confirm_duplicate: true,
    });
    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Cancel sends nothing and keeps the draft to rewrite", async () => {
    mocks.addArticle.mockRejectedValueOnce(duplicate409());
    const { onAdded } = renderAndSubmit();

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mocks.addArticle).toHaveBeenCalledTimes(1);
    expect(onAdded).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Body")).toHaveValue(BODY);
  });

  it("any other failure is still a toast", async () => {
    mocks.addArticle.mockRejectedValueOnce(
      Object.assign(new Error("boom"), { response: { status: 500, data: { detail: "Server error" } } }),
    );
    renderAndSubmit();

    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith(expect.any(String), "error"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
