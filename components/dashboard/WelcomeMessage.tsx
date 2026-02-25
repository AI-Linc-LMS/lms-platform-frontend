"use client";

import { Typography, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserDisplayName } from "@/lib/utils/user-utils";

export const WelcomeMessage: React.FC = () => {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);

  return (
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
        {t("dashboard.welcomeHello", { name: displayName })}{" "}
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
        {t("dashboard.welcomeSubtitle")}
      </Typography>
    </Box>
  );
};
