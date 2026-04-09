"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Paper,
  Pagination,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import type {
  JobCreateUpdatePayload,
  JobQuestionV2,
} from "@/lib/services/admin/admin-jobs-v2.service";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { CreateJobIllustration } from "@/components/jobs-v2/illustrations";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ApplicationQuestionsModal } from "./ApplicationQuestionsModal";

interface CourseOption {
  id: number;
  title?: string;
  name?: string;
}

interface JobCreateEditSubmitOptions {
  jdFile?: File;
}

interface JobCreateEditPageProps {
  onSubmit: (
    data: JobCreateUpdatePayload | Partial<JobCreateUpdatePayload>,
    options?: JobCreateEditSubmitOptions
  ) => Promise<void>;
  onCancel: () => void;
  title: string;
  initialData?: JobV2 | null;
  courses?: CourseOption[];
  isEditMode?: boolean;
}

const emptyPayload: JobCreateUpdatePayload = {
  job_title: "",
  company_name: "",
  company_logo: "",
  company_info: "",
  job_description: "",
  role_process: "",
  mandatory_skills: [],
  key_skills: [],
  industry_type: "",
  department: "",
  employment_type: "",
  role_category: "",
  education: "",
  ug_requirements: "",
  pg_requirements: "",
  location: "",
  years_of_experience: "",
  salary: "",
  apply_link: "",
  job_type: "job",
  is_published: false,
  status: "active",
  application_deadline: "",
  number_of_openings: null,
  applicable_passout_year: null,
  min_10th_percentage: null,
  min_12th_percentage: null,
  min_graduation_percentage: null,
  college_mappings: [],
  course_ids: [],
  question_ids: [],
};

/** Positive integer or null — coerces API values; never keeps a string in state. */
function parseNumberOfOpeningsInput(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    if (!Number.isFinite(v) || !Number.isInteger(v) || v < 1) return null;
    return v;
  }
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

const STEPS = [
  "Basic Info",
  "Description & Skills",
  "Compensation & Location",
  "Targeting & Publish",
];

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.4)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#6366f1",
      borderWidth: 2,
    },
    "&.Mui-focused .MuiInputLabel-root": { color: "#6366f1" },
  },
};

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 2.5,
      border: "1px solid",
      borderColor: "rgba(0,0,0,0.06)",
      backgroundColor: "#fff",
      mb: 2.5,
      transition: "all 0.25s ease",
      overflow: "hidden",
      position: "relative",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)",
      },
      "&:hover": {
        borderColor: "rgba(99, 102, 241, 0.2)",
        boxShadow: "0 8px 30px rgba(99, 102, 241, 0.08)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
      {icon && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.06) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid",
            borderColor: "rgba(99, 102, 241, 0.2)",
          }}
        >
          <IconWrapper icon={icon} size={24} style={{ color: "#6366f1" }} />
        </Box>
      )}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", fontSize: "1.05rem" }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

