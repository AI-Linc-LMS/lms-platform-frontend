"use client";

import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";
import { memo } from "react";
import {
  createJobSchema,
  type CreateJobFormData,
} from "@/lib/schemas/job-portal-v2.schema";
import type { Job, EligibilityCriteria } from "@/lib/job-portal-v2";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";

interface JDCreateEditFormProps {
  job?: Job | null;
  onSubmit: (data: CreateJobFormData) => Promise<void>;
  isSubmitting?: boolean;
}

interface CourseOption {
  id: number;
  name?: string;
  title?: string;
}

const JDCreateEditFormComponent = ({
  job,
  onSubmit,
  isSubmitting = false,
}: JDCreateEditFormProps) => {
  const [role, setRole] = useState(job?.role ?? "");
  const [companyName, setCompanyName] = useState(job?.company_name ?? "");
  const [companyLogo, setCompanyLogo] = useState(job?.company_logo ?? "");
  const [jobDescription, setJobDescription] = useState(job?.job_description ?? "");
  const [eligibility, setEligibility] = useState<EligibilityCriteria>(
    job?.eligibility_criteria ?? {}
  );
  const [compensation, setCompensation] = useState(job?.compensation ?? "");
  const [location, setLocation] = useState(job?.location ?? "");
  const [applicationDeadline, setApplicationDeadline] = useState(
    job?.application_deadline ?? ""
  );
  const [jobType, setJobType] = useState<"job" | "internship">(
    (job?.job_type as "job" | "internship") ?? "job"
  );
  const [tags, setTags] = useState<string[]>(job?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [isPublished, setIsPublished] = useState(job?.is_published ?? false);
  const [targetAllStudents, setTargetAllStudents] = useState(
    job?.target_all_students ?? true
  );
  const [targetCourses, setTargetCourses] = useState<number[]>(() => {
    const raw = job?.target_courses ?? [];
    return raw.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  });
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    adminCoursesService
      .getCourses({ limit: 200 })
      .then((res: unknown) => {
        let list: CourseOption[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && typeof res === "object") {
          const r = res as Record<string, unknown>;
          if (Array.isArray(r.results)) list = r.results as CourseOption[];
          else if (Array.isArray(r.courses)) list = r.courses as CourseOption[];
          else if (Array.isArray(r.data)) list = r.data as CourseOption[];
        }
        setCourses(
          list.map((c) => ({
            id: Number((c as { id?: unknown }).id),
            name: (c as { name?: string }).name,
            title: (c as { title?: string }).title,
          })).filter((c) => !Number.isNaN(c.id))
        );
      })
      .catch(() => setCourses([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateJobFormData = {
      role: role.trim(),
      company_name: companyName.trim(),
      company_logo: companyLogo.trim() || undefined,
      job_description: jobDescription.trim(),
      eligibility_criteria:
        Object.keys(eligibility).length > 0 ? eligibility : undefined,
      compensation: compensation.trim() || undefined,
      location: location.trim() || undefined,
      application_deadline:
        applicationDeadline.trim() && /^\d{4}-\d{2}-\d{2}$/.test(applicationDeadline.trim())
          ? applicationDeadline.trim()
          : undefined,
      job_type: jobType,
      tags: tags.length > 0 ? tags : undefined,
      is_published: isPublished,
      target_all_students: targetAllStudents,
      target_courses: targetAllStudents
        ? undefined
        : targetCourses.length > 0
          ? targetCourses.filter((n) => !Number.isNaN(n))
          : undefined,
    };
    const result = createJobSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of result.error.issues) {
        const path = String(err.path?.[0] ?? "");
        const msg = "message" in err ? String(err.message) : "Invalid";
        if (path && !fieldErrors[path]) fieldErrors[path] = msg;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Role *"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        error={!!errors.role}
        helperText={errors.role}
        required
        fullWidth
        size="small"
      />
      <TextField
        label="Company name *"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        error={!!errors.company_name}
        helperText={errors.company_name}
        required
        fullWidth
        size="small"
      />
      <TextField
        label="Company logo URL"
        value={companyLogo}
        onChange={(e) => setCompanyLogo(e.target.value)}
        error={!!errors.company_logo}
        helperText={errors.company_logo}
        placeholder="https://..."
        fullWidth
        size="small"
      />
      <TextField
        label="Job description *"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        error={!!errors.job_description}
        helperText={errors.job_description}
        required
        fullWidth
        multiline
        rows={6}
        size="small"
      />
      <TextField
        label="Compensation"
        value={compensation}
        onChange={(e) => setCompensation(e.target.value)}
        placeholder="e.g. 10-15 LPA"
        fullWidth
        size="small"
      />
      <TextField
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        fullWidth
        size="small"
      />
      <TextField
        label="Application deadline"
        value={applicationDeadline}
        onChange={(e) => setApplicationDeadline(e.target.value)}
        placeholder="YYYY-MM-DD"
        error={!!errors.application_deadline}
        helperText={errors.application_deadline}
        fullWidth
        size="small"
      />
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant={jobType === "job" ? "contained" : "outlined"}
          size="small"
          onClick={() => setJobType("job")}
        >
          Job
        </Button>
        <Button
          variant={jobType === "internship" ? "contained" : "outlined"}
          size="small"
          onClick={() => setJobType("internship")}
        >
          Internship
        </Button>
      </Box>
      <Box>
        <TextField
          label="Tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder="Add tag and press Enter"
          fullWidth
          size="small"
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {tags.map((t, i) => (
            <Chip key={i} label={t} onDelete={() => removeTag(i)} size="small" />
          ))}
        </Box>
      </Box>
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
          }
          label="Published"
        />
        <FormHelperText sx={{ mt: -0.5, ml: 0 }}>
          When checked, the job is visible to students and they can apply. Uncheck to save as draft (hidden from the job portal).
        </FormHelperText>
      </Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={targetAllStudents}
            onChange={(e) => setTargetAllStudents(e.target.checked)}
          />
        }
        label="Target all students"
      />
      {!targetAllStudents && (
        <FormControl size="small" fullWidth>
          <InputLabel>Target courses</InputLabel>
          <Select
            multiple
            value={targetCourses}
            onChange={(e) => {
              const raw = e.target.value as unknown[];
              setTargetCourses(
                raw.map((v) => Number(v)).filter((n) => !Number.isNaN(n))
              );
            }}
            input={<OutlinedInput label="Target courses" />}
            renderValue={(selected) =>
              (selected as number[])
                .map(
                  (id) =>
                    courses.find((c) => c.id === id)?.name ??
                    courses.find((c) => c.id === id)?.title ??
                    id
                )
                .join(", ")
            }
          >
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name ?? c.title ?? `Course ${c.id}`}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Only students enrolled in these courses will see and apply to this job.
          </FormHelperText>
        </FormControl>
      )}
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{
          backgroundColor: "#6366f1",
          textTransform: "none",
          fontWeight: 600,
          alignSelf: "flex-start",
          "&:hover": { backgroundColor: "#4f46e5" },
        }}
      >
        {isSubmitting ? "Saving..." : job ? "Update job" : "Create job"}
      </Button>
    </Box>
  );
};

export const JDCreateEditForm = memo(JDCreateEditFormComponent);
JDCreateEditForm.displayName = "JDCreateEditForm";
