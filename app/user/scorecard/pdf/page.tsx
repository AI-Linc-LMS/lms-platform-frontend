"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Trophy, Sparkles } from "lucide-react";

import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { ScorecardThemeProvider } from "@/components/scorecard/primitives";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { ScorecardData } from "@/lib/types/scorecard.types";

type PdfTemplate = "detailed" | "certificate";

const SECTION_ORDER_PDF = ["overview", "learning_consumption"] as const;

export default function ScorecardPdfPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const clientId = searchParams.get("client_id");
  const templateParam = (searchParams.get("template") || "detailed").toLowerCase();
  const template: PdfTemplate = templateParam === "certificate" ? "certificate" : "detailed";

  const hasValidLink = Boolean(token && clientId);
  const [data, setData] = useState<ScorecardData | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const error = !hasValidLink || fetchError ? "Invalid or expired link." : null;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasValidLink) return undefined;
    let cancelled = false;
    scorecardService
      .getScorecardDataForPdf(token as string, clientId as string)
      .then((scorecardData) => {
        if (!cancelled) setData(scorecardData);
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, clientId, hasValidLink]);

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", padding: 24 }}>
        <p style={{ fontSize: 16, color: "#666" }}>{error ?? "Invalid or expired link."}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", padding: 24 }}>
        <p style={{ fontSize: 14, color: "#666" }}>Loading scorecard...</p>
      </div>
    );
  }

  if (template === "certificate") {
    return (
      <ScorecardThemeProvider forcedMode="light">
        <div ref={wrapperRef}>
          <CertificateTemplate data={data} />
        </div>
      </ScorecardThemeProvider>
    );
  }

  // Detailed template (default)
  const enabledModules = data.scorecardConfig?.enabledModules;
  const showAll = !enabledModules || enabledModules.length === 0;
  const sectionOrder = showAll
    ? [...SECTION_ORDER_PDF]
    : (SECTION_ORDER_PDF as readonly string[]).filter((id) => (enabledModules as string[]).includes(id));

  return (
    <div ref={wrapperRef} style={{ width: "100%", background: "#f9fafb", minHeight: "100vh", paddingBottom: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#000" }}>Learning scorecard</h1>
          <p style={{ margin: "4px 0 0", fontSize: 15, color: "#666" }}>Overview and learning consumption</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
        </div>
      </div>
    </div>
  );
}

function CertificateTemplate({ data }: { data: ScorecardData }) {
  const ov = data.overview;
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fef9c3 0%, #fef3c7 50%, #fde68a 100%)",
        padding: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 880,
          padding: 56,
          background: "#fffdf6",
          border: "12px double #b45309",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(180, 83, 9, 0.18)",
          position: "relative",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 999, background: "#fde68a", color: "#92400e", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12 }}>
          <Sparkles size={14} />
          Certificate of Achievement
        </div>
        <h1 style={{ margin: "32px 0 4px", fontSize: 14, color: "#92400e", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
          This is presented to
        </h1>
        <h2 style={{ margin: "0 0 24px", fontFamily: '"Alex Brush", cursive', fontSize: 72, color: "#1f2937", lineHeight: 1.05 }}>
          {ov.studentName || "Learner"}
        </h2>
        <p style={{ margin: "0 auto", maxWidth: 580, fontSize: 16, color: "#374151", lineHeight: 1.6 }}>
          for completing the <strong>{ov.programName || "Learning Programme"}</strong> with a final performance score of{" "}
          <strong style={{ color: "#92400e", fontSize: 20 }}>{ov.overallPerformanceScore}</strong> and grade{" "}
          <strong>{ov.overallGrade}</strong>.
        </p>

        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          <StatBlock icon={<Trophy size={18} />} label="Performance" value={`${ov.overallPerformanceScore}`} />
          <StatBlock icon={<Award size={18} />} label="Completion" value={`${Math.round(ov.completionPercentage)}%`} />
          <StatBlock icon={<Sparkles size={18} />} label="Streak" value={`${ov.activeDaysStreak} days`} />
        </div>

        <div style={{ marginTop: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ width: 180, borderBottom: "1px solid #92400e", paddingBottom: 4, marginBottom: 4, fontFamily: '"Alex Brush", cursive', fontSize: 28, color: "#1f2937" }}>
              AI Linc
            </div>
            <span style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>Issued by</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{today}</div>
            <span style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>Date issued</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #fcd34d",
        background: "#fffdf6",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ color: "#92400e" }}>{icon}</span>
      <span style={{ fontSize: 10, color: "#92400e", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: "#1f2937", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>{value}</span>
    </div>
  );
}
