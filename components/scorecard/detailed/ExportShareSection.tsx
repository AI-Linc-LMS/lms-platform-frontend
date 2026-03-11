"use client";

import { useState } from "react";
import { Box, Typography, Paper, Button, CircularProgress, Alert } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { scorecardService } from "@/lib/services/scorecard.service";

function getSuggestedFilename(): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `scorecard_${dateStr}.pdf`;
}

export function ExportShareSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    setError(null);
    setLoading(true);
    try {
      const blob = await scorecardService.exportScorecardPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getSuggestedFilename();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      const message = e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: Blob; status?: number } }).response?.status === 503
          ? "PDF export is not available. Please try again later."
          : (e as { response?: { data?: Blob } }).response?.data instanceof Blob
            ? "Failed to generate PDF."
            : "Failed to download PDF."
        : "Failed to download PDF.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%", mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "rgba(10, 102, 194, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:file-pdf-box" size={20} color="#0a66c2" />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              Export Scorecard
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#666666",
              fontSize: "0.875rem",
              pl: 6.5,
            }}
          >
            Download your complete performance scorecard as a PDF document
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IconWrapper icon="mdi:download" size={20} />}
          onClick={handleDownloadPDF}
          sx={{
            backgroundColor: "#0a66c2",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            px: 3,
            py: 1.5,
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
            "&:hover": {
              backgroundColor: "#004182",
              boxShadow: "0 6px 16px rgba(10, 102, 194, 0.4)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease",
            minWidth: { xs: "100%", sm: "200px" },
          }}
        >
          Download PDF
        </Button>
      </Box>
    </Paper>
  );
}
