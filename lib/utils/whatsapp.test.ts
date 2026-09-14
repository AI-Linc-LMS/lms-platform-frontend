import { describe, expect, it } from "vitest";
import { dialableNumber, profilePhoneForPrefill, telHref, ticketChatMessage, whatsappChatUrl } from "./whatsapp";

describe("dialableNumber", () => {
  it("accepts E.164 with or without separators", () => {
    expect(dialableNumber("+919876543210")).toBe("+919876543210");
    expect(dialableNumber("+91 98765-43210")).toBe("+919876543210");
  });

  it("refuses what WhatsApp cannot dial", () => {
    // An old free-form value, a bare national number, an extension, too short, too long.
    for (const v of ["020 7946 0000 x221", "9876543210", "+91 98765 43210 x2", "+1234567", "+1234567890123456", "", null]) {
      expect(dialableNumber(v), String(v)).toBeNull();
    }
  });
});

describe("whatsappChatUrl", () => {
  it("prefers the server's link", () => {
    expect(whatsappChatUrl({ whatsapp_url: "https://wa.me/919876543210", contact_phone: "+14155552671" }))
      .toBe("https://wa.me/919876543210");
  });

  it("derives a link when the payload predates whatsapp_url", () => {
    expect(whatsappChatUrl({ contact_phone: "+91 98765 43210" })).toBe("https://wa.me/919876543210");
  });

  it("ignores a server value that is not a plain wa.me link", () => {
    expect(whatsappChatUrl({ whatsapp_url: "javascript:alert(1)", contact_phone: "+919876543210" }))
      .toBe("https://wa.me/919876543210");
    expect(whatsappChatUrl({ whatsapp_url: "https://evil.test/919876543210" })).toBeNull();
  });

  it("returns null for a ticket with no dialable number", () => {
    expect(whatsappChatUrl({ contact_phone: "020 7946 0000 x221" })).toBeNull();
    expect(whatsappChatUrl({})).toBeNull();
  });

  it("encodes the pre-typed message", () => {
    const url = whatsappChatUrl({ whatsapp_url: "https://wa.me/919876543210" }, 'Hi Asha, ticket #4: "a & b"?');
    expect(url).toBe(`https://wa.me/919876543210?text=${encodeURIComponent('Hi Asha, ticket #4: "a & b"?')}`);
  });
});

describe("telHref", () => {
  it("dials only a real number", () => {
    expect(telHref("+91 98765 43210")).toBe("tel:+919876543210");
    expect(telHref("call me")).toBeNull();
  });
});

describe("ticketChatMessage", () => {
  it("says who is writing and about which ticket", () => {
    expect(ticketChatMessage({ learnerName: "Asha Rao", orgName: "Agileology", ticketId: 42, subject: "Video stuck" }))
      .toBe('Hi Asha, this is Agileology support about your ticket #42: "Video stuck".');
  });

  it("degrades without a name, org or subject", () => {
    expect(ticketChatMessage({ ticketId: 7 })).toBe("Hi, this is support about your ticket #7.");
  });
});


describe("profilePhoneForPrefill", () => {
  it("keeps an E.164 profile number", () => {
    expect(profilePhoneForPrefill("+91 98765 43210")).toBe("+919876543210");
  });
  it("gives a bare Indian mobile its country code", () => {
    expect(profilePhoneForPrefill("9876543210")).toBe("+919876543210");
  });
  it("starts empty rather than pre-filling something invalid", () => {
    for (const v of ["12345", "020 7946 0000", "", null, undefined]) expect(profilePhoneForPrefill(v)).toBe("");
  });
});
