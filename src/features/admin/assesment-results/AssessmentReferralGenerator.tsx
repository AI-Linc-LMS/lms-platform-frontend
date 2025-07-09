import React, { useState } from "react";
import { FiCopy, FiCheck, FiExternalLink, FiLink } from "react-icons/fi";

interface AssessmentReferralGeneratorProps {
  className?: string;
}

const AssessmentReferralGenerator: React.FC<AssessmentReferralGeneratorProps> = ({ 
  className = "" 
}) => {
  const [assessmentId, setAssessmentId] = useState("ai-linc-scholarship-test");
  const [referralCode, setReferralCode] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Generate the referral URL
  const generateReferralUrl = () => {
    if (!referralCode.trim()) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/assessment/${assessmentId}?ref=${encodeURIComponent(referralCode.trim())}`;
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Open URL in new tab
  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const generatedUrl = generateReferralUrl();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FiLink className="w-5 h-5 text-[#255C79]" />
        <h2 className="text-lg font-semibold text-gray-900">
          Generate Assessment Referral URL
        </h2>
      </div>

      <div className="space-y-4">
        {/* Assessment ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment ID
          </label>
          <input
            type="text"
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            placeholder="e.g., ai-linc-scholarship-test"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            The unique identifier for the assessment
          </p>
        </div>

        {/* Referral Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral Code
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="e.g., TEACHER123, PARTNER_XYZ"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            The referral code to track who referred the student
          </p>
        </div>

        {/* Generated URL Display */}
        {generatedUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Referral URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600 font-mono break-all">
                {generatedUrl}
              </div>
              <button
                onClick={() => copyToClipboard(generatedUrl)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  copiedUrl === generatedUrl
                    ? "bg-green-100 text-green-700"
                    : "bg-[#255C79] text-white hover:bg-[#1E4A63]"
                }`}
                title={copiedUrl === generatedUrl ? "Copied!" : "Copy URL"}
              >
                {copiedUrl === generatedUrl ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={() => openInNewTab(generatedUrl)}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                title="Open in new tab"
              >
                <FiExternalLink className="w-4 h-4" />
                Open
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Enter the assessment ID (or use the default)</li>
            <li>2. Enter a unique referral code to track the source</li>
            <li>3. Copy the generated URL and share it with students</li>
            <li>4. View referral tracking in the assessment results below</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AssessmentReferralGenerator; 