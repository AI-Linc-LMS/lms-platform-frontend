/**
 * The preview must actually render at the chosen device width.
 *
 * Reported as "the live preview is still not responsive". The claim is testable: a media query
 * fires on the frame's own CSS width, so switching to Desktop must make the iframe 1280px wide —
 * not merely look different. If the frame stays at the pane's width, every project is previewed
 * at one size and a breakpoint brief cannot be checked at all.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectPreview from "./ProjectPreview";

const FILES = {
  "index.html": `<!doctype html><link rel="stylesheet" href="styles.css"><body><h1>Hi</h1></body>`,
  "styles.css": "h1{color:red}",
};

beforeAll(() => {
  // jsdom has no ResizeObserver; the component uses it to measure the pane.
  if (!(globalThis as { ResizeObserver?: unknown }).ResizeObserver) {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function frame(): HTMLIFrameElement {
  return screen.getByTitle("Project preview") as HTMLIFrameElement;
}

describe("ProjectPreview device widths", () => {
  it("offers the device controls", () => {
    render(<ProjectPreview files={FILES} />);
    for (const label of ["Phone", "Tablet", "Desktop", "Fit to pane"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("lays the frame out at the DEVICE width, not the pane width", () => {
    render(<ProjectPreview files={FILES} />);

    fireEvent.click(screen.getByLabelText("Phone"));
    expect(frame().style.width).toBe("390px");

    fireEvent.click(screen.getByLabelText("Tablet"));
    expect(frame().style.width).toBe("768px");

    // The one that matters: a desktop layout must be laid out at 1280 even in a narrow pane,
    // or the desktop half of a media query can never be seen.
    fireEvent.click(screen.getByLabelText("Desktop"));
    expect(frame().style.width).toBe("1280px");
  });

  it("returns to filling the pane on Fit", () => {
    render(<ProjectPreview files={FILES} />);
    fireEvent.click(screen.getByLabelText("Desktop"));
    fireEvent.click(screen.getByLabelText("Fit to pane"));
    expect(frame().style.width).toBe("100%");
  });

  it("reports the width the media queries are seeing", () => {
    render(<ProjectPreview files={FILES} />);
    fireEvent.click(screen.getByLabelText("Tablet"));
    expect(screen.getByText(/768px/)).toBeTruthy();
  });

  it("surfaces the project's OWN breakpoints, either side of the rule", () => {
    // The pricing brief's case exactly: a 600px rule, and a pane that happens to sit at 591 —
    // so "fit" silently shows the narrow branch and the design looks like it never responds.
    const responsive = {
      ...FILES,
      "styles.css": "#pricing{display:grid;grid-template-columns:repeat(3,1fr)}" +
                    "@media (max-width: 600px){#pricing{grid-template-columns:1fr}}",
    };
    render(<ProjectPreview files={responsive} />);

    fireEvent.click(screen.getByText("◂600"));
    expect(frame().style.width).toBe("600px");

    // 601 is the only width that certainly falls on the wide side: a max-width rule matches AT
    // its own value, so 600 is narrow.
    fireEvent.click(screen.getByText("600▸"));
    expect(frame().style.width).toBe("601px");
  });

  it("offers no breakpoint chips when the project declares none", () => {
    render(<ProjectPreview files={FILES} />);
    expect(screen.queryByText(/^◂/)).toBeNull();
  });

  it("marks the active device so the current width is obvious", () => {
    render(<ProjectPreview files={FILES} />);
    fireEvent.click(screen.getByLabelText("Desktop"));
    expect(screen.getByLabelText("Desktop").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Phone").getAttribute("aria-pressed")).toBe("false");
  });
});
