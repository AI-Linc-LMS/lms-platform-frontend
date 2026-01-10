"use client";

import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  slogan?: string;
}

export function AuthLayout({
  children,
  slogan = "Changing the  way  the  world  learns",
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* Left Section - Form */}
      <Box
        sx={{
          flex: { xs: 1, md: "0 0 50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 4, md: 0 },
          backgroundColor: "background.default",
          overflow: "auto",
        }}
      >
        {children}
      </Box>

      {/* Right Section - Branding */}
      <Box
        sx={{
          flex: { xs: 0, md: "0 0 50%" },
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#f8fafc",
          overflow: "hidden",
          height: "100vh",
        }}
      >
        {/* Abstract Shapes */}
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        >
          {/* Top-center primary gradient */}
          <Box
            sx={{
              position: "absolute",
              top: -100,
              right: "20%",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--primary-300) 0%, var(--primary-500) 100%)",
              opacity: 0.3,
              filter: "blur(80px)",
            }}
          />
          {/* Top-right orange */}
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 350,
              height: 350,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
              opacity: 0.25,
              filter: "blur(70px)",
            }}
          />
          {/* Bottom-left pink-red gradient */}
          <Box
            sx={{
              position: "absolute",
              bottom: -100,
              left: -100,
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ec4899 0%, #ef4444 100%)",
              opacity: 0.2,
              filter: "blur(100px)",
            }}
          />
          {/* Bottom-center light blue */}
          <Box
            sx={{
              position: "absolute",
              bottom: 100,
              left: "30%",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)",
              opacity: 0.25,
              filter: "blur(60px)",
            }}
          />
          {/* Bottom-right light purple */}
          <Box
            sx={{
              position: "absolute",
              bottom: 50,
              right: 50,
              width: 200,
              height: 200,
              borderRadius: "30%",
              background: "linear-gradient(135deg, #c084fc 0%, #d8b4fe 100%)",
              opacity: 0.3,
              filter: "blur(50px)",
            }}
          />
        </Box>

        {/* Slogan */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            px: 6,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: { md: "3rem", lg: "4rem" },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#1e293b",
              position: "relative",
              zIndex: 2,
            }}
          >
            {slogan.split(" ").map((word, index) => {
              if (word === "the" || word === "world") {
                return (
                  <Box
                    key={index}
                    component="span"
                    sx={{
                      position: "relative",
                      display: "inline-block",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        right: 0,
                        height: "40%",
                        background:
                          "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
                        borderRadius: "20px",
                        opacity: 0.3,
                        zIndex: -1,
                      },
                    }}
                  >
                    {word}{" "}
                  </Box>
                );
              }
              return <span key={index}>{word} </span>;
            })}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
