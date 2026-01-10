"use client";

import { Typography, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserDisplayName } from "@/lib/utils/user-utils";
import { Leaderboard } from "./Leaderboard";

interface WelcomeHeaderProps {
  courseId?: number; // Kept for backward compatibility but not used
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ courseId }) => {
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);

  return (
    <Box
      sx={{
        mb: 4,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "1fr 400px",
        },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Box>
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
            fontWeight: 700,
            color: "#111827",
            mb: 1,
          }}
        >
          Hello {displayName}!{" "}
          <motion.span
            style={{ display: "inline-block" }}
            animate={{
              rotate: [0, 14, -8, 14, -8, 14, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          >
            👋
          </motion.span>
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: "1rem",
            color: "#6b7280",
            maxWidth: "600px",
          }}
        >
          Nice to have you back, what an exciting day! Get ready and continue
          your lesson today.
        </Typography>
      </Box>
      <Box
        sx={{
          display: { xs: "none", lg: "block" },
        }}
      >
        <Leaderboard />
      </Box>
    </Box>
  );
};
