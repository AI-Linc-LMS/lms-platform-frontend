import apiClient from "./api";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export type TicketCategory =
  | "technical"
  | "content"
  | "video"
  | "quiz"
  | "navigation"
  | "other";

export interface TicketUserMini {
  id: number;
  user_id: number;
  email: string | null;
  full_name: string;
  role: string;
}

export interface Ticket {
  id: number;
  category: TicketCategory;
  category_display: string;
  subject: string;
  description: string;
  status: TicketStatus;
  status_display: string;
  user_attachments: string[];
  admin_resolution_notes: string;
  admin_attachments: string[];
  course_id: number | null;
  content_id: number | null;
  page_url: string;
  raised_by: TicketUserMini | null;
  resolved_by_user: TicketUserMini | null;
  resolved_at: string | null;
  /** Timestamp of the most recent RESOLVED→OPEN transition (user reopen or
   *  admin status-update). Null if the ticket has never been reopened. */
  reopened_at: string | null;
  /** Past admin resolutions, oldest first. Paired with reopen_history[i]. */
  resolution_history: ResolutionHistoryEntry[];
  /** Past reopen messages, oldest first. */
  reopen_history: ReopenHistoryEntry[];
  created_at: string;
  updated_at: string | null;
}

export interface ResolutionHistoryEntry {
  notes: string;
  attachments: string[];
  resolved_by_id: number | null;
  resolved_by_name: string | null;
  resolved_by_email: string | null;
  resolved_at: string | null;
}

export interface ReopenHistoryEntry {
  details: string;
  attachments: string[];
  reopened_at: string;
  by: "user" | "admin";
}

export interface TicketListResponse {
  count: number;
  page: number;
  limit: number;
  results: Ticket[];
}

export interface AdminTicketListResponse extends TicketListResponse {
  open_count: number;
  in_progress_count: number;
  resolved_count: number;
}

export interface CreateTicketPayload {
  category: TicketCategory;
  subject?: string;
  description: string;
  user_attachments?: string[];
  course_id?: number | null;
  content_id?: number | null;
  page_url?: string;
}

export interface ResolveTicketPayload {
  admin_resolution_notes: string;
  admin_attachments?: string[];
}

export interface ReopenTicketPayload {
  additional_details: string;
  additional_attachments?: string[];
}

export interface TicketAssignee {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface CreateAssigneePayload {
  email: string;
  name?: string;
}

export interface ListTicketsParams {
  status?: TicketStatus | "";
  category?: TicketCategory | "";
  search?: string;
  /** Only return tickets that have been reopened at least once. */
  reopened?: boolean;
  page?: number;
  limit?: number;
}

function buildQuery(params?: ListTicketsParams): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  if (params.status) usp.set("status", params.status);
  if (params.category) usp.set("category", params.category);
  if (params.search) usp.set("search", params.search);
  if (params.reopened) usp.set("reopened", "true");
  if (params.page) usp.set("page", String(params.page));
  if (params.limit) usp.set("limit", String(params.limit));
  const q = usp.toString();
  return q ? `?${q}` : "";
}

/**
 * Walk a DRF-style error payload and return the first human-readable message.
 *
 * Handles:
 *   {detail: "..."}                            → "..."
 *   {error: "..."}                             → "..."
 *   {field: ["..."]}                           → "field: ..."
 *   {field: "..."}                             → "field: ..."
 *   {user_attachments: {"0": ["Enter a valid URL."]}}  → "user_attachments: Enter a valid URL."
 *   {non_field_errors: ["..."]}                → "..."
 */
function firstDrfMessage(node: unknown, path: string[] = []): string | null {
  if (node == null) return null;
  if (typeof node === "string") {
    const s = node.trim();
    if (!s) return null;
    return path.length ? `${path.join(".")}: ${s}` : s;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = firstDrfMessage(item, path);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    // detail/error are top-level shortcuts - no field prefix needed
    if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail.trim();
    if (typeof obj.error === "string" && obj.error.trim()) return obj.error.trim();
    if (
      Array.isArray(obj.non_field_errors) &&
      typeof obj.non_field_errors[0] === "string"
    ) {
      return obj.non_field_errors[0] as string;
    }
    for (const [key, val] of Object.entries(obj)) {
      if (key === "detail" || key === "error") continue;
      const found = firstDrfMessage(val, [...path, key]);
      if (found) return found;
    }
  }
  return null;
}

