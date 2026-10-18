import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PracticeSourceBadge, describeSource } from "@/components/adaptive-journey/PracticeSourceBadge";
import type { PracticeItem } from "@/lib/services/adaptive-course.service";

/**
 * Additional Practice draws from the Verified Content Library first and only asks a model to
 * write what the library could not supply. The badge is the only place a learner is told which
 * they got, so what it says has to be true in all four cases — including the one where the
 * server cannot tell us, where the only honest output is nothing at all.
 */

type Item = Pick<PracticeItem, "kind" | "source" | "from_bank" | "from_ai" | "related_topic">;

const item = (over: Partial<Item> = {}): Item => ({ kind: "quiz", ...over });

describe("describeSource", () => {
  it("names the bank when everything came from it", () => {
    expect(describeSource(item({ source: "bank", from_bank: 5, from_ai: 0 })))
      .toBe("From the question bank");
  });

  it("says written for you when a model wrote it all", () => {
    expect(describeSource(item({ source: "ai", from_bank: 0, from_ai: 5 })))
      .toBe("Written for you");
  });

  it("gives both counts for a mixed set, because the split is the point", () => {
    expect(describeSource(item({ source: "mixed", from_bank: 7, from_ai: 3 })))
      .toBe("7 questions from the bank · 3 newly written");
  });

  it("uses the right noun per kind, and the singular when there is one", () => {
    expect(describeSource(item({ kind: "coding", source: "mixed", from_bank: 1, from_ai: 2 })))
      .toBe("1 problem from the bank · 2 newly written");
    expect(describeSource(item({ kind: "article", source: "mixed", from_bank: 2, from_ai: 1 })))
      .toBe("2 explainers from the bank · 1 newly written");
  });

  it("says nothing when the server sent no provenance", () => {
    // A server predating the library returns no source. Guessing "AI" would be a claim the
    // page cannot support, so the badge stays silent.
    expect(describeSource(item({}))).toBeNull();
    expect(describeSource(item({ from_bank: 3 }))).toBeNull();
  });

  it("does not print a zero side if the server says mixed but sends one", () => {
    expect(describeSource(item({ source: "mixed", from_bank: 4, from_ai: 0 })))
      .toBe("From the question bank");
    expect(describeSource(item({ source: "mixed", from_bank: 0, from_ai: 4 })))
      .toBe("Written for you");
  });
});

describe("PracticeSourceBadge", () => {
  it("renders the label", () => {
    render(<PracticeSourceBadge item={item({ source: "bank", from_bank: 5 })} />);
    expect(screen.getByText("From the question bank")).toBeInTheDocument();
  });

  it("renders nothing at all without a source", () => {
    const { container } = render(<PracticeSourceBadge item={item({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("flags a set filled from the wider module", () => {
    // The learner is revising one lesson; material drawn from a neighbouring one is still
    // useful but is not the same thing, and they should be able to tell.
    render(<PracticeSourceBadge item={item({ source: "bank", from_bank: 5, related_topic: true })} />);
    expect(screen.getByText(/related topic/)).toBeInTheDocument();
  });

  it("omits the related-topic note when the material is on-topic", () => {
    render(<PracticeSourceBadge item={item({ source: "bank", from_bank: 5 })} />);
    expect(screen.queryByText(/related topic/)).not.toBeInTheDocument();
  });

  it("does not dress bank content in the AI gradient", () => {
    // AIPill owns the indigo-violet-pink gradient as the house marker for model-written
    // content. Verified library content wearing it would say the opposite of what this badge
    // exists to say, so the two sources must not render alike.
    const bank = render(<PracticeSourceBadge item={item({ source: "bank", from_bank: 5 })} />);
    const bankHtml = bank.container.innerHTML;
    bank.unmount();
    const ai = render(<PracticeSourceBadge item={item({ source: "ai", from_ai: 5 })} />);
    expect(ai.container.innerHTML).not.toBe(bankHtml);
  });
});
