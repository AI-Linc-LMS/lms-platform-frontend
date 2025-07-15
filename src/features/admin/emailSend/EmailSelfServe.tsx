import React, { useState, useRef } from "react";
import { useToast } from "../../../contexts/ToastContext";
import RichTextEditor from "../course-builder/components/RichTextEditor";
import { htmlEmail } from "../../../services/admin/workshopRegistrationApis";

interface EmailData {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

const EmailSelfServe: React.FC = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [emailData, setEmailData] = useState<EmailData[]>([]);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: "",
    body: "",
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: showSuccessToast, error: showErrorToast } = useToast();

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
      const processedBody = emailTemplate.body.replace(/\n/g, "\\n");
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
    if (!emailData.length || !emailTemplate.subject || !emailTemplate.body) {
      alert("Please upload emails and fill in subject and body.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Here you would integrate with your email service API
      // await fetch('/api/send-bulk-emails', { ... })

      showSuccessToast(
        "Emails Sent Successfully!",
        `Successfully sent ${emailData.length} emails to your recipients.`
      );
      // Reset form
      setEmailData([]);
      setEmailTemplate({ subject: "", body: "" });
      setUploadedFileName("");
      setHtmlPreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      showErrorToast(
        "Error Sending Emails",
        "Failed to send emails. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Bulk Email Sender</h1>
        <button
          onClick={downloadSampleCSV}
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Sample CSV
        </button>
      </div>

      {/* Email Upload Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          1. Upload Email List
        </h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 pt-10 text-center">
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
            className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Choose CSV File
          </label>
          <p className="text-gray-600 mt-2">
            Upload a CSV file with email addresses (one per line).
          </p>
          {uploadedFileName && (
            <p className="text-green-600 mt-2">✓ {uploadedFileName} uploaded</p>
          )}
        </div>
      </div>

      {/* Email Composition Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          2. Compose Email
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={emailTemplate.body}
                  onChange={(value: string) =>
                    setEmailTemplate({ ...emailTemplate, body: value })
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
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handlePreviewHtml}
                disabled={isPreviewLoading || !emailTemplate.body}
                className={`px-4 py-2 rounded bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors ${
                  isPreviewLoading || !emailTemplate.body
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
              !emailTemplate.body ||
              isLoading
            }
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !emailData.length ||
              !emailTemplate.subject ||
              !emailTemplate.body ||
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {isLoading ? "Sending..." : "Send Bulk Emails"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSelfServe;
