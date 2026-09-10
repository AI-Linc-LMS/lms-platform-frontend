import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The ticket conversation feature: backend AI-Linc-LMS/ai-linc-backend#821 shipped the API and
 * said "frontend follows in a separate PR". It never did, so for two days a ticket had a
 * conversation endpoint and no way to reach it.
 *
 * These assertions are structural on purpose. The two things most likely to be got wrong here
 * are not rendering details — they are (a) re-deriving `side` on the client, and (b) forgetting
 * that a support form's contact fields are per-ticket state.
 */
const read = (p: string): string => readFileSync(join(process.cwd(), p), "utf8");

describe("the conversation is wired to the real contract", () => {
  const svc = () => read("lib/services/ticket.service.ts");

  it("calls the comments endpoint the backend actually exposes", () => {
    expect(svc()).toContain("/tickets/${ticketId}/comments/");
  });

  it("tolerates both a bare array and a paginated envelope", () => {
    // The list endpoint returns a plain array today; a later pagination change should not blank
    // every ticket conversation in the product.
    expect(svc()).toContain("Array.isArray(data) ? data : (data?.results ?? [])");
  });

  it("takes `side` from the server rather than deriving it from a role", () => {
    // side is computed from the TICKET: whoever raised it is the learner in this conversation,
    // whatever else they are. Deriving it client-side puts an admin who raised a ticket on the
    // wrong side of their own thread.
    const comp = read("components/tickets/TicketConversation.tsx");
    expect(comp).toContain('comment.side === "staff"');
    expect(comp).not.toMatch(/author\?\.role\s*===/);
  });
});

describe("both detail surfaces show it", () => {
  it.each([
    "app/tickets/[id]/page.tsx",
    "app/admin/tickets/[id]/page.tsx",
  ])("%s mounts TicketConversation", (p) => {
    expect(read(p)).toContain("<TicketConversation");
  });
});

describe("contact details are per-ticket state", () => {
  const dlg = () => read("components/common/ReportIssueDialog.tsx");

  it("are sent on create", () => {
    const s = dlg();
    for (const f of ["contact_email", "contact_phone", "contact_preference"]) {
      expect(s).toContain(f);
    }
  });

  it("are cleared when the dialog closes", () => {
    // Otherwise one ticket's phone number silently rides along into the next one.
    const s = dlg();
    const close = s.slice(s.indexOf("const handleClose"), s.indexOf("onClose();"));
    for (const setter of ['setContactEmail("")', 'setContactPhone("")', 'setContactPreference("")']) {
      expect(close, `handleClose must call ${setter}`).toContain(setter);
    }
  });

  it("never claim a preference for a channel the learner left blank", () => {
    // It would tell support to ring a number that is not there.
    const s = dlg();
    expect(s).toContain('contactPreference === "phone" && !contactPhone.trim()');
    expect(s).toContain('contactPreference === "email" && !contactEmail.trim()');
  });
});
