"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { JobCreateUpdatePayload } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { CreateJobIllustration } from "@/components/jobs-v2/illustrations";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CourseOption {
  id: number;
  title?: string;
  name?: string;
}

interface JobCreateEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: JobCreateUpdatePayload | Partial<JobCreateUpdatePayload>) => Promise<void>;
  title: string;
  initialData?: JobV2 | null;
  courses?: CourseOption[];
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
  application_deadline: "",
  college_mappings: [],
  course_ids: [],
};

const STEPS = [
  "Basic Info",
  "Description & Skills",
  "Compensation & Location",
  "Targeting & Publish",
];

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
      p: 2,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      backgroundColor: "#fff",
      mb: 2,
      transition: "box-shadow 0.2s, border-color 0.2s",
      "&:hover": {
        borderColor: "rgba(99, 102, 241, 0.3)",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.08)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      {icon && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon={icon} size={18} style={{ color: "#6366f1" }} />
        </Box>
      )}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

export function JobCreateEditDialog({
  open,
  onClose,
  onSubmit,
  title,
  initialData,
  courses = [],
}: JobCreateEditDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [formData, setFormData] = useState<JobCreateUpdatePayload>(emptyPayload);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const [collegeInput, setCollegeInput] = useState("");

  useEffect(() => {
    if (initialData) {
      const data = initialData as {
        college_mappings?: Array<{ college_name: string; department?: string; batch?: string }>;
        courses?: Array<{ id: number }>;
        application_deadline?: string;
      };
      const deadline = data.application_deadline ?? initialData.application_deadline ?? "";
      const formattedDeadline = deadline ? deadline.split("T")[0] : "";
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
        application_deadline: formattedDeadline,
        college_mappings: (data.college_mappings ?? []).map((m) => ({
          college_name: m.college_name,
          department: m.department,
          batch: m.batch,
        })),
        course_ids: (data.courses ?? []).map((c) => c.id),
      });
    } else {
      setFormData(emptyPayload);
    }
    setActiveStep(0);
  }, [initialData, open]);

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

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.job_title.trim() || !formData.company_name.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      const payload: JobCreateUpdatePayload | Partial<JobCreateUpdatePayload> = {
        ...formData,
        mandatory_skills: formData.key_skills ?? [],
        course_ids: formData.course_ids ?? [],
        is_published: Boolean(formData.is_published),
        application_deadline: formData.application_deadline?.trim()
          ? formData.application_deadline
          : null,
      };
      await onSubmit(payload);
      onClose();
    } catch {
      // Error shown by parent
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSubmit, onClose]);

  const canProceedStep0 = formData.job_title.trim() && formData.company_name.trim();
  const isLastStep = activeStep === STEPS.length - 1;

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <SectionCard title="Basic information" icon="mdi:briefcase-outline">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Job Title"
                value={formData.job_title}
                onChange={(e) => handleChange("job_title", e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="e.g. Software Engineer"
              />
              <TextField
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Company Logo URL"
                value={formData.company_logo}
                onChange={(e) => handleChange("company_logo", e.target.value)}
                fullWidth
                size="small"
                placeholder="https://..."
              />
              <TextField
                label="Apply Link (external)"
                value={formData.apply_link}
                onChange={(e) => handleChange("apply_link", e.target.value)}
                fullWidth
                size="small"
                placeholder="Leave empty for in-portal application"
              />
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
                rows={4}
                size="small"
              />
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
                placeholder="e.g. Application → Screening → Interview"
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
              />
            </SectionCard>
            <SectionCard title="Key Skills" icon="mdi:tag-multiple-outline">
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                {(formData.key_skills ?? []).map((s, i) => (
                  <Chip key={i} label={s} size="small" onDelete={() => removeSkill(i)} />
                ))}
              </Box>
              <TextField
                size="small"
                placeholder="Add skill"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={addSkill}>
                        Add
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{ width: "100%", maxWidth: 320 }}
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
                  />
                  <TextField
                    label="Department"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Box>
                <TextField
                  label="UG Requirements"
                  value={formData.ug_requirements}
                  onChange={(e) => handleChange("ug_requirements", e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="PG Requirements"
                  value={formData.pg_requirements}
                  onChange={(e) => handleChange("pg_requirements", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Box>
            </SectionCard>
          </Box>
        );
      case 2:
        return (
          <SectionCard title="Compensation & location" icon="mdi:map-marker">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Years of Experience"
                value={formData.years_of_experience}
                onChange={(e) => handleChange("years_of_experience", e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. 0-2 years"
              />
              <TextField
                label="Salary"
                value={formData.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. 8-12 LPA"
              />
              <FormControl fullWidth size="small">
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
              <FormControl fullWidth size="small">
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
              <TextField
                label="Industry Type"
                value={formData.industry_type}
                onChange={(e) => handleChange("industry_type", e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Role Category"
                value={formData.role_category}
                onChange={(e) => handleChange("role_category", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          </SectionCard>
        );
      case 3:
        return (
          <Box>
            <SectionCard title="Targeting" icon="mdi:target">
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                  Courses (optional)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
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
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  College Mapping (targeted colleges)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Leave empty to show job to all colleges
                </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                {(formData.college_mappings ?? []).map((m, i) => (
                  <Chip
                    key={i}
                    label={m.college_name}
                    size="small"
                    onDelete={() => removeCollege(i)}
                  />
                ))}
              </Box>
              <TextField
                size="small"
                placeholder="College name"
                value={collegeInput}
                onChange={(e) => setCollegeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCollege())}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={addCollege}>
                        Add
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{ width: "100%", maxWidth: 320 }}
              />
              </Box>
            </SectionCard>
            <SectionCard title="Publish" icon="mdi:publish">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
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
              <TextField
                label="Application Deadline (optional)"
                value={formData.application_deadline}
                onChange={(e) => handleChange("application_deadline", e.target.value)}
                fullWidth
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
          boxShadow: fullScreen ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxHeight: fullScreen ? "100%" : "90vh",
        },
      }}
    >
      {/* Hero header with illustration */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 2, sm: 3 },
          p: 3,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: { xs: "100%", sm: 180 },
            height: { xs: 120, sm: 140 },
          }}
        >
          <CreateJobIllustration width={160} height={130} primaryColor="#6366f1" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "#0f172a" }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step {activeStep + 1} of {STEPS.length}
          </Typography>
        </Box>
      </Box>

      <DialogContent
        sx={{
          px: 3,
          pt: 2,
          pb: 2,
          backgroundColor: "#f8fafc",
        }}
      >
        <Stepper
          activeStep={activeStep}
          sx={{
            mb: 3,
            flexShrink: 0,
            "& .MuiStepConnector-line": { borderColor: "divider" },
            "& .MuiStepLabel-label": { fontWeight: 500, fontSize: { xs: "0.75rem", sm: "0.875rem" } },
            "& .MuiStepIcon-root.Mui-completed": { color: "#16a34a" },
            "& .MuiStepIcon-root.Mui-completed .MuiStepIcon-text": { fill: "#16a34a" },
            "& .MuiStepIcon-root.Mui-active": { color: "#6366f1" },
          }}
          alternativeLabel={!fullScreen}
          orientation={fullScreen ? "vertical" : "horizontal"}
        >
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box
          sx={{
            height: fullScreen ? "auto" : 420,
            minHeight: fullScreen ? 280 : 420,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          backgroundColor: "#fff",
          borderTop: "1px solid",
          borderColor: "divider",
          gap: 1,
        }}
      >
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 500 }}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} sx={{ textTransform: "none", fontWeight: 500 }}>
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
              fontWeight: 600,
              px: 2,
              py: 1,
              borderRadius: 2,
              backgroundColor: "#6366f1",
              "&:hover": { backgroundColor: "#4f46e5" },
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !formData.job_title.trim() || !formData.company_name.trim()}
            startIcon={<IconWrapper icon="mdi:content-save" size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              py: 1,
              borderRadius: 2,
              backgroundColor: "#6366f1",
              "&:hover": { backgroundColor: "#4f46e5" },
            }}
          >
            {submitting ? "Saving..." : "Save Job"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
