"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route: password reset now uses OTP on /forgot-password */
export default function ResetPasswordRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/forgot-password");
  }, [router]);

  return null;
}
