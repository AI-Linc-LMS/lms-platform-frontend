import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * The "Complete profile" lock on Jobs, Resume and Interview, on a phone.
 *
 * Measured at 360px: the banner's button was 33px tall, and the "Profile 40% complete" line and
 * the missing-field chips were 11.5-11.8px. The phone gets 44px and 12px; desktop keeps its sizes,
 * so the phone values must appear only inside the max-width:599.95px block.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({
    percentage: 40,
    missingFields: [],
    completion: {
      required_fields: [
        { field: "phone", label: "Phone number", filled: false },
        { field: "dob", label: "Date of birth", filled: false },
        { field: "name", label: "Name", filled: true },
      ],
    },
  }),
}));

import { ProfileLockBanner, ProfileLockCard } from "./ProfileLock";

describe("the profile lock on a phone", () => {
  it("gives the banner's Complete profile button a 44px target on a phone only", () => {
    render(<ProfileLockBanner moduleLabel="Jobs" />);
    const css = cssByMedia(screen.getByTestId("complete-profile-button"));
    expect(css.phone).toContain("min-height:44px");
    expect(css.unscoped).not.toContain("min-height:44px");
  });

  it("draws the progress line and the missing-field chips at 12px on a phone only", () => {
    render(<ProfileLockCard title="Jobs are locked" body="Finish your profile" />);
    const pct = cssByMedia(screen.getByTestId("profile-percent"));
    expect(pct.phone).toContain("font-size:0.75rem");
    expect(pct.unscoped).toContain("font-size:0.72rem");
    expect(pct.unscoped).not.toContain("font-size:0.75rem");

    const chips = screen.getAllByTestId("missing-field-chip");
    expect(chips.map((c) => c.textContent)).toEqual(["Phone number", "Date of birth"]);
    const chip = cssByMedia(chips[0]);
    expect(chip.phone).toContain("font-size:0.75rem");
    expect(chip.unscoped).toContain("font-size:0.74rem");
    expect(chip.unscoped).not.toContain("font-size:0.75rem");
  });
});
