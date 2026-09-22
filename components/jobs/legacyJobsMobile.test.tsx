import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The legacy /jobs board on a phone. Measured at 390px: 26px page buttons, a 28px save heart,
 * 37px Easy Apply and a 30px search field. A phone gets 44px targets. 600px and up are unchanged.
 */

import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import { JobPagination } from "./JobPagination";

const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

describe("legacy job board pagination", () => {
  it("drops the first/last arrows on a phone but keeps page 1 and the last page one tap away", () => {
    viewport(390);
    render(<JobPagination totalCount={2220} pageSize={20} page={5} onPageChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Go to first page" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Go to last page" })).toBeNull();
    expect(screen.getByRole("button", { name: "Go to page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to page 111" })).toBeInTheDocument();
  });

  it("keeps the first/last arrows on a desktop", () => {
    viewport(1440);
    render(<JobPagination totalCount={2220} pageSize={20} page={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Go to first page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to last page" })).toBeInTheDocument();
  });

  it("makes the page buttons 44px inside the phone block only", () => {
    viewport(390);
    render(<JobPagination totalCount={2220} pageSize={20} page={5} onPageChange={vi.fn()} />);
    const css = cssByMedia(screen.getByRole("navigation"));
    expect(css.phone).toContain("min-width:44px");
    expect(css.phone).toContain("height:44px");
    expect(css.unscoped).not.toContain("44px");
  });
});
