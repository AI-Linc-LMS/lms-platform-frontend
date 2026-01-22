"use client";

import { useState, useEffect, useMemo } from "react";
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
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";
import { BasicInfoSection } from "@/components/admin/assessment/BasicInfoSection";
import { AssessmentSettingsSection } from "@/components/admin/assessment/AssessmentSettingsSection";
import {
  MultipleSectionsSection,
  Section,
} from "@/components/admin/assessment/MultipleSectionsSection";
import { SectionBasedQuestionsInput } from "@/components/admin/assessment/SectionBasedQuestionsInput";
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
  const [proctoringEnabled, setProctoringEnabled] = useState(true);

  // Multiple sections
  const [sections, setSections] = useState<Section[]>([]);

  // MCQ input method
  const [mcqInputMethod, setMcqInputMethod] =
    useState<MCQInputMethod>("manual");

  // Section-based question assignments
  // For manual/csv/ai input
  const [manualMCQs, setManualMCQs] = useState<Record<string, MCQ[]>>({});
  const [csvMCQs, setCsvMCQs] = useState<Record<string, MCQ[]>>({});
  const [aiMCQs, setAiMCQs] = useState<Record<string, MCQ[]>>({});
  // For existing pool selection
  const [sectionMcqIds, setSectionMcqIds] = useState<Record<string, number[]>>(
    {}
  );

  // Existing MCQs for selection
  const [existingMCQs, setExistingMCQs] = useState<any[]>([]);
  const [loadingMCQs, setLoadingMCQs] = useState(false);

  // Coding problems
  const [codingInputMethod, setCodingInputMethod] = useState<"existing" | "ai">(
    "existing"
  );
  const [sectionCodingProblemIds, setSectionCodingProblemIds] = useState<
    Record<string, number[]>
  >({});
  // For AI generated coding problems (similar to aiMCQs)
  const [aiCodingProblems, setAiCodingProblems] = useState<
    Record<string, CodingProblemListItem[]>
  >({});
  const [existingCodingProblems, setExistingCodingProblems] = useState<
    CodingProblemListItem[]
  >([]);
  const [loadingCodingProblems, setLoadingCodingProblems] = useState(false);

  // Load existing MCQs and coding problems on page load
  useEffect(() => {
    loadExistingMCQs();
    loadExistingCodingProblems();
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

  const loadExistingCodingProblems = async () => {
    try {
      setLoadingCodingProblems(true);
      const data = await adminAssessmentService.getCodingProblems(
        config.clientId
      );
      setExistingCodingProblems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load coding problems", "error");
    } finally {
      setLoadingCodingProblems(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate basic info
      if (!title.trim() || !instructions.trim()) {
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
      if (sections.length === 0) {
        showToast("Please add at least one section", "error");
        return;
      }
    }
    if (activeStep === 1) {
      // Validate questions for each section
      const quizSections = sections.filter((s) => s.type === "quiz");
      const codingSections = sections.filter((s) => s.type === "coding");
      
      let hasQuizQuestions = false;
      let hasCodingProblems = false;

      // Check quiz sections
      if (quizSections.length > 0) {
        for (const section of quizSections) {
          if (mcqInputMethod === "existing") {
            const ids = sectionMcqIds[section.id] || [];
            if (ids.length > 0) {
              hasQuizQuestions = true;
              break;
            }
          } else {
            const mcqs =
              manualMCQs[section.id] ||
              csvMCQs[section.id] ||
              aiMCQs[section.id] ||
              [];
            if (mcqs.length > 0) {
              hasQuizQuestions = true;
              break;
            }
          }
        }
      }

      // Check coding sections
      if (codingSections.length > 0) {
        for (const section of codingSections) {
          const ids = sectionCodingProblemIds[section.id] || [];
          const aiProblems = aiCodingProblems[section.id] || [];
          if (ids.length > 0 || aiProblems.length > 0) {
            hasCodingProblems = true;
            break;
          }
        }
      }

      // At least one section type must have questions
      if (!hasQuizQuestions && !hasCodingProblems) {
        showToast(
          "Please add at least one question to a section",
          "error"
        );
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Validation function to check if Next button should be enabled
  const isNextButtonDisabled = useMemo(() => {
    if (activeStep === 0) {
      // Step 0: Basic info validation
      if (!title.trim() || !instructions.trim()) {
        return true;
      }
      if (durationMinutes < 1) {
        return true;
      }
      if (isPaid && (!price || Number(price) <= 0)) {
        return true;
      }
      if (sections.length === 0) {
        return true;
      }
      return false;
    }
    
    if (activeStep === 1) {
      // Step 1: Validate questions for each section
      const quizSections = sections.filter((s) => s.type === "quiz");
      const codingSections = sections.filter((s) => s.type === "coding");
      
      // Check quiz sections
      for (const section of quizSections) {
        // Calculate total MCQs for this section (inline logic)
        let totalQuestions = 0;
        if (manualMCQs[section.id]) {
          totalQuestions += manualMCQs[section.id].length;
        }
        if (csvMCQs[section.id]) {
          totalQuestions += csvMCQs[section.id].length;
        }
        if (aiMCQs[section.id]) {
          totalQuestions += aiMCQs[section.id].length;
        }
        const existingIds = sectionMcqIds[section.id] || [];
        totalQuestions += existingIds.length;
        
        const requiredQuestions = section.number_of_questions_to_show ?? 1;
        
        if (totalQuestions < requiredQuestions) {
          return true; // Not enough questions
        }
      }
      
      // Check coding sections
      for (const section of codingSections) {
        // Calculate total coding problems for this section (inline logic)
        let totalProblems = 0;
        const existingIds = sectionCodingProblemIds[section.id] || [];
        totalProblems += existingIds.length;
        if (aiCodingProblems[section.id]) {
          totalProblems += aiCodingProblems[section.id].length;
        }
        
        const requiredProblems = section.number_of_questions_to_show ?? 1;
        
        if (totalProblems < requiredProblems) {
          return true; // Not enough problems
        }
      }
      
      // At least one section type must have questions
      let hasQuizQuestions = false;
      let hasCodingProblems = false;
      
      if (quizSections.length > 0) {
        for (const section of quizSections) {
          let totalQuestions = 0;
          if (manualMCQs[section.id]) {
            totalQuestions += manualMCQs[section.id].length;
          }
          if (csvMCQs[section.id]) {
            totalQuestions += csvMCQs[section.id].length;
          }
          if (aiMCQs[section.id]) {
            totalQuestions += aiMCQs[section.id].length;
          }
          const existingIds = sectionMcqIds[section.id] || [];
          totalQuestions += existingIds.length;
          
          if (totalQuestions > 0) {
            hasQuizQuestions = true;
            break;
          }
        }
      }
      
      if (codingSections.length > 0) {
        for (const section of codingSections) {
          let totalProblems = 0;
          const existingIds = sectionCodingProblemIds[section.id] || [];
          totalProblems += existingIds.length;
          if (aiCodingProblems[section.id]) {
            totalProblems += aiCodingProblems[section.id].length;
          }
          
          if (totalProblems > 0) {
            hasCodingProblems = true;
            break;
          }
        }
      }
      
      if (!hasQuizQuestions && !hasCodingProblems) {
        return true; // No questions at all
      }
      
      return false;
    }
    
    return false;
  }, [
    activeStep,
    title,
    instructions,
    durationMinutes,
    isPaid,
    price,
    sections,
    sectionMcqIds,
    manualMCQs,
    csvMCQs,
    aiMCQs,
    sectionCodingProblemIds,
    aiCodingProblems,
  ]);

  // Get total count of MCQs for a specific section (all sources combined)
  const getTotalMCQCountForSection = (sectionId: string): number => {
    let count = 0;
    
    // Manual MCQs
    if (manualMCQs[sectionId]) {
      count += manualMCQs[sectionId].length;
    }
    
    // CSV MCQs
    if (csvMCQs[sectionId]) {
      count += csvMCQs[sectionId].length;
    }
    
    // AI MCQs
    if (aiMCQs[sectionId]) {
      count += aiMCQs[sectionId].length;
    }
    
    // Existing pool MCQs
    const existingIds = sectionMcqIds[sectionId] || [];
    count += existingIds.length;
    
    return count;
  };

  // Get MCQs for a specific section - checks ALL input methods
  const getMCQsForSection = (sectionId: string): MCQ[] => {
    // Collect questions from all possible sources
    const allMCQs: MCQ[] = [];

    // Manual MCQs
    if (manualMCQs[sectionId] && manualMCQs[sectionId].length > 0) {
      allMCQs.push(...manualMCQs[sectionId]);
    }

    // CSV MCQs
    if (csvMCQs[sectionId] && csvMCQs[sectionId].length > 0) {
      allMCQs.push(...csvMCQs[sectionId]);
    }

    // AI MCQs
    if (aiMCQs[sectionId] && aiMCQs[sectionId].length > 0) {
      allMCQs.push(...aiMCQs[sectionId]);
    }

    // Existing pool MCQs (convert IDs to MCQ objects)
    const existingIds = sectionMcqIds[sectionId] || [];
    if (existingIds.length > 0) {
      const existingMCQsForSection = existingMCQs
        .filter((mcq) => existingIds.includes(mcq.id))
        .map((mcq) => ({
          question_text: mcq.question_text,
          option_a: mcq.option_a,
          option_b: mcq.option_b,
          option_c: mcq.option_c,
          option_d: mcq.option_d,
          correct_option: (mcq.correct_option as "A" | "B" | "C" | "D") || "A",
          explanation: mcq.explanation || "",
          difficulty_level:
            (mcq.difficulty_level as "Easy" | "Medium" | "Hard") || "Medium",
          topic: mcq.topic || "",
          skills: mcq.skills || "",
        }));
      allMCQs.push(...existingMCQsForSection);
    }

    return allMCQs;
  };

  // Get MCQ IDs for a specific section (for existing pool)
  const getMcqIdsForSection = (sectionId: string): number[] => {
    return sectionMcqIds[sectionId] || [];
  };

  // Get total count of coding problems for a specific section (all sources combined)
  const getTotalCodingProblemCountForSection = (sectionId: string): number => {
    let count = 0;
    
    // Existing pool coding problems
    const existingIds = sectionCodingProblemIds[sectionId] || [];
    count += existingIds.length;
    
    // AI generated coding problems
    if (aiCodingProblems[sectionId]) {
      count += aiCodingProblems[sectionId].length;
    }
    
    return count;
  };

  // Get Coding Problem IDs for a specific section
  const getCodingProblemIdsForSection = (sectionId: string): number[] => {
    return sectionCodingProblemIds[sectionId] || [];
  };

  // Get Coding Problems for a specific section (combines AI generated and existing)
  const getCodingProblemsForSection = (
    sectionId: string
  ): CodingProblemListItem[] => {
    const problems: CodingProblemListItem[] = [];

    // Add AI generated problems
    if (aiCodingProblems[sectionId] && aiCodingProblems[sectionId].length > 0) {
      problems.push(...aiCodingProblems[sectionId]);
    }

    // Add existing problems (from selected IDs)
    const selectedIds = sectionCodingProblemIds[sectionId] || [];
    if (selectedIds.length > 0) {
      const existingProblems = existingCodingProblems.filter((problem) =>
        selectedIds.includes(problem.id)
      );
      // Only add if not already in AI generated list (avoid duplicates)
      existingProblems.forEach((problem) => {
        if (!problems.some((p) => p.id === problem.id)) {
          problems.push(problem);
        }
      });
    }

    return problems;
  };

  // Get all MCQs across all sections with section information
  const getAllMCQsWithSections = (): Array<MCQ & { sectionId: string }> => {
    const quizSections = sections.filter((s) => s.type === "quiz");
    const allMCQs: Array<MCQ & { sectionId: string }> = [];
    quizSections.forEach((section) => {
      const sectionMCQs = getMCQsForSection(section.id);
      sectionMCQs.forEach((mcq) => {
        allMCQs.push({ ...mcq, sectionId: section.id });
      });
    });
    return allMCQs;
  };

  // Get all MCQs across all sections (for backward compatibility)
  const getAllMCQs = (): MCQ[] => {
    return getAllMCQsWithSections().map(({ sectionId, ...mcq }) => mcq);
  };

  const handleCreate = async () => {
    try {
      setCreating(true);

      const quizSections = sections
        .filter((s) => s.type === "quiz")
        .sort((a, b) => a.order - b.order);
      const codingSections = sections
        .filter((s) => s.type === "coding")
        .sort((a, b) => a.order - b.order);

      // Validate that at least one section has questions
      if (quizSections.length === 0 && codingSections.length === 0) {
        showToast("Please add at least one section", "error");
        setCreating(false);
        return;
      }

      // Validate that all quiz sections have at least 1 question
      if (quizSections.length > 0) {
        const sectionsWithoutQuestions: Array<{ title: string; order: number }> =
          [];
        quizSections.forEach((section) => {
          const sectionMCQs = getMCQsForSection(section.id);
          if (sectionMCQs.length === 0) {
            sectionsWithoutQuestions.push({
              title: section.title,
              order: section.order,
            });
          }
        });

        if (sectionsWithoutQuestions.length > 0) {
          const sectionNames = sectionsWithoutQuestions
            .sort((a, b) => a.order - b.order)
            .map((s) => `"${s.title}" (Order: ${s.order})`)
            .join(", ");
          showToast(
            `Please add at least 1 question to the following quiz sections: ${sectionNames}`,
            "error"
          );
          setCreating(false);
          return;
        }
      }

      // Validate number_of_questions_to_show for quiz sections
      const invalidQuizSections: Array<{ title: string; order: number; required: number; selected: number }> = [];
      quizSections.forEach((section) => {
        if (section.number_of_questions_to_show !== undefined) {
          const totalQuestions = getTotalMCQCountForSection(section.id);
          if (totalQuestions < section.number_of_questions_to_show) {
            invalidQuizSections.push({
              title: section.title,
              order: section.order,
              required: section.number_of_questions_to_show,
              selected: totalQuestions,
            });
          }
        }
      });

      if (invalidQuizSections.length > 0) {
        const errorMessages = invalidQuizSections
          .sort((a, b) => a.order - b.order)
          .map((s) => `"${s.title}" (Order: ${s.order}): Need ${s.required} questions, but only ${s.selected} selected`)
          .join("; ");
        showToast(
          `Quiz sections with insufficient questions: ${errorMessages}`,
          "error"
        );
        setCreating(false);
        return;
      }

      // Validate number_of_questions_to_show for coding sections
      const invalidCodingSections: Array<{ title: string; order: number; required: number; selected: number }> = [];
      codingSections.forEach((section) => {
        if (section.number_of_questions_to_show !== undefined) {
          const totalProblems = getTotalCodingProblemCountForSection(section.id);
          if (totalProblems < section.number_of_questions_to_show) {
            invalidCodingSections.push({
              title: section.title,
              order: section.order,
              required: section.number_of_questions_to_show,
              selected: totalProblems,
            });
          }
        }
      });

      if (invalidCodingSections.length > 0) {
        const errorMessages = invalidCodingSections
          .sort((a, b) => a.order - b.order)
          .map((s) => `"${s.title}" (Order: ${s.order}): Need ${s.required} problems, but only ${s.selected} selected`)
          .join("; ");
        showToast(
          `Coding sections with insufficient problems: ${errorMessages}`,
          "error"
        );
        setCreating(false);
        return;
      }

      // Build payload with all sections
      const payload: CreateAssessmentPayload = {
        title: title.trim(),
        instructions: instructions.trim(),
        description: description.trim() || undefined,
        duration_minutes: durationMinutes,
        is_paid: isPaid,
        price: isPaid ? (price ? Number(price) : null) : null,
        currency: isPaid ? currency : undefined,
        is_active: isActive,
        proctoring_enabled: proctoringEnabled,
      };

      // Remove undefined fields to match exact API format
      Object.keys(payload).forEach((key) => {
        if (payload[key as keyof typeof payload] === undefined) {
          delete payload[key as keyof typeof payload];
        }
      });

      // Prepare quiz sections with their questions
      if (quizSections.length > 0) {
        payload.quiz_sections = quizSections.map((section) => {
          const sectionMCQs = getMCQsForSection(section.id);
          const sectionMcqIds = getMcqIdsForSection(section.id);

          // Separate MCQs into those from manual/csv/ai (need to send as objects)
          // and those from existing pool (send as IDs)
          const manualMCQsForSection = manualMCQs[section.id] || [];
          const csvMCQsForSection = csvMCQs[section.id] || [];
          const aiMCQsForSection = aiMCQs[section.id] || [];
          const mcqsToSend = [
            ...manualMCQsForSection,
            ...csvMCQsForSection,
            ...aiMCQsForSection,
          ];

          const sectionPayload: any = {
            title: section.title.trim(),
            order: section.order,
            number_of_questions: section.number_of_questions_to_show !== undefined ? section.number_of_questions_to_show:sectionMCQs.length, // Total count from all sources
          };

          // Include description only if it exists
          if (section.description && section.description.trim()) {
            sectionPayload.description = section.description.trim();
          }

          // Include scores for quiz sections
          if (section.easyScore !== undefined) {
            sectionPayload.easy_score = section.easyScore;
          }
          if (section.mediumScore !== undefined) {
            sectionPayload.medium_score = section.mediumScore;
          }
          if (section.hardScore !== undefined) {
            sectionPayload.hard_score = section.hardScore;
          }


          // Include mcqs if there are any from manual/csv/ai input
          if (mcqsToSend.length > 0) {
            sectionPayload.mcqs = mcqsToSend;
          }

          // Include mcq_ids if there are any from existing pool
          if (sectionMcqIds.length > 0) {
            sectionPayload.mcq_ids = sectionMcqIds;
          }

          return sectionPayload;
        });
      }

      // Prepare coding sections with their coding problems
      if (codingSections.length > 0) {
        payload.coding_sections = codingSections.map((section) => {
          const sectionCodingProblemIds = getCodingProblemIdsForSection(
            section.id
          );
          const sectionPayload: any = {
            title: section.title.trim(),
            order: section.order,
            number_of_questions: section.number_of_questions_to_show !== undefined? section.number_of_questions_to_show: sectionCodingProblemIds.length,
            coding_problem_ids: sectionCodingProblemIds,
          };

          // Include description only if it exists
          if (section.description && section.description.trim()) {
            sectionPayload.description = section.description.trim();
          }

          // Include scores for coding sections
          if (section.easyScore !== undefined) {
            sectionPayload.easy_score = section.easyScore;
          }
          if (section.mediumScore !== undefined) {
            sectionPayload.medium_score = section.mediumScore;
          }
          if (section.hardScore !== undefined) {
            sectionPayload.hard_score = section.hardScore;
          }

          return sectionPayload;
        });
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
              proctoringEnabled={proctoringEnabled}
              onDurationChange={setDurationMinutes}
              onPaidChange={setIsPaid}
              onPriceChange={setPrice}
              onCurrencyChange={setCurrency}
              onActiveChange={setIsActive}
              onProctoringEnabledChange={setProctoringEnabled}
            />
            <Divider />
            <MultipleSectionsSection
              sections={sections}
              onSectionsChange={setSections}
            />
          </Box>
        );

      case 1:
        return (
          <SectionBasedQuestionsInput
            sections={sections}
            mcqInputMethod={mcqInputMethod}
            onMcqInputMethodChange={setMcqInputMethod}
            sectionMcqIds={sectionMcqIds}
            onSectionMcqIdsChange={(sectionId, ids) => {
              setSectionMcqIds((prev) => ({ ...prev, [sectionId]: ids }));
            }}
            manualMCQs={manualMCQs}
            onManualMCQsChange={(sectionId, mcqs) => {
              setManualMCQs((prev) => ({ ...prev, [sectionId]: mcqs }));
            }}
            csvMCQs={csvMCQs}
            onCsvMCQsChange={(sectionId, mcqs) => {
              setCsvMCQs((prev) => ({ ...prev, [sectionId]: mcqs }));
            }}
            aiMCQs={aiMCQs}
            onAiMCQsChange={(sectionId, mcqs) => {
              setAiMCQs((prev) => ({ ...prev, [sectionId]: mcqs }));
            }}
            existingMCQs={existingMCQs}
            loadingMCQs={loadingMCQs}
            codingInputMethod={codingInputMethod}
            onCodingInputMethodChange={setCodingInputMethod}
            sectionCodingProblemIds={sectionCodingProblemIds}
            onSectionCodingProblemIdsChange={(sectionId, ids) => {
              setSectionCodingProblemIds((prev) => ({
                ...prev,
                [sectionId]: ids,
              }));
            }}
            aiCodingProblems={aiCodingProblems}
            onAiCodingProblemsChange={(sectionId, problems) => {
              setAiCodingProblems((prev) => ({
                ...prev,
                [sectionId]: problems,
              }));
            }}
            existingCodingProblems={existingCodingProblems}
            loadingCodingProblems={loadingCodingProblems}
          />
        );

      case 2:
        const totalMCQsWithSections = getAllMCQsWithSections();
        const totalMCQs = getAllMCQs();
        const quizSections = sections.filter((s) => s.type === "quiz");
        const codingSections = sections.filter((s) => s.type === "coding");
        // Calculate total questions (MCQs + coding problems)

        return (
          <AssessmentPreviewSection
            title={title}
            durationMinutes={durationMinutes}
            isActive={isActive}
            isPaid={isPaid}
            price={price}
            currency={currency}
            sectionTitle={quizSections.length > 0 ? quizSections[0].title : ""}
            totalMCQs={totalMCQs}
            totalMCQsWithSections={totalMCQsWithSections}
            sections={sections}
            getMCQsForSection={getMCQsForSection}
            getCodingProblemIdsForSection={getCodingProblemIdsForSection}
            getCodingProblemsForSection={getCodingProblemsForSection}
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
                disabled={isNextButtonDisabled}
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
