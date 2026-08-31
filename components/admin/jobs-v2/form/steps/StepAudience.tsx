"use client";

import { useMemo, useState } from "react";
import { Autocomplete, Box, InputBase, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobQuestionV2 } from "@/lib/services/admin/admin-jobs-v2.service";
import {
  CountPill,
  EmptyState,
  ErrorState,
  J,
  JButton,
  JCard,
  JDatePicker,
  JPagination,
  JSelect,
  MOTION,
  R,
  SearchInput,
  SectionHeader,
  SkillChip,
  StatusSelect,
  TYPE,
  controlSx,
} from "@/components/jobs-v2/ui";
import { AudienceSummary } from "../AudienceSummary";
import { ChipBinField, type StepProps } from "./StepRole";

export interface CourseOption {
  id: number;
  title?: string;
  name?: string;
}

const courseLabel = (option: CourseOption) =>
  option?.title ?? option?.name ?? `Course ${option?.id ?? ""}`;

const QUESTION_TYPE_KEYS: Record<string, { key: string; fallback: string }> = {
  text: { key: "jobsV2.questionType.text", fallback: "Short text" },
  textarea: { key: "jobsV2.questionType.textarea", fallback: "Paragraph" },
  choice: { key: "jobsV2.questionType.choice", fallback: "Single choice" },
  multichoice: { key: "jobsV2.questionType.multichoice", fallback: "Multiple choice" },
  yes_no: { key: "jobsV2.questionType.yes_no", fallback: "Yes / No" },
};

export interface StepAudienceProps extends StepProps {
  courses: CourseOption[];
  coursesLoading: boolean;
  coursesError: string | null;
  onRetryCourses: () => void;

  adaptiveCourses: CourseOption[];
  adaptiveLoading: boolean;
  adaptiveError: string | null;
  onRetryAdaptive: () => void;

  questionBank: JobQuestionV2[];
  questionsLoading: boolean;
  questionsError: string | null;
  onRetryQuestions: () => void;
  onAddQuestion: () => void;

  onOpenStudentPicker: () => void;
  /** Student ids already assigned on the server, so "new" additions can be counted honestly. */
  serverAssignedIds: number[];
}

/** Autocomplete rendered through the module's own control chrome, not MUI's outlined input. */
function TokenAutocompleteInput({
  params,
  placeholder,
}: {
  params: Parameters<
    NonNullable<React.ComponentProps<typeof Autocomplete>["renderInput"]>
  >[0];
  placeholder: string;
}) {
  return (
    <InputBase
      {...params.InputProps}
      inputProps={params.inputProps}
      placeholder={placeholder}
      sx={controlSx({ multiline: true })}
    />
  );
}

