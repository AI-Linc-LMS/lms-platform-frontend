// @vitest-environment jsdom
/**
 * "When changing the coding language from Python to C++, the language selector updates to C++,
 *  but the coding IDE remains populated with the Python starter code."
 *
 * The modal was handed one starter - the one for whichever language the problem listed first -
 * and the picker only ever moved a label. A candidate who chose C++ was asked to write C++
 * underneath a Python function signature, and whatever they submitted was graded as C++.
 *
 * The modal now receives every starter the problem ships and keeps a draft per language, so
 * switching gives you the right skeleton and switching back gives you your own work.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

import { CodingQuestionModal } from "./CodingQuestionModal";

const PYTHON = "def solve():\n    pass\n";
const CPP = "#include <bits/stdc++.h>\nint solve() { return 0; }\n";

const problem = {
  title: "Two Sum",
  statement: "Find two numbers that add to the target.",
  language: "python",
  starter_code: PYTHON,
  starters: { python: PYTHON, cpp: CPP },
} as never;

async function pick(language: string) {
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.click(await screen.findByRole("option", { name: language }));
}

describe("switching the coding language", () => {
  it("brings the starter for the language that was chosen", async () => {
    const onSubmit = vi.fn();
    render(<CodingQuestionModal open problem={problem} onSubmit={onSubmit} />);

    await pick("C++");
    await userEvent.click(screen.getByRole("button", { name: /submit code/i }));

    expect(onSubmit).toHaveBeenCalledWith({ code: CPP.trim(), language: "cpp" });
  });

  it("does not throw away what the candidate already wrote in the other language", async () => {
    const onSubmit = vi.fn();
    render(<CodingQuestionModal open problem={problem} onSubmit={onSubmit} />);

    await pick("C++");
    await pick("Python");
    await userEvent.click(screen.getByRole("button", { name: /submit code/i }));

    expect(onSubmit).toHaveBeenCalledWith({ code: PYTHON.trim(), language: "python" });
  });

  it("a language the problem ships no starter for opens empty rather than lying", async () => {
    render(<CodingQuestionModal open problem={problem} onSubmit={vi.fn()} />);

    await pick("Java");

    // Empty, not Python: the editor has nothing to submit, so Submit stays shut.
    expect(screen.getByRole("button", { name: /submit code/i })).toBeDisabled();
  });
});
