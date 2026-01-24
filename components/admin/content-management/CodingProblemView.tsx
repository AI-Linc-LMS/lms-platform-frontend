"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { ContentDetails } from "@/lib/services/admin/admin-content-management.service";
import { getAvailableLanguages } from "@/components/coding/utils/languageUtils";
import { CodingProblemDescription } from "./CodingProblemDescription";
import { CodingProblemEditor } from "./CodingProblemEditor";

interface CodingProblemViewProps {
  content: ContentDetails;
}

export function CodingProblemView({ content }: CodingProblemViewProps) {
  const templateCode = content.content_details?.template_code || {};
  const availableLanguages = getAvailableLanguages(templateCode);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const problemStatement = content.content_details?.problem_statement || "";
  const inputFormat = content.content_details?.input_format || "";
  const outputFormat = content.content_details?.output_format || "";
  const sampleInput = content.content_details?.sample_input || "";
  const sampleOutput = content.content_details?.sample_output || "";
  const constraints = content.content_details?.constraints || "";
  const tags = content.content_details?.tags || "";
  const difficultyLevel = content.content_details?.difficulty_level || "";
  const testCases = content.content_details?.test_cases || [];

  // Initialize language and code when component mounts
  useEffect(() => {
    if (availableLanguages.length > 0 && !selectedLanguage) {
      const firstLang = availableLanguages[0].value;
      setSelectedLanguage(firstLang);
      setCode(templateCode[firstLang] || "");
    } else if (availableLanguages.length === 0 && !selectedLanguage) {
      setSelectedLanguage("python");
      setCode("");
    }
  }, [availableLanguages, templateCode, selectedLanguage]);

  // Update code when selected language or template code changes
  useEffect(() => {
    if (selectedLanguage && templateCode[selectedLanguage]) {
      setCode(templateCode[selectedLanguage]);
    }
  }, [selectedLanguage, templateCode]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCode(templateCode[language] || "");
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 0,
      }}
    >
      {/* Left Panel - Problem Description */}
      <Box
        sx={{
          width: { xs: "100%", md: "50%" },
          height: { xs: "50%", md: "100%" },
          borderRight: { md: "1px solid #e5e7eb" },
          borderBottom: { xs: "1px solid #e5e7eb", md: "none" },
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
        }}
      >
        <CodingProblemDescription
          title={content.title}
          problemStatement={problemStatement}
          inputFormat={inputFormat}
          outputFormat={outputFormat}
          constraints={constraints}
          sampleInput={sampleInput}
          sampleOutput={sampleOutput}
          testCases={testCases}
          tags={tags}
          difficultyLevel={difficultyLevel}
        />
      </Box>

      {/* Right Panel - Code Editor */}
      <CodingProblemEditor
        code={code}
        selectedLanguage={selectedLanguage}
        availableLanguages={availableLanguages}
        onLanguageChange={handleLanguageChange}
      />
    </Box>
  );
}
