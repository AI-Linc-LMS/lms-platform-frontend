"use client";

import { Button, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { Ticket } from "@/lib/services/ticket.service";
import { mailtoHref, telFromContact, ticketChatMessage, whatsappChatUrl } from "@/lib/utils/whatsapp";

interface Props {
  ticket: Pick<
    Ticket,
    "id" | "subject" | "contact_phone" | "contact_email" | "contact_preference" | "whatsapp_url" | "raised_by"
  >;
  /** The institution's name, so the learner knows at once who is messaging them. */
  orgName?: string | null;
}

const PREFERENCE_LABEL: Record<string, string> = {
  whatsapp: "Prefers WhatsApp",
  phone: "Prefers a call",
  email: "Prefers email",
};

/**
 * How staff reach the learner about this ticket, straight from the ticket page.
 *
 * The learner is required to give a WhatsApp number when raising a ticket; until this component
 * existed no staff screen displayed it at all, so the number was collected and never usable.
 */
export function TicketContactActions({ ticket, orgName }: Props) {
  const name = ticket.raised_by?.full_name || "";
  const chat = whatsappChatUrl(
    ticket,
    ticketChatMessage({ learnerName: name, orgName, ticketId: ticket.id, subject: ticket.subject }),
  );
  const call = telFromContact(ticket);
  const email = mailtoHref(
    (ticket.contact_email || ticket.raised_by?.email || "").trim(),
    `Your support ticket #${ticket.id}`,
  );
  const preference = ticket.contact_preference ? PREFERENCE_LABEL[ticket.contact_preference] : undefined;

  return (
    <Stack
      data-testid="ticket-contact-actions"
      direction={{ xs: "column", sm: "row" }}
      spacing={1.25}
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)", mr: 0.5 }}>
        Reach {name ? name.split(/\s+/)[0] : "the learner"}
      </Typography>

      {chat ? (
        <Button
          component="a"
          href={chat}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          variant="contained"
          startIcon={<IconWrapper icon="mdi:whatsapp" size={16} />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 999,
            bgcolor: "#128c7e",
            color: "#fff",
            "&:hover": { bgcolor: "#0e7a6d" },
          }}
        >
          WhatsApp {ticket.contact_phone}
        </Button>
      ) : (
        <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
          {ticket.contact_phone
            ? `${ticket.contact_phone} (not a WhatsApp number)`
            : // True for both causes: raised before the number was required, or from a tenant site
              // still on an older Support form (the backend logs which).
              "No contact number on this ticket."}
        </Typography>
      )}

      {call && (
        <Button
          component="a"
          href={call}
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:phone-outline" size={16} />}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 999 }}
        >
          Call
        </Button>
      )}

      {email && (
        <Button
          component="a"
          href={email}
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:email-outline" size={16} />}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 999 }}
        >
          Email
        </Button>
      )}

      {preference && (
        <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
          {preference}
        </Typography>
      )}
    </Stack>
  );
}
