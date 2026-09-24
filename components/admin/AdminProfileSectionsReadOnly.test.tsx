/**
 * An admin (and the public preview) reading a learner's experience sees the learner's points as a
 * list, the same points the learner's resume draws - not the stored text with its typed dots.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@/lib/i18n";

import type { UserProfile } from "@/lib/services/profile.service";
import { AdminProfileSectionsReadOnly } from "./AdminProfileSectionsReadOnly";

const profile = (experience: unknown[]) => ({ experience }) as unknown as UserProfile;
const entry = { id: "e1", company: "Acme", position: "PM", start_date: "2024-01-01", current: true };

describe("experience, read only", () => {
  it("lists an entry's stored points", () => {
    render(<AdminProfileSectionsReadOnly profile={profile([{ ...entry, highlights: ["Built X", "Led Y & Z"] }])} />);
    const items = within(screen.getByText("PM at Acme").parentElement!).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Built X", "Led Y & Z"]);
  });

  it("lists the points of an entry saved as one paragraph of inline bullets", () => {
    render(<AdminProfileSectionsReadOnly profile={profile([{ ...entry, description: "• Built X • Led Y" }])} />);
    const items = within(screen.getByText("PM at Acme").parentElement!).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Built X", "Led Y"]);
  });
});
