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

  it("does not greet a nameless account by its email address", () => {
    // No first or last name: the API sends the username, which is the email.
    const nameless = { ...base.raised_by, full_name: "asha@example.com" };
    render(
      <TicketContactActions
        ticket={{ ...base, raised_by: nameless, contact_phone: "+919876543210", whatsapp_url: "https://wa.me/919876543210" }}
        orgName="Agileology"
      />,
    );
    const href = screen.getByRole("link", { name: /whatsapp/i }).getAttribute("href") ?? "";
    expect(decodeURIComponent(href.split("?text=")[1])).toBe('Hi, this is Agileology support about your ticket #42: "Video stuck".');
    expect(screen.getByText("Reach the learner")).toBeInTheDocument();
    expect(screen.queryByText(/asha@example\.com/)).toBeNull();
  });

  it("falls back to the account email when no contact email was given", () => {
    render(<TicketContactActions ticket={{ ...base, contact_phone: "+919876543210", whatsapp_url: null }} />);
    expect(screen.getByRole("link", { name: /email/i }).getAttribute("href")).toMatch(/^mailto:asha@example\.com\?/);
  });

  it("says so plainly for a ticket raised before a number was required", () => {
    render(<TicketContactActions ticket={{ ...base, contact_phone: "", whatsapp_url: null, contact_preference: "" }} />);
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /call/i })).toBeNull();
    expect(screen.getByText(/no contact number on this ticket/i)).toBeInTheDocument();
  });

  it("calls the number the server resolved for an older bare value", () => {
    render(
      <TicketContactActions ticket={{ ...base, contact_phone: "98765 43210", whatsapp_url: "https://wa.me/919876543210" }} />,
    );
    expect(screen.getByRole("link", { name: /call/i }).getAttribute("href")).toBe("tel:+919876543210");
  });

  it("does not offer a WhatsApp button for an old undialable number", () => {
    render(
      <TicketContactActions ticket={{ ...base, contact_phone: "020 7946 0000 x221", whatsapp_url: null }} />,
    );
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    expect(screen.getByText(/not a WhatsApp number/i)).toBeInTheDocument();
  });
});
