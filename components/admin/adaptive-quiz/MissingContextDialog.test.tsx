import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react";

/**
 * The backend refuses to publish an adaptive-quiz question whose stem points at a figure, table or
 * code it does not include, and answers 400 with code "missing_context". The rule misfires on some
 * legitimate wording, so the author sees the questions and decides: go back and fix them, or save
 * anyway (the same request again, with confirm_missing_context).
 */

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | { defaultValue?: string; [k: string]: unknown }) => {
      const template = typeof opts === "string" ? opts : opts?.defaultValue;
      if (!template) return key;
      return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        typeof opts === "object" && opts && k in opts ? String(opts[k]) : "",
      );
    },
  }),
}));

import { MissingContextDialog, useMissingContextConfirm } from "./MissingContextDialog";
import { readMissingContext, stemText, type MissingContextQuestion } from "@/lib/utils/missing-context";

const FLAGGED: MissingContextQuestion = {
  index: 1,
  id: null,
  question_text: "<p>How many rows does an INNER JOIN of customers to orders return <strong>here</strong>?</p>",
  reason: 'The question says "JOIN of customers to orders return here" but does not include what it refers to.',
  rule: "here-without-scenario",
  phrase: "JOIN of customers to orders return here",
};

function refusal(questions: unknown[] = [FLAGGED]) {
  return {
    message: "Request failed with status code 400",
    response: {
      status: 400,
      data: { detail: "Question 2 (...) seems to refer to ...", code: "missing_context", questions },
    },
  };
}

describe("readMissingContext", () => {
  it("returns the flagged questions from the server's refusal", () => {
    expect(readMissingContext(refusal())).toEqual([FLAGGED]);
  });

  it("is null for any other error", () => {
    expect(readMissingContext({ response: { status: 400, data: { detail: "min_questions cannot exceed max_questions." } } })).toBeNull();
    expect(readMissingContext({ response: { status: 500, data: { code: "missing_context", questions: [FLAGGED] } } })).toBeNull();
    expect(readMissingContext(refusal([]))).toBeNull();
    expect(readMissingContext(refusal([{ nonsense: true }]))).toBeNull();
    expect(readMissingContext(new Error("Network Error"))).toBeNull();
    expect(readMissingContext(null)).toBeNull();
  });
});

describe("stemText", () => {
  it("lists a stem as plain text, markup removed and entities decoded", () => {
    expect(stemText("<p>Is 3 &lt; 5   <em>here</em>?</p><pre><code>print(3 &lt; 5)</code></pre>")).toBe(
      "Is 3 < 5 here?print(3 < 5)",
    );
    expect(stemText("")).toBe("");
  });

  it("parses in a separate document, never in the page's", () => {
    // An element of the page given innerHTML starts loading any <img> in it (and runs its onerror);
    // a DOMParser document is inert. So the page's document must not be touched at all.
    const created = vi.spyOn(document, "createElement");
    expect(stemText('<img src="https://example.com/x.png" onerror="alert(1)">Which join?')).toBe("Which join?");
    expect(created).not.toHaveBeenCalled();
    created.mockRestore();
  });
});

describe("MissingContextDialog", () => {
  it("lists each question with its number and reason, and offers both choices", () => {
    const onGoBack = vi.fn();
    const onSaveAnyway = vi.fn();
    render(<MissingContextDialog open questions={[FLAGGED]} onGoBack={onGoBack} onSaveAnyway={onSaveAnyway} />);
    const dialog = screen.getByTestId("missing-context-dialog");
    expect(within(dialog).getByText("Check these questions")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "These questions seem to refer to a figure, table or code they don't include. Learners can't answer them without it.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Question 2")).toBeInTheDocument();
    expect(within(dialog).getByText("How many rows does an INNER JOIN of customers to orders return here?")).toBeInTheDocument();
    expect(within(dialog).getByText(FLAGGED.reason)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Go back and fix" }));
    expect(onGoBack).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save anyway" }));
    expect(onSaveAnyway).toHaveBeenCalledTimes(1);
  });
});

describe("useMissingContextConfirm", () => {
  it("opens on the refusal, and Save anyway closes it and resends", () => {
    const { result } = renderHook(() => useMissingContextConfirm());
    const resend = vi.fn();
    let handled = false;
    act(() => {
      handled = result.current.intercept(refusal(), resend);
    });
    expect(handled).toBe(true);
    expect(result.current.dialogProps.open).toBe(true);
    expect(result.current.dialogProps.questions).toEqual([FLAGGED]);

    act(() => result.current.dialogProps.onSaveAnyway());
    expect(resend).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps.open).toBe(false);
  });

  it("leaves any other error to the page, and going back never resends", () => {
    const { result } = renderHook(() => useMissingContextConfirm());
    const resend = vi.fn();
    expect(result.current.intercept({ response: { status: 400, data: { detail: "no" } } }, resend)).toBe(false);
    expect(result.current.dialogProps.open).toBe(false);

    act(() => {
      result.current.intercept(refusal(), resend);
    });
    act(() => result.current.dialogProps.onGoBack());
    expect(result.current.dialogProps.open).toBe(false);
    expect(resend).not.toHaveBeenCalled();
  });
});
