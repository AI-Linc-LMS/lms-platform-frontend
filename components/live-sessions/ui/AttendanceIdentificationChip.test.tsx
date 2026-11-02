import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));
vi.mock("@/components/common/IconWrapper", () => ({
  IconWrapper: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));
vi.mock("@/components/common/mobile/ScrollRow", () => ({
  ScrollRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { AttendanceIdentificationChip } from "./LiveSessionUI";

describe("AttendanceIdentificationChip", () => {
  it("names an unregistered roster and carries the reason where a hover or a reader finds it", () => {
    render(
      <AttendanceIdentificationChip
        identification={{ mode: "pending", reason: "The roster is not registered with Zoom yet." }}
      />
    );
    const chip = screen.getByText("Roster not registered");
    expect(chip.closest("[title]")).toHaveAttribute("title", "The roster is not registered with Zoom yet.");
    expect(screen.getByLabelText(/Roster not registered\. The roster is not registered/)).toBeTruthy();
  });

  it("says attendance will be by name, in red, for a meeting or a switched-off webinar", () => {
    render(<AttendanceIdentificationChip identification={{ mode: "name_only", reason: "a meeting" }} />);
    expect(screen.getByText("Attendance by name")).toBeTruthy();
  });

  it("stays quiet when attendance is exact, unless asked to say so", () => {
    const { rerender } = render(
      <AttendanceIdentificationChip identification={{ mode: "exact", reason: "registered" }} />
    );
    expect(screen.queryByText("Attendance exact")).toBeNull();
    rerender(<AttendanceIdentificationChip identification={{ mode: "exact", reason: "registered" }} showExact />);
    expect(screen.getByText("Attendance exact")).toBeTruthy();
  });

  it("renders nothing for a session with nobody to identify, or from an older server", () => {
    const { container, rerender } = render(
      <AttendanceIdentificationChip identification={{ mode: "not_applicable", reason: "no batch" }} />
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<AttendanceIdentificationChip identification={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
