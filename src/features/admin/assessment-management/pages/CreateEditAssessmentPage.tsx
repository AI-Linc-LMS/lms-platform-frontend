import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "@mui/icons-material";
import {
  getAssessmentById,
  createAssessment,
  updateAssessment,
  CreateAssessmentPayload,
} from "../../../../services/admin/assessmentApis";
import { getMCQs, MCQListItem } from "../../../../services/admin/mcqApis";
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
  const queryClient = useQueryClient();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const isEditMode = !!assessmentId;

  const [formData, setFormData] = useState<AssessmentFormData>(
    initialAssessmentFormData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMCQIds, setSelectedMCQIds] = useState<Set<number>>(new Set());
  const [tabValue, setTabValue] = useState(0);
  const [showModeChangeConfirm, setShowModeChangeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<
    "create" | "select" | "bulk" | null
  >(null);
  const [bulkMCQs, setBulkMCQs] = useState<MCQData[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkPage, setBulkPage] = useState(0);
  const [bulkRowsPerPage, setBulkRowsPerPage] = useState(10);

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

  // Populate form if editing
  useEffect(() => {
    if (existingAssessment) {
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
          title: existingAssessment.quiz_sections?.[0]?.title || "Quiz Section",
          description: existingAssessment.quiz_sections?.[0]?.description || "",
          order: existingAssessment.quiz_sections?.[0]?.order || 1,
        },
        mode: "create",
        mcqs: [],
        mcq_ids: [],
      });
    }
  }, [existingAssessment]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (payload: CreateAssessmentPayload) => {
      if (isEditMode) {
        return updateAssessment(clientId, Number(assessmentId), payload);
      }
      return createAssessment(clientId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", clientId] });
      navigate("/admin/assessments");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith("quiz_section.")) {
      const fieldName = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        quiz_section: {
          ...prev.quiz_section,
          [fieldName]: fieldName === "order" ? Number(value) : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? Number(value)
            : value,
      }));
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
                      | "bulk";

                    // Check if there's unsaved data
                    const hasUnsavedData =
                      (formData.mode === "create" &&
                        formData.mcqs.length > 0) ||
                      (formData.mode === "select" && selectedMCQIds.size > 0) ||
                      (formData.mode === "bulk" && bulkMCQs.length > 0);

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
                    {/* CSV Upload/Download Section */}
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
                          sx={{ fontWeight: 600, color: "var(--font-primary)" }}
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
                : `You have ${bulkMCQs.length} uploaded question(s). Switching modes will clear your uploaded questions.`}
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
