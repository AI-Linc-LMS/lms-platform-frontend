"use client";

import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AIAvatarProps {
  isSpeaking?: boolean;
  question?: string;
  onSpeakComplete?: () => void;
}

export function AIAvatar({
  isSpeaking = false,
  question,
  onSpeakComplete,
}: AIAvatarProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Handle text-to-speech
  useEffect(() => {
    if (question && isSpeaking) {
      // Cancel any ongoing speech
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = "en-US";
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsAnimating(true);
      };

      utterance.onend = () => {
        setIsAnimating(false);
        onSpeakComplete?.();
      };

      utterance.onerror = () => {
        setIsAnimating(false);
        onSpeakComplete?.();
      };

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [question, isSpeaking, onSpeakComplete]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* Avatar Container */}
      <Box
        sx={{
          position: "relative",
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Animated Background Circle */}
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: isAnimating
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
              : "linear-gradient(135deg, #475569 0%, #64748b 100%)",
            opacity: isAnimating ? 0.3 : 0.2,
            animation: isAnimating ? "pulse 2s ease-in-out infinite" : "none",
            "@keyframes pulse": {
              "0%, 100%": {
                transform: "scale(1)",
                opacity: 0.3,
              },
              "50%": {
                transform: "scale(1.1)",
                opacity: 0.5,
              },
            },
          }}
        />

        {/* Avatar Icon */}
        <Box
          sx={{
            position: "relative",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: isAnimating
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              : "linear-gradient(135deg, #475569 0%, #64748b 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isAnimating
              ? "0 20px 60px rgba(99, 102, 241, 0.4)"
              : "0 10px 40px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
            transform: isAnimating ? "scale(1.05)" : "scale(1)",
          }}
        >
          <Box
            sx={{
              animation: isAnimating
                ? "bounce 1s ease-in-out infinite"
                : "none",
              "@keyframes bounce": {
                "0%, 100%": {
                  transform: "translateY(0)",
                },
                "50%": {
                  transform: "translateY(-10px)",
                },
              },
            }}
          >
            <IconWrapper icon="mdi:robot" size={100} color="#ffffff" />
          </Box>
        </Box>

        {/* Speaking Indicator */}
        {isAnimating && (
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              backgroundColor: "rgba(99, 102, 241, 0.9)",
              borderRadius: 2,
              backdropFilter: "blur(10px)",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                animation: "pulse-dot 1.5s ease-in-out infinite",
                "@keyframes pulse-dot": {
                  "0%, 100%": {
                    opacity: 1,
                    transform: "scale(1)",
                  },
                  "50%": {
                    opacity: 0.5,
                    transform: "scale(0.8)",
                  },
                },
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                animation: "pulse-dot 1.5s ease-in-out infinite 0.2s",
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                animation: "pulse-dot 1.5s ease-in-out infinite 0.4s",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Loading Overlay */}
      {isSpeaking && !isAnimating && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <CircularProgress size={48} sx={{ color: "#6366f1" }} />
        </Box>
      )}
    </Box>
  );
}
