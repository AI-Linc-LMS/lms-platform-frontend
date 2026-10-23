import { describe, expect, it } from "vitest";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";

/**
 * Every string "Remove from organisation" shows exists in both languages, interpolates the same
 * placeholders, and follows the house style. The Arabic namespace fell back to English for any
 * key it lacked, so a missing key here would never fail at runtime; this is the only place it
 * can fail.
 */

const KEYS = [
  "tabMembers",
  "tabRemoved",
  "removedHint",
  "emptyRemoved",
  "emptyRemovedHint",
  "removeAction",
  "removeTitle",
  "removeBody",
  "removing",
  "removeConfirm",
  "removedToast",
  "removeFailed",
  "addBack",
  "addedBackToast",
  "addBackFailed",
  "deleteAction",
  "deleteTitle",
  "deleteBody",
  "deleting",
  "deleteConfirm",
  "deletedToast",
  "deleteFailed",
  "removedChip",
  "removedOn",
  "unknownAdmin",
  "detailBanner",
  "switchDisabledRemoved",
];

const enMembership = en.adminManageStudents.membership as Record<string, string>;
const arMembership = ar.adminManageStudents.membership as Record<string, string>;
/** The house style bans em dashes in copy; the character is built here so it never appears in source. */
const EM_DASH = String.fromCodePoint(0x2014);
const placeholders = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

describe("the Remove from organisation copy", () => {
  it("has every key in English and in Arabic, each a non-empty string", () => {
    expect(Object.keys(enMembership).sort()).toEqual([...KEYS].sort());
    expect(Object.keys(arMembership).sort()).toEqual([...KEYS].sort());
    for (const key of KEYS) {
      expect(typeof enMembership[key], `en ${key}`).toBe("string");
      expect(enMembership[key].trim(), `en ${key}`).not.toBe("");
      expect(typeof arMembership[key], `ar ${key}`).toBe("string");
      expect(arMembership[key].trim(), `ar ${key}`).not.toBe("");
    }
    expect(en.adminManageStudents.quickEnroll.successRestored).toContain("{{name}}");
    expect(ar.adminManageStudents.quickEnroll.successRestored).toContain("{{name}}");
  });

  it("interpolates the same placeholders in both languages", () => {
    for (const key of KEYS) {
      expect(placeholders(arMembership[key]), key).toEqual(placeholders(enMembership[key]));
    }
  });

  it("uses no em dash, in either language", () => {
    for (const key of KEYS) {
      expect(enMembership[key], `en ${key}`).not.toContain(EM_DASH);
      expect(arMembership[key], `ar ${key}`).not.toContain(EM_DASH);
    }
    expect(en.adminManageStudents.quickEnroll.successRestored).not.toContain(EM_DASH);
  });

  it("tells the admin, in the confirm, that the person cannot sign in again", () => {
    // Shown on every tenant, gated or not: the server refuses a removed member at every door.
    expect(enMembership.removeBody).toContain(
      "They will not be able to sign in again until you add them back.",
    );
    expect(enMembership.removeBody).toContain("you can add them back at any time");
  });
});