export function JobCreateEditPage({
  onSubmit,
  onCancel,
  title,
  initialData,
  courses = [],
  isEditMode = false,
}: JobCreateEditPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [formData, setFormData] = useState<JobCreateUpdatePayload>(emptyPayload);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const [collegeInput, setCollegeInput] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [questionBank, setQuestionBank] = useState<JobQuestionV2[]>([]);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(5);

  useEffect(() => {
    adminJobsV2Service.getQuestions().then(setQuestionBank).catch(() => setQuestionBank([]));
  }, []);

  useEffect(() => {
    if (initialData) {
      const data = initialData as {
        college_mappings?: Array<{ college_name: string; department?: string; batch?: string }>;
        courses?: Array<{ id: number }>;
        question_ids?: number[];
        application_deadline?: string;
      };
      const rawDeadline = data.application_deadline ?? initialData.application_deadline ?? "";
      const formattedDeadline =
        typeof rawDeadline === "string" && rawDeadline.trim()
          ? rawDeadline.includes("T")
            ? rawDeadline.split("T")[0]
            : rawDeadline.trim()
          : "";
      const init = initialData as {
        status?: "active" | "inactive" | "closed" | "completed";
        number_of_openings?: number | string | null;
        applicable_passout_year?: string | null;
        min_10th_percentage?: number | null;
        min_12th_percentage?: number | null;
        min_graduation_percentage?: number | null;
      };
      setFormData({
        job_title: initialData.job_title ?? "",
        company_name: initialData.company_name ?? "",
        company_logo: initialData.company_logo ?? "",
        company_info: initialData.company_info ?? "",
        job_description: initialData.job_description ?? "",
        role_process: initialData.role_process ?? "",
        mandatory_skills: initialData.mandatory_skills ?? [],
        key_skills: initialData.key_skills ?? [],
        industry_type: initialData.industry_type ?? "",
        department: initialData.department ?? "",
        employment_type: initialData.employment_type ?? "",
        role_category: initialData.role_category ?? "",
        education: initialData.education ?? "",
        ug_requirements: initialData.ug_requirements ?? "",
        pg_requirements: initialData.pg_requirements ?? "",
        location: initialData.location ?? "",
        years_of_experience: initialData.years_of_experience ?? "",
        salary: initialData.salary ?? "",
        apply_link: initialData.apply_link ?? "",
        job_type: initialData.job_type ?? "job",
        is_published: initialData.is_published ?? false,
        status: init.status ?? "active",
        application_deadline: formattedDeadline,
        number_of_openings: parseNumberOfOpeningsInput(init.number_of_openings),
        applicable_passout_year: init.applicable_passout_year ?? null,
        min_10th_percentage: init.min_10th_percentage ?? null,
        min_12th_percentage: init.min_12th_percentage ?? null,
        min_graduation_percentage: init.min_graduation_percentage ?? null,
        college_mappings: (data.college_mappings ?? []).map((m) => ({
          college_name: m.college_name,
          department: m.department,
          batch: m.batch,
        })),
        course_ids: (data.courses ?? []).map((c) => c.id),
        question_ids: data.question_ids ?? [],
      });
    } else {
      setFormData({ ...emptyPayload, question_ids: [] });
    }
    setActiveStep(0);
  }, [initialData]);

  const handleChange = useCallback(
    (field: keyof JobCreateUpdatePayload, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addSkill = useCallback(() => {
    const s = skillInput.trim();
    if (!s) return;
    setFormData((prev) => ({
      ...prev,
      key_skills: [...(prev.key_skills ?? []), s],
    }));
    setSkillInput("");
  }, [skillInput]);

  const removeSkill = useCallback((index: number) => {
    setFormData((prev) => {
      const skills = [...(prev.key_skills ?? [])];
      skills.splice(index, 1);
      return { ...prev, key_skills: skills };
    });
  }, []);

  const addCollege = useCallback(() => {
    const c = collegeInput.trim();
    if (!c) return;
    setFormData((prev) => ({
      ...prev,
      college_mappings: [...(prev.college_mappings ?? []), { college_name: c }],
    }));
    setCollegeInput("");
  }, [collegeInput]);

  const removeCollege = useCallback((index: number) => {
    setFormData((prev) => {
      const mappings = [...(prev.college_mappings ?? [])];
      mappings.splice(index, 1);
      return { ...prev, college_mappings: mappings };
    });
  }, []);

  const toggleQuestion = useCallback((qId: number) => {
    setFormData((prev) => {
      const ids = prev.question_ids ?? [];
      const set = new Set(ids);
      if (set.has(qId)) set.delete(qId);
      else set.add(qId);
      return { ...prev, question_ids: Array.from(set) };
    });
  }, []);

  const addNewQuestion = useCallback(
    async (data: {
      question_text: string;
      question_type: string;
      is_required: boolean;
      order: number;
      options?: string[];
    }) => {
      try {
        const q = await adminJobsV2Service.createQuestion(
          {
            question_text: data.question_text,
            question_type: data.question_type,
            is_required: data.is_required,
            order: data.order,
            options: data.options,
          },
          undefined
        );
        setQuestionBank((prev) => [...prev, q]);
        setFormData((prev) => ({
          ...prev,
          question_ids: [...(prev.question_ids ?? []), q.id],
        }));
        setQuestionsPage(1);
      } catch {
        throw new Error("Failed to create question");
      }
    },
    []
  );

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (
      !formData.job_title.trim() ||
      !formData.company_name.trim() ||
      !formData.company_logo?.trim()
    ) {
      return;
    }
    try {
      setSubmitting(true);
      const payload: JobCreateUpdatePayload | Partial<JobCreateUpdatePayload> = {
        ...formData,
        company_logo: formData.company_logo.trim(),
        mandatory_skills: formData.key_skills ?? [],
        course_ids: formData.course_ids ?? [],
        question_ids: formData.question_ids ?? [],
        is_published: Boolean(formData.is_published),
        status: formData.status ?? "active",
        application_deadline: formData.application_deadline?.trim()
          ? formData.application_deadline.trim()
          : null,
        number_of_openings: parseNumberOfOpeningsInput(formData.number_of_openings),
        applicable_passout_year: formData.applicable_passout_year?.trim() || null,
        min_10th_percentage: formData.min_10th_percentage ?? null,
        min_12th_percentage: formData.min_12th_percentage ?? null,
        min_graduation_percentage: formData.min_graduation_percentage ?? null,
      };
      await onSubmit(payload, { jdFile: jdFile ?? undefined });
      onCancel();
    } catch {
      // Error shown by parent
    } finally {
      setSubmitting(false);
    }
  }, [formData, jdFile, onSubmit, onCancel]);

  const canProceedStep0 =
    Boolean(formData.job_title.trim()) &&
    Boolean(formData.company_name.trim()) &&
    Boolean(formData.company_logo?.trim());
  const isLastStep = activeStep === STEPS.length - 1;

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <SectionCard title="Basic information" icon="mdi:briefcase-outline">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {formData.company_logo && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border: "1px dashed",
                    borderColor: "rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <Box
                    component="img"
                    src={formData.company_logo}
                    alt="Company logo"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      objectFit: "contain",
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "#fff",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 500, color: "#64748b" }}>
                    Logo preview
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Job Title"
                  value={formData.job_title}
                  onChange={(e) => handleChange("job_title", e.target.value)}
                  required
                  fullWidth
                  size="small"
                  placeholder="e.g. Software Engineer"
                  sx={inputSx}
                />
                <TextField
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  required
                  fullWidth
                  size="small"
                  placeholder="e.g. Acme Inc."
                  sx={inputSx}
                />
              </Box>
              <TextField
                label="Company Logo URL"
                value={formData.company_logo}
                onChange={(e) => handleChange("company_logo", e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="https://example.com/logo.png"
                helperText="Required — public image URL shown on job cards and detail pages"
                sx={inputSx}
              />
              <TextField
                label="Apply Link (external)"
                value={formData.apply_link}
                onChange={(e) => handleChange("apply_link", e.target.value)}
                fullWidth
                size="small"
                placeholder="Leave empty for in-portal application"
                sx={inputSx}
              />
            </Box>
            <Box sx={{ mt: 2.5, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: "#0f172a" }}>
                Company & Eligibility
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Number of Openings"
                  type="text"
                  value={
                    formData.number_of_openings == null
                      ? ""
                      : String(formData.number_of_openings)
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (digits === "") {
                      handleChange("number_of_openings", null);
                      return;
                    }
                    const n = parseInt(digits, 10);
                    handleChange("number_of_openings", n >= 1 ? n : null);
                  }}
                  fullWidth
                  size="small"
                  placeholder="e.g. 5"
                  helperText="Whole number only (minimum 1)"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    autoComplete: "off",
                  }}
                  sx={inputSx}
                />
                <TextField
                  label="Applicable Passout Year"
                  value={formData.applicable_passout_year ?? ""}
                  onChange={(e) => handleChange("applicable_passout_year", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. 2025 or 2024-2026"
                  sx={inputSx}
                />
                <TextField
                  label="Min 10th %"
                  type="number"
                  value={formData.min_10th_percentage ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "min_10th_percentage",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  fullWidth
                  size="small"
                  placeholder="e.g. 60"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  sx={inputSx}
                />
                <TextField
                  label="Min 12th %"
                  type="number"
                  value={formData.min_12th_percentage ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "min_12th_percentage",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  fullWidth
                  size="small"
                  placeholder="e.g. 60"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  sx={inputSx}
                />
                <TextField
                  label="Min Graduation %"
                  type="number"
                  value={formData.min_graduation_percentage ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "min_graduation_percentage",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  fullWidth
                  size="small"
                  placeholder="e.g. 60"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  sx={inputSx}
                />
              </Box>
            </Box>
          </SectionCard>
        );
      case 1:
        return (
          <Box>
            <SectionCard title="Job Description" icon="mdi:text-box-outline">
              <TextField
                label="Description"
                value={formData.job_description}
                onChange={(e) => handleChange("job_description", e.target.value)}
                fullWidth
                multiline
                rows={5}
                size="small"
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                sx={inputSx}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#0f172a" }}>
                  Upload JD (PDF)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Optional. Upload a PDF job description. Students can view it on the job detail page.
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "rgba(99, 102, 241, 0.4)",
                    color: "#6366f1",
                    "&:hover": {
                      borderColor: "#6366f1",
                      backgroundColor: "rgba(99, 102, 241, 0.08)",
                    },
                  }}
                >
                  {jdFile ? jdFile.name : "Choose PDF"}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.type === "application/pdf") setJdFile(f);
                      e.target.value = "";
                    }}
                  />
                </Button>
                {jdFile && (
                  <Typography variant="caption" sx={{ ml: 1.5, color: "#64748b" }}>
                    Selected: {jdFile.name}
                  </Typography>
                )}
              </Box>
            </SectionCard>
            <SectionCard title="Role Process" icon="mdi:format-list-checks">
              <TextField
                label="Process steps"
                value={formData.role_process}
                onChange={(e) => handleChange("role_process", e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="e.g. Application → Screening → Interview → Offer"
                sx={inputSx}
              />
            </SectionCard>
            <SectionCard title="About Company" icon="mdi:information-outline">
              <TextField
                label="Company info"
                value={formData.company_info}
                onChange={(e) => handleChange("company_info", e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Brief overview of your company..."
                sx={inputSx}
              />
            </SectionCard>
            <SectionCard title="Key Skills" icon="mdi:tag-multiple-outline">
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  mb: 2,
                  minHeight: 40,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: (formData.key_skills ?? []).length > 0 ? "rgba(99, 102, 241, 0.03)" : "transparent",
                  border: "1px dashed",
                  borderColor: (formData.key_skills ?? []).length > 0 ? "rgba(99, 102, 241, 0.2)" : "rgba(0,0,0,0.08)",
                }}
              >
                {(formData.key_skills ?? []).map((s, i) => (
                  <Chip
                    key={i}
                    label={s}
                    size="small"
                    onDelete={() => removeSkill(i)}
                    sx={{
                      borderRadius: 1.5,
                      height: 28,
                      backgroundColor: "rgba(99, 102, 241, 0.12)",
                      color: "#6366f1",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      "& .MuiChip-deleteIcon": { color: "#6366f1", "&:hover": { color: "#4f46e5" } },
                    }}
                  />
                ))}
              </Box>
              <TextField
                size="small"
                placeholder="Type a skill and press Enter or click Add"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={addSkill}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          color: "#6366f1",
                          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
                        }}
                      >
                        Add
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{ width: "100%", maxWidth: 360, ...inputSx }}
              />
            </SectionCard>
            <SectionCard title="Requirements" icon="mdi:certificate-outline">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField
                    label="Education"
                    value={formData.education}
                    onChange={(e) => handleChange("education", e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="e.g. B.Tech, B.E."
                    sx={inputSx}
                  />
                  <TextField
                    label="Department"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="e.g. Engineering"
                    sx={inputSx}
                  />
                </Box>
                <TextField
                  label="UG Requirements"
                  value={formData.ug_requirements}
                  onChange={(e) => handleChange("ug_requirements", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Undergraduate requirements"
                  sx={inputSx}
                />
                <TextField
                  label="PG Requirements"
                  value={formData.pg_requirements}
                  onChange={(e) => handleChange("pg_requirements", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Postgraduate requirements"
                  sx={inputSx}
                />
              </Box>
            </SectionCard>
          </Box>
        );
      case 2:
        return (
          <SectionCard title="Compensation & location" icon="mdi:map-marker">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. Bangalore, Remote"
                  sx={inputSx}
                />
                <TextField
                  label="Years of Experience"
                  value={formData.years_of_experience}
                  onChange={(e) => handleChange("years_of_experience", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. 0-2 years"
                  sx={inputSx}
                />
                <TextField
                  label="Salary"
                  value={formData.salary}
                  onChange={(e) => handleChange("salary", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. 8-12 LPA"
                  sx={inputSx}
                />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={formData.job_type}
                    label="Job Type"
                    onChange={(e) => handleChange("job_type", e.target.value)}
                  >
                    <MenuItem value="job">Job</MenuItem>
                    <MenuItem value="internship">Internship</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Employment Type</InputLabel>
                  <Select
                    value={formData.employment_type}
                    label="Employment Type"
                    onChange={(e) => handleChange("employment_type", e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    <MenuItem value="Full-time">Full-time</MenuItem>
                    <MenuItem value="Part-time">Part-time</MenuItem>
                    <MenuItem value="Internship">Internship</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Industry Type"
                  value={formData.industry_type}
                  onChange={(e) => handleChange("industry_type", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. Technology"
                  sx={inputSx}
                />
                <TextField
                  label="Role Category"
                  value={formData.role_category}
                  onChange={(e) => handleChange("role_category", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. Software Development"
                  sx={inputSx}
                />
              </Box>
            </Box>
          </SectionCard>
        );
      case 3:
        return (
          <Box>
            <SectionCard title="Targeting" icon="mdi:target">
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700, color: "#0f172a" }}>
                  Courses (optional)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  If set, job is visible only to students enrolled in at least one of these courses
                </Typography>
                <Autocomplete
                  multiple
                  options={courses}
                  getOptionLabel={(option: CourseOption) =>
                    option?.title ?? option?.name ?? `Course ${option?.id ?? ""}`
                  }
                  isOptionEqualToValue={(option: CourseOption, value: CourseOption) =>
                    option?.id === value?.id
                  }
                  value={(formData.course_ids ?? [])
                    .map((id) => courses.find((c) => Number(c?.id) === Number(id)))
                    .filter(Boolean) as CourseOption[]}
                  onChange={(_, newValue: CourseOption[]) => {
                    handleChange("course_ids", newValue.map((c) => c.id));
                  }}
                  renderOption={(props, option: CourseOption) => (
                    <li {...props} key={option?.id ?? props.id}>
                      {option?.title ?? option?.name ?? `Course ${option?.id}`}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select courses"
                      placeholder="Leave empty for all students"
                      sx={inputSx}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option?.title ?? option?.name ?? `Course ${option?.id}`}
                        {...getTagProps({ index })}
                        key={option?.id ?? index}
                        size="small"
                        onDelete={getTagProps({ index }).onDelete}
                      />
                    ))
                  }
                />
              </Box>
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700, color: "#0f172a" }}>
                  College Mapping (targeted colleges)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Leave empty to show job to all colleges
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    mb: 2,
                    minHeight: 40,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: (formData.college_mappings ?? []).length > 0 ? "rgba(99, 102, 241, 0.03)" : "transparent",
                    border: "1px dashed",
                    borderColor: (formData.college_mappings ?? []).length > 0 ? "rgba(99, 102, 241, 0.2)" : "rgba(0,0,0,0.08)",
                  }}
                >
                  {(formData.college_mappings ?? []).map((m, i) => (
                    <Chip
                      key={i}
                      label={m.college_name}
                      size="small"
                      onDelete={() => removeCollege(i)}
                      sx={{
                        borderRadius: 1.5,
                        height: 28,
                        backgroundColor: "rgba(99, 102, 241, 0.08)",
                        border: "1px solid",
                        borderColor: "rgba(99, 102, 241, 0.25)",
                        color: "#475569",
                        fontWeight: 500,
                        "& .MuiChip-deleteIcon": { color: "#64748b", "&:hover": { color: "#6366f1" } },
                      }}
                    />
                  ))}
                </Box>
                <TextField
                  size="small"
                  placeholder="Type college name and press Enter or click Add"
                  value={collegeInput}
                  onChange={(e) => setCollegeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCollege())}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={addCollege}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#6366f1",
                            "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
                          }}
                        >
                          Add
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: "100%", maxWidth: 360, ...inputSx }}
                />
              </Box>
            </SectionCard>
            <SectionCard title="Application Questions" icon="mdi:help-circle-outline">
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1.5,
                  mb: 2.5,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(99, 102, 241, 0.04)",
                  border: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.12)",
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                    Select questions for applicants
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    Click to select or deselect. These will appear on the job application form.
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={`${(formData.question_ids ?? []).length} selected`}
                    size="small"
                    sx={{
                      height: 28,
                      fontWeight: 600,
                      backgroundColor: "rgba(99, 102, 241, 0.12)",
                      color: "#6366f1",
                      "& .MuiChip-label": { px: 1.5 },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                    onClick={() => setAddQuestionModalOpen(true)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 1.5,
                      backgroundColor: "#6366f1",
                      "&:hover": { backgroundColor: "#4f46e5" },
                    }}
                  >
                    Add question
                  </Button>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2 }}>
                {questionBank.length === 0 ? (
                  <Box
                    sx={{
                      p: 5,
                      borderRadius: 2.5,
                      border: "2px dashed",
                      borderColor: "rgba(99, 102, 241, 0.3)",
                      backgroundColor: "rgba(99, 102, 241, 0.03)",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 2.5,
                        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        border: "1px solid",
                        borderColor: "rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <IconWrapper icon="mdi:help-circle-outline" size={36} style={{ color: "#6366f1" }} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
                      No questions yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Create your first question to add to the application form
                    </Typography>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={<IconWrapper icon="mdi:plus" size={20} />}
                      onClick={() => setAddQuestionModalOpen(true)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        py: 1.25,
                        borderRadius: 2,
                        backgroundColor: "#6366f1",
                        boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                        "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)" },
                      }}
                    >
                      Create first question
                    </Button>
                  </Box>
                ) : (
                  <>
                    {questionBank
                      .slice(
                        (questionsPage - 1) * questionsPerPage,
                        (questionsPage - 1) * questionsPerPage + questionsPerPage
                      )
                      .map((q) => {
                        const selected = (formData.question_ids ?? []).includes(q.id);
                        const typeLabel =
                          q.question_type === "textarea"
                            ? "Descriptive"
                            : q.question_type === "choice"
                              ? "MCQ"
                              : q.question_type === "multichoice"
                                ? "Multi"
                                : q.question_type === "yes_no"
                                  ? "Yes/No"
                                  : "Text";
                        const opts =
                          q.question_type === "yes_no"
                            ? ["Yes", "No"]
                            : (q.options && q.options.length > 0 ? q.options : []);
                        const hasOptions = opts.length > 0;
                        return (
                          <Box
                            key={q.id}
                            onClick={() => toggleQuestion(q.id)}
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1.5,
                              p: 2,
                              borderRadius: 2,
                              border: "2px solid",
                              borderColor: selected ? "#6366f1" : "rgba(0,0,0,0.08)",
                              backgroundColor: selected ? "rgba(99, 102, 241, 0.06)" : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              boxShadow: selected ? "0 2px 8px rgba(99, 102, 241, 0.15)" : "none",
                              "&:hover": {
                                borderColor: selected ? "#6366f1" : "rgba(99, 102, 241, 0.4)",
                                backgroundColor: selected ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.02)",
                                boxShadow: selected ? "0 2px 12px rgba(99, 102, 241, 0.2)" : "0 1px 4px rgba(0,0,0,0.04)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: 0.75,
                                border: "2px solid",
                                borderColor: selected ? "#6366f1" : "#cbd5e1",
                                backgroundColor: selected ? "#6366f1" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                mt: 0.25,
                              }}
                            >
                              {selected && <IconWrapper icon="mdi:check" size={14} style={{ color: "#fff" }} />}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: "#0f172a", lineHeight: 1.5 }}>
                                {q.question_text}
                                {q.is_required && (
                                  <Typography component="span" color="error" sx={{ fontSize: "0.7rem", ml: 0.5 }}>
                                    *
                                  </Typography>
                                )}
                              </Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 1 }}>
                                <Chip
                                  label={typeLabel}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                                    color: "#6366f1",
                                    border: "none",
                                  }}
                                />
                                {hasOptions && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                      alignItems: "center",
                                    }}
                                  >
                                    {opts.map((opt, i) => (
                                      <Typography
                                        key={i}
                                        variant="caption"
                                        sx={{
                                          px: 1,
                                          py: 0.25,
                                          borderRadius: 1,
                                          bgcolor: "rgba(0,0,0,0.04)",
                                          color: "#475569",
                                          fontSize: "0.75rem",
                                          border: "1px solid",
                                          borderColor: "rgba(0,0,0,0.06)",
                                        }}
                                      >
                                        {String.fromCharCode(65 + i)}. {opt}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    {questionBank.length > questionsPerPage && (
                      <Box
                        sx={{
                          pt: 2,
                          mt: 1,
                          borderTop: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Showing {(questionsPage - 1) * questionsPerPage + 1}–
                            {Math.min(questionsPage * questionsPerPage, questionBank.length)} of {questionBank.length}
                          </Typography>
                          <PerPageSelect
                            value={questionsPerPage}
                            onChange={(v) => {
                              setQuestionsPerPage(v);
                              setQuestionsPage(1);
                            }}
                            options={[5, 8, 10, 15] as unknown as number[]}
                          />
                        </Box>
                        <Pagination
                          count={Math.ceil(questionBank.length / questionsPerPage)}
                          page={questionsPage}
                          onChange={(_, p) => setQuestionsPage(p)}
                          color="primary"
                          size="small"
                          showFirstButton={false}
                          showLastButton={false}
                          sx={{
                            "& .MuiPaginationItem-root": { borderRadius: 1 },
                          }}
                        />
                      </Box>
                    )}
                  </>
                )}
              </Box>
              <ApplicationQuestionsModal
                open={addQuestionModalOpen}
                onClose={() => setAddQuestionModalOpen(false)}
                onSubmit={addNewQuestion}
                nextOrder={questionBank.length}
              />
            </SectionCard>
            <SectionCard title="Publish" icon="mdi:publish">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: formData.is_published ? "rgba(34, 197, 94, 0.06)" : "rgba(99, 102, 241, 0.04)",
                    border: "1px solid",
                    borderColor: formData.is_published ? "rgba(34, 197, 94, 0.2)" : "rgba(99, 102, 241, 0.15)",
                  }}
                >
                  <FormControl size="small" fullWidth sx={inputSx}>
                    <InputLabel>Publish Status</InputLabel>
                    <Select
                      value={formData.is_published ? "yes" : "no"}
                      label="Publish Status"
                      onChange={(e) => handleChange("is_published", e.target.value === "yes")}
                    >
                      <MenuItem value="no">Draft (save for later)</MenuItem>
                      <MenuItem value="yes">Published (visible to students)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Job Status</InputLabel>
                  <Select
                    value={formData.status ?? "active"}
                    label="Job Status"
                    onChange={(e) =>
                      handleChange("status", e.target.value as "active" | "inactive" | "closed" | "completed")
                    }
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Closing Date (optional)"
                  value={formData.application_deadline}
                  onChange={(e) => handleChange("application_deadline", e.target.value)}
                  fullWidth
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx}
                />
              </Box>
            </SectionCard>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: 3,
          p: 3.5,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 35%, #eef2ff 100%)",
          borderRadius: 2.5,
          mb: 3,
          border: "1px solid",
          borderColor: "rgba(99, 102, 241, 0.12)",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.06)",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
          },
        }}
      >
        {!isEditMode && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: { xs: "100%", md: 110 },
              height: { xs: 88, md: 110 },
              position: "relative",
              zIndex: 1,
            }}
          >
            <CreateJobIllustration width={100} height={88} primaryColor="#6366f1" />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
              {isEditMode ? "Edit Job" : "Create Job"}
            </Typography>
            {isEditMode && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: "#64748b",
                  px: 1.5,
                  py: 0.25,
                  borderRadius: 1.5,
                  backgroundColor: "rgba(0,0,0,0.04)",
                }}
              >
                {title}
              </Typography>
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              mt: 0.5,
            }}
          >
            Step {activeStep + 1} of {STEPS.length}
            <Box component="span" sx={{ color: "rgba(0,0,0,0.3)" }}>·</Box>
            <Box component="span" sx={{ color: "#6366f1", fontWeight: 600 }}>{STEPS[activeStep]}</Box>
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <Stepper
          activeStep={activeStep}
          sx={{
            "& .MuiStepConnector-line": {
              borderColor: "rgba(99, 102, 241, 0.25)",
              borderTopWidth: 2,
              transition: "border-color 0.2s ease",
            },
            "& .MuiStepLabel-label": {
              fontWeight: 500,
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
              color: "#64748b",
            },
            "& .MuiStepIcon-root.Mui-completed": { color: "#16a34a" },
            "& .MuiStepIcon-root.Mui-completed .MuiStepIcon-text": { fill: "#fff" },
            "& .MuiStepIcon-root.Mui-active": { color: "#6366f1" },
            "& .MuiStepLabel-root.Mui-active .MuiStepLabel-label": {
              color: "#6366f1",
              fontWeight: 700,
            },
          }}
          alternativeLabel={!isMobile}
          orientation={isMobile ? "vertical" : "horizontal"}
        >
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 400,
          overflowY: "auto",
          pb: 2,
        }}
      >
        {renderStepContent()}
      </Box>

      {/* Sticky footer actions */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          p: 3,
          borderRadius: 2.5,
          borderTop: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          backgroundColor: "#fff",
          zIndex: 10,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              onClick={onCancel}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#64748b",
                px: 2,
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              }}
            >
              Cancel
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#64748b",
                  px: 2.5,
                  "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)", color: "#6366f1" },
                }}
              >
                Back
              </Button>
            )}
            {!isLastStep ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 0 && !canProceedStep0}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: "#6366f1",
                  boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
                  "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)" },
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !formData.job_title.trim() ||
                  !formData.company_name.trim() ||
                  !formData.company_logo?.trim()
                }
                startIcon={<IconWrapper icon="mdi:content-save" size={18} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: "#6366f1",
                  boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
                  "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)" },
                }}
              >
                {submitting ? "Saving..." : "Save Job"}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
