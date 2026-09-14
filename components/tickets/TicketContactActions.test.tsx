import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketContactActions } from "./TicketContactActions";

const base = {
  id: 42,
  subject: "Video stuck",
  contact_email: "",
  contact_preference: "whatsapp" as const,
  raised_by: { id: 1, user_id: 1, email: "asha@example.com", full_name: "Asha Rao", role: "student" },
};

describe("TicketContactActions", () => {
  it("opens WhatsApp with the ticket already named", () => {
    render(
      <TicketContactActions
        ticket={{ ...base, contact_phone: "+919876543210", whatsapp_url: "https://wa.me/919876543210" }}
        orgName="Agileology"
      />,
    );
    const link = screen.getByRole("link", { name: /whatsapp/i });
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    expect(decodeURIComponent(href.split("?text=")[1])).toBe(
      'Hi Asha, this is Agileology support about your ticket #42: "Video stuck".',
    );
    // A new tab: support keeps the ticket open while they chat.
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: /call/i }).getAttribute("href")).toBe("tel:+919876543210");
    expect(screen.getByText("Prefers WhatsApp")).toBeInTheDocument();
  });

  it("falls back to the account email when no contact email was given", () => {
    render(<TicketContactActions ticket={{ ...base, contact_phone: "+919876543210", whatsapp_url: null }} />);
    expect(screen.getByRole("link", { name: /email/i }).getAttribute("href")).toMatch(/^mailto:asha@example\.com\?/);
  });

  it("says so plainly for a ticket raised before a number was required", () => {
    render(<TicketContactActions ticket={{ ...base, contact_phone: "", whatsapp_url: null, contact_preference: "" }} />);
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /call/i })).toBeNull();
    expect(screen.getByText(/raised before one was required/i)).toBeInTheDocument();
  });

  it("does not offer a WhatsApp button for an old undialable number", () => {
    render(
      <TicketContactActions ticket={{ ...base, contact_phone: "020 7946 0000 x221", whatsapp_url: null }} />,
    );
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    expect(screen.getByText(/not a WhatsApp number/i)).toBeInTheDocument();
  });
});
