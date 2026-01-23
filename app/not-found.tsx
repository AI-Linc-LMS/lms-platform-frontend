"use client";

import { useRouter } from "next/navigation";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export default function NotFound() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        py: { xs: 4, sm: 8 },
        px: { xs: 2, sm: 3 },
      }}
    >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6, md: 8 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.08)",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Icon Container */}
            <Box
              sx={{
                mb: 4,
                display: "flex",
                justifyContent: "center",
              }}
            >
            <Box
              sx={{
                width: { xs: 120, sm: 160 },
                height: { xs: 120, sm: 160 },
                borderRadius: "50%",
                backgroundColor: "rgba(10, 102, 194, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
                <IconWrapper
                  icon="mdi:file-question-outline"
                  size={80}
                  color="#0a66c2"
                />
              </Box>
            </Box>

            {/* 404 Number */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "5rem", sm: "7rem", md: "9rem" },
                fontWeight: 800,
                background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              404
            </Typography>

            {/* Title */}
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
                fontWeight: 700,
                color: "#000000",
                mb: 2,
                letterSpacing: "-0.02em",
              }}
            >
              Page Not Found
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "1rem", sm: "1.125rem" },
                color: "#666666",
                mb: 5,
                maxWidth: "600px",
                mx: "auto",
                lineHeight: 1.7,
              }}
            >
              Oops! The page you're looking for doesn't exist or has been moved. 
              Please check the URL or return to the dashboard to continue.
            </Typography>

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<IconWrapper icon="mdi:home" size={20} />}
                onClick={() => router.push("/dashboard")}
                sx={{
                  backgroundColor: "#0a66c2",
                  color: "#ffffff",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: "24px",
                  boxShadow: "0 2px 4px rgba(10, 102, 194, 0.2)",
                  minWidth: { xs: "100%", sm: "200px" },
                  "&:hover": {
                    backgroundColor: "#004182",
                    boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Return to Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
                onClick={() => router.back()}
                sx={{
                  borderColor: "#0a66c2",
                  color: "#0a66c2",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: "24px",
                  minWidth: { xs: "100%", sm: "200px" },
                  "&:hover": {
                    borderColor: "#004182",
                    backgroundColor: "rgba(10, 102, 194, 0.05)",
                    borderWidth: "2px",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Go Back
              </Button>
            </Box>

            {/* Helpful Links */}
            <Box
              sx={{
                mt: 6,
                pt: 4,
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.8125rem",
                  mb: 2,
                  display: "block",
                }}
              >
                Quick Links
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="text"
                  size="small"
                  onClick={() => router.push("/dashboard")}
                  sx={{
                    color: "#0a66c2",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    "&:hover": {
                      backgroundColor: "rgba(10, 102, 194, 0.05)",
                    },
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => router.push("/courses")}
                  sx={{
                    color: "#0a66c2",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    "&:hover": {
                      backgroundColor: "rgba(10, 102, 194, 0.05)",
                    },
                  }}
                >
                  Courses
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => router.push("/assessments")}
                  sx={{
                    color: "#0a66c2",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    "&:hover": {
                      backgroundColor: "rgba(10, 102, 194, 0.05)",
                    },
                  }}
                >
                  Assessments
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => router.push("/profile")}
                  sx={{
                    color: "#0a66c2",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    "&:hover": {
                      backgroundColor: "rgba(10, 102, 194, 0.05)",
                    },
                  }}
                >
                  Profile
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
  );
}
