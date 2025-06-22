import React, { useState, useMemo, useEffect, useRef } from "react";
import CertificateTemplates, {
  CertificateTemplatesRef,
} from "./CertificateTemplates";

// Dummy data interface
interface Certificate {
  id: string;
  type: "assessment" | "workshop" | "assessment-workshop";
  name: string;
  issuedDate: string;
  studentName: string;
  studentEmail: string;
  score?: number;
  sessionNumber?: number;
}

const CertificatePortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Ref to access CertificateTemplates methods
  const certificateRef = useRef<CertificateTemplatesRef>(null);

  // Single certificate data - every student will have this
  const certificates: Certificate[] = [
    {
      id: "1",
      type: "assessment-workshop",
      name: "No code Development",
      issuedDate: "2024-01-15",
      studentName: "John Doe",
      studentEmail: "john.doe@example.com",
      score: 85,
      sessionNumber: 1,
    },
  ];

  const filteredCertificates = useMemo(() => {
    return certificates.filter(
      (cert) =>
        cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleViewCertificate = () => {
    setShowPreview(true);
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Certificates
          </h1>
          <p className="text-gray-600">
            View and download your certificates from assessments and workshops
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search certificates by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
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
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  {getCertificateIcon(certificate.type)}
                  {getCertificateBadge(certificate.type)}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {certificate.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Issued:</span>{" "}
                    {new Date(certificate.issuedDate).toLocaleDateString()}
                  </p>
                  {certificate.score && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Score:</span>{" "}
                      {certificate.score}%
                    </p>
                  )}
                  {certificate.sessionNumber && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Session:</span>{" "}
                      {certificate.sessionNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleViewCertificate()}
                    className="w-full bg-[#255C79] text-white py-2 px-4 rounded-lg hover:bg-[#1E4A63] hover:scale-105 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <svg
                      className="w-4 h-4"
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
                    View & Download Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificate Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 ">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-lg border-1 border-gray-300 p-4">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="w-auto h-10 px-6 text-sm rounded-xl text-white bg-[#255C79] font-medium transition-all duration-200 hover:bg-[#1E4A63] hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    >
                      Close
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
                      className="w-auto h-10 px-6 text-sm rounded-xl text-white bg-[#255C79] font-medium transition-all duration-200 hover:bg-[#1E4A63] hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
                    >
                      {isDownloading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
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
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="py-2 px-6">
                <CertificateTemplates ref={certificateRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatePortal;
