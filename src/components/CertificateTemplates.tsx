import { useRef, useImperativeHandle, forwardRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export interface CertificateTemplatesRef {
  downloadPDF: () => Promise<void>;
  isDownloading: boolean;
}

const CertificateTemplates = forwardRef<CertificateTemplatesRef>((_, ref) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get user data from Redux store
  const userData = useSelector((state: RootState) => state.user);

  const downloadPDF = async () => {
    const element = certificateRef.current;
    if (!element) return;

    setIsDownloading(true);

    try {
      // Local type for jsPDF options
      const jsPDFOptions: {
        unit: string;
        format: [number, number];
        orientation: "landscape" | "portrait";
      } = {
        unit: "px",
        format: [1123, 794],
        orientation: "landscape",
      };

      const opt = {
        margin: 0,
        filename: "certificate.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: jsPDFOptions,
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Expose downloadPDF function and loading state to parent component
  useImperativeHandle(ref, () => ({
    downloadPDF,
    isDownloading,
  }));

  // Get user's full name or fallback to "User"
  const userName = userData?.full_name || "User";

  // Get today's date
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        background: "#071c30",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div
        ref={certificateRef}
        data-certificate-ref="true"
        style={{
          width: "100%",
          maxWidth: "1123px",
          height: "auto",
          aspectRatio: "1123/794",
          background: "linear-gradient(to bottom, #050f1d, #071c30)",
          color: "white",
          padding: "60px 40px",
          boxSizing: "border-box",
          position: "relative",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            fontSize: 28,
            fontWeight: "bold",
            color: "#42c6ff",
          }}
        >
          AI LINC
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            letterSpacing: 8,
            color: "#1ce4dd",
            textAlign: "center",
            marginTop: 60,
          }}
        >
          CERTIFICATE
        </div>
        <div
          style={{
            fontSize: 24,
            letterSpacing: 3,
            color: "#d3d3d3",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          OF COMPLETION
        </div>

        <div style={{ textAlign: "center", fontSize: 20 }}>Presented to</div>
        <div
          style={{
            textAlign: "center",
            fontSize: 40,
            color: "#3ae6e6",
            fontStyle: "italic",
            margin: "10px 0",
          }}
        >
          {userName}
        </div>

        <div style={{ textAlign: "center", fontSize: 18, marginBottom: 20 }}>
          has successfully completed the AI Assessment conducted by Ai-Linc
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 20,
            color: "#1ce4dd",
            fontWeight: "bold",
          }}
        >
          NO CODE DEVELOPMENT BOOTCAMP USING AGENTIC/GENERATIVE AI
        </div>

        <div style={{ textAlign: "center", fontSize: 18, marginTop: 30 }}>
          {today}
        </div>

        <div style={{ textAlign: "center", fontSize: 18, marginTop: 40 }}>
          Session taken by the experts from
          <div style={{ marginTop: 10 }}>
            <img
              src="https://cdn.worldvectorlogo.com/logos/microsoft-1.svg"
              alt="Microsoft"
              style={{
                height: 30,
                margin: "0 10px",
                verticalAlign: "middle",
              }}
            />
            <img
              src="https://cdn.worldvectorlogo.com/logos/google-icon.svg"
              alt="Google"
              style={{
                height: 30,
                margin: "0 10px",
                verticalAlign: "middle",
              }}
            />
            <img
              src="https://cdn.worldvectorlogo.com/logos/amazon-icon-1.svg"
              alt="Amazon"
              style={{
                height: 30,
                margin: "0 10px",
                verticalAlign: "middle",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

CertificateTemplates.displayName = "CertificateTemplates";

export default CertificateTemplates;
