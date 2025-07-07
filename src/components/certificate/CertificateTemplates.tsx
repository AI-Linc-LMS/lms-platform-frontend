import { useRef, useImperativeHandle, forwardRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Certificate } from "../../services/certificateApis";
import certificateBg from "./certificate-bg/certifiacte bg.png";

export interface CertificateTemplatesRef {
  downloadPDF: () => Promise<void>;
  isDownloading: boolean;
}

interface CertificateTemplatesProps {
  certificate?: Certificate | null;
}

const CertificateTemplates = forwardRef<
  CertificateTemplatesRef,
  CertificateTemplatesProps
>(({ certificate }, ref) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get user data from Redux store
  const userData = useSelector((state: RootState) => state.user);

  const downloadPDF = async () => {
    const element = certificateRef.current;
    if (!element) return;

    setIsDownloading(true);

    try {
      // Store original border radius
      const originalBorderRadius = element.style.borderRadius;

      // Temporarily remove border radius for PDF generation
      element.style.borderRadius = "0px";

      // Local type for jsPDF options
      const jsPDFOptions: {
        unit: string;
        format: [number, number];
        orientation: "landscape" | "portrait";
      } = {
        unit: "px",
        format: [800, 500],
        orientation: "landscape",
      };

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `${certificateName.replace(/\s+/g, "_")}_certificate.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          width: 800,
          height: 500,
          backgroundColor: "#071c30",
          allowTaint: false,
          foreignObjectRendering: false,
        },
        jsPDF: jsPDFOptions,
      };

      await html2pdf().set(opt).from(element).save();

      // Restore original border radius
      element.style.borderRadius = originalBorderRadius;
    } catch (error) {
      //console.error("Error generating PDF:", error);
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
  const userName = certificate?.studentName || userData?.full_name || "User";

  // Get certificate name or fallback
  const certificateName = certificate?.name || "AI Assessment";

  // Get issued date or today's date
  const issuedDate = certificate?.issuedDate ?? "06/22/2025";

  return (
    <div className="flex justify-center items-center w-full h-full min-h-[400px] p-2">
      <div
        ref={certificateRef}
        data-certificate-ref="true"
        className="w-full max-w-[800px] h-[500px] text-white p-4 sm:p-6 md:p-8 lg:p-12 box-border relative rounded-lg shadow-lg bg-cover bg-center"
        style={{
          backgroundImage: `url(${certificateBg})`,
          aspectRatio: "8/5",
          minHeight: "400px",
          maxHeight: "500px",
          width: "100%",
          maxWidth: "800px",
          margin: "0",
          borderRadius: "12px",
        }}
      >
        <div className="absolute top-4 md:top-6 left-4 md:left-8 text-3xl font-bold text-[#42c6ff] z-10">
          AI LINC
        </div>

        <div className="flex flex-col justify-center items-center h-full text-center -mt-8">
          <div className="font-oswald text-5xl font-semibold tracking-[0.68rem] text-[#1ce4dd] mb-2">
            CERTIFICATE
          </div>
          <div className="font-oswald text-2xl tracking-wider text-[#d3d3d3] text-center mb-3">
            OF COMPLETION
          </div>

          <div className="font-oswald text-xl tracking-wider text-center">
            Presented to
          </div>
          <div className="font-playfair-display text-[2.7rem] text-[#3ae6e6] italic tracking-wider text-center mb-4 mt-2">
            {userName}
          </div>

          <div className="font-oswald text-base text-center tracking-wide mb-4 px-4">
            has successfully completed the AI Assessment conducted by Ai-Linc
          </div>

          <div className="font-oswald text-lg text-[#1ce4dd] font-medium tracking-wider text-center px-4 mt-2">
            NO CODE DEVELOPMENT BOOTCAMP USING AGENTIC/GENERATIVE AI
          </div>

          <div className="font-lato text-lg text-center">
            Issued on {issuedDate}
          </div>
        </div>

        <div className="font-oswald text-lg text-center tracking-wider absolute bottom-14 left-0 right-0">
          Session taken by the experts from
        </div>
      </div>
    </div>
  );
});

CertificateTemplates.displayName = "CertificateTemplates";

export default CertificateTemplates;
