import React, { useState, useMemo, useEffect, useRef } from "react";
import CertificateTemplates, {
  CertificateTemplatesRef,
} from "./CertificateTemplates";
import { useQuery } from "@tanstack/react-query";
import {
  getAvailableCertificates,
  Certificate,
} from "../../services/certificateApis";

const CertificatePortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  console.log(isMobile);
  // Ref to access CertificateTemplates methods
  const certificateRef = useRef<CertificateTemplatesRef>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      console.log(
        "Mobile detection:",
        mobile,
        "Screen width:",
        window.innerWidth
      );
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Fetch certificates from API
  const {
    data: certificates = [],
    isLoading,
    error,
  } = useQuery<Certificate[]>({
    queryKey: ["availableCertificates"],
    queryFn: () => getAvailableCertificates(1),
  });

  const filteredCertificates = useMemo(() => {
    return certificates.filter(
      (cert) =>
        cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [certificates, searchTerm]);

  const handleViewCertificate = async (certificate: Certificate) => {
    // If on mobile, directly download the certificate
    if (isMobile) {
      console.log("Mobile download triggered for:", certificate.name);
      setIsDownloading(true);

      try {
        // Set the certificate first
        setSelectedCertificate(certificate);

        // Wait for the component to update with the new certificate
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (certificateRef.current) {
          console.log("Certificate ref found, downloading...");
          await certificateRef.current.downloadPDF();
        } else {
          console.error("Certificate ref not found after waiting");
        }
      } catch (error) {
        console.error("Download failed:", error);
      } finally {
        setIsDownloading(false);
      }
    } else {
      // On desktop, show preview modal
      setSelectedCertificate(certificate);
      setShowPreview(true);
    }
  };

  const getCertificateIcon = (type: string) => {
    if (type === "assessment") {
      return (
        <svg
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    } else if (type === "workshop") {
      return (
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      );
    } else {
      // assessment-workshop type
      return (
        <svg
          className="w-6 h-6 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
  };

  const getCertificateBadge = (type: string) => {
    if (type === "assessment") {
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          Assessment
        </span>
      );
    } else if (type === "workshop") {
      return (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          Workshop
        </span>
      );
    } else {
      // assessment-workshop type
      return (
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
          Assessment & Workshop
        </span>
      );
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPreview]);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            My Certificates
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and download your certificates from assessments and workshops
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search certificates by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79] text-sm sm:text-base"
              />
              <svg
                className="absolute left-3 top-2.5 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {!isLoading && !error && (
              <div className="text-sm text-gray-500">
                {filteredCertificates.length} certificate
                {filteredCertificates.length !== 1 ? "s" : ""} found
              </div>
            )}
          </div>
        </div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="text-center py-8 sm:py-12">
            <svg
              className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Loading certificates...
            </h3>
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12">
            <svg
              className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error loading certificates
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please try again later.
            </p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <svg
              className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No certificates found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Try adjusting your search terms."
                : "You haven't earned any certificates yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-3 sm:p-4 md:p-6"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6">
                    {getCertificateIcon(certificate.type)}
                  </div>
                  <div className="text-xs sm:text-sm">
                    {getCertificateBadge(certificate.type)}
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2">
                  {certificate.name}
                </h3>

                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Issued:</span>{" "}
                    {new Date(certificate.issuedDate).toLocaleDateString()}
                  </p>
                  {certificate.score && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Score:</span>{" "}
                      {certificate.score}%
                    </p>
                  )}
                  {certificate.sessionNumber && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Session:</span>{" "}
                      {certificate.sessionNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleViewCertificate(certificate)}
                    disabled={isDownloading}
                    className="w-full bg-[#255C79] text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-[#1E4A63] hover:scale-105 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 transform active:scale-95 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading && isMobile ? (
                      <svg
                        className="animate-spin w-3 h-3 sm:w-4 sm:h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                    <span className="hidden sm:inline">
                      View & Download Certificate
                    </span>
                    <span className="sm:hidden">
                      {isDownloading
                        ? "Downloading..."
                        : "Download Certificate"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificate Preview Modal - Hidden on Mobile */}
        {showPreview && !isMobile && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-[1px] flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-lg border border-gray-300">
              <div className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-10 sm:px-4 text-sm rounded-xl text-white bg-[#255C79] font-medium transition-all duration-200 hover:bg-[#1E4A63] hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    >
                      <svg
                        className="w-5 h-5 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="hidden sm:inline ml-2">Close</span>
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={async () => {
                        if (isDownloading) return; // Prevent multiple clicks

                        setIsDownloading(true);
                        try {
                          await certificateRef.current?.downloadPDF();
                        } catch (error) {
                          console.error("Download failed:", error);
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                      disabled={isDownloading}
                      className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-10 sm:px-4 sm:px-6 text-sm rounded-xl text-white bg-[#255C79] font-medium transition-all duration-200 hover:bg-[#1E4A63] hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    >
                      {isDownloading ? (
                        <>
                          <svg
                            className="animate-spin w-5 h-5 sm:w-4 sm:h-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span className="hidden sm:inline ml-2">
                            Generating PDF...
                          </span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="hidden sm:inline ml-2">
                            Download
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="py-2 px-3 sm:px-6">
                <CertificateTemplates
                  ref={certificateRef}
                  certificate={selectedCertificate}
                />
              </div>
            </div>
          </div>
        )}

        {/* Hidden CertificateTemplates for Mobile Downloads */}
        {isMobile && (
          <div className="hidden">
            <CertificateTemplates
              ref={certificateRef}
              certificate={selectedCertificate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatePortal;
