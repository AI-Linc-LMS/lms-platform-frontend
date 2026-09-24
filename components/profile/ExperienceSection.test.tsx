/**
 * The profile's Work Experience section: points in, points out.
 *
 * Reported: "Change the Work Experience section in the profile to use bullet-point entries so each
 * responsibility or achievement is stored and populated as an individual bullet in the resume."
 *
 * Before, the section was one "Description" textarea and showed what was typed as one paragraph.
 * What is pinned: an entry saved as a paragraph of inline bullets opens as separate points and
 * shows as a list; saving it sends the points as a list (and the same points as text, for older
 * readers); and saving the section does NOT rewrite an entry the learner never opened.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

import type { Experience, UserProfile } from "@/lib/services/profile.service";
import { ExperienceSection } from "./ExperienceSection";

const LEGACY: Experience = {
  id: "e1",
  company: "Acme",
  position: "Product Manager",
  start_date: "2024-01-01",
  current: true,
  description: "• Managed product timelines… • Engaged with clients… • Created walkthroughs…",
};

const OTHER: Experience = {
  id: "e2",
  company: "Beta",
  position: "Analyst",
  start_date: "2022-01-01",
  end_date: "2023-06-01",
  current: false,
  description: "Built R&D dashboards with <Chart> components.",
};

const profileWith = (experience: Experience[]) => ({ experience }) as unknown as UserProfile;

describe("an entry saved as a paragraph", () => {
  it("shows as a list of points, not one paragraph with the dots inline", () => {
    render(<ExperienceSection profile={profileWith([LEGACY])} onSave={vi.fn()} />);
    const list = screen.getByTestId("experience-points");
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Managed product timelines…",
      "Engaged with clients…",
      "Created walkthroughs…",
    ]);
  });

  it("opens as one field per point", () => {
    render(<ExperienceSection profile={profileWith([LEGACY])} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Experience" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("textbox", { name: "Point 1 of 3" })).toHaveValue("Managed product timelines…");
    expect(within(dialog).getByRole("textbox", { name: "Point 3 of 3" })).toHaveValue("Created walkthroughs…");
    expect(within(dialog).queryByRole("textbox", { name: /description/i })).toBeNull();
  });

  it("is saved as a list of points, with the same points as text for older readers", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ExperienceSection profile={profileWith([LEGACY, OTHER])} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Edit Experience" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Point 2 of 3" }), {
      target: { value: "Engaged with clients & partners" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const [edited, untouched] = onSave.mock.calls[0][0].experience;
    expect(edited.highlights).toEqual([
      "Managed product timelines…",
      "Engaged with clients & partners",
      "Created walkthroughs…",
    ]);
    expect(edited.description).toBe(
      "Managed product timelines…\nEngaged with clients & partners\nCreated walkthroughs…",
    );
    // The entry the learner did not open goes back exactly as it came: text only.
    expect(untouched).not.toHaveProperty("highlights");
    expect(untouched.description).toBe(OTHER.description);
  });
});

describe("a new entry", () => {
  it("starts with one point to type in, and drops points left blank", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ExperienceSection profile={profileWith([])} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Position" }), { target: { value: "PM" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Company" }), { target: { value: "Acme" } });
    fireEvent.change(within(dialog).getByLabelText("Start Date"), { target: { value: "2024-01-01" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Point 1 of 1" }), {
      target: { value: "Launched the app" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add a point" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const [entry] = onSave.mock.calls[0][0].experience;
    expect(entry.highlights).toEqual(["Launched the app"]);
    expect(entry.description).toBe("Launched the app");
  });
});

describe("what the profile page shows", () => {
  it("prints & and < as typed: profile text is text, never HTML", () => {
    render(<ExperienceSection profile={profileWith([OTHER])} onSave={vi.fn()} />);
    expect(screen.getByText("Built R&D dashboards with <Chart> components.")).toBeInTheDocument();
  });

  it("reads stored points as they are", () => {
    render(
      <ExperienceSection
        profile={profileWith([{ ...OTHER, highlights: ["Built dashboards", "Cut costs by 40%"] }])}
        onSave={vi.fn()}
      />,
    );
    expect(
      within(screen.getByTestId("experience-points"))
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Built dashboards", "Cut costs by 40%"]);
  });
});

describe("review follow-ups", () => {
  it("does not wipe an entry whose text has no points when another entry is saved", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const kept = { ...LEGACY, id: "e0", highlights: [], description: "Kept text" };
    render(<ExperienceSection profile={profileWith([kept, OTHER])} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Edit Experience" })[1]);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const [first] = onSave.mock.calls[0][0].experience;
    expect(first.description).toBe("Kept text");
    expect(first).not.toHaveProperty("highlights");
  });

  it("still clears an entry whose points were all removed", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ExperienceSection profile={profileWith([{ ...OTHER, highlights: ["Only point"] }])} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Experience" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove point 1" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const [entry] = onSave.mock.calls[0][0].experience;
    expect(entry.highlights).toEqual([]);
    expect(entry.description).toBe("");
  });

  it("will not save an entry with a point over 1000 characters, rather than failing the section", () => {
    const long = { ...OTHER, description: `Built ${"x".repeat(1000)}.` };
    render(<ExperienceSection profile={profileWith([long])} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Experience" }));
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

