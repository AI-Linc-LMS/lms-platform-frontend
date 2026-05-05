import type { AssessmentResult } from "@/lib/services/assessment.service";
import {
  generateAssessmentResultPdfVector,
  type AssessmentPdfStudentOverrides,
} from "@/lib/utils/assessment-result-pdf.utils";
import {
  normalizeSubjectiveAnswer,
  parseSubjectiveAnswerPayload,
} from "@/utils/assessment.utils";

function subjectiveAnswerToPlainText(raw: string): string {
  if (!raw.trim()) return raw;
  if (!/<[a-z][\s\S]*>/i.test(raw)) return raw;
  if (typeof document === "undefined") return raw.replace(/<[^>]+>/g, " ");
  const div = document.createElement("div");
  div.innerHTML = raw;
  return (div.textContent || div.innerText || raw).replace(/\s+\n/g, "\n").trim();
}

function safePathSegment(s: string, maxLen: number): string {
  const t = s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "item";
  return t.slice(0, maxLen);
}

/**
 * Builds a ZIP with the same PDF as the single-file download, full `AssessmentResult` JSON,
 * per-problem coding sources (`.txt`), subjective answers (`.txt`), and quiz responses JSON.
 */
export async function downloadAssessmentResultZipBundle(
  data: AssessmentResult,
  baseFileName: string,
  studentOverrides?: AssessmentPdfStudentOverrides,
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const pdfBlob = generateAssessmentResultPdfVector(
    data,
    `${baseFileName}-report.pdf`,
    studentOverrides,
    { download: false },
  );
  zip.file(`${baseFileName}-report.pdf`, pdfBlob);

  zip.file("assessment-result.json", JSON.stringify(data, null, 2));

  const coding = data.user_responses?.coding_problem_responses ?? [];
  coding.forEach((c, i) => {
    const code = c.submitted_code?.trim();
    if (!code) return;
    const title = safePathSegment(c.title || `problem-${c.problem_id}`, 50);
    zip.file(
      `coding/${String(i + 1).padStart(2, "0")}-problem-${c.problem_id}-${title}.txt`,
      code,
    );
  });

  const subjective = data.user_responses?.subjective_responses ?? [];
  subjective.forEach((s, i) => {
    const raw = s.your_answer ?? s.answer;
    const parsed = parseSubjectiveAnswerPayload(raw);
    const images =
      s.images && s.images.length > 0 ? s.images : parsed.images || [];
    const files =
      s.files && s.files.length > 0 ? s.files : parsed.files || [];
    const video =
      s.video?.url != null && s.video.url !== ""
        ? s.video
        : parsed.video?.url
          ? parsed.video
          : null;

    const text = normalizeSubjectiveAnswer(raw);
    const plain = subjectiveAnswerToPlainText(text).trim();
    const prefix = `subjective/${String(i + 1).padStart(2, "0")}-question-${s.question_id}`;
    if (plain) {
      zip.file(`${prefix}.txt`, plain);
    }
    const hasAssets =
      images.length > 0 || files.length > 0 || Boolean(video?.url);
    if (hasAssets) {
      zip.file(
        `${prefix}-attachments.json`,
        JSON.stringify(
          {
            question_id: s.question_id,
            answer_mode: s.answer_mode ?? null,
            images,
            files,
            video: video ?? null,
          },
          null,
          2,
        ),
      );
    }
  });

  const quiz = data.user_responses?.quiz_responses ?? [];
  if (quiz.length > 0) {
    zip.file("quiz/quiz-responses.json", JSON.stringify(quiz, null, 2));
  }

  zip.file(
    "README.txt",
    [
      "Assessment result bundle",
      "===================",
      "",
      `Assessment: ${data.assessment_name}`,
      `Status: ${data.status}`,
      "",
      "Contents:",
      `- ${baseFileName}-report.pdf — same report as “Download PDF”`,
      "- assessment-result.json — raw API payload (archive / tooling)",
      "- coding/*.txt — submitted code per problem (when present)",
      "- subjective/*.txt — written answers as plain text (when present)",
      "- subjective/*-attachments.json — image/file/video URLs when present",
      "- quiz/quiz-responses.json — MCQ-style responses (when present)",
      "",
    ].join("\n"),
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseFileName}-result-bundle.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
