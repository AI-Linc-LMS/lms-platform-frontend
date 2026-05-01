"use client";

import { useEffect, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { profileService, UserProfile } from "@/lib/services/profile.service";
import { calculateProfileCompletion } from "@/lib/utils/profileCompletion";
import { useRouter } from "next/navigation";

export function ProfileCompletionReminder() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    profileService.getUserProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  if (!profile || !isVisible) return null;

  const { percentage } = calculateProfileCompletion(profile);

  if (percentage === 100) return null;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        display: "flex",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.3s ease",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
          transform: "translateY(-2px)",
          borderColor: "#cbd5e1",
        }
      }}
      onClick={() => router.push("/profile#profile-strength")}
    >
      {/* Top Accent Line */}
      <Box 
        sx={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 4, 
          background: "linear-gradient(90deg, #64748b 0%, #94a3b8 100%)",
        }} 
      />

      {/* Icon Area */}
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          width: 48, 
          height: 48, 
          borderRadius: "12px", 
          backgroundColor: "#f1f5f9",
          color: "#475569", 
          mr: 2,
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        <IconWrapper icon="mdi:account-arrow-up-outline" size={24} />
      </Box>

      {/* Content Area */}
      <Box sx={{ flex: 1, pr: 3, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5, lineHeight: 1.2, fontSize: "1rem" }}>
          Strengthen Your Profile
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.875rem", mb: 2, lineHeight: 1.4 }}>
          You're <strong>{percentage}%</strong> there! Add missing details to stand out.
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            <Box 
              sx={{ 
                width: `${percentage}%`, 
                height: "100%", 
                backgroundColor: "#0a66c2", 
                borderRadius: 4,
                transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)" 
              }} 
            />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#0a66c2", minWidth: 32, fontSize: "0.8125rem" }}>
            {percentage}%
          </Typography>
        </Box>
      </Box>

      {/* Close Button */}
      <Box sx={{ position: "absolute", top: 12, right: 12 }}>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          sx={{ 
            color: "#94a3b8",
            "&:hover": {
              backgroundColor: "#f1f5f9",
              color: "#64748b"
            }
          }}
        >
          <IconWrapper icon="mdi:close" size={18} />
        </IconButton>
      </Box>
    </Box>
  );
}
