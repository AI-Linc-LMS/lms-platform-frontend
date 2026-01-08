"use client";

import { Dialog, DialogContent, Box, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "./IconWrapper";

interface StreakCongratulationsModalProps {
  open: boolean;
  onClose: () => void;
  streakCount: number;
}

export function StreakCongratulationsModal({
  open,
  onClose,
  streakCount,
}: StreakCongratulationsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%)",
          border: "2px solid #fdba74",
          boxShadow: "0 20px 60px rgba(251, 146, 60, 0.3)",
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: "relative" }}>
        {/* Animated background sparkles */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#fbbf24",
                top: `${20 + i * 15}%`,
                left: `${10 + i * 12}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </Box>

        <Box sx={{ p: 6, textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* Congratulations Text */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: "#92400e",
                mb: 2,
                fontSize: { xs: "2rem", sm: "2.5rem" },
              }}
            >
              Congratulations! 🎉
            </Typography>
          </motion.div>

          {/* Streak Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                border: "4px solid #ffffff",
                boxShadow: "0 10px 30px rgba(251, 191, 36, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                position: "relative",
              }}
            >
              <motion.div
                animate={{
                  rotate: [0, 12, -12, 12, 0],
                  scale: [1, 1.1, 1.05, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                style={{ fontSize: "3rem" }}
              >
                🔥
              </motion.div>
            </Box>
          </motion.div>

          {/* Streak Count */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#92400e",
                mb: 1,
                fontSize: { xs: "1.75rem", sm: "2rem" },
              }}
            >
              {streakCount} Day{streakCount !== 1 ? "s" : ""} Streak!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#78350f",
                mb: 4,
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
            >
              Keep up the amazing work! You're building a great learning habit.
            </Typography>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                backgroundColor: "#92400e",
                color: "#ffffff",
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(146, 64, 14, 0.3)",
                "&:hover": {
                  backgroundColor: "#78350f",
                  boxShadow: "0 6px 16px rgba(146, 64, 14, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Continue Learning
            </Button>
          </motion.div>
        </Box>
      </DialogContent>
    </Dialog>
  );
}


