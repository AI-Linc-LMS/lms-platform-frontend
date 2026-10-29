import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { QuestionTitle } from "./QuestionTitle";

/**
 * A C question must keep its `#include` on screen.
 *
 * `QuestionTitle` is what the exam player renders a stem with (AssessmentQuizLayout), and it chose
 * between HTML and text with `/<[a-z][\s\S]*>/i`. That says yes to `#include <stdio.h>`, so the
 * stem went through RichHtml, the browser parsed `<stdio.h>` as an unknown element, and swallowed
 * it. Candidates were asked to predict the output of a program whose first line read `#include`.
 * Found on a live eligibility paper: 7 of its 20 C/C++ questions were in that state.
 */

const C_PROGRAM = `What is the output of the following C program?

#include <stdio.h>
int main() {
    int i;
    for (i = 0; i < 5; i++);
    printf("%d", i);
    return 0;
}`;

describe("a question stem that contains code", () => {
  it("keeps a C include directive visible", () => {
    render(<QuestionTitle question={C_PROGRAM} />);
    expect(screen.getByText(/#include <stdio\.h>/)).toBeTruthy();
  });

  it("keeps a C++ include and a stream insertion visible", () => {
    render(<QuestionTitle question={"#include <iostream>\nstd::cout << x;"} />);
    expect(screen.getByText(/#include <iostream>/)).toBeTruthy();
    expect(screen.getByText(/std::cout << x;/)).toBeTruthy();
  });

  it("keeps a generic type visible", () => {
    render(<QuestionTitle question={"What does List<String> hold?"} />);
    expect(screen.getByText(/List<String>/)).toBeTruthy();
  });

  it("still renders authored markup as markup", () => {
    render(<QuestionTitle question={"<p>Consider <code>x = 1</code> and answer</p>"} />);
    // The tags are interpreted, so the text node is the prose without them.
    expect(screen.getByText(/Consider/).textContent).not.toContain("<code>");
  });
});
