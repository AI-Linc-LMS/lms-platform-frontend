import { useRef, useImperativeHandle, forwardRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Certificate } from "../services/certificateApis";

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
      // Local type for jsPDF options
      const jsPDFOptions: {
        unit: string;
        format: [number, number];
        orientation: "landscape" | "portrait";
      } = {
        unit: "px",
        format: [800, 550],
        orientation: "landscape",
      };

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `${certificateName.replace(/\s+/g, "_")}_certificate.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          width: 800,
          height: 550,
          backgroundColor: "#071c30",
        },
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
  const userName = certificate?.studentName || userData?.full_name || "User";

  // Get certificate name or fallback
  const certificateName = certificate?.name || "AI Assessment";

  // Get issued date or today's date
  const issuedDate = certificate?.issuedDate
    ? new Date(certificate.issuedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

  return (
    <div className="flex justify-center items-center w-full h-full min-h-[400px] p-2">
      <div
        ref={certificateRef}
        data-certificate-ref="true"
        className="w-full max-w-[800px] h-[500] sm:h-[540px] bg-gradient-to-b from-[#050f1d] to-[#071c30] text-white p-4 sm:p-6 md:p-8 lg:p-12 box-border relative rounded-lg shadow-lg"
        style={{
          aspectRatio: "8/5",
          minHeight: "400px",
          maxHeight: "550px",
          width: "100%",
          maxWidth: "800px",
          margin: "0",
          backgroundColor: "#071c30",
          background: "linear-gradient(to bottom, #050f1d, #071c30)",
        }}
      >
        <div className="absolute top-2 sm:top-4 md:top-6 left-2 sm:left-4 md:left-8 text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-[#42c6ff]">
          AI LINC
        </div>

        <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider text-[#1ce4dd] text-center mt-6 sm:mt-8 md:mt-12">
          CERTIFICATE
        </div>
        <div className="text-xs sm:text-sm md:text-base lg:text-lg tracking-wide text-[#d3d3d3] text-center mb-3 sm:mb-4 md:mb-6">
          OF COMPLETION
        </div>

        <div className="text-xs sm:text-sm md:text-base lg:text-lg text-center">
          Presented to
        </div>
        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#3ae6e6] italic text-center my-2 sm:my-3">
          {userName}
        </div>

        <div className="text-xs sm:text-sm md:text-base text-center mb-3 sm:mb-4 px-2 sm:px-4">
          has successfully completed the {certificateName} conducted by Ai-Linc
        </div>

        <div className="text-xs sm:text-sm md:text-base lg:text-lg text-[#1ce4dd] font-bold text-center px-2 sm:px-4">
          NO CODE DEVELOPMENT BOOTCAMP USING AGENTIC/GENERATIVE AI
        </div>

        <div className="text-xs sm:text-sm md:text-base lg:text-lg text-center mt-3 sm:mt-4 md:mt-6">
          Issued on {issuedDate}
        </div>

        <div className="text-xs sm:text-sm md:text-base lg:text-lg text-center mt-2 sm:mt-3 md:mt-4 px-2 sm:px-4">
          We appreciate your efforts and dedication in learning and growing with
          us.
        </div>

        <div className="flex flex-col text-xs sm:text-sm md:text-base lg:text-lg items-end 
        mt-4">
          <p className="text-[#3ae6e6] font-medium">Best Regards</p>
          <p className="text-[#42c6ff] font-bold text-sm sm:text-base md:text-lg">
            Team AI LINC
          </p>
        </div>
      </div>
    </div>
  );
});

CertificateTemplates.displayName = "CertificateTemplates";

export default CertificateTemplates;
