"use client";

import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  brandNameTypographySx,
  buildLoginHeroBrandingUi,
  logoContainerSx,
  logoImageSizes,
  sloganTypographySx,
} from "@/lib/theme/authHeroBranding";

interface LoginHeroPreviewProps {
  loginImgUrl: string;
  loginLogoUrl: string;
  /** Merged normalized theme (e.g. `normalizeThemeSettings(draftThemeRaw)`). */
  normalizedTheme: Record<string, string>;
  /** Sample client name shown when previewing. */
  sampleClientName: string;
}

/**
 * Mini replica of the sign-in right panel for branding admin preview.
 */
export function LoginHeroPreview({
  loginImgUrl,
  loginLogoUrl,
  normalizedTheme,
  sampleClientName,
}: LoginHeroPreviewProps) {
  const { t } = useTranslation("common");
  const b = buildLoginHeroBrandingUi(normalizedTheme);
  const sloganText =
    normalizedTheme.loginHeroSlogan?.trim() || t("auth.slogan");
  const useCustom = Boolean(normalizedTheme.loginHeroSlogan?.trim());
  const hero = Boolean(loginImgUrl?.trim());

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        minHeight: 320,
        maxHeight: 400,
        display: "flex",
        position: "relative",
        bgcolor: "#f1f5f9",
        boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      }}
    >
      {hero ? (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src={loginImgUrl.trim()}
            alt=""
            fill
            sizes="480px"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </Box>
      ) : null}

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 2,
          gap: 1.5,
          textAlign: "center",
          width: "100%",
        }}
      >
        {loginLogoUrl.trim() ? (
          <Box
            sx={{
              ...logoContainerSx(hero, b),
              transform: "scale(0.72)",
              transformOrigin: "top center",
            }}
          >
            <Image
              src={loginLogoUrl.trim()}
              alt=""
              fill
              sizes={logoImageSizes(hero, b)}
              style={{ objectFit: "contain" }}
            />
          </Box>
        ) : null}

        <Typography
          component="p"
          sx={{
            ...brandNameTypographySx(hero, b),
            transform: hero ? "scale(0.9)" : "scale(0.85)",
            transformOrigin: "center",
          }}
        >
          {sampleClientName}
        </Typography>

        <Typography
          component="div"
          sx={{
            ...sloganTypographySx(hero, b),
            transform: "scale(0.72)",
            transformOrigin: "top center",
          }}
        >
          {useCustom
            ? sloganText.split(" ").map((word, i) => <span key={i}>{word} </span>)
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
