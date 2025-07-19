import React, { useRef, useState } from "react";
//import { useMutation } from "@tanstack/react-query";
//import { uploadAttendanceData } from "../../../../services/admin/workshopRegistrationApis";
import { parseCSVAttendance, validateCSVFormat } from "../utils/csvParser";
//import { AttendanceData, CSVUploadResponse } from "../types";

interface CSVUploadButtonProps {
  clientId: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const CSVUploadButton: React.FC<CSVUploadButtonProps> = ({
  //clientId,
  //onSuccess,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  //   const uploadMutation = useMutation({
  //     mutationFn: (attendanceData: AttendanceData[]) =>
  //       uploadAttendanceData(clientId, attendanceData),
  //     onSuccess: (data: CSVUploadResponse) => {
  //       setIsUploading(false);
  //       onSuccess?.(
  //         `Successfully uploaded ${data.processed_count || 0} attendance records`
  //       );
  //     },
  //     onError: (error: Error) => {
  //       setIsUploading(false);
  //       const axiosError = error as {
  //         response?: { data?: { message?: string } };
  //       };
  //       const errorMessage =
  //         axiosError?.response?.data?.message ||
  //         "Failed to upload attendance data";
  //       onError?.(errorMessage);
  //     },
  //   });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onError?.("Please select a CSV file");
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();

      // Validate CSV format
      const validation = validateCSVFormat(text);
      if (!validation.isValid) {
        onError?.(`CSV validation failed: ${validation.errors.join(", ")}`);
        setIsUploading(false);
        return;
      }

      // Parse CSV data
      const attendanceData = parseCSVAttendance(text);

      if (attendanceData.length === 0) {
        onError?.("No valid attendance records found in CSV file");
        setIsUploading(false);
        return;
      }
      // Upload to API
      //uploadMutation.mutate(attendanceData);
    } catch {
      setIsUploading(false);
      onError?.("Failed to read CSV file");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={isUploading}
        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Upload Attendance CSV"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span>{isUploading ? "Uploading..." : "Upload Attendance"}</span>
      </button>
    </>
  );
};
