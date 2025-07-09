import React, { useState } from "react";
import { FiCopy, FiCheck, FiExternalLink, FiLink, FiPlus, FiUser } from "react-icons/fi";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createReferral } from "../../../services/admin/workshopRegistrationApis";
import { getAllAssessments } from "../../../services/assesment/assesmentApis";
import { ReferralData } from "../../../types/referral";

interface AssessmentReferralGeneratorProps {
  className?: string;
}

const AssessmentReferralGenerator: React.FC<AssessmentReferralGeneratorProps> = ({ 
  className = "" 
}) => {
  // Fetch assessments list
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { data: assessments = [] } = useQuery({
    queryKey: ["assessments-list", clientId],
    queryFn: () => getAllAssessments(clientId),
    staleTime: 5 * 60 * 1000,
  });

  const [assessmentId, setAssessmentId] = useState(
    assessments[0]?.slug || "ai-linc-scholarship-test"
  );
  const [referralCode, setReferralCode] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form data for creating referral record
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    referral_code: ""
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const queryClient = useQueryClient();

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: (data: ReferralData) => createReferral(clientId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["referals"] });
      setReferralCode(data.referral_code || formData.referral_code);
      setShowCreateForm(false);
      setFormData({ name: "", email: "", phone_number: "", referral_code: "" });
      setErrors({});
    },
    onError: (error) => {
      console.error("Error creating referral:", error);
      // Handle error display
    }
  });

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

  // Validate form
  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }

    if (!formData.referral_code.trim()) {
      newErrors.referral_code = "Referral code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createReferralMutation.mutate(formData);
    }
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
        {/* Assessment Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Assessment
          </label>
          <select
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none"
          >
            {assessments.map((ass) => (
              <option key={ass.slug} value={ass.slug}>
                {ass.title}
              </option>
            ))}
          </select>
        </div>

        {/* Referral Code Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Referral Code
            </label>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1 text-sm text-[#255C79] hover:text-[#1E4A63] font-medium"
            >
              <FiPlus className="w-4 h-4" />
              Create New Referral
            </button>
          </div>

          {showCreateForm ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <FiUser className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">Create Referral Record</h3>
              </div>
              
              <form onSubmit={handleCreateReferral} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none ${
                        errors.phone_number ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Referral Code (e.g., TEACHER123)"
                      value={formData.referral_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, referral_code: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none ${
                        errors.referral_code ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.referral_code && <p className="text-red-500 text-xs mt-1">{errors.referral_code}</p>}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createReferralMutation.isPending}
                    className="flex items-center gap-1 px-3 py-2 bg-[#255C79] text-white rounded-md text-sm font-medium hover:bg-[#1E4A63] disabled:opacity-50"
                  >
                    {createReferralMutation.isPending ? "Creating..." : "Create Referral"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter existing referral code or create a new one above"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none"
            />
          )}
          
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
            <li>2. Create a new referral record with person details OR use an existing referral code</li>
            <li>3. Copy the generated URL and share it with students</li>
            <li>4. View referral tracking in the assessment results below</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AssessmentReferralGenerator; 