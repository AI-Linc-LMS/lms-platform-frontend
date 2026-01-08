"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Dialog,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { certificateService, Certificate } from "@/lib/services/certificate.service";
import { CertificateViewer } from "./CertificateViewer";

export function CertificateList() {
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await certificateService.getAvailableCertificates();
      setCertificates(data || []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load certificates", "error");
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateClick = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedCertificate(null);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (certificates.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 2,
          p: 4,
        }}
      >
        <IconWrapper icon="mdi:certificate-outline" size={64} color="#9ca3af" />
        <Typography variant="h6" sx={{ color: "#6b7280", fontWeight: 600 }}>
          No Certificates Available
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af", textAlign: "center" }}>
          Complete courses to earn certificates and share your achievements!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1f2937",
            mb: 3,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          My Certificates
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {certificates.map((certificate) => (
            <Paper
              key={certificate.id}
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-4px)",
                },
              }}
              onClick={() => handleCertificateClick(certificate)}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "56.25%", // 16:9 aspect ratio
                  backgroundColor: "#f9fafb",
                  borderRadius: 1,
                  overflow: "hidden",
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={certificate.certificate_url}
                  alt={certificate.course_title}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1f2937",
                  mb: 1,
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {certificate.course_title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Issued: {new Date(certificate.issued_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:eye" size={18} />}
                sx={{
                  mt: 2,
                  borderColor: "#6366f1",
                  color: "#6366f1",
                  "&:hover": {
                    borderColor: "#4f46e5",
                    backgroundColor: "#eef2ff",
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCertificateClick(certificate);
                }}
              >
                View Certificate
              </Button>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Certificate Viewer Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        {selectedCertificate && (
          <CertificateViewer
            certificate={selectedCertificate}
            onClose={handleCloseViewer}
          />
        )}
      </Dialog>
    </>
  );
}