function unwrapError(error: unknown, fallback: string): Error {
  const axiosError = error as {
    response?: { data?: unknown };
    message?: string;
  };
  const data = axiosError?.response?.data;
  const msg = firstDrfMessage(data);
  if (msg) return new Error(msg);
  return new Error(axiosError?.message || fallback);
}

export const ticketService = {
  async create(clientId: number, payload: CreateTicketPayload): Promise<Ticket> {
    try {
      const { data } = await apiClient.post<Ticket>(
        `/api/clients/${clientId}/tickets/`,
        payload,
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to create ticket");
    }
  },

  async listMine(
    clientId: number,
    params?: ListTicketsParams,
  ): Promise<TicketListResponse> {
    try {
      const { data } = await apiClient.get<TicketListResponse>(
        `/api/clients/${clientId}/tickets/my/${buildQuery(params)}`,
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to fetch your tickets");
    }
  },

  async listAdmin(
    clientId: number,
    params?: ListTicketsParams,
  ): Promise<AdminTicketListResponse> {
    try {
      const { data } = await apiClient.get<AdminTicketListResponse>(
        `/api/clients/${clientId}/tickets/admin/${buildQuery(params)}`,
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to fetch admin tickets");
    }
  },

  async get(clientId: number, ticketId: number): Promise<Ticket> {
    try {
      const { data } = await apiClient.get<Ticket>(
        `/api/clients/${clientId}/tickets/${ticketId}/`,
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to fetch ticket");
    }
  },

  async resolve(
    clientId: number,
    ticketId: number,
    payload: ResolveTicketPayload,
  ): Promise<Ticket> {
    try {
      const { data } = await apiClient.post<Ticket>(
        `/api/clients/${clientId}/tickets/${ticketId}/resolve/`,
        payload,
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to resolve ticket");
    }
  },

  async updateStatus(
    clientId: number,
    ticketId: number,
    status: Exclude<TicketStatus, "RESOLVED">,
  ): Promise<Ticket> {
    try {
      const { data } = await apiClient.patch<Ticket>(
        `/api/clients/${clientId}/tickets/${ticketId}/status/`,
        { status },
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to update ticket status");
    }
  },

  async reopen(
    clientId: number,
    ticketId: number,
    payload: ReopenTicketPayload,
  ): Promise<Ticket> {
    try {
      const { data } = await apiClient.post<Ticket>(
        `/api/clients/${clientId}/tickets/${ticketId}/reopen/`,
        payload,
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to reopen ticket");
    }
  },

  async listAssignees(clientId: number): Promise<TicketAssignee[]> {
    try {
      const { data } = await apiClient.get<{
        count: number;
        results: TicketAssignee[];
      }>(`/api/clients/${clientId}/tickets/assignees/`);
      return data.results;
    } catch (e) {
      throw unwrapError(e, "Failed to fetch assignees");
    }
  },

  async addAssignee(
    clientId: number,
    payload: CreateAssigneePayload,
  ): Promise<TicketAssignee> {
    try {
      const { data } = await apiClient.post<TicketAssignee>(
        `/api/clients/${clientId}/tickets/assignees/`,
        payload,
      );
      return data;
    } catch (e) {
      throw unwrapError(e, "Failed to add assignee");
    }
  },

  async removeAssignee(clientId: number, assigneeId: number): Promise<void> {
    try {
      await apiClient.delete(
        `/api/clients/${clientId}/tickets/assignees/${assigneeId}/`,
      );
    } catch (e) {
      throw unwrapError(e, "Failed to remove assignee");
    }
  },
};

export const TICKET_CATEGORY_OPTIONS: Array<{
  value: TicketCategory;
  label: string;
}> = [
  { value: "technical", label: "Technical Support" },
  { value: "content", label: "Content Help" },
  { value: "video", label: "Video Help" },
  { value: "quiz", label: "Quiz/Assessment Help" },
  { value: "navigation", label: "Navigation Help" },
  { value: "other", label: "Other" },
];

export const TICKET_STATUS_OPTIONS: Array<{
  value: TicketStatus;
  label: string;
}> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];
