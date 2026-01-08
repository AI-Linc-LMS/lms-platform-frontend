"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentService,
  CreateAssessmentPayload,
  MCQ,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";
import { BasicInfoSection } from "@/components/admin/assessment/BasicInfoSection";
import { AssessmentSettingsSection } from "@/components/admin/assessment/AssessmentSettingsSection";
import { QuizSectionSection } from "@/components/admin/assessment/QuizSectionSection";
import { QuestionsInputSection } from "@/components/admin/assessment/QuestionsInputSection";
import { AssessmentPreviewSection } from "@/components/admin/assessment/AssessmentPreviewSection";

type MCQInputMethod = "manual" | "existing" | "csv" | "ai";

const steps = ["Assessment Details", "Add Questions", "Review & Create"];

export default function CreateAssessmentPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [creating, setCreating] = useState(false);

  // Assessment basic info
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [isActive, setIsActive] = useState(true);

  // Quiz section
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionOrder, setSectionOrder] = useState(1);

  // MCQ input method
  const [mcqInputMethod, setMcqInputMethod] =
    useState<MCQInputMethod>("manual");
  const [manualMCQs, setManualMCQs] = useState<MCQ[]>([]);
  const [selectedMcqIds, setSelectedMcqIds] = useState<number[]>([]);
  const [csvMCQs, setCsvMCQs] = useState<MCQ[]>([]);
  const [aiMCQs, setAiMCQs] = useState<MCQ[]>([]);

  // Existing MCQs for selection
  const [existingMCQs, setExistingMCQs] = useState<any[]>([]);
  const [loadingMCQs, setLoadingMCQs] = useState(false);

  // Load existing MCQs on page load
  useEffect(() => {
    loadExistingMCQs();
  }, []);

  const loadExistingMCQs = async () => {
    try {
      setLoadingMCQs(true);
      const data = await adminAssessmentService.getMCQs(config.clientId);
      setExistingMCQs(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load MCQs", "error");
    } finally {
      setLoadingMCQs(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate basic info
      if (!title.trim() || !instructions.trim() || !sectionTitle.trim()) {
        showToast("Please fill in all required fields", "error");
        return;
      }
      if (durationMinutes < 1) {
        showToast("Duration must be at least 1 minute", "error");
        return;
      }
      if (isPaid && (!price || Number(price) <= 0)) {
        showToast("Please enter a valid price for paid assessment", "error");
        return;
      }
    }
    if (activeStep === 1) {
      // Validate questions
      const totalMCQs = getTotalMCQs();
      if (totalMCQs.length === 0) {
        showToast("Please add at least one question", "error");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getTotalMCQs = (): MCQ[] => {
    switch (mcqInputMethod) {
      case "manual":
        return manualMCQs;
      case "csv":
        return csvMCQs;
      case "ai":
        return aiMCQs;
      default:
        return [];
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);

      const payload: CreateAssessmentPayload = {
        title: title.trim(),
        instructions: instructions.trim(),
        description: description.trim() || undefined,
        duration_minutes: durationMinutes,
        is_paid: isPaid,
        price: isPaid ? (price ? Number(price) : null) : null,
        currency: isPaid ? currency : undefined,
        is_active: isActive,
        quiz_section: {
          title: sectionTitle.trim(),
          description: sectionDescription.trim() || undefined,
          order: sectionOrder,
          number_of_questions: getTotalMCQs().length,
        },
      };

      if (mcqInputMethod === "existing") {
        payload.mcq_ids = selectedMcqIds;
      } else {
        payload.mcqs = getTotalMCQs();
      }

      await adminAssessmentService.createAssessment(config.clientId, payload);
      showToast("Assessment created successfully", "success");
      router.push("/admin/assessment");
    } catch (error: any) {
      showToast(error?.message || "Failed to create assessment", "error");
    } finally {
      setCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <BasicInfoSection
              title={title}
              instructions={instructions}
              description={description}
              onTitleChange={setTitle}
              onInstructionsChange={setInstructions}
              onDescriptionChange={setDescription}
            />
            <Divider />
            <AssessmentSettingsSection
              durationMinutes={durationMinutes}
              isPaid={isPaid}
              price={price}
              currency={currency}
              isActive={isActive}
              onDurationChange={setDurationMinutes}
              onPaidChange={setIsPaid}
              onPriceChange={setPrice}
              onCurrencyChange={setCurrency}
              onActiveChange={setIsActive}
            />
            <Divider />
            <QuizSectionSection
              sectionTitle={sectionTitle}
              sectionDescription={sectionDescription}
              sectionOrder={sectionOrder}
              onSectionTitleChange={setSectionTitle}
              onSectionDescriptionChange={setSectionDescription}
              onSectionOrderChange={setSectionOrder}
            />
          </Box>
        );

      case 1:
        return (
          <QuestionsInputSection
            mcqInputMethod={mcqInputMethod}
            onMcqInputMethodChange={setMcqInputMethod}
            manualMCQs={manualMCQs}
            onManualMCQsChange={setManualMCQs}
            selectedMcqIds={selectedMcqIds}
            onSelectedMcqIdsChange={setSelectedMcqIds}
            csvMCQs={csvMCQs}
            onCsvMCQsChange={setCsvMCQs}
            aiMCQs={aiMCQs}
            onAiMCQsChange={setAiMCQs}
            existingMCQs={existingMCQs}
            loadingMCQs={loadingMCQs}
          />
        );

      case 2:
        const totalMCQs = getTotalMCQs();
        return (
          <AssessmentPreviewSection
            title={title}
            durationMinutes={durationMinutes}
            isActive={isActive}
            isPaid={isPaid}
            price={price}
            currency={currency}
            sectionTitle={sectionTitle}
            totalMCQs={totalMCQs}
          />
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.back()}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Create Assessment
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 4,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      fontWeight: 500,
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Form Content */}
        <Paper
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
          }}
        >
          {renderStepContent()}
        </Paper>

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            gap: 2,
          }}
        >
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          >
            Back
          </Button>
          <Box sx={{ display: "flex", gap: 2 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={creating}
                startIcon={
                  creating ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:check" size={18} />
                  )
                }
                sx={{ bgcolor: "#6366f1" }}
              >
                {creating ? "Creating..." : "Create Assessment"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<IconWrapper icon="mdi:arrow-right" size={18} />}
                sx={{ bgcolor: "#6366f1" }}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
