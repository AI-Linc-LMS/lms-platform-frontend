/**
 * The words an admin sees for a course-generation job's status.
 *
 * Lived in app/admin/adaptive-courses/page.tsx and was imported from there by the job page. A
 * page file may export only what Next.js defines for a page, and the webpack build's type step
 * rejects any other export ("statusLabel is not a valid Page export field").
 */
export function statusLabel(status: string): string {
  switch (status) {
    case "awaiting_approval":
      return "Waiting for approval";
    case "rejected":
      return "Not approved";
    case "pending":
      return "Queued";
    case "generating_outline":
      return "Planning outline";
    case "creating_structure":
      return "Building structure";
    case "generating_content":
      return "Generating content";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}
