import React, { useState, useRef } from "react";
import { useToast } from "../../../contexts/ToastContext";
import RichTextEditor from "../course-builder/components/RichTextEditor";
import {
  createEmailJob,
  htmlEmail,
} from "../../../services/admin/workshopRegistrationApis";
import { useMutation } from "@tanstack/react-query";
import { FiUpload, FiEye } from "react-icons/fi";
import EmailPreviewModal from "./EmailPreviewModal";

export interface JobData {
  task_name: string;
  emails: string[];
  subject: string;
  email_body: string;
}

interface EmailData {
  email: string;
}

interface EmailTemplate {
  subject: string;
  email_body: string;
}

interface EmailFormProps {
  clientId: string;
  onJobCreated: (jobId: string) => void;
  onViewHistory: () => void;
  preFilledEmails?: string[];
}

const EmailForm: React.FC<EmailFormProps> = ({
  clientId,
  onJobCreated,
  onViewHistory,
  preFilledEmails = [],
}) => {
  const [emailData, setEmailData] = useState<EmailData[]>(
    preFilledEmails.map((email) => ({ email }))
  );
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: "",
    email_body: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [htmlPreview, setHtmlPreview] = useState<string>(
    `<div style="font-family: Arial, sans-serif; padding: 24px; background: #f9f9f9;">
      <h2 style="color: #2d3748;">Welcome to AI Linc!</h2>
      <p style="color: #4a5568;">This is a <b>sample HTML email</b> preview. You can use <span style='color: #3182ce;'>bold</span>, <i>italic</i>, <u>underline</u>, and even <span style='color: #38a169;'>colored text</span>!</p>
      <p style="margin-top: 24px;">Best regards,<br/>The AI Linc Team</p>
    </div>`
  );
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const createJobMutation = useMutation({
    mutationFn: (jobData: JobData) => createEmailJob(clientId, jobData),
    onSuccess: (data) => {
      const returnedJobId = data?.task_id;
      onJobCreated(returnedJobId);

      // Reset form
      setEmailData([]);
      setEmailTemplate({ subject: "", email_body: "" });
      setUploadedFileName("");
      setHtmlPreview("");
      setTaskName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showSuccessToast(
        "Emails Sent Successfully!",
        "Successfully sent emails to your recipients."
      );
    },
    onError: () => {
      showErrorToast(
        "Error Sending Emails",
        "Failed to send emails. Please try again."
      );
    },
  });

  const parseCSV = (csvText: string): EmailData[] => {
    const lines = csvText.split("\n");
    const emails: EmailData[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle both formats: single email per line or comma-separated
      const values = line.split(",").map((value) => value.trim());

      for (const value of values) {
        if (value && value.includes("@")) {
          emails.push({ email: value });
        }
      }
    }

    return emails;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const emails = parseCSV(csvText);
        setEmailData(emails);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        alert(
          'Error parsing CSV file. Please check the format. Make sure it has an "email" column.'
        );
      }
    };
    reader.readAsText(file);
  };

  const handlePreviewHtml = async () => {
    setIsPreviewLoading(true);
    try {
      // Replace line breaks with literal \n before sending to API
      const processedBody = emailTemplate.email_body.replace(/\n/g, "\\n");
      const response = await htmlEmail(clientId, processedBody);
      setHtmlPreview(response.formatted_html || response || "");
    } catch {
      showErrorToast("Error", "Failed to format email body");
      setHtmlPreview("");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (
      !emailData.length ||
      !taskName ||
      !emailTemplate.subject ||
      !emailTemplate.email_body
    ) {
      alert("Please upload emails and fill in subject and body.");
      return;
    }

    setIsLoading(true);
    const createJobData: JobData = {
      task_name: taskName || "Welcome Email Campaign",
      emails: emailData.map((email) => email.email),
      subject: emailTemplate.subject,
      email_body: htmlPreview.length > 0 ? htmlPreview : emailTemplate.email_body,
    };
    createJobMutation.mutate(createJobData);
    setIsLoading(false);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailData((prev) =>
      prev.filter((emailData) => emailData.email !== emailToRemove)
    );
  };

  const downloadSampleCSV = () => {
    const csvContent =
      "opbkfslm@example.com\nrjjccrxc@example.com\newqczvde@mail.net\nvjpxzwvx@testmail.com\necxchwcz@sample.org";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_emails.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            Bulk Email Sender
          </h1>
        </div>
        <div className="flex gap-2">
          {/* CSV Upload Icon */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-lg cursor-pointer transition-colors"
              title="Upload CSV file"
            >
              <FiUpload className="w-5 h-5" />
            </label>
            {uploadedFileName && (
              <div className="absolute -bottom-8 right-0 text-xs text-green-600 whitespace-nowrap">
                ✓ {uploadedFileName}
              </div>
            )}
          </div>
          <button
            onClick={onViewHistory}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
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
                strokeWidth="2"
                d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
            View History
          </button>
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
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
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Email List Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          1. Email Recipients
        </h2>
        {emailData.length > 0 ? (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {emailData.length} recipient
                  {emailData.length !== 1 ? "s" : ""} loaded
                </span>
                <button
                  onClick={() => setShowEmailPreviewModal(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <FiEye className="w-4 h-4" />
                  View All
                </button>
              </div>
              <button
                onClick={() => setEmailData([])}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {emailData.slice(0, 5).map((emailData, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                >
                  <span className="text-gray-700 truncate">
                    {emailData.email}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    #{index + 1}
                  </span>
                </div>
              ))}
              {emailData.length > 6 && (
                <div className="flex items-center justify-center p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-600">
                  +{emailData.length - 6} more
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-2">
              No email recipients loaded yet.
            </p>
            <p className="text-sm text-gray-500">
              Upload a CSV file or emails will be pre-filled from the sales
              funnel.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          2. Task Name
        </h2>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a task name..."
        />
      </div>

      {/* Email Composition Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          3. Compose Email
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Subject *
            </label>
            <input
              type="text"
              value={emailTemplate.subject}
              onChange={(e) =>
                setEmailTemplate((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
              className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body *
            </label>
            <div className="flex gap-4 w-full justify-between">
              <div className="w-full h-[360px]">
                <RichTextEditor
                  value={emailTemplate.email_body}
                  onChange={(value: string) =>
                    setEmailTemplate({ ...emailTemplate, email_body: value })
                  }
                  placeholder="Enter email body content..."
                />
              </div>
              {/* HTML Preview */}
              <div className="w-full">
                {htmlPreview && (
                  <div className="border border-gray-300 rounded p-4 bg-gray-50 h-[360px]">
                    <div className="mb-2 text-xs text-gray-500 font-semibold">
                      HTML Preview
                    </div>
                    <div
                      dangerouslySetInnerHTML={{ __html: htmlPreview }}
                      className="h-[310px] overflow-y-auto"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex mt-4">
              <button
                type="button"
                onClick={handlePreviewHtml}
                disabled={
                  isPreviewLoading || emailTemplate.email_body.length === 0
                }
                className={`px-4 py-2 rounded bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors ${
                  isPreviewLoading || emailTemplate.email_body.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isPreviewLoading ? "Generating Preview..." : "Preview as HTML"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Send Section */}
      <div className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-gray-600">
            {emailData.length > 0 && (
              <p>Ready to send to {emailData.length} recipients</p>
            )}
          </div>
          <button
            onClick={handleSendEmails}
            disabled={
              !emailData.length ||
              !emailTemplate.subject ||
              !emailTemplate.email_body ||
              isLoading
            }
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !emailData.length ||
              !emailTemplate.subject ||
              !emailTemplate.email_body ||
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {isLoading ? "Sending..." : "Send Bulk Emails"}
          </button>
        </div>
      </div>

      {/* Email Preview Modal */}
      <EmailPreviewModal
        isOpen={showEmailPreviewModal}
        onClose={() => setShowEmailPreviewModal(false)}
        emails={emailData}
        onRemoveEmail={handleRemoveEmail}
      />
    </div>
  );
};

export default EmailForm;
