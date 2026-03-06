import { z } from "zod";

export const eligibilityCriteriaSchema = z
  .object({
    min_graduation_year: z.number().int().optional(),
    branches: z.array(z.string()).optional(),
    degree_types: z.array(z.string()).optional(),
  })
  .optional();

export const createJobSchema = z.object({
  role: z.string().min(1, "Role is required"),
  company_name: z.string().min(1, "Company name is required"),
  company_logo: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || /^https?:\/\/.+/.test(val.trim()),
      "Must be a valid URL"
    ),
  job_description: z.string().min(1, "Job description is required"),
  eligibility_criteria: eligibilityCriteriaSchema,
  compensation: z.string().optional(),
  location: z.string().optional(),
  application_deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  job_type: z.enum(["job", "internship"]).default("job"),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().default(false),
  target_all_students: z.boolean().default(true),
  target_courses: z.array(z.number().int()).optional(),
});

export const applySchema = z.object({
  resume_url: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || val.trim() === "" || /^https?:\/\/.+/.test(val.trim()),
      "Must be a valid URL"
    ),
  cover_letter: z.string().optional(),
});

export type CreateJobFormData = z.infer<typeof createJobSchema>;
export type ApplyFormData = z.infer<typeof applySchema>;
