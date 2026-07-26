"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { authUtils } from "@/lib/auth/auth-utils";
import { isScopedAdminRole, isClientOrgAdminRole } from "@/lib/auth/role-utils";

/**
 * Route guard for the instructor surface. Only teaching roles (instructor / course_manager) and org
 * admins may enter; everyone else is bounced to the student home. A real guard — the UI never relies
 * on the backend alone to keep learners out of /instructor.
 */
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const role = authUtils.getUserRole() ?? "";
    const ok = isScopedAdminRole(role) || isClientOrgAdminRole(role);
    setAllowed(ok);
    if (!ok) router.replace("/dashboard");
  }, [router]);

  if (allowed !== true) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  return <>{children}</>;
}
