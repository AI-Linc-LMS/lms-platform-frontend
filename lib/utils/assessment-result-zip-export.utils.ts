import type { AssessmentResult } from "@/lib/services/assessment.service";
import {
  generateAssessmentResultPdfVector,
  type AssessmentPdfStudentOverrides,
} from "@/lib/utils/assessment-result-pdf.utils";

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
    const raw = s.your_answer ?? s.answer ?? "";
    const text = typeof raw === "string" ? raw : String(raw ?? "");
    if (!text.trim()) return;
    zip.file(
      `subjective/${String(i + 1).padStart(2, "0")}-question-${s.question_id}.txt`,
      subjectiveAnswerToPlainText(text),
    );
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
