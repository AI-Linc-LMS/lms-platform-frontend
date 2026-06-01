"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService } from "@/lib/services/community.service";

export default function UserByUsernamePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const username = params?.username ? decodeURIComponent(params.username) : "";
    if (!username) {
      setNotFound(true);
      return;
    }
    communityService
      .getCommunityUserByUsername(username)
      .then((profile) => router.replace(`/community/user/${profile.id}`))
      .catch(() => setNotFound(true));
  }, [params?.username, router]);

  if (notFound) {
    return (
      <MainLayout fullWidthContent>
        <Box
          sx={{
            maxWidth: 520,
            mx: "auto",
            textAlign: "center",
            py: 12,
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper icon="mdi:account-question-outline" size={56} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ mt: 1 }}>
            User not found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No community user is registered under that username.
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2, textTransform: "none" }}
            onClick={() => router.push("/community")}
          >
            Back to Community
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    </MainLayout>
  );
}
