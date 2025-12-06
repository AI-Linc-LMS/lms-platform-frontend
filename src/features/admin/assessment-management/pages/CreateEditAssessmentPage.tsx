import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  RadioGroup,
  Radio,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Save as SaveIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import {
  getAssessmentById,
  createAssessment,
  updateAssessment,
  CreateAssessmentPayload,
} from "../../../../services/admin/assessmentApis";
import {
  getMCQs,
  MCQListItem,
  generateMCQsWithAI,
} from "../../../../services/admin/mcqApis";
import MCQFormList from "../components/MCQFormList";
import MCQSelectionTable from "../components/MCQSelectionTable";

import {
  AssessmentFormData,
  initialAssessmentFormData,
  createNewMCQ,
  CURRENCY_OPTIONS,
  downloadCSVTemplate,
  parseCSV,
  MCQData,
} from "../types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assessment-tabpanel-${index}`}
      aria-labelledby={`assessment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CreateEditAssessmentPage = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const isEditMode = !!assessmentId;

  // Storage key for form persistence
  const storageKey = `assessment-form-${assessmentId || "new"}`;
  const hasInitializedRef = useRef(false);

  // Load from localStorage on mount (only for new assessments, not edit mode)
  const loadFormFromStorage = (): AssessmentFormData | null => {
    if (isEditMode) return null; // Don't load from storage in edit mode
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only return if it has meaningful data (not just default values)
        if (
          parsed &&
          (parsed.title || parsed.instructions || parsed.mcqs?.length > 0)
        ) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  };

  const [formData, setFormData] = useState<AssessmentFormData>(() => {
    const stored = loadFormFromStorage();
    return stored || initialAssessmentFormData;
  });

  // Track if form has been initialized to prevent resets
  const formInitializedRef = useRef(false);
  const lastAiMCQsCountRef = useRef(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMCQIds, setSelectedMCQIds] = useState<Set<number>>(() => {
    if (isEditMode) return new Set();
    try {
      const stored = localStorage.getItem(`${storageKey}-selectedMCQIds`);
      if (stored) {
        const ids = JSON.parse(stored);
        return new Set(ids);
      }
    } catch {
      // Ignore parse errors
    }
    return new Set();
  });
  // Initialize tab value from URL or localStorage
  const [tabValue, setTabValue] = useState(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab) {
      const tabNum = parseInt(urlTab, 10);
      if (!isNaN(tabNum) && tabNum >= 0 && tabNum <= 2) {
        return tabNum;
      }
    }
    // Fallback to localStorage if no URL param
    if (!isEditMode) {
      try {
        const stored = localStorage.getItem(`${storageKey}-tab`);
        if (stored) {
          const tabNum = parseInt(stored, 10);
          if (!isNaN(tabNum) && tabNum >= 0 && tabNum <= 2) {
            return tabNum;
          }
        }
      } catch {
        // Ignore
      }
    }
    return 0;
  });
  const [showModeChangeConfirm, setShowModeChangeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<
    "create" | "select" | "bulk" | "ai" | null
  >(null);
  const [bulkMCQs, setBulkMCQs] = useState<MCQData[]>(() => {
    if (isEditMode) return [];
    try {
      const stored = localStorage.getItem(`${storageKey}-bulkMCQs`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkPage, setBulkPage] = useState(0);
  const [bulkRowsPerPage, setBulkRowsPerPage] = useState(10);

  // AI Generation state
  const [aiMCQs, setAiMCQs] = useState<MCQData[]>(() => {
    if (isEditMode) return [];
    try {
      const stored = localStorage.getItem(`${storageKey}-aiMCQs`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) {
          lastAiMCQsCountRef.current = parsed.length;
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    lastAiMCQsCountRef.current = 0;
    return [];
  });
  const [aiPage, setAiPage] = useState(0);
  const [aiRowsPerPage, setAiRowsPerPage] = useState(10);
  const [aiTopic, setAiTopic] = useState("");
  const [aiNumberOfQuestions, setAiNumberOfQuestions] = useState(10);
  const [aiDifficultyLevel, setAiDifficultyLevel] = useState<
    "Easy" | "Medium" | "Hard"
  >("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState("");
  const [aiGenerationSuccess, setAiGenerationSuccess] = useState(false);

  // Fetch existing assessment if editing
  const { data: existingAssessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ["assessment", clientId, assessmentId],
    queryFn: () => getAssessmentById(clientId, Number(assessmentId)),
    enabled: isEditMode,
  });

  // Fetch available MCQs for selection mode
  const { data: availableMCQs = [], isLoading: loadingMCQs } = useQuery<
    MCQListItem[]
  >({
    queryKey: ["mcqs", clientId],
    queryFn: () => getMCQs(clientId),
  });

  // Populate form if editing (only once when assessment loads)
  useEffect(() => {
    if (existingAssessment && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Only set form data if we're in edit mode and don't have localStorage data
      // This prevents overwriting user's work if they accidentally navigate
      if (isEditMode) {
        setFormData({
          title: existingAssessment.title,
          instructions: existingAssessment.instructions,
          description: existingAssessment.description || "",
          duration_minutes: existingAssessment.duration_minutes,
          is_paid: existingAssessment.is_paid,
          price: existingAssessment.price || "",
          currency: existingAssessment.currency || "INR",
          is_active: existingAssessment.is_active,
          quiz_section: {
            title:
              existingAssessment.quiz_sections?.[0]?.title || "Quiz Section",
            description:
              existingAssessment.quiz_sections?.[0]?.description || "",
            order: existingAssessment.quiz_sections?.[0]?.order || 1,
          },
          mode: "create",
          mcqs: [],
          mcq_ids: [],
        });
      }
    }
  }, [existingAssessment, isEditMode]);

  // Create/Update mutation (declared early so it can be used in useEffect)
  const saveMutation = useMutation({
    mutationFn: (payload: CreateAssessmentPayload) => {
      if (isEditMode) {
        return updateAssessment(clientId, Number(assessmentId), payload);
      }
      return createAssessment(clientId, payload);
    },
    onSuccess: () => {
      // Clear localStorage on successful save (for new assessments only)
      if (!isEditMode) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}-selectedMCQIds`);
        localStorage.removeItem(`${storageKey}-bulkMCQs`);
        localStorage.removeItem(`${storageKey}-aiMCQs`);
      }
      queryClient.invalidateQueries({ queryKey: ["assessments", clientId] });
      navigate("/admin/assessments");
    },
  });

  // Mark form as initialized after first render
  useEffect(() => {
    formInitializedRef.current = true;
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const tabStr = tabValue.toString();
    if (currentTab !== tabStr) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("tab", tabStr);
      setSearchParams(newSearchParams, { replace: true });
    }
    // Also save to localStorage
    if (!isEditMode) {
      try {
        localStorage.setItem(`${storageKey}-tab`, tabStr);
      } catch {
        // Ignore
      }
    }
  }, [tabValue, searchParams, setSearchParams, isEditMode, storageKey]);

  // Persist form data to localStorage (debounced) - saves on every change
  useEffect(() => {
    if (!isEditMode && formInitializedRef.current) {
      // Save immediately first (no debounce for critical data)
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
        localStorage.setItem(
          `${storageKey}-selectedMCQIds`,
          JSON.stringify(Array.from(selectedMCQIds))
        );
        localStorage.setItem(
          `${storageKey}-bulkMCQs`,
          JSON.stringify(bulkMCQs)
        );
        localStorage.setItem(`${storageKey}-aiMCQs`, JSON.stringify(aiMCQs));
      } catch {
        // Ignore storage errors
      }
    }
  }, [formData, selectedMCQIds, bulkMCQs, aiMCQs, isEditMode, storageKey]);

  // Save immediately when tab becomes hidden (before browser discards state)
  useEffect(() => {
    if (isEditMode) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && formInitializedRef.current) {
        // Tab is being hidden - save immediately to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(formData));
          localStorage.setItem(
            `${storageKey}-selectedMCQIds`,
            JSON.stringify(Array.from(selectedMCQIds))
          );
          localStorage.setItem(
            `${storageKey}-bulkMCQs`,
            JSON.stringify(bulkMCQs)
          );
          localStorage.setItem(`${storageKey}-aiMCQs`, JSON.stringify(aiMCQs));
          localStorage.setItem(`${storageKey}-tab`, tabValue.toString());
        } catch {
          // Ignore storage errors
        }
      } else if (document.visibilityState === "visible") {
        // Tab became visible - check and restore aiMCQs if needed
        setTimeout(() => {
          if (formInitializedRef.current && !isEditMode) {
            try {
              const storedAI = localStorage.getItem(`${storageKey}-aiMCQs`);
              if (storedAI) {
                const parsed = JSON.parse(storedAI);
                if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                  // Always restore if localStorage has data and state is empty or different
                  if (
                    aiMCQs.length === 0 ||
                    parsed.length !== aiMCQs.length ||
                    parsed.length > lastAiMCQsCountRef.current
                  ) {
                    setAiMCQs(parsed);
                    lastAiMCQsCountRef.current = parsed.length;
                  }
                }
              }
            } catch (error) {
              console.error(
                "Error restoring aiMCQs on visibility change:",
                error
              );
            }
          }
        }, 100); // Small delay to ensure state has settled
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    formData,
    selectedMCQIds,
    bulkMCQs,
    aiMCQs,
    tabValue,
    isEditMode,
    storageKey,
  ]);

  // Backup: Save before page unload
  useEffect(() => {
    if (isEditMode) return;

    const handleBeforeUnload = () => {
      if (formInitializedRef.current) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(formData));
          localStorage.setItem(
            `${storageKey}-selectedMCQIds`,
            JSON.stringify(Array.from(selectedMCQIds))
          );
          localStorage.setItem(
            `${storageKey}-bulkMCQs`,
            JSON.stringify(bulkMCQs)
          );
          localStorage.setItem(`${storageKey}-aiMCQs`, JSON.stringify(aiMCQs));
          localStorage.setItem(`${storageKey}-tab`, tabValue.toString());
        } catch {
          // Ignore storage errors
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    formData,
    selectedMCQIds,
    bulkMCQs,
    aiMCQs,
    tabValue,
    isEditMode,
    storageKey,
  ]);

  // Restore form from localStorage if it gets reset (handles tab switches and remounts)
  useEffect(() => {
    if (isEditMode || !formInitializedRef.current) return;

    // ALWAYS check localStorage for aiMCQs first - this is critical for data persistence
    // This handles the case where AI MCQs were generated but state was lost on tab switch
    try {
      const storedAI = localStorage.getItem(`${storageKey}-aiMCQs`);
      if (storedAI) {
        const parsed = JSON.parse(storedAI);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          // Simple rule: if localStorage has MCQs and state is empty OR has fewer items, restore
          // This ensures we never lose data
          if (aiMCQs.length === 0 || parsed.length > aiMCQs.length) {
            setAiMCQs(parsed);
            lastAiMCQsCountRef.current = parsed.length;
          } else if (parsed.length > lastAiMCQsCountRef.current) {
            // localStorage has more than we last tracked - restore it
            setAiMCQs(parsed);
            lastAiMCQsCountRef.current = parsed.length;
          }
        }
      }
    } catch (error) {
      console.error("Error restoring aiMCQs from localStorage:", error);
    }

    // Check if form appears to be reset (empty/default) but localStorage has data
    const isFormEmpty =
      (!formData.title || formData.title === initialAssessmentFormData.title) &&
      (!formData.instructions ||
        formData.instructions === initialAssessmentFormData.instructions) &&
      formData.mcqs.length === 0 &&
      selectedMCQIds.size === 0 &&
      bulkMCQs.length === 0;

    if (isFormEmpty) {
      const stored = loadFormFromStorage();
      if (
        stored &&
        stored.title &&
        stored.title !== initialAssessmentFormData.title
      ) {
        // Form was reset, restore from localStorage immediately
        setFormData(stored);

        // Restore other state
        try {
          const storedSelected = localStorage.getItem(
            `${storageKey}-selectedMCQIds`
          );
          if (storedSelected) {
            const ids = JSON.parse(storedSelected);
            if (ids.length > 0) {
              setSelectedMCQIds(new Set(ids));
            }
          }
        } catch {
          // Ignore
        }

        try {
          const storedBulk = localStorage.getItem(`${storageKey}-bulkMCQs`);
          if (storedBulk) {
            const parsed = JSON.parse(storedBulk);
            if (parsed.length > 0) {
              setBulkMCQs(parsed);
            }
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [formData, selectedMCQIds, bulkMCQs, aiMCQs, isEditMode, storageKey]); // Watch for changes

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith("quiz_section.")) {
      const fieldName = name.split(".")[1];
      setFormData((prev) => {
        const updated = {
          ...prev,
          quiz_section: {
            ...prev.quiz_section,
            [fieldName]: fieldName === "order" ? Number(value) : value,
          },
        };
        // Save immediately on change (no debounce for critical updates)
        if (!isEditMode && formInitializedRef.current) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {
            // Ignore
          }
        }
        return updated;
      });
    } else {
      setFormData((prev) => {
        const updated = {
          ...prev,
          [name]:
            type === "checkbox"
              ? checked
              : type === "number"
              ? Number(value)
              : value,
        };
        // Save immediately on change (no debounce for critical updates)
        if (!isEditMode && formInitializedRef.current) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {
            // Ignore
          }
        }
        return updated;
      });
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMCQChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const newMCQs = [...prev.mcqs];
      newMCQs[index] = {
        ...newMCQs[index],
        [field]: value,
      };
      return { ...prev, mcqs: newMCQs };
    });
  };

  const addMCQ = () => {
    setFormData((prev) => ({
      ...prev,
      mcqs: [...prev.mcqs, createNewMCQ()],
    }));
  };

  const bulkAddMCQs = (newMCQs: typeof formData.mcqs) => {
    setFormData((prev) => ({
      ...prev,
      mcqs: [...prev.mcqs, ...newMCQs],
    }));
  };

  const removeMCQ = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      mcqs: prev.mcqs.filter((_, i) => i !== index),
    }));
  };

  const toggleMCQSelection = (mcqId: number) => {
    setSelectedMCQIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mcqId)) {
        newSet.delete(mcqId);
      } else {
        newSet.add(mcqId);
      }
      return newSet;
    });
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { data, errors: parseErrors } = parseCSV(text);

      if (parseErrors.length > 0) {
        setCsvErrors(parseErrors);
        setUploadSuccess(false);
        setBulkMCQs([]);
        setBulkPage(0);
      } else {
        setCsvErrors([]);
        setUploadSuccess(true);
        setBulkMCQs(data);
        setBulkPage(0); // Reset to first page
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeBulkMCQ = (index: number) => {
    setBulkMCQs((prev) => {
      const newMCQs = prev.filter((_, i) => i !== index);
      // If we're on a page that no longer exists after deletion, go back one page
      const maxPage = Math.max(
        0,
        Math.ceil(newMCQs.length / bulkRowsPerPage) - 1
      );
      if (bulkPage > maxPage) {
        setBulkPage(maxPage);
      }
      return newMCQs;
    });
  };

  const handleAIGenerate = async () => {
    // Validation
    if (!aiTopic.trim()) {
      setAiGenerationError("Topic is required");
      return;
    }
    if (aiNumberOfQuestions < 1 || aiNumberOfQuestions > 100) {
      setAiGenerationError("Number of questions must be between 1 and 100");
      return;
    }

    setIsGenerating(true);
    setAiGenerationError("");
    setAiGenerationSuccess(false);

    try {
      const data = await generateMCQsWithAI(clientId, {
        topic: aiTopic,
        number_of_questions: aiNumberOfQuestions,
        difficulty_level: aiDifficultyLevel,
      });

      // Transform the MCQs to match our MCQData format
      const generatedMCQs: MCQData[] = data.mcqs.map((mcq, index: number) => ({
        id: `AI-${Date.now()}-${index}`,
        question_text: mcq.question_text,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_option: mcq.correct_option,
        explanation: mcq.explanation || "",
        difficulty_level: mcq.difficulty_level,
        topic: mcq.topic || "",
        skills: mcq.skills || "",
      }));

      // Calculate new array BEFORE state update
      const updatedAiMCQs = [...aiMCQs, ...generatedMCQs];

      // Save to localStorage SYNCHRONOUSLY before any state updates or tab switches
      if (!isEditMode) {
        try {
          localStorage.setItem(
            `${storageKey}-aiMCQs`,
            JSON.stringify(updatedAiMCQs)
          );
          // Also save the full form data
          localStorage.setItem(storageKey, JSON.stringify(formData));
          localStorage.setItem(
            `${storageKey}-selectedMCQIds`,
            JSON.stringify(Array.from(selectedMCQIds))
          );
          localStorage.setItem(
            `${storageKey}-bulkMCQs`,
            JSON.stringify(bulkMCQs)
          );
          // Update ref to track the count
          lastAiMCQsCountRef.current = updatedAiMCQs.length;
        } catch (error) {
          console.error("Failed to save AI MCQs to localStorage:", error);
        }
      }

      // Now update state
      setAiMCQs(updatedAiMCQs);
      lastAiMCQsCountRef.current = updatedAiMCQs.length;
      setAiGenerationSuccess(true);
      setAiPage(0);

      // Reset form
      setAiTopic("");
      setAiNumberOfQuestions(10);
      setAiDifficultyLevel("Medium");

      setTimeout(() => setAiGenerationSuccess(false), 3000);
    } catch (error) {
      setAiGenerationError(
        error instanceof Error
          ? error.message
          : "Failed to generate MCQs. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmModeChange = () => {
    if (pendingMode) {
      setFormData((prev) => ({
        ...prev,
        mode: pendingMode,
        mcqs: [],
      }));
      setSelectedMCQIds(new Set());
      setBulkMCQs([]);
      setCsvErrors([]);
      setBulkPage(0);
      setAiMCQs([]);
      setAiGenerationError("");
      setAiPage(0);
      setErrors({});
    }
    setShowModeChangeConfirm(false);
    setPendingMode(null);
  };

  const handleCancelModeChange = () => {
    setShowModeChangeConfirm(false);
    setPendingMode(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Save current form state before changing tabs
    if (!isEditMode && formInitializedRef.current) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
        localStorage.setItem(
          `${storageKey}-selectedMCQIds`,
          JSON.stringify(Array.from(selectedMCQIds))
        );
        localStorage.setItem(
          `${storageKey}-bulkMCQs`,
          JSON.stringify(bulkMCQs)
        );
        localStorage.setItem(`${storageKey}-aiMCQs`, JSON.stringify(aiMCQs));
        localStorage.setItem(`${storageKey}-tab`, newValue.toString());
      } catch {
        // Ignore
      }
    }
    setTabValue(newValue);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.instructions.trim()) {
      newErrors.instructions = "Instructions are required";
    }
    if (formData.duration_minutes < 1) {
      newErrors.duration_minutes = "Duration must be at least 1 minute";
    }
    if (formData.is_paid && !formData.price) {
      newErrors.price = "Price is required for paid assessments";
    }
    if (!formData.quiz_section.title.trim()) {
      newErrors["quiz_section.title"] = "Quiz section title is required";
    }

    if (formData.mode === "create") {
      if (formData.mcqs.length === 0) {
        newErrors.mcqs = "At least one MCQ is required";
      } else {
        formData.mcqs.forEach((mcq, index) => {
          if (!mcq.question_text.trim()) {
            newErrors[`mcq_${index}_question`] = "Question text is required";
          }
          if (
            !mcq.option_a.trim() ||
            !mcq.option_b.trim() ||
            !mcq.option_c.trim() ||
            !mcq.option_d.trim()
          ) {
            newErrors[`mcq_${index}_options`] = "All options are required";
          }
        });
      }
    } else if (formData.mode === "select") {
      if (selectedMCQIds.size === 0) {
        newErrors.mcq_ids = "At least one MCQ must be selected";
      }
    } else if (formData.mode === "bulk") {
      if (bulkMCQs.length === 0) {
        newErrors.mcqs = "Please upload a CSV file with at least one MCQ";
      }
    } else if (formData.mode === "ai") {
      if (aiMCQs.length === 0) {
        newErrors.mcqs = "Please generate at least one MCQ using AI";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateAssessmentPayload = {
      title: formData.title,
      instructions: formData.instructions,
      description: formData.description || undefined,
      duration_minutes: formData.duration_minutes,
      is_paid: formData.is_paid,
      price: formData.is_paid ? formData.price : null,
      currency: formData.is_paid ? formData.currency : undefined,
      is_active: formData.is_active,
      quiz_section: {
        title: formData.quiz_section.title,
        description: formData.quiz_section.description || undefined,
        order: formData.quiz_section.order,
      },
    };

    if (formData.mode === "create") {
      payload.mcqs = formData.mcqs.map((mcq) => ({
        question_text: mcq.question_text,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_option: mcq.correct_option,
        explanation: mcq.explanation || undefined,
        difficulty_level: mcq.difficulty_level,
        topic: mcq.topic || undefined,
        skills: mcq.skills || undefined,
      }));
    } else if (formData.mode === "select") {
      payload.mcq_ids = Array.from(selectedMCQIds);
    } else if (formData.mode === "bulk") {
      payload.mcqs = bulkMCQs.map((mcq) => ({
        question_text: mcq.question_text,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_option: mcq.correct_option,
        explanation: mcq.explanation || undefined,
        difficulty_level: mcq.difficulty_level,
        topic: mcq.topic || undefined,
        skills: mcq.skills || undefined,
      }));
    } else if (formData.mode === "ai") {
      payload.mcqs = aiMCQs.map((mcq) => ({
        question_text: mcq.question_text,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_option: mcq.correct_option,
        explanation: mcq.explanation || undefined,
        difficulty_level: mcq.difficulty_level,
        topic: mcq.topic || undefined,
        skills: mcq.skills || undefined,
      }));
    }

    saveMutation.mutate(payload);
  };

  if (isEditMode && loadingAssessment) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "var(--neutral-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            border: "2px solid",
            borderColor: "var(--primary-500)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--neutral-50)", p: 3 }}>
      <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => navigate("/admin/assessments")}
            sx={{
              color: "var(--font-primary)",
              "&:hover": {
                bgcolor: "var(--neutral-100)",
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "var(--font-primary)" }}
            >
              {isEditMode ? "Edit Assessment" : "Create Assessment"}
            </Typography>
            <Typography sx={{ color: "var(--font-secondary)" }}>
              {isEditMode
                ? "Update assessment details"
                : "Create a new assessment with MCQ questions"}
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Paper sx={{ bgcolor: "var(--card-bg)" }}>
            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: "var(--neutral-200)",
                "& .MuiTab-root": {
                  color: "var(--font-secondary)",
                  fontWeight: 500,
                },
                "& .Mui-selected": {
                  color: "var(--primary-600)",
                },
                "& .MuiTabs-indicator": {
                  bgcolor: "var(--primary-600)",
                },
              }}
            >
              <Tab label="Basic Info" />
              <Tab label="Quiz Section" />
              <Tab label="Questions" />
            </Tabs>

            {/* Tab 1: Basic Info */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Enter assessment title"
                />

                <TextField
                  label="Instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.instructions}
                  helperText={errors.instructions}
                  placeholder="Enter assessment instructions"
                />

                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter assessment description (optional)"
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                  }}
                >
                  <TextField
                    label="Duration (minutes)"
                    name="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: 1 }}
                    error={!!errors.duration_minutes}
                    helperText={errors.duration_minutes}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      name="currency"
                      value={formData.currency}
                      onChange={handleSelectChange}
                      label="Currency"
                      disabled={!formData.is_paid}
                    >
                      {CURRENCY_OPTIONS.map((curr) => (
                        <MenuItem key={curr.code} value={curr.code}>
                          {curr.symbol} - {curr.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  label="Price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={!formData.is_paid}
                  error={!!errors.price}
                  helperText={errors.price || "Required if assessment is paid"}
                  placeholder="Enter price"
                />

                <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="is_paid"
                        checked={formData.is_paid}
                        onChange={handleInputChange}
                        sx={{
                          color: "var(--primary-500)",
                          "&.Mui-checked": {
                            color: "var(--primary-600)",
                          },
                        }}
                      />
                    }
                    label="Paid Assessment"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        sx={{
                          color: "var(--primary-500)",
                          "&.Mui-checked": {
                            color: "var(--primary-600)",
                          },
                        }}
                      />
                    }
                    label="Active"
                  />
                </Box>
              </Box>
            </TabPanel>

            {/* Tab 2: Quiz Section */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Section Title"
                  name="quiz_section.title"
                  value={formData.quiz_section.title}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  error={!!errors["quiz_section.title"]}
                  helperText={errors["quiz_section.title"]}
                  placeholder="Enter section title"
                />

                <TextField
                  label="Section Description"
                  name="quiz_section.description"
                  value={formData.quiz_section.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Enter section description (optional)"
                />

                <TextField
                  label="Section Order"
                  name="quiz_section.order"
                  type="number"
                  value={formData.quiz_section.order}
                  onChange={handleInputChange}
                  inputProps={{ min: 1 }}
                  sx={{ maxWidth: 200 }}
                />
              </Box>
            </TabPanel>

            {/* Tab 3: Questions */}
            <TabPanel value={tabValue} index={2}>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 500,
                    color: "var(--font-primary)",
                    mb: 2,
                  }}
                >
                  Choose how to add questions
                </Typography>
                <RadioGroup
                  value={formData.mode}
                  onChange={(e) => {
                    const newMode = e.target.value as
                      | "create"
                      | "select"
                      | "bulk"
                      | "ai";

                    // Check if there's unsaved data
                    const hasUnsavedData =
                      (formData.mode === "create" &&
                        formData.mcqs.length > 0) ||
                      (formData.mode === "select" && selectedMCQIds.size > 0) ||
                      (formData.mode === "bulk" && bulkMCQs.length > 0) ||
                      (formData.mode === "ai" && aiMCQs.length > 0);

                    if (hasUnsavedData) {
                      // Show confirmation dialog
                      setPendingMode(newMode);
                      setShowModeChangeConfirm(true);
                    } else {
                      // No unsaved data, switch immediately
                      setFormData((prev) => ({
                        ...prev,
                        mode: newMode,
                        mcqs: [],
                      }));
                      setSelectedMCQIds(new Set());
                      setBulkMCQs([]);
                      setCsvErrors([]);
                      setBulkPage(0);
                      setAiMCQs([]);
                      setAiGenerationError("");
                      setAiPage(0);
                      setErrors({});
                    }
                  }}
                  row
                  sx={{ mb: 4 }}
                >
                  <FormControlLabel
                    value="create"
                    control={
                      <Radio
                        sx={{
                          color: "var(--primary-500)",
                          "&.Mui-checked": {
                            color: "var(--primary-600)",
                          },
                        }}
                      />
                    }
                    label="Create New MCQs"
                  />
                  <FormControlLabel
                    value="select"
                    control={
                      <Radio
                        sx={{
                          color: "var(--primary-500)",
                          "&.Mui-checked": {
                            color: "var(--primary-600)",
                          },
                        }}
                      />
                    }
                    label="Select Existing MCQs"
                  />
                  <FormControlLabel
                    value="bulk"
                    control={
                      <Radio
                        sx={{
                          color: "var(--primary-500)",
                          "&.Mui-checked": {
                            color: "var(--primary-600)",
                          },
                        }}
                      />
                    }
                    label="Bulk Upload (CSV)"
                  />
                  <FormControlLabel
                    value="ai"
                    control={
                      <Radio
                        sx={{
                          color: "var(--primary-500)",
                          "&.Mui-checked": {
                            color: "var(--primary-600)",
                          },
                        }}
                      />
                    }
                    label="AI Generation"
                  />
                </RadioGroup>

                {/* Create New MCQs Mode */}
                {formData.mode === "create" && (
                  <MCQFormList
                    mcqs={formData.mcqs}
                    errors={errors}
                    onMCQChange={handleMCQChange}
                    onAddMCQ={addMCQ}
                    onRemoveMCQ={removeMCQ}
                    onBulkAddMCQs={bulkAddMCQs}
                  />
                )}

                {/* Select Existing MCQs Mode */}
                {formData.mode === "select" && (
                  <Box>
                    {loadingMCQs ? (
                      <Box sx={{ textAlign: "center", py: 8 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            border: "2px solid",
                            borderColor: "var(--primary-500)",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto",
                            "@keyframes spin": {
                              "0%": { transform: "rotate(0deg)" },
                              "100%": { transform: "rotate(360deg)" },
                            },
                          }}
                        />
                        <Typography
                          sx={{ mt: 2, color: "var(--font-secondary)" }}
                        >
                          Loading MCQs...
                        </Typography>
                      </Box>
                    ) : (
                      <MCQSelectionTable
                        mcqs={availableMCQs}
                        selectedIds={selectedMCQIds}
                        onToggleSelection={toggleMCQSelection}
                        error={errors.mcq_ids}
                        onNavigateToMCQBank={() => navigate("/admin/mcqs")}
                      />
                    )}
                  </Box>
                )}

                {/* Bulk Upload Mode */}
                {formData.mode === "bulk" && (
                  <Box>
                    {/* CSV Upload Section */}
                    <Paper
                      sx={{
                        p: 3,
                        border: "1px solid",
                        borderColor: "var(--neutral-200)",
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: "var(--font-primary)",
                          }}
                        >
                          Bulk Import via CSV
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            color: "var(--font-secondary)",
                            mb: 1,
                          }}
                        >
                          Download the CSV template, fill in your questions, and
                          upload the file to import multiple MCQs at once.
                        </Typography>

                        <Box
                          sx={{
                            bgcolor: "var(--primary-50)",
                            border: "1px solid var(--primary-200)",
                            borderRadius: 1,
                            p: 2,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "var(--primary-700)",
                              mb: 1,
                            }}
                          >
                            Important Instructions:
                          </Typography>
                          <List dense sx={{ py: 0 }}>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                primary="• Column Headers: Do not modify or remove the header row from the template"
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  color: "var(--font-secondary)",
                                  fontWeight: 600,
                                }}
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                primary="• Difficulty Level: Use exactly Easy, Medium, or Hard (case-sensitive, do not change)"
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  color: "var(--font-secondary)",
                                }}
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                primary="• Correct Option: Must be A, B, C, or D (uppercase)"
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  color: "var(--font-secondary)",
                                }}
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                primary="• Required Fields: question_text, option_a, option_b, option_c, option_d, correct_option"
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  color: "var(--font-secondary)",
                                }}
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                primary="• Optional Fields: explanation, topic, skills"
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  color: "var(--font-secondary)",
                                }}
                              />
                            </ListItem>
                          </List>
                        </Box>

                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadTemplate}
                            sx={{
                              borderColor: "var(--primary-600)",
                              color: "var(--primary-600)",
                              "&:hover": {
                                borderColor: "var(--primary-700)",
                                bgcolor: "var(--primary-50)",
                              },
                            }}
                          >
                            Download Template
                          </Button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                          />

                          <Button
                            variant="contained"
                            startIcon={<UploadIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              bgcolor: "var(--primary-500)",
                              "&:hover": {
                                bgcolor: "var(--primary-700)",
                              },
                            }}
                          >
                            Upload CSV
                          </Button>
                        </Box>

                        {uploadSuccess && (
                          <Alert
                            severity="success"
                            onClose={() => setUploadSuccess(false)}
                          >
                            {bulkMCQs.length} MCQ(s) imported successfully!
                          </Alert>
                        )}

                        {csvErrors.length > 0 && (
                          <Alert
                            severity="error"
                            onClose={() => setCsvErrors([])}
                          >
                            <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                              CSV Validation Errors:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: "20px" }}>
                              {csvErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </Alert>
                        )}
                      </Box>
                    </Paper>

                    {/* Table View */}
                    {bulkMCQs.length > 0 && (
                      <Box>
                        <Typography
                          sx={{
                            mb: 2,
                            color: "var(--font-secondary)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {bulkMCQs.length} question
                          {bulkMCQs.length !== 1 ? "s" : ""} imported
                        </Typography>
                        <TableContainer
                          component={Paper}
                          sx={{
                            border: "1px solid",
                            borderColor: "var(--neutral-200)",
                          }}
                        >
                          <Table>
                            <TableHead sx={{ bgcolor: "var(--neutral-50)" }}>
                              <TableRow>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 70 }}
                                >
                                  ID
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", minWidth: 200 }}
                                >
                                  Question
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option A
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option B
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option C
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option D
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 80 }}
                                >
                                  Correct
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 100 }}
                                >
                                  Difficulty
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 80 }}
                                >
                                  Actions
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bulkMCQs
                                .slice(
                                  bulkPage * bulkRowsPerPage,
                                  bulkPage * bulkRowsPerPage + bulkRowsPerPage
                                )
                                .map((mcq, displayIndex) => {
                                  const actualIndex =
                                    bulkPage * bulkRowsPerPage + displayIndex;
                                  return (
                                    <TableRow key={mcq.id} hover>
                                      <TableCell
                                        sx={{
                                          fontSize: "0.75rem",
                                          color: "var(--font-secondary)",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {mcq.id}
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.question_text}
                                        >
                                          {mcq.question_text}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_a}
                                        >
                                          {mcq.option_a}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_b}
                                        >
                                          {mcq.option_b}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_c}
                                        >
                                          {mcq.option_c}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_d}
                                        >
                                          {mcq.option_d}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={mcq.correct_option}
                                          size="small"
                                          sx={{
                                            bgcolor: "var(--success-100)",
                                            color: "var(--success-700)",
                                            fontWeight: "bold",
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={mcq.difficulty_level}
                                          size="small"
                                          sx={{
                                            bgcolor:
                                              mcq.difficulty_level === "Easy"
                                                ? "var(--success-100)"
                                                : mcq.difficulty_level ===
                                                  "Medium"
                                                ? "var(--warning-100)"
                                                : "var(--error-100)",
                                            color:
                                              mcq.difficulty_level === "Easy"
                                                ? "var(--success-700)"
                                                : mcq.difficulty_level ===
                                                  "Medium"
                                                ? "var(--warning-700)"
                                                : "var(--error-700)",
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <IconButton
                                          onClick={() =>
                                            removeBulkMCQ(actualIndex)
                                          }
                                          size="small"
                                          sx={{
                                            color: "var(--error-500)",
                                            "&:hover": {
                                              bgcolor: "var(--error-100)",
                                            },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <TablePagination
                          component="div"
                          count={bulkMCQs.length}
                          page={bulkPage}
                          onPageChange={(_, newPage) => setBulkPage(newPage)}
                          rowsPerPage={bulkRowsPerPage}
                          onRowsPerPageChange={(e) => {
                            setBulkRowsPerPage(parseInt(e.target.value, 10));
                            setBulkPage(0);
                          }}
                          rowsPerPageOptions={[5, 10, 25, 50]}
                          sx={{
                            borderTop: "1px solid",
                            borderColor: "var(--neutral-200)",
                          }}
                        />
                      </Box>
                    )}

                    {bulkMCQs.length === 0 && !csvErrors.length && (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 8,
                          bgcolor: "var(--neutral-50)",
                          borderRadius: 1,
                        }}
                      >
                        <UploadIcon
                          sx={{
                            fontSize: 48,
                            color: "var(--font-tertiary)",
                            mb: 2,
                          }}
                        />
                        <Typography sx={{ color: "var(--font-secondary)" }}>
                          No MCQs uploaded yet. Download the template and upload
                          your CSV file.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* AI Generation Mode */}
                {formData.mode === "ai" && (
                  <Box>
                    {/* AI Generation Section */}
                    <Paper
                      sx={{
                        p: 3,
                        border: "1px solid",
                        borderColor: "var(--neutral-200)",
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <AutoAwesomeIcon
                            sx={{ color: "var(--primary-600)", fontSize: 24 }}
                          />
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "var(--font-primary)",
                            }}
                          >
                            AI-Powered MCQ Generation
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            color: "var(--font-secondary)",
                            mb: 1,
                          }}
                        >
                          Generate MCQs automatically using AI by specifying a
                          topic, number of questions, and difficulty level.
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              md: "1fr 1fr 1fr",
                            },
                            gap: 2,
                          }}
                        >
                          <TextField
                            label="Topic"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="e.g., Python Programming"
                            fullWidth
                            required
                          />

                          <TextField
                            label="Number of Questions"
                            type="number"
                            value={aiNumberOfQuestions}
                            onChange={(e) =>
                              setAiNumberOfQuestions(Number(e.target.value))
                            }
                            inputProps={{ min: 1, max: 100 }}
                            fullWidth
                            required
                          />

                          <FormControl fullWidth>
                            <InputLabel>Difficulty Level</InputLabel>
                            <Select
                              value={aiDifficultyLevel}
                              onChange={(e) =>
                                setAiDifficultyLevel(
                                  e.target.value as "Easy" | "Medium" | "Hard"
                                )
                              }
                              label="Difficulty Level"
                            >
                              <MenuItem value="Easy">Easy</MenuItem>
                              <MenuItem value="Medium">Medium</MenuItem>
                              <MenuItem value="Hard">Hard</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        <Box>
                          <Button
                            variant="contained"
                            startIcon={
                              isGenerating ? null : <AutoAwesomeIcon />
                            }
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                            sx={{
                              bgcolor: "var(--primary-500)",
                              "&:hover": {
                                bgcolor: "var(--primary-700)",
                              },
                              "&:disabled": {
                                opacity: 0.6,
                              },
                            }}
                          >
                            {isGenerating ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    border: "2px solid white",
                                    borderTopColor: "transparent",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                    "@keyframes spin": {
                                      "0%": { transform: "rotate(0deg)" },
                                      "100%": {
                                        transform: "rotate(360deg)",
                                      },
                                    },
                                  }}
                                />
                                Generating...
                              </Box>
                            ) : (
                              "Generate MCQs with AI"
                            )}
                          </Button>
                        </Box>

                        {aiGenerationSuccess && (
                          <Alert
                            severity="success"
                            onClose={() => setAiGenerationSuccess(false)}
                          >
                            Successfully generated {aiNumberOfQuestions} MCQ(s)
                            using AI!
                          </Alert>
                        )}

                        {aiGenerationError && (
                          <Alert
                            severity="error"
                            onClose={() => setAiGenerationError("")}
                          >
                            {aiGenerationError}
                          </Alert>
                        )}
                      </Box>
                    </Paper>

                    {/* Table View for AI MCQs */}
                    {aiMCQs.length > 0 && (
                      <Box>
                        <Typography
                          sx={{
                            mb: 2,
                            color: "var(--font-secondary)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {aiMCQs.length} question
                          {aiMCQs.length !== 1 ? "s" : ""} generated
                        </Typography>
                        <TableContainer
                          component={Paper}
                          sx={{
                            border: "1px solid",
                            borderColor: "var(--neutral-200)",
                          }}
                        >
                          <Table>
                            <TableHead sx={{ bgcolor: "var(--neutral-50)" }}>
                              <TableRow>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 70 }}
                                >
                                  ID
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", minWidth: 200 }}
                                >
                                  Question
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option A
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option B
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option C
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 120 }}
                                >
                                  Option D
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 80 }}
                                >
                                  Correct
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 100 }}
                                >
                                  Difficulty
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: 80 }}
                                >
                                  Actions
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {aiMCQs
                                .slice(
                                  aiPage * aiRowsPerPage,
                                  aiPage * aiRowsPerPage + aiRowsPerPage
                                )
                                .map((mcq, displayIndex) => {
                                  const actualIndex =
                                    aiPage * aiRowsPerPage + displayIndex;
                                  return (
                                    <TableRow key={mcq.id} hover>
                                      <TableCell
                                        sx={{
                                          fontSize: "0.75rem",
                                          color: "var(--font-secondary)",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {mcq.id}
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.question_text}
                                        >
                                          {mcq.question_text}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_a}
                                        >
                                          {mcq.option_a}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_b}
                                        >
                                          {mcq.option_b}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_c}
                                        >
                                          {mcq.option_c}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          sx={{ fontSize: "0.875rem" }}
                                          title={mcq.option_d}
                                        >
                                          {mcq.option_d}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={mcq.correct_option}
                                          size="small"
                                          sx={{
                                            bgcolor: "var(--success-100)",
                                            color: "var(--success-700)",
                                            fontWeight: "bold",
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={mcq.difficulty_level}
                                          size="small"
                                          sx={{
                                            bgcolor:
                                              mcq.difficulty_level === "Easy"
                                                ? "var(--success-100)"
                                                : mcq.difficulty_level ===
                                                  "Medium"
                                                ? "var(--warning-100)"
                                                : "var(--error-100)",
                                            color:
                                              mcq.difficulty_level === "Easy"
                                                ? "var(--success-700)"
                                                : mcq.difficulty_level ===
                                                  "Medium"
                                                ? "var(--warning-700)"
                                                : "var(--error-700)",
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <IconButton
                                          onClick={() => {
                                            setAiMCQs((prev) => {
                                              const newMCQs = prev.filter(
                                                (_, i) => i !== actualIndex
                                              );
                                              const maxPage = Math.max(
                                                0,
                                                Math.ceil(
                                                  newMCQs.length / aiRowsPerPage
                                                ) - 1
                                              );
                                              if (aiPage > maxPage) {
                                                setAiPage(maxPage);
                                              }
                                              // Save immediately to localStorage
                                              if (
                                                !isEditMode &&
                                                formInitializedRef.current
                                              ) {
                                                try {
                                                  localStorage.setItem(
                                                    `${storageKey}-aiMCQs`,
                                                    JSON.stringify(newMCQs)
                                                  );
                                                } catch {
                                                  // Ignore storage errors
                                                }
                                              }
                                              return newMCQs;
                                            });
                                          }}
                                          size="small"
                                          sx={{
                                            color: "var(--error-500)",
                                            "&:hover": {
                                              bgcolor: "var(--error-100)",
                                            },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <TablePagination
                          component="div"
                          count={aiMCQs.length}
                          page={aiPage}
                          onPageChange={(_, newPage) => setAiPage(newPage)}
                          rowsPerPage={aiRowsPerPage}
                          onRowsPerPageChange={(e) => {
                            setAiRowsPerPage(parseInt(e.target.value, 10));
                            setAiPage(0);
                          }}
                          rowsPerPageOptions={[5, 10, 25, 50]}
                          sx={{
                            borderTop: "1px solid",
                            borderColor: "var(--neutral-200)",
                          }}
                        />
                      </Box>
                    )}

                    {aiMCQs.length === 0 && !aiGenerationError && (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 8,
                          bgcolor: "var(--neutral-50)",
                          borderRadius: 1,
                        }}
                      >
                        <AutoAwesomeIcon
                          sx={{
                            fontSize: 48,
                            color: "var(--font-tertiary)",
                            mb: 2,
                          }}
                        />
                        <Typography sx={{ color: "var(--font-secondary)" }}>
                          No MCQs generated yet. Fill in the details and click
                          Generate to create MCQs with AI.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </TabPanel>
          </Paper>

          {/* Form Actions */}
          <Paper sx={{ bgcolor: "var(--card-bg)", mt: 2, p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/assessments")}
                startIcon={<CloseIcon />}
                disabled={saveMutation.isPending}
                sx={{
                  borderColor: "var(--neutral-300)",
                  color: "var(--font-primary)",
                  "&:hover": {
                    borderColor: "var(--neutral-400)",
                    bgcolor: "var(--neutral-100)",
                  },
                  "&:disabled": {
                    opacity: 0.5,
                  },
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={saveMutation.isPending}
                startIcon={saveMutation.isPending ? null : <SaveIcon />}
                sx={{
                  bgcolor: "var(--primary-500)",
                  "&:hover": {
                    bgcolor: "var(--primary-700)",
                  },
                  "&:disabled": {
                    opacity: 0.5,
                  },
                }}
              >
                {saveMutation.isPending ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        border: "2px solid white",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        "@keyframes spin": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    />
                    Saving...
                  </Box>
                ) : (
                  <>{isEditMode ? "Update Assessment" : "Create Assessment"}</>
                )}
              </Button>
            </Box>

            {saveMutation.isError && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "var(--error-100)",
                  borderLeft: "4px solid",
                  borderColor: "var(--error-500)",
                }}
              >
                <Typography
                  sx={{ fontSize: "0.875rem", color: "var(--error-600)" }}
                >
                  Error: {(saveMutation.error as Error).message}
                </Typography>
              </Box>
            )}
          </Paper>
        </form>

        {/* Mode Change Confirmation Dialog */}
        <Dialog
          open={showModeChangeConfirm}
          onClose={handleCancelModeChange}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{ color: "var(--font-primary)", fontWeight: "bold" }}
          >
            Switch Question Mode?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "var(--font-secondary)" }}>
              {formData.mode === "create"
                ? `You have ${formData.mcqs.length} unsaved question(s). Switching modes will clear all your current questions.`
                : formData.mode === "select"
                ? `You have ${selectedMCQIds.size} selected question(s). Switching modes will clear your selections.`
                : formData.mode === "bulk"
                ? `You have ${bulkMCQs.length} uploaded question(s). Switching modes will clear your uploaded questions.`
                : `You have ${aiMCQs.length} AI-generated question(s). Switching modes will clear your generated questions.`}
            </Typography>
            <Typography sx={{ color: "var(--font-secondary)", mt: 2 }}>
              Are you sure you want to continue?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleCancelModeChange}
              sx={{
                color: "var(--font-primary)",
                borderColor: "var(--neutral-200)",
                "&:hover": {
                  bgcolor: "var(--neutral-50)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmModeChange}
              variant="contained"
              sx={{
                bgcolor: "var(--primary-500)",
                "&:hover": {
                  bgcolor: "var(--primary-700)",
                },
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default CreateEditAssessmentPage;
