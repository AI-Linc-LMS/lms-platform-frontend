import type { Section } from "@/components/admin/assessment/MultipleSectionsSection";
import type { AssessmentDetail } from "@/lib/services/admin/admin-assessment.service";
import {
  isCodingQuestion,
  isMCQQuestion,
  isSubjectiveQuestion,
  type QuestionsExportResponse,
} from "@/lib/services/admin/admin-assessment.service";

export type MCQInputMethod = "manual" | "existing" | "csv" | "ai";

/** Match datetime-local inputs (same logic as admin assessment edit page). */
export function formatAssessmentDatetimeForInput(
  dateTimeString: string | null | undefined
): string {
  if (!dateTimeString?.trim()) return "";
  try {
    const s = dateTimeString.trim();

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
      return s.slice(0, 16);
    }
    const ddParts = s.match(
      /^(\d{1,2})\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );
    if (ddParts) {
      const [, d, mo, y, h, min] = ddParts;
      return `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}T${h!.padStart(2, "0")}:${min}`;
    }
    const isoMatch = s.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:.*)?$/
    );
    if (isoMatch) {
      const [, y, mo, d, h, min] = isoMatch;
      return `${y}-${mo}-${d}T${h}:${min}`;
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hr = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hr}:${min}`;
  } catch {
    return "";
  }
}

export function mapQuestionsExportToAuthoringState(exportData: QuestionsExportResponse): {
  sections: Section[];
  mcqInputMethodBySection: Record<string, MCQInputMethod>;
  codingInputMethodBySection: Record<string, "existing" | "ai" | "raw" | "csv">;
  subjectiveInputMethodBySection: Record<string, "manual" | "existing">;
  sectionMcqIds: Record<string, number[]>;
  sectionCodingProblemIds: Record<string, number[]>;
  sectionSubjectiveQuestionIds: Record<string, number[]>;
} {
  const sections: Section[] = [];
  const mcqInputMethodBySection: Record<string, MCQInputMethod> = {};
  const codingInputMethodBySection: Record<string, "existing" | "ai" | "raw" | "csv"> = {};
  const subjectiveInputMethodBySection: Record<string, "manual" | "existing"> = {};
  const sectionMcqIds: Record<string, number[]> = {};
  const sectionCodingProblemIds: Record<string, number[]> = {};
  const sectionSubjectiveQuestionIds: Record<string, number[]> = {};

  const sorted = [...exportData.sections].sort((a, b) => a.order - b.order);

  for (const sec of sorted) {
    const id = `loaded-${sec.section_type}-${sec.section_id}`;
    const base: Section = {
      id,
      type:
        sec.section_type === "coding"
          ? "coding"
          : sec.section_type === "subjective"
            ? "subjective"
            : "quiz",
      title: sec.section_title || "",
      description: sec.section_description || "",
      order: sec.order,
      easyScore: sec.easy_score,
      mediumScore: sec.medium_score,
      hardScore: sec.hard_score,
    };

    const nQ = sec.number_of_questions;
    const pool = sec.questions?.length ?? 0;
    if (nQ > 0 && pool > 0 && nQ !== pool) {
      base.number_of_questions_to_show = nQ;
    }

    if (sec.section_type === "quiz") {
      sections.push(base);
      mcqInputMethodBySection[id] = "existing";
      sectionMcqIds[id] = sec.questions.filter(isMCQQuestion).map((q) => q.id);
    } else if (sec.section_type === "coding") {
      sections.push(base);
      codingInputMethodBySection[id] = "existing";
      sectionCodingProblemIds[id] = sec.questions.filter(isCodingQuestion).map((q) => q.id);
    } else if (sec.section_type === "subjective") {
      sections.push(base);
      subjectiveInputMethodBySection[id] = "existing";
      sectionSubjectiveQuestionIds[id] = sec.questions
        .filter(isSubjectiveQuestion)
        .map((q) => q.id);
    }
  }

  return {
    sections,
    mcqInputMethodBySection,
    codingInputMethodBySection,
    subjectiveInputMethodBySection,
    sectionMcqIds,
    sectionCodingProblemIds,
    sectionSubjectiveQuestionIds,
  };
}

export function applyAssessmentDetailToBasicFields(
  data: AssessmentDetail,
  setters: {
    setTitle: (v: string) => void;
    setInstructions: (v: string) => void;
    setDescription: (v: string) => void;
    setDurationMinutes: (v: number) => void;
    setStartTime: (v: string) => void;
    setEndTime: (v: string) => void;
    setIsPaid: (v: boolean) => void;
    setPrice: (v: string) => void;
    setCurrency: (v: string) => void;
    setIsActive: (v: boolean) => void;
    setCourseIds: (v: number[]) => void;
    setColleges: (v: string[]) => void;
    setProctoringEnabled: (v: boolean) => void;
    setLiveStreaming: (v: boolean) => void;
    setSendCommunication: (v: boolean) => void;
    setShowResult: (v: boolean) => void;
    setEvaluationMode: (v: "auto" | "manual") => void;
    setAllowMovementAcrossSections: (v: boolean) => void;
    setTabSwitchLimitEnabled: (v: boolean) => void;
    setTabSwitchLimitCount: (v: number) => void;
    setCertificateAvailable: (v: boolean) => void;
    setPassBandLowerPercent: (v: string) => void;
    setPassBandUpperPercent: (v: string) => void;
    setAllowDesktop: (v: boolean) => void;
    setAllowMobile: (v: boolean) => void;
    setAllowTablet: (v: boolean) => void;
  }
): void {
  const anyData = data as unknown as Record<string, unknown>;
  setters.setTitle(data.title ?? "");
  setters.setInstructions(data.instructions ?? "");
  setters.setDescription(data.description ?? "");
  setters.setDurationMinutes(data.duration_minutes ?? 60);
  setters.setStartTime(formatAssessmentDatetimeForInput(data.start_time ?? "") || "");
  setters.setEndTime(formatAssessmentDatetimeForInput(data.end_time ?? "") || "");
  setters.setIsPaid(Boolean(anyData.is_paid));
  setters.setPrice(
    anyData.price != null && String(anyData.price).trim() !== ""
      ? String(anyData.price)
      : ""
  );
  setters.setCurrency((anyData.currency as string) ?? "INR");
  setters.setIsActive(data.is_active ?? true);
  const loadedCourseIds = Array.isArray(anyData.course_ids)
    ? (anyData.course_ids as number[])
    : Array.isArray(anyData.courses)
      ? (anyData.courses as { id: number }[]).map((c) => c.id)
      : [];
  setters.setCourseIds(loadedCourseIds);
  setters.setColleges(Array.isArray(anyData.colleges) ? (anyData.colleges as string[]) : []);
  setters.setProctoringEnabled((anyData.proctoring_enabled as boolean) ?? true);
  setters.setLiveStreaming((anyData.live_streaming as boolean) ?? false);
  setters.setSendCommunication((anyData.send_communication as boolean) ?? false);
  setters.setShowResult((anyData.show_result as boolean) ?? true);
  setters.setEvaluationMode(anyData.evaluation_mode === "manual" ? "manual" : "auto");
  setters.setAllowMovementAcrossSections(anyData.allow_movement !== false);
  setters.setTabSwitchLimitEnabled(Boolean(anyData.tab_switch_limit_enabled));
  setters.setTabSwitchLimitCount(
    Number(anyData.tab_switch_limit_count) > 0 ? Number(anyData.tab_switch_limit_count) : 2
  );
  setters.setCertificateAvailable(Boolean(anyData.certificate_available));
  setters.setPassBandLowerPercent(
    anyData.pass_band_lower_min_percent != null &&
      String(anyData.pass_band_lower_min_percent).trim() !== ""
      ? String(anyData.pass_band_lower_min_percent)
      : ""
  );
  setters.setPassBandUpperPercent(
    anyData.pass_band_upper_min_percent != null &&
      String(anyData.pass_band_upper_min_percent).trim() !== ""
      ? String(anyData.pass_band_upper_min_percent)
      : ""
  );
  setters.setAllowDesktop((anyData.allow_desktop as boolean) ?? true);
  setters.setAllowMobile((anyData.allow_mobile as boolean) ?? true);
  setters.setAllowTablet((anyData.allow_tablet as boolean) ?? true);
}
