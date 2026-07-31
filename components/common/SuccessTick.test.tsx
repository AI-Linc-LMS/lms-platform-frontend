import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SuccessTick } from "@/components/common/SuccessTick";

/**
 * The login tick was reported broken three times and "fixed" twice.
 *
 * The second fix was still invisible in production: `SignInLoader` renders at `zIndex: 9999` and
 * this component at `2000`, so the spinner covered the animation completely. Nothing caught it,
 * because there was nothing to catch it with.
 *
 * A component test cannot know which overlay the app happens to mount alongside — but it CAN pin
 * the two properties that made the bug possible: the tick is announced to assistive tech (so it
 * is findable at all), and its stacking order is a stated contract rather than an accident.
 */

describe("SuccessTick", () => {
  it("announces itself rather than being a silent decoration", () => {
    render(<SuccessTick label="Login successful!" />);
    // role=status + aria-live means a screen reader hears the confirmation. It is also what
    // makes the element findable in a test, which is the practical half.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Login successful!")).toBeInTheDocument();
  });

  it("renders the sublabel when given one", () => {
    render(<SuccessTick label="Signed out" sublabel="See you soon" />);
    expect(screen.getByText("See you soon")).toBeInTheDocument();
  });

  it("covers the screen", () => {
    // A confirmation that scrolls with the page, or sits in a corner, is the toast this replaced.
    render(<SuccessTick label="Login successful!" />);
    const overlay = screen.getByRole("status");
    expect(getComputedStyle(overlay).position).toBe("fixed");
  });

  it("states a stacking order", () => {
    /**
     * This is the regression guard.
     *
     * The tick was rendered UNDER a spinner for an entire release because nothing recorded what
     * it had to sit above. If someone lowers this, the test fails and they have to think about
     * the loader at 9999 — which is exactly the conversation that did not happen last time.
     */
    render(<SuccessTick label="Login successful!" />);
    const z = Number(getComputedStyle(screen.getByRole("status")).zIndex);
    expect(z).toBeGreaterThanOrEqual(2000);
  });
});
