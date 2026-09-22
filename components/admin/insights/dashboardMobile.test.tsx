import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import { DashboardHero, HeroKpi, DeckSection } from "@/components/admin/dashboard/v2/surfaces";
import { DefinitionMark, Panel } from "./primitives";
import { phoneFont } from "./phoneType";

/**
 * The admin dashboard on a phone.
 *
 * jsdom has no layout, so what is pinned is the emitted CSS: every phone size sits inside the
 * max-width:599.95px block and the desktop still receives exactly the authored value.
 */

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

function hero() {
  return render(
    <DashboardHero
      tenantName="Demo"
      summary="10 of 186 students were active."
      facts={[{ icon: "mdi:school-outline", label: "34 adaptive courses" }]}
      range="30d"
      onRangeChange={vi.fn()}
      courses={[]}
      courseId={null}
      onCourseChange={vi.fn()}
    >
      <HeroKpi label="Students active" value={10} denominator={186} definition="Did one activity." footnote="per day" />
    </DashboardHero>,
  );
}

describe("phoneFont", () => {
  it("floors a small size to 12px on a phone and leaves the authored size for every other width", () => {
    expect(phoneFont(0.62)).toEqual({
      fontSize: "0.62rem",
      "@media (max-width:599.95px)": { fontSize: "0.75rem" },
    });
  });

  it("adds no phone rule to a size that is already readable", () => {
    expect(phoneFont(0.9)).toEqual({ fontSize: "0.9rem" });
  });
});

describe("dashboard hero on a phone", () => {
  it("range pills are 44px tall on a phone only", () => {
    hero();
    expectPhoneOnly(screen.getByRole("button", { name: "30D" }), /min-height:44px/);
  });

  it("the course picker takes its own row at 44px on a phone only", () => {
    hero();
    const picker = screen.getByRole("button", { name: /All adaptive courses/ });
    expectPhoneOnly(picker, /min-height:44px/);
    expectPhoneOnly(picker, /max-width:none/);
    // The desktop keeps its 320px cap.
    expect(cssByMedia(picker).unscoped).toMatch(/max-width:320px/);
  });

  it("KPI labels are 12px on a phone and keep their 0.62rem on a desktop", () => {
    hero();
    const label = screen.getByText("Students active");
    expectPhoneOnly(label, /font-size:0\.75rem/);
    expect(cssByMedia(label).unscoped).toMatch(/font-size:0\.62rem/);
  });

  it("the tenant eyebrow and section rules are 12px on a phone only", () => {
    hero();
    expectPhoneOnly(screen.getByText("Demo · Analytics"), /font-size:0\.75rem/);
    render(<DeckSection title="Who is here" />);
    expectPhoneOnly(screen.getByText("Who is here"), /font-size:0\.75rem/);
  });
});

describe("charts and info marks on a phone", () => {
  it("every recharts tick and legend inside a Panel is 12px on a phone only", () => {
    render(
      <Panel title="Activity trend" icon="mdi:chart-line">
        <div data-testid="panel-body-child" />
      </Panel>,
    );
    const body = screen.getByTestId("panel-body-child").parentElement!;
    expectPhoneOnly(body, /recharts-cartesian-axis-tick-value[^{]*\{font-size:12px/);
    expectPhoneOnly(body, /recharts-legend-item-text\{font-size:12px/);
  });

  it("a definition mark has a 44px touch area on a phone only", () => {
    const { container } = render(<DefinitionMark text="What this counts." />);
    const mark = container.querySelector("span")!;
    expectPhoneOnly(mark, /::after\{[^}]*width:44px;height:44px/);
  });
});
