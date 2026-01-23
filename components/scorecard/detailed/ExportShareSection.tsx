"use client";

import { Box, Typography, Paper, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export function ExportShareSection() {
  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    console.log("Download PDF");
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
          startIcon={<IconWrapper icon="mdi:download" size={20} />}
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
