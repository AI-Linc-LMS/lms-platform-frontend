/**
 * Choosing a certificate design: select, then confirm.
 *
 * Reported as "when changing the certificate template for a course or assessment, the selection UI
 * is unclear and difficult to use - and the modal is so zoomed it is not possible to navigate". A
 * click used to APPLY the design and close the dialog, so an admin comparing two lost the gallery
 * the moment they touched one. Now a click selects, the footer names what is selected, and "Use
 * this design" applies it.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("@/components/certificate/CertificatePreview", () => ({
  CertificatePreview: () => <div data-testid="preview" />,
}));
vi.mock("@/lib/certificates/useIssuer", () => ({
  useCertificateIssuer: () => ({ name: "CodePaathshala" }),
}));

import type { CertificateTemplate } from "@/lib/certificates/types";
import { TemplatePickerField } from "./TemplatePickerField";
import { designFromTemplate } from "./previewPayload";

const tpl = (id: number, name: string) =>
  ({
    id, name, slug: `t${id}`, description: "", kind: "design", layout: "classic",
    preset: "gold", palette_overrides: null, ornament_level: null, band_label: "", seal_code: "",
    asset: null, asset_url: null, field_placements: null, is_active: true, is_archived: false,
    default_for: null, created_by_name: "", usage: { rules: 0, tiers: 0, issued: 0 },
    design: designFromTemplate(null, "#7c3aed"),
  }) as unknown as CertificateTemplate;

const TEMPLATES = [tpl(1, "Assessment Excellence"), tpl(2, "Assessment Participation")];

function open(onChange = vi.fn(), value: number | null = null) {
  render(<TemplatePickerField templates={TEMPLATES} value={value} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: /change/i }));
  return onChange;
}

describe("the certificate design picker", () => {
  it("does not apply a design on the first click", () => {
    const onChange = open();
    fireEvent.click(screen.getByRole("button", { name: /Assessment Participation/ }));
    expect(onChange).not.toHaveBeenCalled();
    // The dialog is still open to compare with another.
    expect(screen.getByText("Choose a certificate design")).toBeInTheDocument();
  });

  it("names what is selected in the footer", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: /Assessment Participation/ }));
    expect(screen.getByText("Selected:").parentElement?.textContent).toContain("Assessment Participation");
  });

  it("applies the selection with Use this design", () => {
    const onChange = open();
    fireEvent.click(screen.getByRole("button", { name: /Assessment Participation/ }));
    fireEvent.click(screen.getByRole("button", { name: "Use this design" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("changes nothing on Cancel", () => {
    const onChange = open();
    fireEvent.click(screen.getByRole("button", { name: /Assessment Participation/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies at once on a double-click, for the admin who already knows", () => {
    const onChange = open();
    fireEvent.doubleClick(screen.getByRole("button", { name: /Assessment Excellence/ }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("keeps Use this design disabled until something different is picked", () => {
    open(vi.fn(), 1);
    expect(screen.getByRole("button", { name: "Use this design" })).toBeDisabled();
  });
});
