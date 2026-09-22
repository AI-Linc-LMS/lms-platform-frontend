import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * The sidebar's tenant name, shown when the logo fails to load.
 *
 * It first shipped as a centring flexbox; text-overflow does not apply to a flex container, so
 * "Kalinga Institute of Industrial Technology" rendered as "nstitute of Industrial Te", cut at
 * both ends. Pinned: a block with an ellipsis, centred by text-align, vertically by line-height.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
}));

import { sidebarWordmarkSx } from "./Sidebar";
import { TenantLogo } from "@/components/common/TenantLogo";

describe("sidebar logo wordmark", () => {
  it("ends a long name in an ellipsis instead of cutting it at both ends", () => {
    render(
      <TenantLogo
        src="https://be.example/branding/asset/9/"
        name="Kalinga Institute of Industrial Technology"
        wordmarkSx={sidebarWordmarkSx(48, "#fff")}
      />,
    );
    fireEvent.error(screen.getByRole("img"));
    const css = cssByMedia(screen.getByTestId("tenant-wordmark")).unscoped;
    expect(css).toContain("text-overflow:ellipsis");
    expect(css).toContain("white-space:nowrap");
    expect(css).toContain("overflow:hidden");
    expect(css).toContain("text-align:center");
    expect(css).toContain("line-height:48px");
    expect(css).not.toContain("display:flex");
    expect(css).not.toContain("justify-content:center");
  });
});