export function StepAudience({
  form,
  courses,
  coursesLoading,
  coursesError,
  onRetryCourses,
  adaptiveCourses,
  adaptiveLoading,
  adaptiveError,
  onRetryAdaptive,
  questionBank,
  questionsLoading,
  questionsError,
  onRetryQuestions,
  onAddQuestion,
  onOpenStudentPicker,
  serverAssignedIds,
}: StepAudienceProps) {
  const { t } = useTranslation("common");
  const { data, setField } = form;

  const [questionSearch, setQuestionSearch] = useState("");
  const [questionQuery, setQuestionQuery] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionPageSize, setQuestionPageSize] = useState(10);

  const selectedIds = useMemo(() => new Set(data.question_ids ?? []), [data.question_ids]);

  const selectedCourses = useMemo(
    () =>
      (data.course_ids ?? [])
        .map((id) => courses.find((c) => Number(c.id) === Number(id)))
        .filter(Boolean) as CourseOption[],
    [courses, data.course_ids],
  );
  const selectedAdaptive = useMemo(
    () =>
      (data.adaptive_course_ids ?? [])
        .map((id) => adaptiveCourses.find((c) => Number(c.id) === Number(id)))
        .filter(Boolean) as CourseOption[],
    [adaptiveCourses, data.adaptive_course_ids],
  );

  const newStudentCount = useMemo(() => {
    const known = new Set(serverAssignedIds);
    return form.assignedStudents.filter((s) => !known.has(s.id)).length;
  }, [form.assignedStudents, serverAssignedIds]);

  /** Selected questions are PINNED to the top: with 60 in a global bank paginated 5 at a
   *  time, an "N selected" chip was the only evidence a selection existed at all. */
  const filteredQuestions = useMemo(() => {
    const query = questionQuery.trim().toLowerCase();
    const list = questionBank.filter((q) => {
      if (selectedOnly && !selectedIds.has(q.id)) return false;
      if (questionType && q.question_type !== questionType) return false;
      if (query && !(q.question_text ?? "").toLowerCase().includes(query)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const aSel = selectedIds.has(a.id) ? 0 : 1;
      const bSel = selectedIds.has(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.id - b.id;
    });
  }, [questionBank, questionQuery, questionType, selectedIds, selectedOnly]);

  const questionPageCount = Math.max(1, Math.ceil(filteredQuestions.length / questionPageSize));
  const safePage = Math.min(questionPage, questionPageCount);
  const pagedQuestions = filteredQuestions.slice(
    (safePage - 1) * questionPageSize,
    safePage * questionPageSize,
  );

  const questionsFiltered = Boolean(questionQuery.trim() || questionType || selectedOnly);

  const resetQuestionFilters = () => {
    setQuestionSearch("");
    setQuestionQuery("");
    setQuestionType("");
    setSelectedOnly(false);
    setQuestionPage(1);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionHeader
        icon="mdi:target"
        title={t("jobsV2.form.stepAudience", "Audience and publish")}
        description={t(
          "jobsV2.form.stepAudienceHint",
          "Who sees the job, what they are asked, and whether it goes live.",
        )}
      />

      {/* The one sentence. It replaces four per-picker captions that contradicted each other. */}
      <AudienceSummary
        courseTitles={selectedCourses.map(courseLabel)}
        adaptiveTitles={selectedAdaptive.map(courseLabel)}
        studentCount={form.assignedStudents.length}
        collegeNames={(data.college_mappings ?? []).map((m) => m.college_name)}
        newStudentCount={newStudentCount}
        published={Boolean(data.is_published)}
      />

      <JCard>
        <Typography sx={{ ...TYPE.h3, mb: 2 }}>
          {t("jobsV2.form.targeting", "Targeting")}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* ---- courses --------------------------------------------------- */}
          <Box>
            <Typography component="label" htmlFor="courses-picker" sx={{ ...TYPE.label, display: "block", mb: 0.75 }}>
              {t("jobsV2.form.courses", "Courses")}
            </Typography>
            {coursesError ? (
              <ErrorState
                variant="inline"
                error={coursesError}
                title={t("jobsV2.form.coursesErrorTitle", "We could not load your courses")}
                body={t(
                  "jobsV2.form.coursesErrorBody",
                  "Without this list you cannot target by course. Everything else on the form still saves.",
                )}
                onRetry={onRetryCourses}
              />
            ) : coursesLoading ? (
              <Box
                aria-busy="true"
                sx={{
                  height: 44,
                  borderRadius: R.ctl,
                  border: `1px dashed ${J.hairline}`,
                  bgcolor: J.surface2,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                }}
              >
                <Typography sx={TYPE.micro}>
                  {t("jobsV2.form.coursesLoading", "Loading your courses…")}
                </Typography>
              </Box>
            ) : (
              <Autocomplete
                multiple
                id="courses-picker"
                options={courses}
                getOptionLabel={(option) => courseLabel(option as CourseOption)}
                isOptionEqualToValue={(option, value) =>
                  (option as CourseOption)?.id === (value as CourseOption)?.id
                }
                value={selectedCourses}
                onChange={(_, value) =>
                  setField(
                    "course_ids",
                    (value as CourseOption[]).map((c) => c.id),
                  )
                }
                renderOption={(props, option) => (
                  <li {...props} key={(option as CourseOption).id}>
                    {courseLabel(option as CourseOption)}
                  </li>
                )}
                renderInput={(params) => (
                  <TokenAutocompleteInput
                    params={params}
                    placeholder={t("jobsV2.form.coursesPlaceholder", "Search your courses")}
                  />
                )}
              />
            )}
          </Box>

          {/* ---- adaptive courses ------------------------------------------ */}
          <Box>
            <Typography component="label" htmlFor="adaptive-picker" sx={{ ...TYPE.label, display: "block", mb: 0.75 }}>
              {t("jobsV2.form.adaptiveCourses", "Adaptive courses")}
            </Typography>
            {adaptiveError ? (
              <ErrorState
                variant="inline"
                error={adaptiveError}
                title={t("jobsV2.form.adaptiveErrorTitle", "We could not load your adaptive courses")}
                body={t(
                  "jobsV2.form.adaptiveErrorBody",
                  "The picker below would otherwise look simply empty, which is not the same thing.",
                )}
                onRetry={onRetryAdaptive}
              />
            ) : adaptiveLoading ? (
              <Box
                aria-busy="true"
                sx={{
                  height: 44,
                  borderRadius: R.ctl,
                  border: `1px dashed ${J.hairline}`,
                  bgcolor: J.surface2,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                }}
              >
                <Typography sx={TYPE.micro}>
                  {t("jobsV2.form.adaptiveLoading", "Loading adaptive courses…")}
                </Typography>
              </Box>
            ) : (
              <Autocomplete
                multiple
                id="adaptive-picker"
                options={adaptiveCourses}
                getOptionLabel={(option) => courseLabel(option as CourseOption)}
                isOptionEqualToValue={(option, value) =>
                  (option as CourseOption)?.id === (value as CourseOption)?.id
                }
                value={selectedAdaptive}
                onChange={(_, value) =>
                  setField(
                    "adaptive_course_ids",
                    (value as CourseOption[]).map((c) => c.id),
                  )
                }
                renderOption={(props, option) => (
                  <li {...props} key={(option as CourseOption).id}>
                    {courseLabel(option as CourseOption)}
                  </li>
                )}
                renderInput={(params) => (
                  <TokenAutocompleteInput
                    params={params}
                    placeholder={t(
                      "jobsV2.form.adaptivePlaceholder",
                      "Search your adaptive courses",
                    )}
                  />
                )}
              />
            )}
          </Box>

          {/* ---- assigned students ----------------------------------------- */}
          <Box>
            <Typography sx={{ ...TYPE.label, mb: 0.75 }}>
              {t("jobsV2.form.assignedStudents", "Individually assigned students")}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
              {form.assignedStudents.map((student) => (
                <SkillChip
                  key={student.id}
                  selected
                  onToggle={() =>
                    form.setAssignedStudents(
                      form.assignedStudents.filter((x) => x.id !== student.id),
                    )
                  }
                >
                  {student.name}
                </SkillChip>
              ))}
              <JButton
                variant="secondary"
                size="sm"
                startIcon="mdi:account-plus-outline"
                onClick={onOpenStudentPicker}
              >
                {form.assignedStudents.length > 0
                  ? t("jobsV2.form.editStudents", "Edit students")
                  : t("jobsV2.form.selectStudents", "Select students")}
              </JButton>
            </Box>
          </Box>

          {/* ---- colleges --------------------------------------------------- */}
          <ChipBinField
            id="college-mappings"
            label={t("jobsV2.form.colleges", "College mapping")}
            placeholder={t("jobsV2.form.collegePlaceholder", "Type a college name and press Enter")}
            addLabel={t("jobsV2.form.add", "Add")}
            values={(data.college_mappings ?? []).map((m) => m.college_name)}
            onAdd={form.addCollege}
            onRemove={form.removeCollege}
            emptyHint={t("jobsV2.form.noColleges", "No college mapping — every college qualifies.")}
            tone="neutral"
          />
        </Box>
      </JCard>

      {/* ---- application questions ---------------------------------------- */}
      <JCard>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={TYPE.h3}>
              {t("jobsV2.form.questions", "Application questions")}
            </Typography>
            <Typography sx={{ ...TYPE.small, mt: 0.25 }}>
              {t(
                "jobsV2.form.questionsHint",
                "Pick from the shared bank. Selected questions are pinned to the top of the list.",
              )}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CountPill value={selectedIds.size} tone={selectedIds.size ? "azure" : "neutral"} />
            <JButton variant="primary" size="sm" startIcon="mdi:plus" onClick={onAddQuestion}>
              {t("jobsV2.form.addQuestion", "Add question")}
            </JButton>
          </Box>
        </Box>

        {questionsError ? (
          <ErrorState
            variant="panel"
            error={questionsError}
            title={t("jobsV2.form.questionsErrorTitle", "We could not load the question bank")}
            onRetry={onRetryQuestions}
          />
        ) : questionsLoading ? (
          <Box aria-busy="true" sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  height: 72,
                  borderRadius: R.card,
                  bgcolor: J.surface2,
                  border: `1px solid ${J.hairline}`,
                }}
              />
            ))}
          </Box>
        ) : questionBank.length === 0 ? (
          <EmptyState
            variant="panel"
            icon="mdi:help-circle-outline"
            title={t("jobsV2.form.noQuestionsTitle", "No questions yet")}
            body={t(
              "jobsV2.form.noQuestionsBody",
              "Create your first question and it joins the shared bank for every future job.",
            )}
            primaryAction={
              <JButton variant="primary" startIcon="mdi:plus" onClick={onAddQuestion}>
                {t("jobsV2.form.createFirstQuestion", "Create the first question")}
              </JButton>
            }
          />
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1.25,
                mb: 2,
              }}
            >
              <SearchInput
                value={questionSearch}
                onChange={setQuestionSearch}
                onSubmit={(value) => {
                  setQuestionQuery(value);
                  setQuestionPage(1);
                }}
                ariaLabel={t("jobsV2.form.searchQuestions", "Search questions")}
                placeholder={t("jobsV2.form.searchQuestions", "Search questions")}
                maxWidth={280}
              />
              <JSelect
                id="question-type-filter"
                value={questionType}
                onChange={(value) => {
                  setQuestionType(value);
                  setQuestionPage(1);
                }}
                fullWidth={false}
                placeholder={t("jobsV2.form.allTypes", "All types")}
                options={[
                  { value: "", label: t("jobsV2.form.allTypes", "All types") },
                  ...Object.entries(QUESTION_TYPE_KEYS).map(([value, meta]) => ({
                    value,
                    label: t(meta.key, meta.fallback),
                  })),
                ]}
                sx={{ minWidth: 180 }}
              />
              <SkillChip
                selected={selectedOnly}
                onToggle={() => {
                  setSelectedOnly((prev) => !prev);
                  setQuestionPage(1);
                }}
                count={selectedIds.size}
              >
                {t("jobsV2.form.selectedOnly", "Selected only")}
              </SkillChip>
            </Box>

            {filteredQuestions.length === 0 ? (
              <EmptyState
                variant="panel"
                icon="mdi:filter-remove-outline"
                title={t("jobsV2.form.noQuestionMatchTitle", "No questions match")}
                body={t(
                  "jobsV2.form.noQuestionMatchBody",
                  "Nothing in the bank matches this search and type.",
                )}
                primaryAction={
                  <JButton variant="secondary" onClick={resetQuestionFilters}>
                    {t("jobsV2.filters.clearAll")}
                  </JButton>
                }
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {pagedQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    selected={selectedIds.has(question.id)}
                    onToggle={() => form.toggleQuestion(question.id)}
                  />
                ))}
              </Box>
            )}

            <JPagination
              page={safePage}
              pageCount={questionPageCount}
              total={filteredQuestions.length}
              pageSize={questionPageSize}
              onPageChange={setQuestionPage}
              onPageSizeChange={(size) => {
                setQuestionPageSize(size);
                setQuestionPage(1);
              }}
              totalHint={
                questionsFiltered
                  ? t("jobsV2.form.questionsFilteredHint", "filtered from {{total}} in the bank", {
                      total: questionBank.length,
                    })
                  : undefined
              }
              sx={{ mt: 2 }}
            />
          </>
        )}
      </JCard>

      {/* ---- publish ------------------------------------------------------- */}
      <JCard>
        <Typography sx={{ ...TYPE.h3, mb: 2 }}>
          {t("jobsV2.form.publish", "Publish")}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2.5,
          }}
        >
          <JSelect
            id="visibility"
            label={t("jobsV2.form.visibility", "Visibility")}
            value={data.is_published ? "published" : "draft"}
            onChange={(value) => setField("is_published", value === "published")}
            options={[
              {
                value: "draft",
                label: t("jobsV2.visibility.draft"),
                icon: "mdi:file-document-edit-outline",
              },
              {
                value: "published",
                label: t("jobsV2.visibility.published"),
                icon: "mdi:eye-outline",
              },
            ]}
            helper={t(
              "jobsV2.form.visibilityHint",
              "A draft is saved but invisible to every student.",
            )}
          />
          {/* Exhaustive by construction: StatusSelect maps JOB_STATUS_ORDER, so `on_hold` can
              never go missing from this control again. */}
          <StatusSelect
            id="job-status"
            kind="job"
            label={t("jobsV2.form.jobStatus", "Job status")}
            value={data.status ?? "active"}
            onChange={(value) => setField("status", value as typeof data.status)}
          />
          <JDatePicker
            id="closing-date"
            label={t("jobsV2.form.closingDate", "Closing date")}
            value={data.application_deadline ?? ""}
            onChange={(value) => setField("application_deadline", value)}
            helper={t("jobsV2.form.closingDateHint", "Optional. Shown to students as a deadline.")}
          />
        </Box>
      </JCard>
    </Box>
  );
}

