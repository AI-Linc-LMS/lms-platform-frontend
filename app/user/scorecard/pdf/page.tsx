"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";

import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { ScorecardData } from "@/lib/types/scorecard.types";

const SECTION_ORDER_PDF = ["overview", "learning_consumption"] as const;

export default function ScorecardPdfPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const clientId = searchParams.get("client_id");
  const [data, setData] = useState<ScorecardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !clientId) {
      setError("Invalid or expired link.");
      return;
    }
    let cancelled = false;
    scorecardService
      .getScorecardDataForPdf(token, clientId)
      .then((scorecardData) => {
        if (!cancelled) setData(scorecardData);
      })
      .catch(() => {
        if (!cancelled) setError("Invalid or expired link.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, clientId]);

  useEffect(() => {
    if (!data || error) return;
    const t = setTimeout(() => {
      wrapperRef.current?.setAttribute("data-pdf-ready", "true");
      if (typeof document !== "undefined") document.body.setAttribute("data-pdf-ready", "true");
    }, 1500);
    return () => clearTimeout(t);
  }, [data, error]);

  if (error || (!token && !clientId)) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f9fafb",
          p: 3,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {error ?? "Invalid or expired link."}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f9fafb",
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Loading scorecard...
        </Typography>
      </Box>
    );
  }

  const enabledModules = data.scorecardConfig?.enabledModules;
  const showAll = !enabledModules || enabledModules.length === 0;
  const sectionOrder = showAll
    ? [...SECTION_ORDER_PDF]
    : (SECTION_ORDER_PDF as readonly string[]).filter((id) => (enabledModules as string[]).includes(id));

  return (
    <Box
      ref={wrapperRef}
      sx={{
        width: "100%",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        pb: 4,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#000000",
              fontSize: { xs: "1.75rem", sm: "2rem" },
              mb: 0.5,
            }}
          >
            Learning scorecard
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#666666",
              fontSize: "0.9375rem",
            }}
          >
            Overview and learning consumption
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {sectionOrder.map((sectionId) => {
            switch (sectionId) {
              case "overview":
                return <StudentOverviewSection key={sectionId} data={data.overview} readOnly />;
              case "learning_consumption":
                return <LearningConsumptionSection key={sectionId} data={data.learningConsumption} />;
              default:
                return null;
            }
          })}
        </Box>
      </Container>
    </Box>
  );
}
