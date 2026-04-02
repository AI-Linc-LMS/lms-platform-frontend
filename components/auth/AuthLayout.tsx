"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

interface AuthLayoutProps {
  children: ReactNode;
  slogan?: string;
}

export function AuthLayout({ children, slogan }: AuthLayoutProps) {
  const { t } = useTranslation("common");
  const { clientInfo, loading: clientInfoLoading } = useClientInfo();
  const sloganText = slogan ?? t("auth.slogan");

  const brandName = clientInfo?.name?.trim() || "";
  const logoUrl =
    clientInfo?.login_logo_url?.trim() ||
    clientInfo?.app_logo_url?.trim() ||
    "";

  /** Same gradient highlight as slogan words “the” / “world” */
  const brandWordHighlightSx = {
    position: "relative" as const,
    display: "inline-block" as const,
    "&::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "40%",
      background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
      borderRadius: "20px",
      opacity: 0.3,
      zIndex: -1,
    },
  };

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

        {/* Brand + slogan */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            px: 6,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          {clientInfoLoading ? (
            <Box
              sx={{
                width: "100%",
                maxWidth: 320,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 1.5,
                mx: "auto",
              }}
            >
              <Skeleton variant="rounded" width={200} height={56} sx={{ borderRadius: 1 }} />
              <Skeleton variant="text" width={280} height={52} />
            </Box>
          ) : (
            (logoUrl || brandName) && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  width: "100%",
                  gap: 1.5,
                  maxWidth: 600,
                  mx: "auto",
                }}
              >
                {logoUrl ? (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: 280,
                      height: { xs: 56, md: 72 },
                      mx: "auto",
                      alignSelf: "center",
                    }}
                  >
                    <Image
                      src={logoUrl}
                      alt={brandName || "Logo"}
                      fill
                      sizes="280px"
                      style={{ objectFit: "contain" }}
                      priority
                    />
                  </Box>
                ) : null}
                {brandName ? (
                  <Typography
                    component="p"
                    sx={{
                      fontSize: { md: "2.75rem", lg: "3.25rem" },
                      fontWeight: 800,
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                      wordSpacing: "normal",
                      color: "#1e293b",
                      maxWidth: 720,
                      width: "100%",
                      m: 0,
                      mt: logoUrl ? 0.5 : 0,
                      mx: "auto",
                      textAlign: "center",
                      alignSelf: "center",
                    }}
                  >
                    {brandName
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((word, index, words) => (
                        <Box
                          key={`${word}-${index}`}
                          component="span"
                          sx={{
                            ...brandWordHighlightSx,
                            marginRight:
                              index < words.length - 1 ? "0.35em" : 0,
                          }}
                        >
                          {word}
                        </Box>
                      ))}
                  </Typography>
                ) : null}
              </Box>
            )
          )}

          <Typography
            variant="h2"
            component="div"
            sx={{
              fontSize: { md: "3rem", lg: "4rem" },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#1e293b",
              position: "relative",
              zIndex: 2,
            }}
          >
            {sloganText.split(" ").map((word, index) => {
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
