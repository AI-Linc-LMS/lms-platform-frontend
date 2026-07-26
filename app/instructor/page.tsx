import { redirect } from "next/navigation";

// Bare /instructor → the dashboard (the instructor's home).
export default function InstructorIndex() {
  redirect("/instructor/dashboard");
}
