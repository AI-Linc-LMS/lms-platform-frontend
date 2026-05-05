/**
 * Certificate copy builders. Organization name, logo, accent color, and slug subtitle are mapped
 * from tenant ClientInfo in `client-branding.ts` (buildCertificateBranding / finalizeBranding).
 */
import type { CertificateBranding, CertificateContent, CertificateVariant } from "./types";
import { generateCertificateId } from "./certificate-id";
import { scoreToPercent } from "./pass-band";

function toTitleCaseName(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

/** Optional “structured training in {course}” line; omitted when no course label is configured. */
function trainingInCourseLine(courseName?: string | null): Pick<
  CertificateContent,
  "bodyLead" | "bodySegments"
> {
  const trimmed = String(courseName ?? "").trim();
  if (!trimmed) {
    return { bodyLead: "", bodySegments: undefined };
  }
  return {
    bodyLead: "For completing structured training in",
    bodySegments: [
      {
        text: trimmed,
        bold: true,
        color: "#3e3aa5",
        fontSizePx: 28,
      },
    ],
  };
}

function baseContent(
  variant: CertificateVariant,
  partial: Omit<
    CertificateContent,
    "variant" | "branding" | "certificateId" | "issuedOn"
  > &
    Partial<Pick<CertificateContent, "certificateId" | "issuedOn">>,
  branding: CertificateBranding
): CertificateContent {
  return {
    variant,
    issuedOn: partial.issuedOn ?? new Date(),
    certificateId: partial.certificateId ?? generateCertificateId(branding?.issuerDisplayName),
    dateLabelPrefix: partial.dateLabelPrefix ?? "DATE:",
    preamble: partial.preamble,
    headlineTitle: partial.headlineTitle,
    bodyLead: partial.bodyLead,
    bodySegments: partial.bodySegments,
    subjectName: partial.subjectName,
    recipientName: toTitleCaseName(partial.recipientName),
    scoreText: partial.scoreText,
    credentialLines: partial.credentialLines,
    branding,
  };
}

export function buildCourseCompletionCertificate(
  args: {
    recipientName: string;
    courseTitle: string;
    branding: CertificateBranding;
    issuedOn?: Date;
    certificateId?: string;
  }
): CertificateContent {
  const { recipientName, courseTitle, branding, issuedOn, certificateId } = args;
  return baseContent(
    "course_completion",
    {
      recipientName,
      subjectName: courseTitle,
      headlineTitle: "Certificate of completion",
      preamble: "This is to certify that",
      bodyLead: "has successfully completed the training program",
      bodySegments: [
        { text: courseTitle, bold: true },
        { text: " offered by ", bold: false },
        { text: branding.issuerDisplayName, bold: true },
        { text: ".", bold: false },
      ],
      issuedOn,
      certificateId,
    },
    branding
  );
}

export function buildAssessmentParticipationCertificate(
  args: {
    recipientName: string;
    assessmentTitle: string;
    /** Linked course/program label when the assessment sits inside a named course track. */
    certificateCourseName?: string | null;
    branding: CertificateBranding;
    issuedOn?: Date;
    certificateId?: string;
  }
): CertificateContent {
  const { recipientName, assessmentTitle, branding, issuedOn, certificateId, certificateCourseName } = args;
  const trainingLine = trainingInCourseLine(certificateCourseName);
  return baseContent(
    "assessment_participation",
    {
      recipientName,
      subjectName: assessmentTitle,
      headlineTitle: "Certificate of participation",
      preamble: "This certificate is presented to",
      ...trainingLine,
      issuedOn,
      certificateId,
    },
    branding
  );
}

export function buildAssessmentAppreciationCertificate(
  args: {
    recipientName: string;
    assessmentTitle: string;
    certificateCourseName?: string | null;
    branding: CertificateBranding;
    scoreText: string;
    issuedOn?: Date;
    certificateId?: string;
  }
): CertificateContent {
  const { recipientName, assessmentTitle, branding, scoreText, issuedOn, certificateId, certificateCourseName } =
    args;
  const trainingLine = trainingInCourseLine(certificateCourseName);
  return baseContent(
    "assessment_appreciation",
    {
      recipientName,
      subjectName: assessmentTitle,
      scoreText: undefined,
      headlineTitle: "Certificate of excellence",
      preamble: "This certificate is presented to",
      ...trainingLine,
      issuedOn,
      certificateId,
    },
    branding
  );
}

/**
 * Learner-facing certificate on the assessment result page: includes score and summary stats.
 * Signature image and signatory copy come from client branding when configured.
 */
export function buildAssessmentResultCertificate(args: {
  recipientName: string;
  assessmentTitle: string;
  certificateCourseName?: string | null;
  branding: CertificateBranding;
  score: number;
  maximumMarks: number;
  accuracyPercent: number;
  percentile?: number | null;
  attemptedQuestions: number;
  totalQuestions: number;
  timeTakenMinutes?: number | null;
  /** When true, uses achievement headline and copy (same thresholds as appreciation band). */
  inAppreciationBand: boolean;
  issuedOn?: Date;
  certificateId?: string;
}): CertificateContent {
  const {
    recipientName,
    assessmentTitle,
    certificateCourseName,
    branding,
    score,
    maximumMarks,
    accuracyPercent,
    percentile,
    attemptedQuestions,
    totalQuestions,
    timeTakenMinutes,
    inAppreciationBand,
    issuedOn,
    certificateId,
  } = args;

  const trainingLine = trainingInCourseLine(certificateCourseName);

  if (inAppreciationBand) {
    return baseContent(
      "assessment_result",
      {
        recipientName,
        subjectName: assessmentTitle,
        scoreText: undefined,
        credentialLines: undefined,
        headlineTitle: "Certificate of excellence",
        preamble: "This certificate is presented to",
        ...trainingLine,
        issuedOn,
        certificateId,
      },
      branding
    );
  }

  return baseContent(
    "assessment_result",
    {
      recipientName,
      subjectName: assessmentTitle,
      scoreText: undefined,
      credentialLines: undefined,
      headlineTitle: "Certificate of completion",
      preamble: "This certificate is presented to",
      ...trainingLine,
      issuedOn,
      certificateId,
    },
    branding
  );
}
