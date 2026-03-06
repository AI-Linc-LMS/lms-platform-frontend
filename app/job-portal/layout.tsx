"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";

export default function JobPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMyApplications = pathname?.startsWith("/job-portal/my-applications");

  return (
    <MainLayout>
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          mb: 0,
          px: { xs: 2, md: 3 },
          pt: 2,
          pb: 0,
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, mb: -0.5 }}>
          <Button
            component={Link}
            href="/job-portal"
            variant={!isMyApplications ? "contained" : "text"}
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              ...(!isMyApplications
                ? { backgroundColor: "#6366f1", "&:hover": { backgroundColor: "#4f46e5" } }
                : { color: "text.secondary" }),
            }}
          >
            Browse jobs
          </Button>
          <Button
            component={Link}
            href="/job-portal/my-applications"
            variant={isMyApplications ? "contained" : "text"}
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              ...(isMyApplications
                ? { backgroundColor: "#6366f1", "&:hover": { backgroundColor: "#4f46e5" } }
                : { color: "text.secondary" }),
            }}
          >
            My Applications
          </Button>
        </Box>
      </Box>
      {children}
    </MainLayout>
  );
}
