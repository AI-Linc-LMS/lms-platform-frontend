import { redirect } from "next/navigation";

export default function PendingInstructorsRedirectPage() {
  redirect("/admin/instructors");
}
