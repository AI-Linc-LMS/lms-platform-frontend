"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  J,
  JButton,
  JCard,
  JFileDrop,
  JTextArea,
  R,
  SectionHeader,
  TYPE,
} from "@/components/jobs-v2/ui";
import { ChipBinField, FieldGrid, FieldProvenance, type StepProps } from "./StepRole";

/** 10MB. The backend accepts a PDF; anything larger is a mistake, not a job description. */
const JD_MAX_BYTES = 10 * 1024 * 1024;

/* ==========================================================================
 * Step 2 — "The description".
 *
 * `mandatory_skills` and `key_skills` are TWO bins here, and the payload sends each one once.
 * The shipped form had a single "Key Skills" editor and then submitted
 * `mandatory_skills: formData.key_skills`, which is the root of the duplicated-skills bug on
 * the admin detail page (5.9). Both halves of that bug are fixed: the form stops copying, and
 * the detail page de-duplicates.
 * ======================================================================== */
export function StepDescription({ form, provenance }: StepProps) {
  const { t } = useTranslation("common");
  const { data, setField } = form;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionHeader
        icon="mdi:text-box-outline"
        title={t("jobsV2.form.stepDescription", "The description")}
        description={t(
          "jobsV2.form.stepDescriptionHint",
          "What a candidate reads before deciding whether to spend an afternoon on this.",
        )}
      />

      <JCard>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <FieldProvenance source={provenance?.job_description} />
            <JTextArea
              id="job-description"
              label={t("jobsV2.form.description", "Job description")}
              value={data.job_description ?? ""}
              onChange={(v) => setField("job_description", v)}
              rows={7}
              placeholder={t(
                "jobsV2.form.descriptionPlaceholder",
                "Describe the role, the responsibilities and what you are looking for…",
              )}
            />
          </Box>

          <Box>
            <Typography sx={{ ...TYPE.label, mb: 0.75 }}>
              {t("jobsV2.form.jdUpload", "Attached job description (PDF)")}
            </Typography>
            <JFileDrop
              id="jd-file"
              accept=".pdf,application/pdf"
              maxBytes={JD_MAX_BYTES}
              value={form.jdFile ? { name: form.jdFile.name, size: form.jdFile.size } : null}
              onFile={(file) => form.setJdFile(file)}
              onClear={() => form.setJdFile(null)}
              state={form.jdFile ? "success" : "idle"}
              label={t("jobsV2.form.jdDropLabel", "Drop a PDF here, or choose a file")}
              hint={t(
                "jobsV2.form.jdDropHint",
                "Optional. Students can open it from the job detail page. PDF, up to 10 MB.",
              )}
            />
          </Box>

          <JTextArea
            id="role-process"
            label={t("jobsV2.form.selectionProcess", "Selection process")}
            value={data.role_process ?? ""}
            onChange={(v) => setField("role_process", v)}
            rows={3}
            placeholder={t(
              "jobsV2.form.selectionProcessPlaceholder",
              "e.g. Application → Screening → Technical interview → Offer",
            )}
          />

          <Box>
            <FieldProvenance source={provenance?.company_info} />
            <JTextArea
              id="company-info"
              label={t("jobsV2.form.aboutCompany", "About the company")}
              value={data.company_info ?? ""}
              onChange={(v) => setField("company_info", v)}
              rows={3}
              placeholder={t(
                "jobsV2.form.aboutCompanyPlaceholder",
                "A short overview of the employer.",
              )}
            />
          </Box>
        </Box>
      </JCard>

      <JCard>
        <Typography sx={{ ...TYPE.h3, mb: 0.5 }}>
          {t("jobsV2.form.skills", "Skills")}
        </Typography>
        <Typography sx={{ ...TYPE.small, mb: 2 }}>
          {t(
            "jobsV2.form.skillsHint",
            "Two separate lists. Must-have skills are the bar; nice-to-have skills are the bonus. Neither is a copy of the other.",
          )}
        </Typography>
        <FieldGrid>
          <ChipBinField
            id="mandatory-skills"
            label={t("jobsV2.form.mustHaveSkills", "Must-have skills")}
            placeholder={t("jobsV2.form.skillPlaceholder", "Type a skill and press Enter")}
            addLabel={t("jobsV2.form.add", "Add")}
            values={data.mandatory_skills ?? []}
            onAdd={(value) => form.addSkill("mandatory_skills", value)}
            onRemove={(index) => form.removeSkill("mandatory_skills", index)}
            emptyHint={t("jobsV2.form.noMustHave", "No must-have skills yet.")}
          />
          <ChipBinField
            id="key-skills"
            label={t("jobsV2.form.niceToHaveSkills", "Nice-to-have skills")}
            placeholder={t("jobsV2.form.skillPlaceholder", "Type a skill and press Enter")}
            addLabel={t("jobsV2.form.add", "Add")}
            values={data.key_skills ?? []}
            onAdd={(value) => form.addSkill("key_skills", value)}
            onRemove={(index) => form.removeSkill("key_skills", index)}
            emptyHint={t("jobsV2.form.noNiceToHave", "No nice-to-have skills yet.")}
            tone="neutral"
          />
        </FieldGrid>
        {(provenance?.mandatory_skills || provenance?.key_skills) && (
          <Box
            sx={{
              mt: 2,
              p: 1.25,
              borderRadius: R.ctl,
              border: `1px solid ${J.azureBorder}`,
              bgcolor: J.azureSoft,
            }}
          >
            <Typography sx={{ ...TYPE.micro, color: J.azureDeep }}>
              {t(
                "jobsV2.form.skillsPrefilled",
                "These skills came from the scraped posting. Review them before publishing.",
              )}
            </Typography>
          </Box>
        )}
        {(data.mandatory_skills ?? []).length === 0 &&
          (data.key_skills ?? []).length === 0 && (
            <JButton
              variant="quiet"
              size="sm"
              startIcon="mdi:information-outline"
              disabled
              disabledReason={t(
                "jobsV2.form.noSkillsReason",
                "A job with no skills still saves; it just cannot be matched to a learner's profile.",
              )}
              sx={{ mt: 1.5, px: 0 }}
            >
              {t("jobsV2.form.noSkillsYet", "No skills added yet")}
            </JButton>
          )}
      </JCard>
    </Box>
  );
}
