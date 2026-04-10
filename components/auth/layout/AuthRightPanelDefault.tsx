"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import Image from "next/image";
import type { LoginHeroBrandingUi } from "@/lib/theme/authHeroBranding";
import {
  brandNameTypographySx,
  logoContainerSx,
  logoImageSizes,
  sloganTypographySx,
} from "@/lib/theme/authHeroBranding";
import { brandWordHighlightSx } from "./authBrandStyles";

interface AuthRightPanelDefaultProps {
  clientInfoLoading: boolean;
  sloganText: string;
  logoUrl: string;
  brandName: string;
  loginImgUrl?: string | null;
  heroBranding?: LoginHeroBrandingUi;
  useCustomSlogan?: boolean;
}

export function AuthRightPanelDefault({
  clientInfoLoading,
  sloganText,
  logoUrl,
  brandName,
  loginImgUrl,
  heroBranding = {},
  useCustomSlogan = false,
}: AuthRightPanelDefaultProps) {
  const hero = Boolean(loginImgUrl?.trim());

  if (hero) {
    const src = loginImgUrl!.trim();
    return (
      <Box
        sx={{
          flex: { xs: 0, md: "0 0 50%" },
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          height: "100vh",
          backgroundColor: "#f1f5f9",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#f1f5f9",
          }}
        >
          <Image
            src={src}
            alt=""
            fill
            priority
            sizes="50vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            maxWidth: 840,
            px: 4,
            pt: { md: 2 },
            gap: 2,
            textAlign: "center",
            minHeight: 0,
            transform: "translateY(clamp(28px, 4vh, 72px))",
          }}
        >
          {clientInfoLoading ? (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Skeleton
                variant="rounded"
                sx={{
                  bgcolor: "rgba(15,23,42,0.08)",
                  width: 320,
                  height: 120,
                  borderRadius: 2,
                }}
              />
              <Skeleton
                variant="text"
                sx={{ bgcolor: "rgba(15,23,42,0.08)", width: "85%", height: 48 }}
              />
              <Skeleton
                variant="text"
                sx={{ bgcolor: "rgba(15,23,42,0.06)", width: "70%", height: 22 }}
              />
            </Box>
          ) : (
            (logoUrl || brandName) && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                }}
              >
                {logoUrl ? (
                  <Box sx={logoContainerSx(true, heroBranding)}>
                    <Image
                      src={logoUrl}
                      alt={brandName || "Logo"}
                      fill
                      sizes={logoImageSizes(true, heroBranding)}
                      style={{ objectFit: "contain" }}
                      priority
                    />
                  </Box>
                ) : null}
                {brandName ? (
                  <Typography
                    component="p"
                    sx={brandNameTypographySx(true, heroBranding)}
                  >
                    {brandName}
                  </Typography>
                ) : null}
              </Box>
            )
          )}

          <Typography
            variant="h2"
            component="div"
            sx={sloganTypographySx(true, heroBranding)}
          >
            {sloganText.split(" ").map((word, index) => (
              <span key={index}>{word} </span>
            ))}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
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
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
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
                <Box sx={logoContainerSx(false, heroBranding)}>
                  <Image
                    src={logoUrl}
                    alt={brandName || "Logo"}
                    fill
                    sizes={logoImageSizes(false, heroBranding)}
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              ) : null}
              {brandName ? (
                <Typography
                  component="p"
                  sx={{
                    ...brandNameTypographySx(false, heroBranding),
                    mt: logoUrl ? 0.5 : 0,
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
                          marginRight: index < words.length - 1 ? "0.35em" : 0,
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
          sx={sloganTypographySx(false, heroBranding)}
        >
          {useCustomSlogan
            ? sloganText.split(" ").map((word, index) => (
                <span key={index}>{word} </span>
              ))
            : sloganText.split(" ").map((word, index) => {
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
  );
}
