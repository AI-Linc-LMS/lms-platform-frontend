import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import "@/lib/i18n";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import { JSelect } from "./Field";

/**
 * On /admin/jobs-v2 at 360px the status, sort and bulk-action selects drew a 44px field around a
 * 30-33px display box, and a Select only opens from that box. On a phone the box fills the field;
 * desktop keeps MUI's box, so the rule must live in the phone block only.
 */
describe("JSelect on a phone", () => {
  it("makes the part that opens the list 44px tall, on a phone only", () => {
    const { container } = render(
      <JSelect label="Status" value="active" onChange={() => {}} options={[{ value: "active", label: "Active" }]} />,
    );
    const root = container.querySelector(".MuiInputBase-root")!;
    const css = cssByMedia(root);
    expect(css.phone).toMatch(/\.MuiSelect-select\.MuiInputBase-input\{[^}]*min-height:44px/);
    expect(css.phone).toMatch(/\.MuiSelect-select\.MuiInputBase-input\{[^}]*margin-block:-1px/);
    expect(css.unscoped).not.toMatch(/\.MuiSelect-select\.MuiInputBase-input\{/);
  });
});
