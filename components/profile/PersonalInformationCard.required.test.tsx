/**
 * The Personal Information form has to say which fields are mandatory BEFORE the learner saves.
 *
 * It already said so afterwards: submit with an empty date of birth and a red "Date of birth is
 * required." appears under the box. Up to the moment of that failure the form looked entirely
 * optional — every caption was identical, so "Gender" and "Country" read the same, and only one
 * of them will stop a save.
 *
 * Two properties are asserted, and they are deliberately different assertions:
 *
 *   - the VISIBLE marker: an asterisk inside the caption, which is what a sighted learner reads;
 *   - the PROGRAMMATIC one: `required` / `aria-required` on the control itself, which is what a
 *     screen reader announces. An asterisk alone is a decoration; an asterisk glued into the
 *     label text would announce as the word "star" or as nothing at all.
 *
 * And the negative case, which is the one that actually keeps this honest: the server does not
 * require Gender, so Gender must carry neither. The required set comes from
 * `accounts/profile_completion.required_fields_for(client)` over the wire, so a tenant that
 * narrows it must narrow the asterisks too.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("@/lib/services/countries.service", () => ({
  countriesService: { list: async () => [{ code: "IN", name: "India" }] },
}));

vi.mock("@/lib/services/colleges.service", () => ({
  collegesService: { search: async () => [], list: async () => [] },
}));

import { PersonalInformationCard } from "./PersonalInformationCard";
import type { UserProfile } from "@/lib/services/profile.service";

/** The five the platform requires by default, as the server reports them. */
const SERVER_DEFAULT_REQUIRED = [
  { field: "first_name", label: "First name", filled: false },
  { field: "last_name", label: "Last name", filled: false },
  { field: "phone_number", label: "Phone number", filled: false },
  { field: "date_of_birth", label: "Date of birth", filled: false },
  { field: "country", label: "Country", filled: false },
];

function makeProfile(
  requiredFields: { field: string; label: string; filled: boolean }[] = SERVER_DEFAULT_REQUIRED,
): UserProfile {
  return {
    first_name: "Asha",
    last_name: "Rao",
    email: "asha@example.com",
    username: "asha",
    profile_picture: "",
    phone_number: "",
    bio: null,
    social_links: {},
    date_of_birth: null,
    gender: null,
    country: null,
    profile_completion: {
      percentage: 40,
      is_complete: false,
      exempt: false,
      required_fields: requiredFields,
      missing_fields: requiredFields.filter((f) => !f.filled).map((f) => f.field),
      locked_modules: ["resume", "jobs", "interview"],
    },
  } as unknown as UserProfile;
}

/** The caption element that names this control, asterisk and all. */
function labelFor(id: string): HTMLElement {
  const el = document.getElementById(`${id}-label`);
  if (!el) throw new Error(`no label rendered for ${id}`);
  return el;
}

async function openTheForm() {
  await userEvent.click(screen.getByRole("button", { name: /edit/i }));
}

describe("the Personal Information form marks what the server requires", () => {
  it.each([
    ["profile-first-name", /first name/i],
    ["profile-last-name", /last name/i],
    ["profile-phone-number", /phone number/i],
    ["profile-date-of-birth", /date of birth/i],
    ["profile-country", /country/i],
  ])("marks %s visibly and programmatically", async (id, labelText) => {
    render(<PersonalInformationCard profile={makeProfile()} onSave={vi.fn()} />);
    await openTheForm();

    expect(labelFor(id)).toHaveTextContent("*");
    expect(labelFor(id).textContent).toMatch(labelText);

    const control = screen.getByLabelText(labelText);
    expect(control).toBeRequired();
  });

  it("leaves a field the server does NOT require unmarked", async () => {
    render(<PersonalInformationCard profile={makeProfile()} onSave={vi.fn()} />);
    await openTheForm();

    // Gender is optional on every tenant: it is not in DEFAULT_REQUIRED_FIELDS and has no
    // predicate in accounts/profile_completion.py.
    expect(labelFor("profile-gender")).not.toHaveTextContent("*");
    expect(labelFor("profile-gender").textContent).toMatch(/gender/i);

    for (const id of ["profile-city", "profile-state", "profile-github", "profile-college-name"]) {
      expect(labelFor(id)).not.toHaveTextContent("*");
    }
  });

  it("follows a tenant that requires fewer fields", async () => {
    // required_profile_fields on the Client narrows the set; the asterisks must narrow with it,
    // or the form demands something the server will happily accept as blank.
    render(
      <PersonalInformationCard
        profile={makeProfile(SERVER_DEFAULT_REQUIRED.slice(0, 2))}
        onSave={vi.fn()}
      />,
    );
    await openTheForm();

    expect(labelFor("profile-first-name")).toHaveTextContent("*");
    expect(labelFor("profile-date-of-birth")).not.toHaveTextContent("*");
    expect(labelFor("profile-country")).not.toHaveTextContent("*");
  });

  it("says what the asterisk means, once, and not in hardcoded English", () => {
    render(<PersonalInformationCard profile={makeProfile()} onSave={vi.fn()} />);

    // The legend text is translated; the asterisk in front of it is drawn in JSX and hidden from
    // assistive tech, because it is a picture of the marker rather than a word.
    expect(screen.getByText(/marks a field you must fill in/i)).toBeInTheDocument();
  });

  it("marks the fields before the learner opens the form at all", () => {
    // The whole point: the learner should not have to fail a save to find out.
    render(<PersonalInformationCard profile={makeProfile()} onSave={vi.fn()} />);

    expect(labelFor("profile-date-of-birth")).toHaveTextContent("*");
    expect(labelFor("profile-gender")).not.toHaveTextContent("*");
  });
});
