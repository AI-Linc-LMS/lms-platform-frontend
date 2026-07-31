import { describe, expect, it } from "vitest";
import {
  getRoleAccent,
  getRoleLabel,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/utils/user-utils";
import type { UserProfile } from "@/lib/services/accounts.service";

/**
 * The sidebar showed "User" instead of people's names.
 *
 * 2,187 of 18,357 production profiles rendered as a raw email address or the literal "User",
 * because the old rule required BOTH first and last name and otherwise fell through to
 * `user_name` — which for a social sign-in IS the email. This is pure logic with a known
 * production failure, which makes it the cheapest possible thing to have had a test for.
 */

const profile = (over: Partial<UserProfile>): UserProfile =>
  ({
    id: 1,
    user_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profile_picture: "",
    role: "student",
    ...over,
  }) as UserProfile;

describe("getUserDisplayName", () => {
  it("uses both names when it has them", () => {
    expect(getUserDisplayName(profile({ first_name: "Utkarsh", last_name: "Singh" }))).toBe(
      "Utkarsh Singh",
    );
  });

  it("accepts a single given name — the case the old rule dropped", () => {
    expect(getUserDisplayName(profile({ first_name: "Poorva" }))).toBe("Poorva");
  });

  it("never renders an email address as a name", () => {
    const name = getUserDisplayName(
      profile({ user_name: "poorva.shrivastava256@gmail.com", email: "poorva.shrivastava256@gmail.com" }),
    );
    expect(name).not.toContain("@");
    expect(name).toBe("Poorva Shrivastava");
  });

  it("uses a username when it is a name rather than an address", () => {
    expect(getUserDisplayName(profile({ user_name: "utkarshsingxx" }))).toBe("utkarshsingxx");
  });

  it("falls back to User only when there is genuinely nothing", () => {
    expect(getUserDisplayName(profile({}))).toBe("User");
    expect(getUserDisplayName(null)).toBe("User");
  });
});

describe("getUserInitials", () => {
  it("agrees with the display name", () => {
    // An avatar reading "U" beside a name reading "Poorva" looks like a bug even when the name
    // is right, so the two chains must not diverge.
    const p = profile({ email: "poorva.shrivastava256@gmail.com" });
    expect(getUserDisplayName(p)).toBe("Poorva Shrivastava");
    expect(getUserInitials(p)).toBe("PS");
  });
});

describe("getRoleLabel", () => {
  it("never leaks a raw slug", () => {
    expect(getRoleLabel("course_manager")).toBe("Course Manager");
    expect(getRoleLabel("superadmin")).toBe("Super Admin");
  });

  it("makes an unknown role presentable rather than raw", () => {
    expect(getRoleLabel("regional_lead")).toBe("Regional Lead");
  });

  it("treats a missing role as a student", () => {
    expect(getRoleLabel(undefined)).toBe("Student");
  });
});

describe("getRoleAccent", () => {
  it("returns a colour that reads on the dark sidebar", () => {
    // The 300/400 tints, not the 500s. Indigo-500 on dark navy lands near 3:1, which is thin
    // for 11px text — the reason these were retuned.
    for (const role of ["superadmin", "admin", "instructor", "course_manager", "student"]) {
      expect(getRoleAccent(role)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