function QuestionCard({
  question,
  selected,
  onToggle,
}: {
  question: JobQuestionV2;
  selected: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation("common");
  const meta = QUESTION_TYPE_KEYS[question.question_type] ?? {
    key: "jobsV2.questionType.text",
    fallback: "Short text",
  };
  const options =
    question.question_type === "yes_no"
      ? [t("jobsV2.questions.yes"), t("jobsV2.questions.no")]
      : (question.options ?? []);

  return (
    <JCard
      interactive
      // A real <button role="checkbox">: focusable, and Enter/Space toggle natively. The
      // shipped question cards were clickable <Box>es, unreachable by keyboard entirely.
      component="button"
      role="checkbox"
      onClick={onToggle}
      aria-label={question.question_text}
      sx={{
        p: 2,
        width: "100%",
        textAlign: "start",
        font: "inherit",
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        borderColor: selected ? J.azureBorder : J.hairline,
        bgcolor: selected ? J.azureSoft : J.surface,
      }}
      {...({ "aria-checked": selected, type: "button" } as Record<string, unknown>)}
    >
      <Box
        aria-hidden
        sx={{
          width: 22,
          height: 22,
          flexShrink: 0,
          mt: 0.25,
          borderRadius: R.ctl,
          display: "grid",
          placeItems: "center",
          border: `2px solid ${selected ? J.azure : J.hairlineStrong}`,
          bgcolor: selected ? J.azure : "transparent",
          color: J.surface,
          transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
        }}
      >
        {selected && <IconWrapper icon="mdi:check" size={14} />}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ ...TYPE.bodyStrong }}>
          {question.question_text}
          {question.is_required && (
            <Box component="span" aria-hidden sx={{ color: J.dangerFg, ml: 0.5 }}>
              *
            </Box>
          )}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center", mt: 1 }}>
          <Typography
            component="span"
            sx={{
              ...TYPE.micro,
              px: 0.75,
              py: 0.25,
              borderRadius: R.pill,
              border: `1px solid ${J.hairline}`,
              bgcolor: J.surface2,
            }}
          >
            {t(meta.key, meta.fallback)}
          </Typography>
          {options.map((option, index) => (
            <Typography
              key={`${option}-${index}`}
              component="span"
              sx={{
                ...TYPE.micro,
                px: 0.75,
                py: 0.25,
                borderRadius: R.ctl,
                border: `1px solid ${J.hairlineSoft}`,
              }}
            >
              {String.fromCharCode(65 + index)}. {option}
            </Typography>
          ))}
        </Box>
      </Box>
    </JCard>
  );
}
