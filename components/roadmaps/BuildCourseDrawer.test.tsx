import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuildCourseDrawer } from "./BuildCourseDrawer";
import { roadmapsService, type RoadmapNode } from "@/lib/services/roadmaps.service";

/**
 * The read-before-you-build step, asserted against the payload the node endpoint really sends.
 *
 * The bug this pins: the drawer fetched the node detail and rendered NONE of its prose. A node
 * whose `summary` was empty showed a title, four counts, and then a screen of white space above
 * the button. The explanation is the reason this drawer exists, so it is a test, not a
 * preference: something explanatory has to reach the DOM for a payload that carries any.
 */

const NODE: RoadmapNode = {
  id: 412,
  title: "Model explainability with SHAP",
  kind: "subtopic",
  summary: "",
} as RoadmapNode;

function renderDrawer(node: RoadmapNode = NODE) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <BuildCourseDrawer
        slug="data-analytics-and-ai-engineer"
        node={node}
        onClose={vi.fn()}
        onBuild={vi.fn()}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("BuildCourseDrawer", () => {
  it("explains the topic even when the node's own summary is empty", async () => {
    // The real shape: no node summary, but the target carries the submodule's description.
    vi.spyOn(roadmapsService, "node").mockResolvedValue({
      id: 412,
      slug: "data-analytics-and-ai-engineer",
      title: "Model explainability with SHAP",
      kind: "subtopic",
      summary: "",
      isRequired: true,
      resources: [],
      opens: [
        {
          type: "submodule",
          courseId: 59,
          courseTitle: "Data Analytics",
          submoduleId: 1915,
          title: "Model explainability with SHAP",
          description:
            "Attribute a model's prediction to individual features using Shapley values.",
          accessible: true,
          selfEnrollable: false,
          content: { questions: 25, codingProblems: 3, readingMinutes: 12 },
        },
      ],
      totals: { steps: 1, questions: 25, codingProblems: 3, readingMinutes: 12 },
    } as Awaited<ReturnType<typeof roadmapsService.node>>);

    renderDrawer();

    expect(
      await screen.findByText(/Attribute a model's prediction to individual features/)
    ).toBeInTheDocument();
    expect(screen.getByText("25 questions")).toBeInTheDocument();
  });

  it("lists what a parent topic covers, so the syllabus is visible before committing", async () => {
    vi.spyOn(roadmapsService, "node").mockResolvedValue({
      id: 300,
      slug: "programming-fundamentals",
      title: "Variables, types and operators",
      kind: "topic",
      summary: "The vocabulary every later topic assumes.",
      isRequired: true,
      resources: [],
      opens: [],
      steps: [
        {
          id: 301, title: "Variables, input and output", selfState: "pending", accessible: true,
          courseId: 59, submoduleId: 900, summary: "", questions: 20, codingProblems: 2,
          readingMinutes: 8,
        },
        {
          id: 302, title: "Data types, casting and operators", selfState: "pending", accessible: true,
          courseId: 59, submoduleId: 901, summary: "", questions: 18, codingProblems: 2,
          readingMinutes: 7,
        },
      ],
      totals: { steps: 2, questions: 38, codingProblems: 4, readingMinutes: 15 },
    } as Awaited<ReturnType<typeof roadmapsService.node>>);

    renderDrawer({ ...NODE, id: 300, title: "Variables, types and operators", kind: "topic" });

    expect(await screen.findByText("What it covers")).toBeInTheDocument();
    expect(screen.getByText("Variables, input and output")).toBeInTheDocument();
    expect(screen.getByText("Data types, casting and operators")).toBeInTheDocument();
    expect(screen.getByText("2 topics")).toBeInTheDocument();
  });

  it("opens from the right and asks rather than instructs", async () => {
    vi.spyOn(roadmapsService, "node").mockResolvedValue({
      id: 412, slug: "s", title: "T", kind: "subtopic", summary: "A summary.",
      isRequired: true, resources: [], opens: [], totals: {},
    } as Awaited<ReturnType<typeof roadmapsService.node>>);

    const { container } = renderDrawer();

    // The map's spine sits right of centre; a left drawer covered the node just clicked.
    expect(container.ownerDocument.querySelector(".MuiDrawer-paperAnchorRight")).not.toBeNull();
    expect(await screen.findByText("Create a course on this?")).toBeInTheDocument();
    expect(screen.getByText("Yes, build it")).toBeInTheDocument();
    expect(screen.getByText("Not now")).toBeInTheDocument();
  });
});
