/**
 * Deleting a certificate design permanently, not just archiving it.
 *
 * Requested as "[Certificate][Admin] there should be an option for deleting templates - there is
 * only archiving. Add the delete option that permanently deletes a template, not just archive."
 * The screenshot was an ARCHIVED design in use (1 band, 1 issued), whose menu offered only
 * "Restore to the library".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("@/components/certificates/CertificateRenderer", () => ({
  CertificateRenderer: () => <div data-testid="preview" />,
}));

import type { CertificateTemplate } from "@/lib/certificates/types";
import { TemplateCard } from "./TemplateCard";
import { describeInUse } from "./TemplatesTab";
import { designFromTemplate } from "./previewPayload";

const t = (_key: string, fallback: string, opts?: Record<string, unknown>) =>
  fallback.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => String(opts?.[k] ?? ""));

describe("what the in-use confirmation says", () => {
  const details = {
    bands: 1, rungs: 2, issued: 1,
    affected_bands: [{ id: 7, label: "Course completion", scope: "adaptive_course", target: "How does Android work?" }],
  };

  it("names each course that would stop awarding it", () => {
    expect(describeInUse(details, t)).toContain("Course completion · How does Android work?");
  });

  it("says what happens to ladder rungs", () => {
    expect(describeInUse(details, t)).toContain("switch 2 points-ladder rung(s) to the default design");
  });

  it("tells the admin that certificates already issued are kept", () => {
    // The fear an admin brings to "delete permanently" is that learners lose their certificates.
    // They do not, and the dialog says so in as many words.
    expect(describeInUse(details, t)).toContain("keep the 1 certificate(s) already issued");
  });

  it("offers archiving as the way to change nothing", () => {
    expect(describeInUse(details, t)).toMatch(/archive it instead/i);
  });

  it("leaves out anything that does not apply", () => {
    const text = describeInUse({ bands: 0, rungs: 0, issued: 3 }, t);
    expect(text).not.toContain("band");
    expect(text).not.toContain("rung");
  });
});

describe("the design card's menu", () => {
  const archivedInUse = {
    id: 5, slug: "narcotics", name: "How To Prevent Narcotics Addiction", description: "",
    kind: "brand", layout: "classic", preset: "brand-classic", palette_overrides: null,
    ornament_level: null, band_label: "", seal_code: "", asset: null, asset_url: null,
    field_placements: null, is_active: false, is_archived: true, default_for: null,
    created_by_name: "", usage: { rules: 1, tiers: 0, issued: 1 },
    // A complete, real design block - the same fallback the editor draws a blank template with.
    design: designFromTemplate(null, "#7c3aed"),
  } as unknown as CertificateTemplate;

  function renderCard(onDeletePermanently = vi.fn()) {
    render(
      <TemplateCard
        template={archivedInUse}
        issuer={{ name: "Finlatics" } as never}
        onEdit={vi.fn()} onDuplicate={vi.fn()} onSetDefault={vi.fn()}
        onToggleArchive={vi.fn()} onDelete={vi.fn()} onAssign={vi.fn()}
        onDeletePermanently={onDeletePermanently}
      />,
    );
    return onDeletePermanently;
  }

  it("offers Delete permanently on an archived design that is in use - the reported case", () => {
    const onDeletePermanently = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /more|actions|options/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /delete permanently/i }));
    expect(onDeletePermanently).toHaveBeenCalledWith(archivedInUse);
  });

  it("still offers restoring it", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /more|actions|options/i }));
    expect(screen.getByRole("menuitem", { name: /restore/i })).toBeInTheDocument();
  });
});
