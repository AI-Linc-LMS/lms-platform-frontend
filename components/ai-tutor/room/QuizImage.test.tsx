// @vitest-environment jsdom
/**
 * "The diagram for the question is not visible, leaving the student unable to understand or
 *  answer the diagram-based question."
 *
 * The root cause was on the backend - the image lookup abstained on the tutor's own phrasing and
 * never asked Wikipedia for the subject - but the overlay had the second half of the problem: a
 * question whose picture did not arrive was still presented as a question, with the options live
 * and Check my answer armed. Answering it was scored, and a wrong answer was recorded against a
 * learner who had nothing to look at.
 *
 * What is pinned here: the picture is described for a screen reader, it cannot push the options
 * off a phone screen, and when it is missing the question stops being answerable rather than
 * becoming a guess.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuizOverlay } from "./QuizOverlay";
import type { PooledQuestion, QuizGradeResult } from "@/lib/services/ai-tutor.service";

const PHONE_QUERY = "(max-width:599.95px)";
const MEDIA_BLOCK = /@media\s*([^{]+)\{((?:[^{}]|\{[^{}]*\})*)\}/g;

/** The emitted CSS for one element, split into the phone-only block and everything else. */
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const classes = Array.from(el.classList).filter(
    (c) => c.startsWith("css-") || c.startsWith("mui-"),
  );
  const pick = (text: string) =>
    classes
      .flatMap((c) =>
        text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`)),
      )
      .join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) =>
    q.trim() === PHONE_QUERY ? "" : block,
  );
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

const DIAGRAM: PooledQuestion = {
  id: 7,
  question: "In the diagram, which part takes in water from the soil?",
  image: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Plant_Anatomy.svg",
  image_alt: "A plant with its roots, stem and leaves labelled.",
  options: [
    { id: "A", label: "Roots" },
    { id: "B", label: "Stem" },
    { id: "C", label: "Leaves" },
  ],
  style: "single",
  difficulty: "Easy",
  topic: "plants",
};

function setup(question: PooledQuestion, graded?: QuizGradeResult | null) {
  const onClose = vi.fn();
  const onAnswer = vi.fn(async () => graded ?? null);
  render(<QuizOverlay question={question} onAnswer={onAnswer} onClose={onClose} />);
  return { onClose, onAnswer };
}

describe("the diagram itself", () => {
  it("shows the picture, described for a screen reader", () => {
    setup(DIAGRAM);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(DIAGRAM.image);
    expect(img.getAttribute("alt")).toBe(DIAGRAM.image_alt);
  });

  it("never leaves alt empty, because the picture IS the question", () => {
    // A bank row copied by an older path can arrive with the image and no alt text. An empty
    // alt tells a screen reader to skip the only thing being asked about.
    setup({ ...DIAGRAM, image_alt: "" });
    expect(screen.getByRole("img").getAttribute("alt")).toBe("Picture for this question");
  });

  it("caps the picture against the viewport on a phone, and only on a phone", () => {
    // Unscoped, a tall diagram is taller than a 360px screen and every option sits below the
    // fold. An `xs` value would cap the desktop dialog too.
    setup(DIAGRAM);
    const css = cssOf(screen.getByRole("img"));
    expect(css.phone).toMatch(/max-height:38vh/);
    expect(css.unscoped).not.toMatch(/max-height/);
  });
});

describe("a diagram question whose diagram did not arrive", () => {
  it("says so instead of showing a broken picture", () => {
    setup(DIAGRAM);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("This picture did not load")).toBeTruthy();
  });

  it("stops being answerable: no option can be picked and there is no Check", async () => {
    const user = userEvent.setup();
    const { onAnswer } = setup(DIAGRAM);
    fireEvent.error(screen.getByRole("img"));

    await user.click(screen.getByText("Roots"));
    expect(screen.queryByRole("button", { name: "Check my answer" })).toBeNull();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("leaves as a skip, so the tutor is told and nothing is recorded", async () => {
    const user = userEvent.setup();
    const { onClose, onAnswer } = setup(DIAGRAM);
    fireEvent.error(screen.getByRole("img"));

    await user.click(screen.getByRole("button", { name: "Skip this one" }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledWith(false));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("does not interfere with a question that has no picture at all", async () => {
    const user = userEvent.setup();
    const { onAnswer } = setup(
      { ...DIAGRAM, image: "", image_alt: "" },
      { ok: true, is_correct: true, correct: ["A"], selected: ["A"], explanation: "" },
    );
    await user.click(screen.getByText("Roots"));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    expect(onAnswer).toHaveBeenCalledWith(7, ["A"]);
  });
});

describe("the server declining to mark it", () => {
  it("is reported as not counted, never as a wrong answer", async () => {
    const user = userEvent.setup();
    setup(DIAGRAM, { ok: false, reason: "unanswerable" });

    await user.click(screen.getByText("Roots"));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));

    expect(await screen.findByText("Not counted")).toBeTruthy();
    expect(screen.queryByText("Not quite.")).toBeNull();
    // `gradeError` would offer Try again. Retrying asks the same impossible question again.
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.queryByText("Could not check that")).toBeNull();
  });

  it("closes as a skip, so no answer is ever attributed to the learner", async () => {
    const user = userEvent.setup();
    const { onClose } = setup(DIAGRAM, { ok: false, reason: "unanswerable" });

    await user.click(screen.getByText("Roots"));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    await user.click(await screen.findByRole("button", { name: "Skip this one" }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalledWith(false));
  });

  it("still offers Try again when the round trip simply failed", async () => {
    const user = userEvent.setup();
    setup(DIAGRAM, null);

    await user.click(screen.getByText("Roots"));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));

    expect(await screen.findByText("Could not check that")).toBeTruthy();
    expect(screen.queryByText("Not counted")).toBeNull();
  });
});
